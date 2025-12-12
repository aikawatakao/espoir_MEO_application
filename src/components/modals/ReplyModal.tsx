"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  author: string;
  date: string;
  text: string;
}

interface ReplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  onSuccess?: () => void;
}

export function ReplyModal({
  open,
  onOpenChange,
  review,
  onSuccess,
}: ReplyModalProps) {
  const [draftText, setDraftText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && review && !draftText) {
      generateAIDraft();
    }
  }, [open, review]);

  const generateAIDraft = async () => {
    if (!review) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reply',
          context: {
            rating: review.rating,
            text: review.text,
            author: review.author
          }
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate draft');
      }

      const data = await res.json();
      setDraftText(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI下書きの生成に失敗しました。APIキーが設定されているか確認してください。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setDraftText("");
    generateAIDraft();
  };

  const handlePost = async () => {
    if (!draftText || draftText.length < 1 || draftText.length > 800) {
      setError("返信文を1〜800文字で入力してください");
      return;
    }

    if (!review) return;

    setIsPosting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText: draftText,
        }),
      });

      if (!res.ok) throw new Error('Failed to post reply');

      toast.success("投稿が完了しました");
      onOpenChange(false);
      onSuccess?.();

      setTimeout(() => {
        setDraftText("");
        setError(null);
      }, 300);
    } catch (err) {
      setError("投稿に失敗しました。もう一度お試しください。");
    } finally {
      setIsPosting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>🤖 AI返信案を生成</DialogTitle>
              <DialogDescription>
                AI生成された返信文を編集して投稿できます
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" id="err">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div id="src_rev" className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="font-medium">{review.author}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(review.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-3 leading-relaxed">{review.text}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium">AI返信文</label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="text-primary hover:bg-primary/10"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                再生成
              </Button>
            </div>

            {isGenerating ? (
              <div className="flex h-48 items-center justify-center rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-primary" />
                  </div>
                  <p className="font-medium text-primary">
                    AI下書きを生成中...
                  </p>
                </div>
              </div>
            ) : (
              <Textarea
                id="ai_draft"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="返信文を入力してください"
                rows={10}
                maxLength={800}
                className="resize-none leading-relaxed"
              />
            )}

            <p className="text-xs text-muted-foreground">
              {draftText.length}/800文字
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            id="btn_post"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handlePost}
            disabled={isPosting || isGenerating || !draftText}
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                投稿中...
              </>
            ) : (
              "承認して投稿"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}