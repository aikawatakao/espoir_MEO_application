import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { type, context } = body;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = "";

        if (type === "reply") {
            const { rating, text, author } = context;
            prompt = `
            あなたは店舗のオーナーです。以下の口コミに対して、丁寧で感謝の気持ちが伝わる返信文を作成してください。
            
            口コミ情報:
            - 投稿者: ${author}
            - 評価: ${rating}星
            - 内容: ${text}
            
            条件:
            - 日本語で記述してください。
            - 300文字以内で簡潔にまとめてください。
            - 評価が高い場合は感謝を、低い場合は真摯な謝罪と改善の意向を含めてください。
            `;
        } else if (type === "survey_preview") {
            const { title, keywords } = context;
            prompt = `
            あなたは店舗のオーナーです。以下のアンケートタイトルとキーワードに基づいて、アンケートの冒頭に表示する挨拶文（プレビュー）を作成してください。
            
            アンケート情報:
            - タイトル: ${title}
            - キーワード: ${keywords.join(", ")}
            
            条件:
            - 日本語で記述してください。
            - 200文字以内で簡潔にまとめてください。
            - キーワードを自然な形で文章に盛り込んでください。
            - 顧客への感謝と、意見がサービス向上に役立つことを伝えてください。
            `;
        } else if (type === "review_draft") {
            const { q1, q2, q3, storeName, language } = context;
            const langName = {
                'ja': '日本語',
                'en': 'English',
                'ko': 'Korean',
                'zh-CN': 'Simplified Chinese',
                'zh-TW': 'Traditional Chinese'
            }[language as string] || '日本語';

            prompt = `
            あなたは顧客として「${storeName}」を利用しました。以下のアンケート回答に基づいて、Googleマップに投稿するための口コミ文章を作成してください。
            
            アンケート回答:
            - Q1詳細: ${q1}
            - Q2よかった点(オプション): ${Array.isArray(q2) ? q2.join(", ") : q2}
            - Q3感想(自由記述): ${q3}
            
            条件:
            - **${langName}**で記述してください。
            - 自然な口調で書いてください。
            - 回答内容を反映し、具体的で好意的な内容にしてください。
            - 200文字〜400文字程度でまとめてください。
            `;
        } else if (type === "translate_survey") {
            const { survey, targetLanguage } = context;
            const langName = {
                'en': 'English',
                'ko': 'Korean',
                'zh-CN': 'Simplified Chinese',
                'zh-TW': 'Traditional Chinese'
            }[targetLanguage as string];

            if (!langName) {
                return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
            }

            prompt = `
            You are a professional translator. Translate the following survey JSON object into ${langName}.
            Evaluate the JSON structure and only translate the values of "title", "label", "options" fields.
            Do NOT change any keys or structure. Return ONLY the valid JSON string.

            Original JSON:
            ${JSON.stringify(survey)}
            `;
        } else {
            return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        console.log('AI Raw Response:', text);

        // Clean up markdown code blocks if present
        text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        console.log('AI Clean Response:', text);

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error('AI generation error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate content',
            details: error.toString()
        }, { status: 500 });
    }
}
