import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, reviews as reviewsTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { listReviews } from '@/lib/google';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const storeId = cookieStore.get('session_store_id')?.value;

        // Fetch from DB regardless of auth to show *something* if we want public access? 
        // No, this is dashboard.

        let targetStoreId = storeId;
        if (!targetStoreId) {
            // For prototype, maybe fallback to the first store if no session?
            // Or return 401. Let's return 401 for safety but if user wants to see demo data...
            // Let's stick to session.
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.select().from(stores).where(eq(stores.id, targetStoreId));
        const store = result[0];

        // Sync with Google if linked and location selected
        if (store && store.googleAccessToken && store.googleLocationId) {
            try {
                // If it's a DEMO PLACE (starts with 'places/'), fetch public reviews
                if (store.googleLocationId.startsWith('places/')) {
                    const apiKey = process.env.GEMINI_API_KEY; // Using Gemini Key as it usually has Google Maps access in same project

                    const url = `https://places.googleapis.com/v1/${store.googleLocationId}?fields=reviews&key=${apiKey}&languageCode=ja`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (data.reviews) {
                        const googleReviews = data.reviews;
                        // Upsert reviews
                        for (const gReview of googleReviews) {
                            const googleId = gReview.name; // Resource name as ID
                            if (!googleId) continue;

                            const existing = (await db.select().from(reviewsTable).where(eq(reviewsTable.id, googleId)).limit(1))[0];

                            if (!existing) {
                                try {
                                    await db.insert(reviewsTable).values({
                                        id: googleId,
                                        storeId: targetStoreId,
                                        author: gReview.authorAttribution?.displayName || 'Anonymous',
                                        rating: gReview.rating || 0,
                                        text: gReview.text?.text || gReview.originalText?.text || '',
                                        date: gReview.publishTime || new Date().toISOString(),
                                        replied: false,
                                        language: 'ja',
                                    });
                                } catch (insertError) {
                                    console.error("Error inserting review:", insertError);
                                }
                            }
                        }
                    }

                } else {
                    console.log('Syncing reviews for', store.googleLocationId);
                    const googleReviews = await listReviews(store.googleAccessToken, store.googleLocationId);

                    // Upsert reviews
                    for (const gReview of googleReviews) {
                        const googleId = gReview.reviewId || gReview.name;

                        if (!googleId) continue;

                        const existing = (await db.select().from(reviewsTable).where(eq(reviewsTable.id, googleId)).limit(1))[0];

                        if (!existing) {
                            try {
                                await db.insert(reviewsTable).values({
                                    id: googleId,
                                    storeId: targetStoreId,
                                    author: gReview.reviewer?.displayName || 'Anonymous',
                                    rating: ["ONE", "TWO", "THREE", "FOUR", "FIVE"].indexOf(gReview.starRating) + 1 || 0,
                                    text: gReview.comment || '',
                                    date: gReview.createTime || new Date().toISOString(),
                                    replied: !!gReview.reviewReply,
                                    replyText: gReview.reviewReply?.comment,
                                    repliedAt: gReview.reviewReply?.updateTime,
                                    language: 'ja',
                                });
                            } catch (insertError) {
                                console.error("Error inserting review:", insertError);
                            }
                        } else {
                            if (!!gReview.reviewReply !== existing.replied) {
                                await db.update(reviewsTable).set({
                                    replied: !!gReview.reviewReply,
                                    replyText: gReview.reviewReply?.comment,
                                    repliedAt: gReview.reviewReply?.updateTime
                                }).where(eq(reviewsTable.id, googleId));
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to sync reviews:", e);
                // Continue to DB fetch
            }
        }

        // Just fetching from DB for now until schema update
        const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.storeId, targetStoreId)).orderBy(desc(reviewsTable.date));

        const formattedReviews = allReviews.map(review => ({
            id: review.id,
            author: review.author,
            rating: review.rating,
            text: review.text,
            date: review.date,
            replied: review.replied,
            replyText: review.replyText,
            language: review.language,
            translatedText: review.translatedText,
            tags: [],
            flagStatus: review.flagStatus,
            lowRating: review.rating <= 2
        }));

        return NextResponse.json({ reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
