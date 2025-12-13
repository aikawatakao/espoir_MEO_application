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
import { Loader2, Sparkles, ExternalLink, Copy, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

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
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1);
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

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    // Fetch Survey
    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const res = await fetch(`/api/surveys/${surveyId}`);
                if (!res.ok) throw new Error("アンケートが見つかりませんでした");
                const data = await res.json();
                setSurvey(data);

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
            toast.error("質問1に回答してください");
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleGenerateText = async () => {
        if (!answers.q1) {
            toast.error("生成には質問1の回答が必要です");
            return;
        }

        setIsGenerating(true);
        try {
            // Use Real AI API
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'reply', // Re-using reply type or similar? 
                    // Actually we need a prompt that takes survey answers and generates a review.
                    // The current 'reply' type is for Replying to reviews.
                    // The 'survey_preview' type is for the Survey Header.
                    // We might need a NEW type or just hack 'reply' context?
                    // Let's check api/ai/generate.
                    // It supports 'reply' and 'survey_preview'.
                    // We probably need a 'review_draft' type.
                    // For now, let's construct a context that fits 'reply' or ask to add 'review_draft'.
                    // Wait, the user wants "Preview" functionality.
                    // In SurveyPreviewScreen it mocks: "本日は素晴らしい体験を..."
                    // Let's use 'reply' type but with a custom context for now to get ANY text, 
                    // OR better, let's quickly add 'review_draft' to the API if possible.
                    // But I cannot easily see API code right now without tool call.
                    // I will use 'reply' type with a tricked context for now to avoid breaking changes, 
                    // or just assume the 'reply' logic (Owner replying) is NOT what we want. We want CUSTOMER drafting review.
                    // Let's try to add 'review_draft' to the Payload in this file, and I will update the API next.
                    type: 'review_draft',
                    context: {
                        q1: answers.q1,
                        q2: answers.q2,
                        q3: answers.q3,
                        storeName: survey?.storeName || "当店"
                    }
                }),
            });

            if (!res.ok) {
                // Fallback if 'review_draft' not implemented yet?
                // No, I should implement it.
                throw new Error("生成に失敗しました");
            }

            const data = await res.json();
            setGeneratedText(data.text);
            setStep(3);
        } catch (err) {
            console.error(err);
            toast.error("文章の生成に失敗しました");
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
                body: JSON.stringify({ answers }),
            });

            if (!res.ok) throw new Error("送信に失敗しました");

            setIsSubmitted(true);
        } catch (err) {
            toast.error("送信に失敗しました。もう一度お試しください。");
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
                        <CardTitle className="text-2xl">ご協力ありがとうございました</CardTitle>
                        <CardDescription>
                            アンケートへの回答を受け付けました。
                            <br />
                            Googleへの投稿もぜひよろしくお願いいたします。
                        </CardDescription>
                    </CardHeader>
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
                        アンケートに回答いただくと、投稿文のおすすめ案が表示されます
                    </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-center text-sm text-muted-foreground">
                        ステップ {step} / {totalSteps}
                    </p>
                </div>

                {/* Step 1 */}
                {step === 1 && question1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>質問 1</CardTitle>
                            <CardDescription>
                                {question1.label || "質問内容"}
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
                                    placeholder="ご自由にお書きください"
                                    value={answers.q1}
                                    onChange={(e) =>
                                        setAnswers((prev) => ({ ...prev, q1: e.target.value }))
                                    }
                                    rows={4}
                                />
                            )}

                            <div className="flex justify-end pt-2">
                                <Button onClick={handleNext}>
                                    次へ
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
                            <CardTitle>質問 2（オプション）</CardTitle>
                            <CardDescription>
                                {question2?.label || "その他のご感想"}
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
                                    {question3?.label || "全体的なご感想"}
                                </Label>
                                <Textarea
                                    placeholder="ご自由にお書きください（最大500字）"
                                    value={answers.q3}
                                    onChange={(e) =>
                                        setAnswers((prev) => ({ ...prev, q3: e.target.value }))
                                    }
                                    maxLength={500}
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {answers.q3.length}/500文字
                                </p>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="outline" onClick={handleBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    戻る
                                </Button>
                                <Button onClick={handleGenerateText} disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            生成中...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            おすすめの文章を作成
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
                            <CardTitle>投稿文のおすすめ</CardTitle>
                            <CardDescription>
                                以下の文章をコピーして、Googleマップに投稿できます
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
                                    toast.success("コピーしました");
                                }}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    テキストをコピー
                                </Button>
                                <Button className="flex-1" variant="secondary" onClick={() => {
                                    // Should open Google Maps review link if possible.
                                    // For now just external link icon.
                                    window.open("https://www.google.com/maps", "_blank");
                                }}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Googleで投稿する
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
                                            送信中...
                                        </>
                                    ) : (
                                        "アンケートを完了する"
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
