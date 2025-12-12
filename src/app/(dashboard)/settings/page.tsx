"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useDashboard } from "@/contexts/DashboardContext";
import { useStore } from "@/contexts/StoreContext";

interface Coupon {
    id: string;
    name: string;
    probability: number;
    validDays: number;
}

export default function SettingsPage() {
    const [storeName, setStoreName] = useState("ラーメン山下");
    const [timezone, setTimezone] = useState("Asia/Tokyo");
    const [googleLinked, setGoogleLinked] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [coupons, setCoupons] = useState<Coupon[]>([
        { id: "1", name: "10%割引", probability: 0.7, validDays: 30 },
        { id: "2", name: "500円割引", probability: 0.2, validDays: 14 },
    ]);
    const [keywords, setKeywords] = useState<string[]>(["西船橋", "居酒屋", "個室", "デート"]);
    const [keywordInput, setKeywordInput] = useState("");
    const [reportFrequency, setReportFrequency] = useState("off");
    const [reportEmails, setReportEmails] = useState<string[]>(["admin@example.com"]);
    const [emailInput, setEmailInput] = useState("");
    const [reportLanguage, setReportLanguage] = useState("ja");

    // 口コミ設定 - Contextから取得
    const {
        lowRatingThreshold,
        setLowRatingThreshold,
        translationEnabled,
        setTranslationEnabled,
        currentStore,
        setCurrentStore
    } = useStore();

    // Dashboard settings from context
    const { settings, updateKPISettings, updateGraphSettings } = useDashboard();

    // Initialize storeName from Context
    useEffect(() => {
        if (currentStore) {
            setStoreName(currentStore.name);
        }
    }, [currentStore]);

    // Fetch other settings
    const [googleLocationId, setGoogleLocationId] = useState<string | null>(null);
    const [availableLocations, setAvailableLocations] = useState<any[]>([]);

    const handleSaveStore = async () => {
        if (!storeName || storeName.length > 80) {
            toast.error("店舗名を入力してください（80字以内）");
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeName, timezone, googleLocationId }),
            });

            if (!res.ok) throw new Error('Failed to save');

            const data = await res.json();
            if (currentStore) {
                setCurrentStore({ ...currentStore, name: data.storeName });
            }
            toast.success("保存しました");
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    // Fetch locations when googleLinked is true
    useEffect(() => {
        if (googleLinked) {
            setIsLoadingLocations(true);
            fetch('/api/google/locations')
                .then(async res => {
                    if (!res.ok) {
                        const err = await res.json();
                        if (err.debugLogs) setDebugInfo(err.debugLogs);
                        throw new Error(err.details || res.statusText);
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.locations) {
                        setAvailableLocations(data.locations);
                    }
                    if (data.debugLogs) {
                        setDebugInfo(data.debugLogs);
                    }
                })
                .catch(err => {
                    console.warn("Failed to fetch locations (likely auth error):", err);
                    toast.error(`店舗情報の取得に失敗: ${err.message}. 再連携してください。`);
                    // If auth error, maybe we should set googleLinked to false?
                    // setGoogleLinked(false); 
                })
                .finally(() => setIsLoadingLocations(false));
        }
    }, [googleLinked]);

    // Also update fetching settings to get googleLocationId
    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/coupons');
            if (res.ok) {
                const data = await res.json();
                const couponsList = Array.isArray(data) ? data : [];
                setCoupons(couponsList.map((c: any) => ({
                    id: c.id,
                    name: c.title,
                    probability: c.probability / 100,
                    validDays: c.validDays || 30
                })));
            }
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.keywords) setKeywords(data.keywords);
                    if (data.reportFrequency) setReportFrequency(data.reportFrequency);
                    if (data.reportEmails) setReportEmails(data.reportEmails);
                    if (data.reportLanguage) setReportLanguage(data.reportLanguage);
                    if (data.timezone) setTimezone(data.timezone);
                    if (data.googleLinked !== undefined) setGoogleLinked(data.googleLinked);
                    if (data.googleLocationId) setGoogleLocationId(data.googleLocationId);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
        fetchCoupons();
    }, []);

    const handleGoogleLink = () => {
        window.location.href = '/api/auth/google';
    };

    const handleAddCoupon = () => {
        const newCoupon: Coupon = {
            id: Date.now().toString(),
            name: "新しいクーポン",
            probability: 0.5,
            validDays: 30,
        };
        setCoupons([...coupons, newCoupon]);
    };

    const handleDeleteCoupon = async (id: string) => {
        if (id.length >= 20) {
            // Existing coupon, delete via API
            try {
                await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Failed to delete coupon", e);
                toast.error("削除に失敗しました");
                return;
            }
        }
        setCoupons(coupons.filter((c) => c.id !== id));
        toast.success("クーポンを削除しました");
    };

    const handleUpdateCoupon = (
        id: string,
        field: keyof Coupon,
        value: string | number
    ) => {
        setCoupons(
            coupons.map((c) =>
                c.id === id ? { ...c, [field]: value } : c
            )
        );
    };

    const handleSaveCoupons = async () => {
        // バリデーション
        for (const coupon of coupons) {
            if (coupon.probability < 0 || coupon.probability > 1) {
                toast.error("当選確率は0.0〜1.0の範囲で設定してください");
                return;
            }
        }

        setIsSaving(true);

        try {
            // We need to sync coupons.
            // For simplicity, we will just update existing ones and create new ones.
            // Deletions are handled immediately by handleDeleteCoupon?
            // No, handleDeleteCoupon updates local state.
            // So we need to figure out what to delete.
            // This is complex.
            // Let's change strategy: Save each coupon individually?
            // Or just use the Coupons Page logic?
            // Given the UI, let's just save the modified ones.
            // But we don't track modifications.

            // Alternative: Send ALL coupons to a batch endpoint?
            // We don't have a batch endpoint.

            // Let's iterate and save.
            const promises = coupons.map(async (c) => {
                const body = {
                    title: c.name,
                    probability: Math.round(c.probability * 100), // Convert 0-1 to 0-100
                    validDays: c.validDays
                };

                // If ID is numeric (timestamp), it's new -> POST
                // If ID is UUID (string), it's existing -> PUT
                // Simple check: if id length < 20 (timestamp is ~13 chars), it's new? UUID is 36.
                // Or check if it exists in original list?

                if (c.id.length < 20) {
                    return fetch('/api/coupons', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...body, description: "設定画面から作成", isActive: true, storeId: "demo-store-id" }),
                    });
                } else {
                    return fetch(`/api/coupons/${c.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                }
            });

            await Promise.all(promises);
            toast.success("クーポン設定を保存しました");
            fetchCoupons(); // Refresh
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveKeywords = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success("キーワード設定を保存しました");
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveReport = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportFrequency, reportEmails, reportLanguage }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success("レポート設定を保存しました");
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveReviewSettings = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lowRatingThreshold, translationEnabled }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success("口コミ設定を保存しました");
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDashboardSettings = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dashboardSettings: settings }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success("ダッシュボード設定を保存しました");
        } catch (err) {
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() === "") {
            toast.error("キーワードを入力してください");
            return;
        }
        if (keywords.length >= 20) {
            toast.error("キーワードは最大20個までです");
            return;
        }
        setKeywords([...keywords, keywordInput.trim()]);
        setKeywordInput("");
    };

    const handleRemoveKeyword = (index: number) => {
        const newKeywords = keywords.filter((_, i) => i !== index);
        setKeywords(newKeywords);
    };

    const handleAddEmail = () => {
        if (emailInput.trim() === "") {
            toast.error("メールアドレスを入力してください");
            return;
        }
        setReportEmails([...reportEmails, emailInput.trim()]);
        setEmailInput("");
    };

    const handleRemoveEmail = (index: number) => {
        const newEmails = reportEmails.filter((_, i) => i !== index);
        setReportEmails(newEmails);
    };

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null; // Or a loading spinner
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="mb-2 text-3xl">設定</h1>

                <p className="text-muted-foreground">
                    店舗情報と連携設定を管理します
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>店舗情報</CardTitle>
                    <CardDescription>
                        店舗の基本情報を設定してください
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="store_name">店舗名 *</Label>
                        <Input
                            id="store_name"
                            placeholder="例：ラーメン山下"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            maxLength={80}
                        />
                        <p className="text-xs text-muted-foreground">
                            {storeName.length}/80文字
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tz">タイムゾーン *</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger id="tz">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Asia/Tokyo">Asia/Tokyo (日本時間)</SelectItem>
                                <SelectItem value="America/New_York">America/New_York (米国東部)</SelectItem>
                                <SelectItem value="Europe/London">Europe/London (英国)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleSaveStore} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            "保存"
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>外部連携</CardTitle>
                    <CardDescription>
                        Google ビジネス プロフィールとの連携状態
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p>Google ビジネス プロフィール</p>
                                {googleLinked ? (
                                    <Badge id="gbp_link" variant="secondary">連携済み</Badge>
                                ) : (
                                    <Badge id="gbp_link" variant="destructive">未連携</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                口コミの自動取得と返信機能を利用できます
                            </p>
                        </div>
                        {!googleLinked && (
                            <Button variant="outline" onClick={handleGoogleLink}>
                                <img src="/google-icon.svg" alt="Google" className="mr-2 h-4 w-4" />
                                Googleビジネスプロフィールと連携する
                            </Button>
                        )}
                    </div>

                    {googleLinked && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label>連携する店舗を選択</Label>

                            {isLoadingLocations ? (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    店舗情報を取得中...
                                </div>
                            ) : availableLocations.length > 0 ? (
                                <>
                                    <Select
                                        value={googleLocationId || ""}
                                        onValueChange={setGoogleLocationId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="店舗を選択..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLocations.map((loc: any) => (
                                                <SelectItem key={loc.name} value={loc.name}>
                                                    {loc.title} ({loc.storeCode || 'No Code'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        選択後に「保存」ボタンを押してください
                                    </p>
                                </>
                            ) : (
                                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                                    管理可能な店舗(Googleビジネスプロフィール)が見つかりませんでした。<br />
                                    Googleアカウントにビジネスプロフィールの管理権限があるかご確認ください。
                                </div>
                            )}

                            {/* Debug Info */}
                            {(availableLocations.length === 0 && debugInfo.length > 0) && (
                                <div className="mt-4 p-3 border rounded-md bg-slate-50 text-xs font-mono text-slate-700">
                                    <p className="font-bold mb-1">デバッグ情報:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {debugInfo.map((Log, i) => (
                                            <li key={i}>{Log}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>クーポン設定</CardTitle>
                            <CardDescription>
                                抽選で提供するクーポンを管理します
                            </CardDescription>
                        </div>
                        <Button onClick={handleAddCoupon} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            追加
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {coupons.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            クーポンが設定されていません
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>クーポン名</TableHead>
                                    <TableHead>当選確率</TableHead>
                                    <TableHead>有効日数</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id} id={`coupon_${coupon.id}`}>
                                        <TableCell>
                                            <Input
                                                value={coupon.name}
                                                onChange={(e) =>
                                                    handleUpdateCoupon(coupon.id, "name", e.target.value)
                                                }
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={coupon.probability}
                                                onChange={(e) =>
                                                    handleUpdateCoupon(
                                                        coupon.id,
                                                        "probability",
                                                        parseFloat(e.target.value)
                                                    )
                                                }
                                                className="w-24"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={coupon.validDays}
                                                onChange={(e) =>
                                                    handleUpdateCoupon(
                                                        coupon.id,
                                                        "validDays",
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {coupons.length > 0 && (
                        <Button onClick={handleSaveCoupons} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    保存中...
                                </>
                            ) : (
                                "クーポン設定を保存"
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>キーワード設定</CardTitle>
                    <CardDescription>
                        店舗に関連するキーワードを設定します
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center">
                        <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="キーワードを入力"
                            className="w-full"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleAddKeyword}
                            disabled={keywordInput.trim() === ""}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {keywords.map((keyword, index) => (
                            <div key={index} className="flex items-center">
                                <Badge variant="secondary">{keyword}</Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveKeyword(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardContent className="pt-0">
                    <Button onClick={handleSaveKeywords} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "保存"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>レポート設定</CardTitle>
                    <CardDescription>
                        キーワードに関するレポートの設定を行います
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="report_frequency">レポート頻度</Label>
                        <Select
                            value={reportFrequency}
                            onValueChange={setReportFrequency}
                        >
                            <SelectTrigger id="report_frequency">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">無効</SelectItem>
                                <SelectItem value="daily">毎日</SelectItem>
                                <SelectItem value="weekly">毎週</SelectItem>
                                <SelectItem value="monthly">毎月</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="report_emails">レポート送信先メールアドレス</Label>
                        <Input
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="メールアドレスを入力"
                            className="w-full"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleAddEmail}
                            disabled={emailInput.trim() === ""}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {reportEmails.map((email, index) => (
                            <div key={index} className="flex items-center">
                                <Badge variant="secondary">{email}</Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveEmail(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="report_language">レポート言語</Label>
                        <Select
                            value={reportLanguage}
                            onValueChange={setReportLanguage}
                        >
                            <SelectTrigger id="report_language">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ja">日本語</SelectItem>
                                <SelectItem value="en">英語</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardContent className="pt-0">
                    <Button onClick={handleSaveReport} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "保存"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>口コミ設定</CardTitle>
                    <CardDescription>
                        口コミのフィルタリングと翻訳設定を行います
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="low_rating_threshold">低評価の閾値</Label>
                        <Select
                            value={lowRatingThreshold}
                            onValueChange={setLowRatingThreshold}
                        >
                            <SelectTrigger id="low_rating_threshold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1-2">1-2星</SelectItem>
                                <SelectItem value="1-3">1-3星</SelectItem>
                                <SelectItem value="1-4">1-4星</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="translation_enabled">翻訳機能</Label>
                        <Switch
                            id="translation_enabled"
                            checked={translationEnabled}
                            onCheckedChange={setTranslationEnabled}
                        />
                    </div>
                </CardContent>
                <CardContent className="pt-0">
                    <Button onClick={handleSaveReviewSettings} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "保存"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ダッシュボードカスタマイズ</CardTitle>
                    <CardDescription>
                        ダッシュボードに表示するKPIとグラフを選択します
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base">表示するKPI</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_review_count" className="flex-1 cursor-pointer">
                                    口コミ総数
                                </Label>
                                <Switch
                                    id="kpi_review_count"
                                    checked={settings.kpis.reviewCount}
                                    onCheckedChange={(value) => updateKPISettings("reviewCount", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_average_rating" className="flex-1 cursor-pointer">
                                    平均評価
                                </Label>
                                <Switch
                                    id="kpi_average_rating"
                                    checked={settings.kpis.averageRating}
                                    onCheckedChange={(value) => updateKPISettings("averageRating", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_unreplied" className="flex-1 cursor-pointer">
                                    未返信口コミ
                                </Label>
                                <Switch
                                    id="kpi_unreplied"
                                    checked={settings.kpis.unreplied}
                                    onCheckedChange={(value) => updateKPISettings("unreplied", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_impressions" className="flex-1 cursor-pointer">
                                    GBP表示回数
                                </Label>
                                <Switch
                                    id="kpi_impressions"
                                    checked={settings.kpis.impressions}
                                    onCheckedChange={(value) => updateKPISettings("impressions", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_phone_clicks" className="flex-1 cursor-pointer">
                                    電話クリック数
                                </Label>
                                <Switch
                                    id="kpi_phone_clicks"
                                    checked={settings.kpis.phoneClicks}
                                    onCheckedChange={(value) => updateKPISettings("phoneClicks", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_low_rating" className="flex-1 cursor-pointer">
                                    低評価割合
                                </Label>
                                <Switch
                                    id="kpi_low_rating"
                                    checked={settings.kpis.lowRating}
                                    onCheckedChange={(value) => updateKPISettings("lowRating", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_directions" className="flex-1 cursor-pointer">
                                    ルート検索回数
                                </Label>
                                <Switch
                                    id="kpi_directions"
                                    checked={settings.kpis.directions}
                                    onCheckedChange={(value) => updateKPISettings("directions", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_website_clicks" className="flex-1 cursor-pointer">
                                    Webサイトクリック数
                                </Label>
                                <Switch
                                    id="kpi_website_clicks"
                                    checked={settings.kpis.websiteClicks}
                                    onCheckedChange={(value) => updateKPISettings("websiteClicks", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="kpi_ctr" className="flex-1 cursor-pointer">
                                    クリック率（CTR）
                                </Label>
                                <Switch
                                    id="kpi_ctr"
                                    checked={settings.kpis.ctr}
                                    onCheckedChange={(value) => updateKPISettings("ctr", value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label className="text-base">表示するグラフ</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="graph_review_trend" className="flex-1 cursor-pointer">
                                    口コミ件数推移
                                </Label>
                                <Switch
                                    id="graph_review_trend"
                                    checked={settings.graphs.reviewTrend}
                                    onCheckedChange={(value) => updateGraphSettings("reviewTrend", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="graph_reply_rate" className="flex-1 cursor-pointer">
                                    返信率推移
                                </Label>
                                <Switch
                                    id="graph_reply_rate"
                                    checked={settings.graphs.replyRate}
                                    onCheckedChange={(value) => updateGraphSettings("replyRate", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="graph_gbp_performance" className="flex-1 cursor-pointer">
                                    GBPパフォーマンス推移
                                </Label>
                                <Switch
                                    id="graph_gbp_performance"
                                    checked={settings.graphs.gbpPerformance}
                                    onCheckedChange={(value) => updateGraphSettings("gbpPerformance", value)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label htmlFor="graph_review_analytics" className="flex-1 cursor-pointer">
                                    口コミトレンド
                                </Label>
                                <Switch
                                    id="graph_review_analytics"
                                    checked={settings.graphs.reviewAnalytics}
                                    onCheckedChange={(value) => updateGraphSettings("reviewAnalytics", value)}
                                />
                            </div>
                        </div>
                    </div>


                </CardContent>
                <CardContent className="pt-0">
                    <Button onClick={handleSaveDashboardSettings} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "保存"}
                    </Button>
                </CardContent>
            </Card>
        </div >
    );
}
