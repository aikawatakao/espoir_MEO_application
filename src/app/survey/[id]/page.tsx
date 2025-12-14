"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Sparkles, ExternalLink, Copy, ArrowRight, ArrowLeft, CheckCircle2, Globe } from "lucide-react";

type Language = 'ja' | 'en' | 'ko' | 'zh-CN' | 'zh-TW';

const LANGUAGES: { id: Language; label: string; flag: string }[] = [
    { id: 'ja', label: '日本語', flag: '🇯🇵' },
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'ko', label: '한국어', flag: '🇰🇷' },
    { id: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { id: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
];

const UI_TEXT = {
    ja: {
        loading: "読み込み中...",
        error_not_found: "アンケートが見つかりませんでした",
        error_gen_failed: "文章の生成に失敗しました",
        error_submit_failed: "送信に失敗しました",
        error_req_q1: "質問1に回答してください",
        error_req_q1_gen: "生成には質問1の回答が必要です",
        step: "ステップ",
        next: "次へ",
        back: "戻る",
        generate: "おすすめの文章を作成",
        generating: "生成中...",
        submit: "アンケートを完了する",
        submitting: "送信中...",
        copy: "テキストをコピー",
        copied: "コピーしました",
        open_google: "Googleで投稿する",
        thank_you_title: "ご協力ありがとうございました",
        thank_you_desc: "アンケートへの回答を受け付けました。<br />Googleへの投稿もぜひよろしくお願いいたします。",
        header_desc: "アンケートに回答いただくと、投稿文のおすすめ案が表示されます",
        q1_label: "質問内容",
        q2_title: "質問 2（オプション）",
        q2_desc: "その他のご感想",
        q3_label: "全体的なご感想",
        q3_placeholder: "ご自由にお書きください（最大500字）",
        q3_count: "文字",
        result_title: "投稿文のおすすめ",
        result_desc: "以下の文章をコピーして、Googleマップに投稿できます",
        q1_placeholder: "ご自由にお書きください",
        select_lang: "言語を選択 / Select Language",
    },
    en: {
        loading: "Loading...",
        error_not_found: "Survey not found",
        error_gen_failed: "Failed to generate text",
        error_submit_failed: "Failed to submit",
        error_req_q1: "Please answer Question 1",
        error_req_q1_gen: "Answer to Q1 is required for generation",
        step: "Step",
        next: "Next",
        back: "Back",
        generate: "Generate Recommendation",
        generating: "Generating...",
        submit: "Complete Survey",
        submitting: "Submitting...",
        copy: "Copy Text",
        copied: "Copied",
        open_google: "Post on Google",
        thank_you_title: "Thank you for your cooperation",
        thank_you_desc: "Your response has been recorded.<br />Please consider posting on Google Maps as well.",
        header_desc: "Answer the survey to get a recommended review text.",
        q1_label: "Question",
        q2_title: "Question 2 (Optional)",
        q2_desc: "Other impressions",
        q3_label: "Overall Impressions",
        q3_placeholder: "Feel free to write (max 500 chars)",
        q3_count: "chars",
        result_title: "Recommended Review",
        result_desc: "You can copy the text below and post it on Google Maps.",
        q1_placeholder: "Feel free to write",
        select_lang: "Select Language",
    },
    ko: {
        loading: "로딩 중...",
        error_not_found: "설문조사를 찾을 수 없습니다",
        error_gen_failed: "문장 생성에 실패했습니다",
        error_submit_failed: "전송에 실패했습니다",
        error_req_q1: "질문 1에 답변해 주세요",
        error_req_q1_gen: "생성을 위해서는 질문 1의 답변이 필요합니다",
        step: "단계",
        next: "다음",
        back: "뒤로",
        generate: "추천 문장 작성",
        generating: "생성 중...",
        submit: "설문 완료",
        submitting: "전송 중...",
        copy: "텍스트 복사",
        copied: "복사했습니다",
        open_google: "Google에 게시",
        thank_you_title: "협조해 주셔서 감사합니다",
        thank_you_desc: "설문 응답이 접수되었습니다.<br />Google 맵 게시도 부탁드립니다.",
        header_desc: "설문에 답하시면 추천 리뷰 문구가 표시됩니다.",
        q1_label: "질문 내용",
        q2_title: "질문 2 (선택)",
        q2_desc: "기타 소감",
        q3_label: "전체적인 소감",
        q3_placeholder: "자유롭게 작성해 주세요 (최대 500자)",
        q3_count: "자",
        result_title: "추천 리뷰",
        result_desc: "아래 문장을 복사하여 Google 맵에 게시할 수 있습니다.",
        q1_placeholder: "자유롭게 작성해 주세요",
        select_lang: "언어 선택",
    },
    'zh-CN': {
        loading: "加载中...",
        error_not_found: "未找到问卷",
        error_gen_failed: "生成文章失败",
        error_submit_failed: "发送失败",
        error_req_q1: "请回答问题1",
        error_req_q1_gen: "生成需要问题1的回答",
        step: "步骤",
        next: "下一步",
        back: "返回",
        generate: "生成推荐文章",
        generating: "生成中...",
        submit: "完成问卷",
        submitting: "发送中...",
        copy: "复制文本",
        copied: "已复制",
        open_google: "在Google发布",
        thank_you_title: "感谢您的合作",
        thank_you_desc: "已收到您的回答。<br />也请您在Google上发布。",
        header_desc: "回答问卷后，将显示推荐的评论文章。",
        q1_label: "问题内容",
        q2_title: "问题2（可选）",
        q2_desc: "其他感想",
        q3_label: "整体感想",
        q3_placeholder: "请自由填写（最多500字）",
        q3_count: "字",
        result_title: "推荐评论",
        result_desc: "您可以复制以下文章并在Google地图上发布。",
        q1_placeholder: "请自由填写",
        select_lang: "选择语言",
    },
    'zh-TW': {
        loading: "載入中...",
        error_not_found: "找不到問卷",
        error_gen_failed: "生成文章失敗",
        error_submit_failed: "傳送失敗",
        error_req_q1: "請回答問題1",
        error_req_q1_gen: "生成需要問題1的回答",
        step: "步驟",
        next: "下一步",
        back: "返回",
        generate: "生成推薦文章",
        generating: "生成中...",
        submit: "完成問卷",
        submitting: "傳送中...",
        copy: "複製文字",
        copied: "已複製",
        open_google: "在Google發布",
        thank_you_title: "感謝您的合作",
        thank_you_desc: "已收到您的回答。<br />也請您在Google上發布。",
        header_desc: "回答問卷後，將顯示推薦的評論文章。",
        q1_label: "問題內容",
        q2_title: "問題2（選填）",
        q2_desc: "其他感想",
        q3_label: "整體感想",
        q3_placeholder: "請自由填寫（最多500字）",
        q3_count: "字",
        result_title: "推薦評論",
        result_desc: "您可以複製以下文章並在Google地圖上發布。",
        q1_placeholder: "請自由填寫",
        select_lang: "選擇語言",
    },
};

interface Question {
    id: string; // "q1", "q2", "q3" usually in this context, or UUID from DB? 
    // The DB stores questions as valid JSON array. 
    // We should map them to the wizard steps.
    label: string;
    type: "single" | "multi" | "text";
    options?: string[];
    required?: boolean;
}

export default function PublicSurveyPage() {
    const params = useParams();
    const surveyId = params?.id as string;

    // State
    const [survey, setSurvey] = useState<any>(null);
    const [originalSurvey, setOriginalSurvey] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(0); // 0 = language select
    const [answers, setAnswers] = useState<{
        q1: string;
        q2: string[];
        q3: string;
    }>({
        q1: "",
        q2: [],
        q3: "",
    });

    const [generatedText, setGeneratedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Language State
    const [language, setLanguage] = useState<Language | null>(null);
    const [translating, setTranslating] = useState(false);

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const t = UI_TEXT[language || 'ja'];

    // Fetch Survey
    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const res = await fetch(`/api/surveys/${surveyId}`);
                if (!res.ok) throw new Error("アンケートが見つかりませんでした");
                const data = await res.json();
                setSurvey(data);
                setOriginalSurvey(data);

                if (data.questions) {
                    try {
                        let parsed = typeof data.questions === 'string'
                            ? JSON.parse(data.questions)
                            : data.questions;

                        // Handle double stringification
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed);

                        setQuestions(Array.isArray(parsed) ? parsed : []);
                    } catch (e) {
                        console.error("Failed to parse questions", e);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (surveyId) fetchSurvey();
    }, [surveyId]);

    // Handlers
    const handleLanguageSelect = async (lang: Language) => {
        setLanguage(lang);

        if (lang === 'ja') {
            setStep(1);
            return;
        }

        setTranslating(true);
        try {
            // Translate survey logic
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'translate_survey',
                    context: {
                        survey: {
                            title: originalSurvey?.title,
                            // Send questions as lightweight structure
                            questions: questions
                        },
                        targetLanguage: lang
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                try {
                    let translatedData = JSON.parse(data.text);
                    // Use translated data
                    if (translatedData.title) {
                        setSurvey((prev: any) => ({ ...prev, title: translatedData.title }));
                    }
                    if (translatedData.questions) {
                        setQuestions(translatedData.questions);
                    }
                } catch (parseError) {
                    console.error("Failed to parse translated survey", parseError);
                    toast.error("翻訳データの読み込みに失敗しました");
                }
            }
        } catch (error) {
            console.error("Translation failed", error);
            toast.error("翻訳に失敗しました。日本語で表示します。");
        } finally {
            setTranslating(false);
            setStep(1);
        }
    };

    const handleQ2Change = (value: string, checked: boolean) => {
        setAnswers((prev) => ({
            ...prev,
            q2: checked
                ? [...prev.q2, value]
                : prev.q2.filter((v) => v !== value),
        }));
    };

    const handleNext = () => {
        if (step === 1 && !answers.q1) {
            toast.error(t.error_req_q1);
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleGenerateText = async () => {
        if (!answers.q1) {
            toast.error(t.error_req_q1_gen);
            return;
        }

        setIsGenerating(true);
        try {
            // Use Real AI API with language awareness
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'review_draft',
                    context: {
                        q1: answers.q1,
                        q2: answers.q2,
                        q3: answers.q3,
                        storeName: survey?.storeName || "当店",
                        language: language || 'ja'
                    }
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || errData.error || t.error_gen_failed);
            }

            const data = await res.json();
            setGeneratedText(data.text);
            setStep(3);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || t.error_gen_failed);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/surveys/${surveyId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers
                    // Note: We might want to save the language used too, but api doesn't support it yet.
                    // Just sending answers is fine for now.
                }),
            });

            if (!res.ok) throw new Error(t.error_submit_failed);

            setIsSubmitted(true);
        } catch (err) {
            toast.error(t.error_submit_failed);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Helpers
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center text-destructive">
                        {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">{t.thank_you_title}</CardTitle>
                        <CardDescription dangerouslySetInnerHTML={{ __html: t.thank_you_desc }} />
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (step === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Language / 言語</CardTitle>
                        <CardDescription>
                            Please select your language<br />
                            言語を選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {translating ? (
                            <div className="py-8 text-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="text-muted-foreground">{t?.loading || 'Translating...'}</p>
                            </div>
                        ) : (
                            LANGUAGES.map((lang) => (
                                <Button
                                    key={lang.id}
                                    variant="outline"
                                    className="h-14 text-lg justify-start px-6"
                                    onClick={() => handleLanguageSelect(lang.id)}
                                >
                                    <span className="mr-3 text-2xl">{lang.flag}</span>
                                    {lang.label}
                                </Button>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const question1 = questions[0];
    const question2 = questions[1];
    const question3 = questions[2]; // Usually feedback

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="mx-auto max-w-2xl space-y-6 py-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="mb-2 text-2xl font-bold">
                        {survey?.title || "アンケート"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t.header_desc}
                    </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-center text-sm text-muted-foreground">
                        {t.step} {step} / {totalSteps}
                    </p>
                </div>

                {/* Step 1 */}
                {step === 1 && question1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1</CardTitle>
                            <CardDescription>
                                {question1.label || t.q1_label}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {question1.type === "single" && question1.options && (
                                <RadioGroup
                                    value={answers.q1}
                                    onValueChange={(value) =>
                                        setAnswers((prev) => ({ ...prev, q1: value }))
                                    }
                                >
                                    {question1.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2 py-1">
                                            <RadioGroupItem value={option} id={`q1-${index}`} />
                                            <Label htmlFor={`q1-${index}`} className="cursor-pointer font-normal">
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}

                            {question1.type === "text" && (
                                <Textarea
                                    placeholder={t.q1_placeholder}
                                    value={answers.q1}
                                    onChange={(e) =>
                                        setAnswers((prev) => ({ ...prev, q1: e.target.value }))
                                    }
                                    rows={4}
                                />
                            )}

                            <div className="flex justify-end pt-2">
                                <Button onClick={handleNext}>
                                    {t.next}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.q2_title}</CardTitle>
                            <CardDescription>
                                {question2?.label || t.q2_desc}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {question2?.type === "multi" && question2.options && (
                                <div className="space-y-2">
                                    {question2.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2 py-1">
                                            <Checkbox
                                                id={`q2-${index}`}
                                                checked={answers.q2.includes(option)}
                                                onCheckedChange={(checked) =>
                                                    handleQ2Change(option, checked as boolean)
                                                }
                                            />
                                            <Label htmlFor={`q2-${index}`} className="cursor-pointer font-normal">
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {question2?.type === "single" && question2.options && (
                                <RadioGroup
                                    value={answers.q2[0] || ""}
                                    onValueChange={(value) =>
                                        setAnswers((prev) => ({ ...prev, q2: [value] }))
                                    }
                                >
                                    {question2.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2 py-1">
                                            <RadioGroupItem value={option} id={`q2-${index}`} />
                                            <Label htmlFor={`q2-${index}`} className="cursor-pointer font-normal">
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}

                            <div className="space-y-2 pt-4 border-t">
                                <Label>
                                    {question3?.label || t.q3_label}
                                </Label>
                                <Textarea
                                    placeholder={t.q3_placeholder}
                                    value={answers.q3}
                                    onChange={(e) =>
                                        setAnswers((prev) => ({ ...prev, q3: e.target.value }))
                                    }
                                    maxLength={500}
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {answers.q3.length}/500 {t.q3_count}
                                </p>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="outline" onClick={handleBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {t.back}
                                </Button>
                                <Button onClick={handleGenerateText} disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t.generating}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            {t.generate}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.result_title}</CardTitle>
                            <CardDescription>
                                {t.result_desc}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={generatedText}
                                onChange={(e) => setGeneratedText(e.target.value)}
                                rows={12}
                                className="resize-none"
                            />

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button variant="outline" className="flex-1" onClick={() => {
                                    navigator.clipboard.writeText(generatedText);
                                    toast.success(t.copied);
                                }}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    {t.copy}
                                </Button>
                                <Button className="flex-1" variant="secondary" onClick={() => {
                                    window.open("https://www.google.com/maps", "_blank");
                                }}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t.open_google}
                                </Button>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <Button
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t.submitting}
                                        </>
                                    ) : (
                                        t.submit
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
