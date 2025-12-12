"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Copy, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Survey {
    id: string;
    name: string;
    targetStore: string;
    questionCount: number;
    status: "published" | "draft" | "stopped";
    lastUpdated: string;
    responseCount: number;
}

import ClientOnly from "@/components/ClientOnly";

export default function SurveyListPage() {
    const router = useRouter();
    // ... (rest of the component logic)

    // Move the return statement logic inside ClientOnly
    // Actually, easier to wrap the return JSX

    // Re-writing the component to wrap the return
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/surveys');
            if (res.ok) {
                const data = await res.json();
                setSurveys(data.surveys);
            }
        } catch (error) {
            console.error("Failed to fetch surveys", error);
            toast.error("アンケートの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    const handleCreateNew = () => {
        router.push("/surveys/create");
    };

    const handleEdit = (surveyId: string) => {
        router.push(`/surveys/${surveyId}`);
    };

    const handleDuplicate = async (surveyId: string) => {
        const survey = surveys.find((s) => s.id === surveyId);
        if (!survey) return;

        try {
            const res = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${survey.name}（コピー）`,
                    storeId: "demo-store-id", // Should be dynamic
                    questions: "[]" // Should copy actual questions
                }),
            });

            if (!res.ok) throw new Error('Failed to duplicate survey');

            toast.success("アンケートを複製しました");
            fetchSurveys();
        } catch (error) {
            toast.error("アンケートの複製に失敗しました");
        }
    };

    const handleToggleStatus = async (surveyId: string) => {
        const survey = surveys.find((s) => s.id === surveyId);
        if (!survey) return;

        const newStatus = survey.status === "stopped" ? "published" : "stopped";

        try {
            const res = await fetch(`/api/surveys/${surveyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            setSurveys(
                surveys.map((s) => {
                    if (s.id === surveyId) {
                        return { ...s, status: newStatus };
                    }
                    return s;
                })
            );

            toast.success(
                newStatus === "published"
                    ? "アンケートを再開しました"
                    : "アンケートを停止しました"
            );
        } catch (error) {
            toast.error("ステータスの更新に失敗しました");
        }
    };

    const handleDelete = async (surveyId: string) => {
        if (!confirm("このアンケートを削除してもよろしいですか？")) return;

        try {
            const res = await fetch(`/api/surveys/${surveyId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete survey');

            setSurveys(surveys.filter((s) => s.id !== surveyId));
            toast.success("アンケートを削除しました");
        } catch (error) {
            toast.error("アンケートの削除に失敗しました");
        }
    };

    const getStatusBadge = (status: Survey["status"]) => {
        switch (status) {
            case "published":
                return <Badge className="bg-green-500">公開</Badge>;
            case "draft":
                return <Badge variant="secondary">下書き</Badge>;
            case "stopped":
                return <Badge variant="outline">停止</Badge>;
        }
    };

    return (
        <ClientOnly>
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="mb-2 text-2xl md:text-3xl">アンケート一覧</h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            作成したアンケートの管理・編集ができます
                        </p>
                    </div>
                    <Button id="btn_create_new" onClick={handleCreateNew} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        新規アンケート作成
                    </Button>
                </div>

                {/* Desktop View */}
                <Card className="hidden md:block">
                    <CardHeader>
                        <CardTitle>アンケート一覧</CardTitle>
                        <CardDescription>
                            全{surveys.length}件のアンケート
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>アンケート名</TableHead>
                                    <TableHead>対象店舗</TableHead>
                                    <TableHead className="text-center">質問数</TableHead>
                                    <TableHead className="text-center">状態</TableHead>
                                    <TableHead>最終更新日</TableHead>
                                    <TableHead className="text-right">回答数</TableHead>
                                    <TableHead className="text-right">アクション</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {surveys.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            アンケートがありません
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    surveys.map((survey) => (
                                        <TableRow key={survey.id}>
                                            <TableCell>{survey.name}</TableCell>
                                            <TableCell>{survey.targetStore}</TableCell>
                                            <TableCell className="text-center">{survey.questionCount}問</TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(survey.status)}
                                            </TableCell>
                                            <TableCell>{survey.lastUpdated}</TableCell>
                                            <TableCell className="text-right">{survey.responseCount}件</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(survey.id)}
                                                    >
                                                        <Edit className="mr-1 h-3 w-3" />
                                                        編集
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleDuplicate(survey.id)}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                複製
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(survey.id)}>
                                                                {survey.status === "stopped" ? (
                                                                    <>
                                                                        <PlayCircle className="mr-2 h-4 w-4" />
                                                                        再開
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <PauseCircle className="mr-2 h-4 w-4" />
                                                                        停止
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(survey.id)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                削除
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    <div className="text-sm text-muted-foreground px-1">
                        全{surveys.length}件のアンケート
                    </div>
                    {surveys.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                アンケートがありません
                            </CardContent>
                        </Card>
                    ) : (
                        surveys.map((survey) => (
                            <Card key={survey.id}>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{survey.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getStatusBadge(survey.status)}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="shrink-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(survey.id)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        編集
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicate(survey.id)}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        複製
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(survey.id)}>
                                                        {survey.status === "stopped" ? (
                                                            <>
                                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                                再開
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PauseCircle className="mr-2 h-4 w-4" />
                                                                停止
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(survey.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        削除
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-muted-foreground mb-1">対象店舗</div>
                                                <div>{survey.targetStore}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground mb-1">質問数</div>
                                                <div>{survey.questionCount}問</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground mb-1">回答数</div>
                                                <div>{survey.responseCount}件</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground mb-1">最終更新</div>
                                                <div>{survey.lastUpdated}</div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleEdit(survey.id)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            編集
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </ClientOnly>
    );
}
