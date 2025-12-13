import { db } from '@/lib/db';
import { stores, reviews as reviewsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { listReviews } from '@/lib/google';

export async function syncReviews(storeId: string) {
    const isDemoMode = process.env.DEMO_MODE === 'true';

    try {
        if (isDemoMode) {
            console.log(`[Sync] Running in DEMO MODE for store ${storeId}`);
            await generateMockReviews(storeId);
        } else {
            console.log(`[Sync] Running in REAL MODE for store ${storeId}`);
            await syncGoogleReviews(storeId);
        }
        return { success: true };
    } catch (error) {
        console.error("Sync failed:", error);
        return { success: false, error };
    }
}

async function syncGoogleReviews(storeId: string) {
    const store = (await db.select().from(stores).where(eq(stores.id, storeId)).limit(1))[0];

    if (!store || !store.googleAccessToken || !store.googleLocationId) {
        throw new Error("Store not linked to Google");
    }

    // Check if it's a DEMO PLACE (starts with 'places/') - Legacy demo handling, can be kept for compatibility
    if (store.googleLocationId.startsWith('places/')) {
        // ... (Existing implementation for Places API if needed, or skip)
        // For simplicity in this refactor, we focus on the main GMB API or pure Mock
        return;
    }

    const googleReviews = await listReviews(store.googleAccessToken, store.googleLocationId);

    for (const gReview of googleReviews) {
        const googleId = gReview.reviewId || gReview.name;
        if (!googleId) continue;

        const existing = (await db.select().from(reviewsTable).where(eq(reviewsTable.id, googleId)).limit(1))[0];

        const reviewData = {
            storeId: storeId,
            author: gReview.reviewer?.displayName || 'Anonymous',
            rating: ["ONE", "TWO", "THREE", "FOUR", "FIVE"].indexOf(gReview.starRating) + 1 || 0,
            text: gReview.comment || '',
            date: gReview.createTime || new Date().toISOString(),
            replied: !!gReview.reviewReply,
            replyText: gReview.reviewReply?.comment,
            repliedAt: gReview.reviewReply?.updateTime,
            language: 'ja',
        };

        if (!existing) {
            await db.insert(reviewsTable).values({
                id: googleId,
                ...reviewData
            });
        } else {
            if (!!gReview.reviewReply !== existing.replied) {
                await db.update(reviewsTable).set({
                    replied: reviewData.replied,
                    replyText: reviewData.replyText,
                    repliedAt: reviewData.repliedAt
                }).where(eq(reviewsTable.id, googleId));
            }
        }
    }
}

async function generateMockReviews(storeId: string) {
    // Generate some static mock reviews if they don't exist
    const mocks = [
        {
            id: `mock-review-1-${storeId}`,
            author: "山田 太郎",
            rating: 5,
            text: "店員さんの対応がとても丁寧で良かったです。また来たいと思います！",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            replied: true,
            replyText: "ご来店ありがとうございます！またのお越しをお待ちしております。",
            repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        },
        {
            id: `mock-review-2-${storeId}`,
            author: "鈴木 花子",
            rating: 4,
            text: "料理は美味しかったですが、提供までの時間が少し長かったです。",
            date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            replied: false,
            replyText: null,
            repliedAt: null,
        },
        {
            id: `mock-review-3-${storeId}`,
            author: "佐藤 健",
            rating: 5,
            text: "個室があって落ち着けました。接待にも使えそうです。",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            replied: true,
            replyText: "この度はご利用ありがとうございます。個室気に入っていただけて光栄です。",
            repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        }
    ];

    for (const mock of mocks) {
        const existing = (await db.select().from(reviewsTable).where(eq(reviewsTable.id, mock.id)).limit(1))[0];

        // In Demo Mode, we ensure these mocks exist. 
        // We only insert if missing. We generally don't overwrite if user modified them in demo?
        // Let's reset them if missing to ensure data is there.
        if (!existing) {
            await db.insert(reviewsTable).values({
                id: mock.id,
                storeId: storeId,
                author: mock.author,
                rating: mock.rating,
                text: mock.text,
                date: mock.date,
                replied: mock.replied,
                replyText: mock.replyText,
                repliedAt: mock.repliedAt,
                language: 'ja',
            });
        }
    }
}
