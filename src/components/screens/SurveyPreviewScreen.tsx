"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, ExternalLink, Copy, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SurveyQuestion {
    label: string;
    type: "single" | "multi" | "text";
    options?: string[];
}

interface SurveyPreviewScreenProps {
    surveyTitle: string;
    questions: SurveyQuestion[];
    onClose: () => void;
}

export function SurveyPreviewScreen({
    surveyTitle,
    questions,
    onClose,
}: SurveyPreviewScreenProps) {
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
    const [error, setError] = useState<string | null>(null);

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

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
            setError("質問1に回答してください");
            return;
        }
        setError(null);
        setStep(step + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep(step - 1);
    };

    const handleGenerateText = async () => {
        if (!answers.q1) {
            setError("少なくとも1つの質問に回答してください");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Mock AI generation
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const mockText = `本日は素晴らしい体験をさせていただきました。\n\n${answers.q1 ? `特に${answers.q1}が印象的でした。` : ""
                }${answers.q2.length > 0
                    ? ` また、${answers.q2.join("や")}も大変良かったです。`
                    : ""
                }\n\n${answers.q3 || "とても満足できる時間を過ごすことができました。"
                }\n\nまた機会があればぜひ訪れたいと思います。ありがとうございました！`;

            setGeneratedText(mockText);
            setStep(3);
        } catch (err) {
            setError("文章の生成に失敗しました");
        } finally {
            setIsGenerating(false);
        }
    };

    const question1 = questions[0];
    const question2 = questions[1];
    const question3 = questions[2];

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="mx-auto max-w-2xl space-y-6 py-8">
                {/* Preview Header */}
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="mb-1 inline-block rounded-md bg-primary/10 px-2 py-1 text-xs">
                                プレビューモード
                            </div>
                            <p className="text-sm text-muted-foreground">
                                これは顧客が見る画面のプレビューです。実際のデータは送信されません。
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="text-center">
                    <h1 className="mb-2 text-2xl">
                        {surveyTitle || "アンケートタイトル"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        アンケートに回答いただくと、投稿文のおすすめ案が表示されます
                    </p>
                </div>

                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-center text-sm text-muted-foreground">
                        ステップ {step} / {totalSteps}
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Step 1: Question 1 */}
                {step === 1 && question1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>質問 1</CardTitle>
                            <CardDescription>
                                {question1.label || "質問内容が設定されていません"}
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
                                        <div key={index} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`q1-${index}`} />
                                            <Label htmlFor={`q1-${index}`} className="cursor-pointer">
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

                            <div className="flex justify-end">
                                <Button onClick={handleNext}>
                                    次へ
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Question 2 & 3 */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>質問 2（オプション）</CardTitle>
                            <CardDescription>
                                {question2?.label || "質問内容が設定されていません"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {question2?.type === "multi" && question2.options && (
                                <div className="space-y-3">
                                    {question2.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`q2-${index}`}
                                                checked={answers.q2.includes(option)}
                                                onCheckedChange={(checked) =>
                                                    handleQ2Change(option, checked as boolean)
                                                }
                                            />
                                            <Label htmlFor={`q2-${index}`} className="cursor-pointer">
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
                                        <div key={index} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option} id={`q2-${index}`} />
                                            <Label htmlFor={`q2-${index}`} className="cursor-pointer">
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}

                            <div className="space-y-2">
                                <Label>
                                    {question3?.label || "ご自由にご感想をお聞かせください"}
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
                                <p className="text-xs text-muted-foreground">
                                    {answers.q3.length}/500文字
                                </p>
                            </div>

                            <div className="flex justify-between">
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

                {/* Step 3: Generated Text */}
                {step === 3 && generatedText && (
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
                                <Button variant="outline" className="flex-1">
                                    <Copy className="mr-2 h-4 w-4" />
                                    テキストをコピー
                                </Button>
                                <Button className="flex-1">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Googleで投稿する
                                </Button>
                            </div>

                            <Alert>
                                <AlertDescription>
                                    投稿後は、このページに戻ってアンケートを完了してください
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}

                {/* Back Button */}
                <div className="text-center">
                    <Button variant="outline" onClick={onClose}>
                        編集画面に戻る
                    </Button>
                </div>
            </div>
        </div>
    );
}
