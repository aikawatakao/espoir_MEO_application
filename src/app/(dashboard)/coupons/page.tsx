"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Plus, Ticket, MoreVertical, Pencil, Trash2, Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Coupon {
    id: string;
    title: string;
    description: string;
    probability: number;
    isActive: boolean;
    createdAt: string;
}

export default function CouponListPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/coupons');
            if (res.ok) {
                const data = await res.json();
                setCoupons(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch coupons", error);
            toast.error("クーポンの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        probability: 50,
        isActive: true,
    });

    const handleOpenCreate = () => {
        setEditingCoupon(null);
        setFormData({
            title: "",
            description: "",
            probability: 50,
            isActive: true,
        });
        setIsCreateDialogOpen(true);
    };

    const handleOpenEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            title: coupon.title,
            description: coupon.description,
            probability: coupon.probability,
            isActive: coupon.isActive,
        });
        setIsCreateDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.description) {
            toast.error("タイトルと説明を入力してください");
            return;
        }

        try {
            if (editingCoupon) {
                const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) throw new Error('Failed to update coupon');

                const updatedCoupon = await res.json();
                setCoupons(coupons.map((c) => (c.id === editingCoupon.id ? { ...c, ...updatedCoupon, createdAt: c.createdAt } : c)));
                toast.success("クーポンを更新しました");
            } else {
                const res = await fetch('/api/coupons', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        storeId: "demo-store-id" // Should be dynamic
                    }),
                });

                if (!res.ok) throw new Error('Failed to create coupon');

                const newCoupon = await res.json();
                setCoupons([{ ...newCoupon, createdAt: newCoupon.createdAt.split('T')[0] }, ...coupons]);
                toast.success("クーポンを作成しました");
            }

            setIsCreateDialogOpen(false);
        } catch (error) {
            toast.error("クーポンの保存に失敗しました");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("このクーポンを削除してもよろしいですか？")) return;

        try {
            const res = await fetch(`/api/coupons/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete coupon');

            setCoupons(coupons.filter((c) => c.id !== id));
            toast.success("クーポンを削除しました");
        } catch (error) {
            toast.error("クーポンの削除に失敗しました");
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/coupons/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            setCoupons(coupons.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c)));
            toast.success(currentStatus ? "クーポンを無効にしました" : "クーポンを有効にしました");
        } catch (error) {
            toast.error("ステータスの更新に失敗しました");
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">クーポン管理</h1>
                    <p className="text-sm text-muted-foreground">
                        顧客向けのクーポンを作成・管理します
                    </p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    新規作成
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coupons.map((coupon) => (
                    <Card key={coupon.id} className={coupon.isActive ? "" : "opacity-70"}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">
                                    {coupon.title}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    作成日: {coupon.createdAt}
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="-mr-2 h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenEdit(coupon)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        編集
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleDelete(coupon.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        削除
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                                <p className="line-clamp-2 min-h-[2.5rem]">{coupon.description}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <Ticket className="h-4 w-4" />
                                        <span>当選確率: {coupon.probability}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={coupon.isActive}
                                        onCheckedChange={() => handleToggleActive(coupon.id, coupon.isActive)}
                                    />
                                    <span className="text-sm font-medium">
                                        {coupon.isActive ? "有効" : "無効"}
                                    </span>
                                </div>
                                <Badge variant={coupon.isActive ? "default" : "secondary"}>
                                    {coupon.isActive ? "公開中" : "下書き"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCoupon ? "クーポンを編集" : "新規クーポン作成"}
                        </DialogTitle>
                        <DialogDescription>
                            クーポンの内容と当選確率を設定してください
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">クーポン名</Label>
                            <Input
                                id="title"
                                placeholder="例：10% OFFクーポン"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">説明</Label>
                            <Textarea
                                id="description"
                                placeholder="クーポンの詳細や利用条件を入力してください"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>当選確率</Label>
                                <span className="text-sm font-medium">{formData.probability}%</span>
                            </div>
                            <Slider
                                value={[formData.probability]}
                                onValueChange={(value) => setFormData({ ...formData, probability: value[0] })}
                                max={100}
                                step={1}
                            />
                            <p className="text-xs text-muted-foreground">
                                ※ 0%にすると抽選で当たりません。100%にすると必ず当たります。
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="isActive">すぐに公開する</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
