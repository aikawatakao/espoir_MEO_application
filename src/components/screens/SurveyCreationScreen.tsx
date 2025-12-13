"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, QrCode, Check, Eye, Plus, X, GripVertical, MoreVertical, Copy, Trash2, MoveUp, MoveDown } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SurveyPreviewScreen } from "./SurveyPreviewScreen";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    label: string;
    type: "single" | "multi" | "text";
    options: string[];
    required: boolean;
}

interface SurveyCreationScreenProps {
    mode?: "new" | "edit";
    surveyId?: string;
    initialData?: any;
}

export function SurveyCreationScreen({ mode = "new", surveyId, initialData }: SurveyCreationScreenProps) {
    const router = useRouter();
    const [surveyTitle, setSurveyTitle] = useState("");
    const [surveyDescription, setSurveyDescription] = useState("");
    const [questions, setQuestions] = useState<Question[]>([
        {
            id: "q1",
            label: "",
            type: "single",
            options: ["", "", "", ""],
            required: true,
        },
    ]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [aiPreview, setAiPreview] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [surveyUrl, setSurveyUrl] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [isDraft, setIsDraft] = useState(true);
    const [isPublished, setIsPublished] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setSurveyTitle(initialData.survey?.title || "");
            setSurveyDescription(initialData.survey?.description || "");
            setIsSaved(true);
            setIsDraft(initialData.survey?.status === "draft");
            setIsPublished(initialData.survey?.status === "published");

            if (initialData.survey?.questions) {
                try {
                    let parsedQuestions = typeof initialData.survey.questions === 'string'
                        ? JSON.parse(initialData.survey.questions)
                        : initialData.survey.questions;

                    // Handle double stringification
                    if (typeof parsedQuestions === 'string') {
                        try {
                            parsedQuestions = JSON.parse(parsedQuestions);
                        } catch (e) {
                            console.error("Failed to parse double-stringified questions", e);
                        }
                    }

                    const sanitizedQuestions = Array.isArray(parsedQuestions) ? parsedQuestions.map((q: any, index: number) => {
                        return {
                            id: `q${Date.now()}_${index}`, // Force new ID to avoid collision with default state
                            label: q.label || q.text || "",
                            type: ["single", "multi", "text"].includes(q.type) ? q.type : "single",
                            options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
                            required: !!q.required
                        };
                    }) : [];

                    if (sanitizedQuestions.length > 0) {
                        setQuestions(sanitizedQuestions);
                    }
                } catch (e) {
                    console.error("Failed to parse questions", e);
                }
            }
        }
    }, [mode, initialData]);

    const handleAddQuestion = () => {
        if (questions.length >= 3) {
            toast.error("質問は最大3問までです");
            return;
        }

        const newQuestion: Question = {
            id: `q${Date.now()}`,
            label: "",
            type: "single",
            options: ["", "", "", ""],
            required: false,
        };

        setQuestions([...questions, newQuestion]);
    };

    const handleUpdateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === id) {
                    return { ...q, [field]: value };
                }
                return q;
            })
        );
    };

    const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === questionId) {
                    const newOptions = [...q.options];
                    newOptions[optionIndex] = value;
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    const handleAddOption = (questionId: string) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === questionId) {
                    return { ...q, options: [...q.options, ""] };
                }
                return q;
            })
        );
    };

    const handleRemoveOption = (questionId: string, optionIndex: number) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === questionId && q.options.length > 2) {
                    const newOptions = q.options.filter((_, i) => i !== optionIndex);
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    const handleDuplicateQuestion = (id: string) => {
        if (questions.length >= 3) {
            toast.error("質問は最大3問までです");
            return;
        }

        const questionToDuplicate = questions.find((q) => q.id === id);
        if (!questionToDuplicate) return;

        const duplicated: Question = {
            ...questionToDuplicate,
            id: `q${Date.now()}`,
        };

        const index = questions.findIndex((q) => q.id === id);
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, duplicated);
        setQuestions(newQuestions);
        toast.success("質問を複製しました");
    };

    const handleDeleteQuestion = (id: string) => {
        if (questions.length === 1) {
            toast.error("最低1つの質問が必要です");
            return;
        }

        setQuestions(questions.filter((q) => q.id !== id));
        toast.success("質問を削除しました");
    };

    const handleMoveQuestion = (id: string, direction: "up" | "down") => {
        const index = questions.findIndex((q) => q.id === id);
        if (index === -1) return;

        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === questions.length - 1) return;

        const newQuestions = [...questions];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
        setQuestions(newQuestions);
    };

    const handleAddKeyword = () => {
        if (!keywordInput.trim()) return;
        if (keywords.length >= 20) {
            toast.error("キーワードは最大20個までです");
            return;
        }
        if (keywords.includes(keywordInput.trim())) {
            toast.error("同じキーワードは追加できません");
            return;
        }

        setKeywords([...keywords, keywordInput.trim()]);
        setKeywordInput("");
    };

    const handleRemoveKeyword = (keyword: string) => {
        setKeywords(keywords.filter((k) => k !== keyword));
    };

    const handleGeneratePreview = async () => {
        if (!surveyTitle) {
            toast.error("アンケート名を入力してください");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'survey_preview',
                    context: {
                        title: surveyTitle,
                        keywords: keywords
                    }
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate preview');
            }

            const data = await res.json();
            setAiPreview(data.text);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "AI生成に失敗しました。APIキーが設定されているか確認してください。");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!surveyTitle || surveyTitle.length > 80) {
            toast.error("アンケート名を入力してください（80字以内）");
            return;
        }

        if (questions.every((q) => !q.label)) {
            toast.error("少なくとも1つの質問を追加してください");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const body = {
                title: surveyTitle,
                description: surveyDescription,
                questions: JSON.stringify(questions),
                status: "draft",
                storeId: "demo-store-id" // Should be dynamic
            };

            let res;
            if (mode === "edit" && surveyId) {
                res = await fetch(`/api/surveys/${surveyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            } else {
                res = await fetch('/api/surveys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error('Failed to save');

            setIsSaved(true);
            setIsDraft(true);
            toast.success(mode === "edit" ? "変更を保存しました（下書き）" : "下書きとして保存しました");

            if (mode === "new" && res.ok) {
                // Redirect to edit page or update URL?
                // For now, just stay here or maybe redirect to list?
                // Ideally redirect to edit page of new survey
                const data = await res.json();
                router.push(`/surveys/${data.id}`);
            }
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!isSaved) {
            toast.error("先に保存してください");
            return;
        }

        try {
            // Update status to published
            // If new, we should have saved first (handled by check above)
            // But if we are in "new" mode and just saved, we might not have ID if we didn't redirect.
            // But handleSave redirects.
            // So we assume we have surveyId if we are here?
            // Wait, handleSave redirects. So we will be in "edit" mode.
            // If we are in "edit" mode, we have surveyId.

            if (!surveyId) {
                toast.error("保存後に公開してください");
                return;
            }

            const res = await fetch(`/api/surveys/${surveyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: "published" }),
            });

            if (!res.ok) throw new Error('Failed to publish');

            const url = `${window.location.origin}/survey/${surveyId}`; // Real URL
            setSurveyUrl(url);
            setIsPublished(true);
            setIsDraft(false);
            toast.success("アンケートを公開しました");
            setShowQRDialog(true);
        } catch (err) {
            toast.error("公開に失敗しました");
        }
    };

    const handlePreview = () => {
        if (!surveyTitle) {
            toast.error("アンケート名を入力してください");
            return;
        }
        if (questions.length === 0 || !questions[0].label) {
            toast.error("少なくとも質問1を入力してください");
            return;
        }

        setError(null);
        setShowPreview(true);
    };

    const getSurveyData = () => {
        return questions.map((q) => ({
            label: q.label || "質問",
            type: q.type,
            options: q.type !== "text" ? q.options.filter((opt) => opt.trim() !== "") : undefined,
        }));
    };

    if (showPreview) {
        return (
            <SurveyPreviewScreen
                surveyTitle={surveyTitle}
                questions={getSurveyData()}
                onClose={() => setShowPreview(false)}
            />
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl">
                        {mode === "edit" ? "アンケート編集" : "アンケート新規作成"}
                    </h1>
                    {isSaved && (
                        isDraft ? (
                            <Badge variant="secondary">下書き</Badge>
                        ) : isPublished ? (
                            <Badge variant="default">公開中</Badge>
                        ) : null
                    )}
                </div>
                <p className="text-muted-foreground">
                    顧客向けアンケートを作成し、投稿を促進しましょう
                    {isDraft && " · 保存後に公開が可能です"}
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sv_title">アンケート名 *</Label>
                        <Input
                            id="sv_title"
                            placeholder="例：来店後の簡単アンケート"
                            value={surveyTitle}
                            onChange={(e) => setSurveyTitle(e.target.value)}
                            maxLength={80}
                        />
                        <p className="text-xs text-muted-foreground">
                            {surveyTitle.length}/80文字
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sv_desc">説明（任意）</Label>
                        <Textarea
                            id="sv_desc"
                            placeholder="アンケートの目的や説明を入力してください"
                            value={surveyDescription}
                            onChange={(e) => setSurveyDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl">質問設定</h2>
                    <Button
                        variant="outline"
                        onClick={handleAddQuestion}
                        disabled={questions.length >= 3}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        質問を追加
                    </Button>
                </div>
                {questions.length >= 3 && (
                    <p className="text-sm text-muted-foreground">
                        ※最大3問まで追加できます
                    </p>
                )}

                {questions.map((question, qIndex) => (
                    <Card key={question.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle>質問 {qIndex + 1}</CardTitle>
                                    {question.required && (
                                        <Badge variant="destructive" className="text-xs">必須</Badge>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => handleMoveQuestion(question.id, "up")}
                                            disabled={qIndex === 0}
                                        >
                                            <MoveUp className="mr-2 h-4 w-4" />
                                            上に移動
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleMoveQuestion(question.id, "down")}
                                            disabled={qIndex === questions.length - 1}
                                        >
                                            <MoveDown className="mr-2 h-4 w-4" />
                                            下に移動
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateQuestion(question.id)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            質問を複製
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDeleteQuestion(question.id)}
                                            className="text-destructive"
                                            disabled={questions.length === 1}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            質問を削除
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`q${qIndex}_label`}>質問文 *</Label>
                                <Input
                                    id={`q${qIndex}_label`}
                                    placeholder="例：特に良かった点を教えてください"
                                    value={question.label}
                                    onChange={(e) =>
                                        handleUpdateQuestion(question.id, "label", e.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`q${qIndex}_type`}>質問タイプ</Label>
                                <Select
                                    value={question.type}
                                    onValueChange={(value) =>
                                        handleUpdateQuestion(question.id, "type", value as Question["type"])
                                    }
                                >
                                    <SelectTrigger id={`q${qIndex}_type`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">単一選択</SelectItem>
                                        <SelectItem value="multi">複数選択</SelectItem>
                                        <SelectItem value="text">自由記述</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {question.type !== "text" && (
                                <div className="space-y-2">
                                    <Label>選択肢</Label>
                                    {question.options.map((option, optIndex) => (
                                        <div key={optIndex} className="flex gap-2">
                                            <Input
                                                key={optIndex}
                                                placeholder={`選択肢 ${optIndex + 1}`}
                                                value={option}
                                                onChange={(e) =>
                                                    handleUpdateOption(question.id, optIndex, e.target.value)
                                                }
                                            />
                                            {question.options.length > 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveOption(question.id, optIndex)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddOption(question.id)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        選択肢を追加
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`q${qIndex}_required`}
                                    checked={question.required}
                                    onCheckedChange={(checked) =>
                                        handleUpdateQuestion(question.id, "required", checked)
                                    }
                                />
                                <Label htmlFor={`q${qIndex}_required`}>必須項目にする</Label>
                            </div>
                        </CardContent>
                    </Card>
                ))
                }
            </div >

            <Card>
                <CardHeader>
                    <CardTitle>対策キーワード</CardTitle>
                    <CardDescription>
                        口コミに入れてほしいキーワードを設定します（最大20個）
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            id="kw_input"
                            placeholder="例：西船橋, 居酒屋, 個室, 子連れOK"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddKeyword();
                                }
                            }}
                        />
                        <Button onClick={handleAddKeyword}>
                            <Plus className="mr-2 h-4 w-4" />
                            追加
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                {keyword}
                                <button
                                    onClick={() => handleRemoveKeyword(keyword)}
                                    className="ml-1 rounded-full hover:bg-muted"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        AIが口コミ文の中で自然に反映します
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>AIプレビュー</CardTitle>
                    <CardDescription>
                        設定内容に基づいてAIが生成する口コミ文のサンプルです
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {aiPreview ? (
                        <div className="rounded-md border bg-muted/50 p-4">
                            <p className="whitespace-pre-wrap">{aiPreview}</p>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground">
                            プレビューを生成してください
                        </p>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleGeneratePreview}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                プレビューを更新
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
                <div className="flex gap-2">
                    <Button
                        id="btn_save"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : isSaved ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                {mode === "edit" ? "変更を保存" : "保存"}
                            </>
                        ) : (
                            mode === "edit" ? "変更を保存" : "作成して保存"
                        )}
                    </Button>
                    <Button
                        id="btn_preview"
                        variant="outline"
                        onClick={handlePreview}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        プレビュー
                    </Button>
                    <Button
                        id="btn_publish"
                        variant="secondary"
                        onClick={handlePublish}
                        disabled={!isSaved}
                    >
                        <QrCode className="mr-2 h-4 w-4" />
                        公開してQRを発行
                    </Button>
                </div>
            </div>

            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>アンケートを公開しました</DialogTitle>
                        <DialogDescription>
                            以下のURLまたはQRコードを顧客に共有してください
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-center rounded-lg border bg-muted p-8">
                            <div className="text-center">
                                <QrCode className="mx-auto h-32 w-32" />
                                <p className="mt-2 text-sm text-muted-foreground">QRコード</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>アンケートURL</Label>
                            <div className="flex gap-2">
                                <Input value={surveyUrl} readOnly />
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(surveyUrl);
                                            toast.success("URLをコピーしました");
                                        } catch (err) {
                                            toast.error("コピーに失敗しました");
                                        }
                                    }}
                                >
                                    コピー
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
