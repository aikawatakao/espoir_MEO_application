"use client";

import { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, Search, MessageCircle, Filter, Languages, Flag, MoreVertical, Tag as TagIcon, X, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/contexts/StoreContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ReplyModal } from "@/components/modals/ReplyModal";

// EmptyState Component
function EmptyState({ icon: Icon, title, description, action }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
            {action && (
                <Button onClick={action.onClick} variant="outline" className="mt-4">
                    {action.label}
                </Button>
            )}
        </div>
    );
}

interface Review {
    id: string;
    rating: number;
    author: string;
    date: string;
    text: string;
    replied: boolean;
    replyText?: string;
    language?: string;
    translatedText?: string;
    tags?: string[];
    flagStatus?: "none" | "pending" | "resolved";
    lowRating?: boolean;
}

function ReviewListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialFilter = searchParams?.get("filter") || "all";

    const [searchQuery, setSearchQuery] = useState("");
    const [ratingFilter, setRatingFilter] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState<string[]>([]);

    const [showUnreplied, setShowUnreplied] = useState(initialFilter === "no_reply");
    const [showLowRating, setShowLowRating] = useState(initialFilter === "low_rating");
    const [showForeign, setShowForeign] = useState(false);
    const [showFlagged, setShowFlagged] = useState(false);

    const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});

    const [deletionDialog, setDeletionDialog] = useState<{
        open: boolean;
        reviewId: string | null;
        reason: string;
        comment: string;
    }>({
        open: false,
        reviewId: null,
        reason: "",
        comment: "",
    });

    const [tagDialog, setTagDialog] = useState<{
        open: boolean;
        reviewId: string | null;
        newTag: string;
    }>({
        open: false,
        reviewId: null,
        newTag: "",
    });

    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    const { translationEnabled } = useStore();
    // Mock lowRatingThreshold logic
    const lowRatingThreshold: string = "1-2";

    const isLowRating = (rating: number): boolean => {
        switch (lowRatingThreshold) {
            case "1-2": return rating <= 2;
            case "1-3": return rating <= 3;
            case "1-4": return rating <= 4;
            default: return rating <= 2;
        }
    };

    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/reviews');
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
            toast.error("口コミの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const allTags = Array.from(new Set(reviews.flatMap((r) => r.tags || [])));

    const filteredReviews = reviews.filter((review) => {
        if (showUnreplied && review.replied) return false;
        if (showLowRating && !isLowRating(review.rating)) return false;
        if (showForeign && review.language === "JA") return false;
        if (showFlagged && review.flagStatus !== "pending") return false;

        if (ratingFilter.length > 0 && !ratingFilter.includes(review.rating.toString())) {
            return false;
        }

        if (tagFilter.length > 0) {
            const hasTag = tagFilter.some((tag) => review.tags?.includes(tag));
            if (!hasTag) return false;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchText = review.text.toLowerCase().includes(query);
            const matchAuthor = review.author.toLowerCase().includes(query);
            const matchTranslation = review.translatedText?.toLowerCase().includes(query);
            if (!matchText && !matchAuthor && !matchTranslation) return false;
        }

        return true;
    });

    const handleToggleTranslation = (reviewId: string) => {
        setShowTranslation((prev) => ({
            ...prev,
            [reviewId]: !prev[reviewId],
        }));
    };

    const handleOpenDeletionDialog = (reviewId: string) => {
        setDeletionDialog({
            open: true,
            reviewId,
            reason: "",
            comment: "",
        });
    };

    const handleSubmitDeletion = async () => {
        if (!deletionDialog.reviewId || !deletionDialog.reason) {
            toast.error("理由を選択してください");
            return;
        }

        try {
            const res = await fetch(`/api/reviews/${deletionDialog.reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flagStatus: 'pending' }),
            });

            if (!res.ok) throw new Error('Failed to submit deletion request');

            setReviews(
                reviews.map((r) =>
                    r.id === deletionDialog.reviewId
                        ? { ...r, flagStatus: "pending" as const }
                        : r
                )
            );
            toast.success("削除申請を送信しました");
            setDeletionDialog({ open: false, reviewId: null, reason: "", comment: "" });
        } catch (error) {
            toast.error("削除申請の送信に失敗しました");
        }
    };

    const handleOpenTagDialog = (reviewId: string) => {
        setTagDialog({
            open: true,
            reviewId,
            newTag: "",
        });
    };

    const handleAddTag = async () => {
        if (!tagDialog.reviewId || !tagDialog.newTag.trim()) {
            toast.error("タグを入力してください");
            return;
        }

        const review = reviews.find(r => r.id === tagDialog.reviewId);
        if (!review) return;

        const newTags = [...(review.tags || []), tagDialog.newTag.trim()];

        try {
            const res = await fetch(`/api/reviews/${tagDialog.reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: newTags }),
            });

            if (!res.ok) throw new Error('Failed to add tag');

            const updatedReview = await res.json();

            setReviews(
                reviews.map((r) =>
                    r.id === tagDialog.reviewId
                        ? { ...r, tags: updatedReview.tags.map((t: any) => t.name) }
                        : r
                )
            );
            toast.success("タグを追加しました");
            setTagDialog({ open: false, reviewId: null, newTag: "" });
        } catch (error) {
            toast.error("タグの追加に失敗しました");
        }
    };

    const handleRemoveTag = async (reviewId: string, tag: string) => {
        const review = reviews.find(r => r.id === reviewId);
        if (!review) return;

        const newTags = review.tags?.filter((t) => t !== tag) || [];

        try {
            const res = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: newTags }),
            });

            if (!res.ok) throw new Error('Failed to remove tag');

            const updatedReview = await res.json();

            setReviews(
                reviews.map((r) =>
                    r.id === reviewId
                        ? { ...r, tags: updatedReview.tags.map((t: any) => t.name) }
                        : r
                )
            );
            toast.success("タグを削除しました");
        } catch (error) {
            toast.error("タグの削除に失敗しました");
        }
    };

    const getLanguageBadge = (language?: string) => {
        if (!language || language === "JA") return null;
        return (
            <Badge variant="outline" className="ml-2">
                {language}
            </Badge>
        );
    };

    const onReplyClick = (review: Review) => {
        setSelectedReview(review);
        setReplyModalOpen(true);
    };

    const handleReplySuccess = () => {
        if (selectedReview) {
            // Optimistic update or re-fetch
            setReviews(reviews.map(r => r.id === selectedReview.id ? { ...r, replied: true, replyText: "返信済み" } : r));
            fetchReviews(); // Re-fetch to get exact state if needed
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h1 className="mb-2 text-2xl md:text-3xl">口コミ一覧</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    顧客からの口コミを確認し、返信を行いましょう
                </p>
            </div>

            {/* Filters */}
            <div className="hidden md:flex flex-wrap gap-2">
                <Button
                    variant={showUnreplied ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowUnreplied(!showUnreplied)}
                >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    未返信のみ
                </Button>
                <Button
                    variant={showLowRating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLowRating(!showLowRating)}
                >
                    <Star className="mr-2 h-4 w-4" />
                    低評価のみ
                </Button>
                <Button
                    variant={showForeign ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowForeign(!showForeign)}
                >
                    <Languages className="mr-2 h-4 w-4" />
                    外国語のみ
                </Button>
                <Button
                    variant={showFlagged ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFlagged(!showFlagged)}
                >
                    <Flag className="mr-2 h-4 w-4" />
                    削除申請済みのみ
                </Button>
                {(showUnreplied || showLowRating || showForeign || showFlagged) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowUnreplied(false);
                            setShowLowRating(false);
                            setShowForeign(false);
                            setShowFlagged(false);
                        }}
                    >
                        <X className="mr-2 h-4 w-4" />
                        フィルタをクリア
                    </Button>
                )}
            </div>

            {/* Detailed Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="search">キーワード検索</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="キーワードで自然文検索"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>評価</Label>
                            <Select
                                value={ratingFilter.length > 0 ? ratingFilter.join(",") : "all"}
                                onValueChange={(value) =>
                                    setRatingFilter(value === "all" ? [] : value.split(","))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="すべての評価" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">すべての評価</SelectItem>
                                    <SelectItem value="5">★5</SelectItem>
                                    <SelectItem value="4">★4</SelectItem>
                                    <SelectItem value="3">★3</SelectItem>
                                    <SelectItem value="2">★2</SelectItem>
                                    <SelectItem value="1">★1</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>タグで絞り込み</Label>
                            <Select
                                value={tagFilter.length > 0 ? tagFilter.join(",") : "all"}
                                onValueChange={(value) =>
                                    setTagFilter(value === "all" ? [] : value.split(","))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="すべてのタグ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">すべてのタグ</SelectItem>
                                    {allTags.map((tag) => (
                                        <SelectItem key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review List */}
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {filteredReviews.length}件の口コミ
                </p>
                {filteredReviews.length === 0 ? (
                    <EmptyState
                        icon={Inbox}
                        title="口コミが見つかりませんでした"
                        description="フィルタ条件を変更するか、新しい口コミを待ちましょう"
                        action={
                            (showUnreplied || showLowRating || showForeign || showFlagged)
                                ? {
                                    label: "フィルタをクリア",
                                    onClick: () => {
                                        setShowUnreplied(false);
                                        setShowLowRating(false);
                                        setShowForeign(false);
                                        setShowFlagged(false);
                                    },
                                }
                                : undefined
                        }
                    />
                ) : (
                    filteredReviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < review.rating
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-gray-300"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            {getLanguageBadge(review.language)}
                                            {review.lowRating && (
                                                <Badge variant="destructive">低評価</Badge>
                                            )}
                                            {review.flagStatus === "pending" && (
                                                <Badge variant="outline" className="border-orange-500 text-orange-500">
                                                    削除申請中
                                                </Badge>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDeletionDialog(review.id)}>
                                                    <Flag className="mr-2 h-4 w-4" />
                                                    Googleに削除申請する
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenTagDialog(review.id)}>
                                                    <TagIcon className="mr-2 h-4 w-4" />
                                                    タグを追加
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <p className="mb-1">
                                            <span className="mr-2">{review.author}</span>
                                            <span className="text-sm text-muted-foreground">{review.date}</span>
                                        </p>
                                        <p className="whitespace-pre-wrap">{review.text}</p>
                                    </div>

                                    {/* Translation */}
                                    {translationEnabled && review.translatedText && (
                                        <div>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleToggleTranslation(review.id)}
                                                className="px-0"
                                            >
                                                <Languages className="mr-1 h-4 w-4" />
                                                {showTranslation[review.id] ? "原文を表示" : "日本語訳を表示"}
                                            </Button>
                                            {showTranslation[review.id] && (
                                                <div className="mt-2 rounded-md bg-muted/50 p-3">
                                                    <p className="text-sm">[日本語訳]</p>
                                                    <p className="mt-1">{review.translatedText}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {review.tags && review.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {review.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="gap-1">
                                                    #{tag}
                                                    <button
                                                        onClick={() => handleRemoveTag(review.id, tag)}
                                                        className="ml-1 rounded-full hover:bg-muted"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply */}
                                    {review.replied && review.replyText ? (
                                        <div className="space-y-2">
                                            <div className="rounded-md border-l-4 border-primary bg-muted/30 p-3">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span className="text-sm">店舗からの返信</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onReplyClick(review)}
                                                    >
                                                        返信を編集
                                                    </Button>
                                                </div>
                                                <p className="text-sm">{review.replyText}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button onClick={() => onReplyClick(review)}>
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            AI返信を生成
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Deletion Dialog */}
            <Dialog open={deletionDialog.open} onOpenChange={(open) => setDeletionDialog({ ...deletionDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Googleに削除申請する</DialogTitle>
                        <DialogDescription>
                            この口コミの削除をGoogleに申請します。申請理由を選択してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">理由 *</Label>
                            <Select
                                value={deletionDialog.reason}
                                onValueChange={(value) => setDeletionDialog({ ...deletionDialog, reason: value })}
                            >
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="理由を選択してください" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="spam">スパム</SelectItem>
                                    <SelectItem value="inappropriate">差別的・不適切な内容</SelectItem>
                                    <SelectItem value="fake">実際の体験に基づかない</SelectItem>
                                    <SelectItem value="other">その他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comment">補足説明（任意）</Label>
                            <Textarea
                                id="comment"
                                placeholder="申請の詳細を入力してください"
                                value={deletionDialog.comment}
                                onChange={(e) => setDeletionDialog({ ...deletionDialog, comment: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletionDialog({ open: false, reviewId: null, reason: "", comment: "" })}
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleSubmitDeletion}>申請を送信</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tag Dialog */}
            <Dialog open={tagDialog.open} onOpenChange={(open) => setTagDialog({ ...tagDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>タグを追加</DialogTitle>
                        <DialogDescription>
                            この口コミにタグを追加します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="newTag">タグ名</Label>
                        <Input
                            id="newTag"
                            placeholder="例：接客、価格、雰囲気"
                            value={tagDialog.newTag}
                            onChange={(e) => setTagDialog({ ...tagDialog, newTag: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setTagDialog({ open: false, reviewId: null, newTag: "" })}
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleAddTag}>追加</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reply Modal */}
            <ReplyModal
                open={replyModalOpen}
                onOpenChange={setReplyModalOpen}
                review={selectedReview}
                onSuccess={handleReplySuccess}
            />
        </div>
    );
}

import ClientOnly from "@/components/ClientOnly";

export default function ReviewListPage() {
    return (
        <ClientOnly>
            <Suspense fallback={<div>Loading...</div>}>
                <ReviewListContent />
            </Suspense>
        </ClientOnly>
    );
}
