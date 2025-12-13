"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Question {
    id: string;
    label: string;
    type: "single" | "multi" | "text";
    options: string[];
    required: boolean;
}

export default function PublicSurveyPage() {
    const params = useParams();
    const surveyId = params?.id as string;
    const [survey, setSurvey] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const res = await fetch(`/api/surveys/${surveyId}`);
                if (!res.ok) {
                    throw new Error("アンケートが見つかりませんでした");
                }
                const data = await res.json();
                setSurvey(data);

                if (data.questions) {
                    try {
                        let parsed = typeof data.questions === 'string'
                            ? JSON.parse(data.questions)
                            : data.questions;

                        // Handle double stringification if happens
                        if (typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                        }

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

        if (surveyId) {
            fetchSurvey();
        }
    }, [surveyId]);

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleMultiSelectChange = (questionId: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            const current = prev[questionId] || [];
            if (checked) {
                return { ...prev, [questionId]: [...current, option] };
            } else {
                return { ...prev, [questionId]: current.filter((v: string) => v !== option) };
            }
        });
    };

    const handleSubmit = async () => {
        // Validation
        for (const q of questions) {
            if (q.required) {
                const ans = answers[q.id];
                if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
                    toast.error(`「${q.label}」は必須項目です`);
                    return;
                }
            }
        }

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
                        <CardTitle className="text-2xl">ご回答ありがとうございます</CardTitle>
                        <CardDescription>
                            アンケートへのご協力ありがとうございました。
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-8 px-4">
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">{survey?.title || "アンケート"}</h1>
                    {survey?.description && (
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {survey.description}
                        </p>
                    )}
                </div>

                {questions.map((q, index) => (
                    <Card key={q.id}>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex gap-2">
                                <span className="text-muted-foreground">Q{index + 1}.</span>
                                {q.label}
                                {q.required && <span className="text-xs text-destructive ml-2 bg-destructive/10 px-2 py-0.5 rounded">必須</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {q.type === "text" && (
                                <Textarea
                                    placeholder="回答を入力してください"
                                    value={answers[q.id] || ""}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            )}

                            {q.type === "single" && (
                                <RadioGroup
                                    value={answers[q.id] || ""}
                                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                                >
                                    {q.options.filter(o => o).map((opt, i) => (
                                        <div key={i} className="flex items-center space-x-2 py-1">
                                            <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                                            <Label htmlFor={`${q.id}-${i}`} className="font-normal cursor-pointer">
                                                {opt}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}

                            {q.type === "multi" && (
                                <div className="space-y-2">
                                    {q.options.filter(o => o).map((opt, i) => (
                                        <div key={i} className="flex items-center space-x-2 py-1">
                                            <Checkbox
                                                id={`${q.id}-${i}`}
                                                checked={(answers[q.id] || []).includes(opt)}
                                                onCheckedChange={(checked) =>
                                                    handleMultiSelectChange(q.id, opt, checked as boolean)
                                                }
                                            />
                                            <Label htmlFor={`${q.id}-${i}`} className="font-normal cursor-pointer">
                                                {opt}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex justify-center pt-4">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full max-w-xs"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                送信中...
                            </>
                        ) : (
                            "回答を送信する"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
