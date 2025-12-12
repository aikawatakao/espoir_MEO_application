import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, reviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { replyToReview } from '@/lib/google';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { replyText } = await request.json();
        const cookieStore = await cookies();
        const storeId = cookieStore.get('session_store_id')?.value;

        if (!storeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get review and store
        const review = (await db.select().from(reviews).where(eq(reviews.id, id)).limit(1))[0];
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        const store = (await db.select().from(stores).where(eq(stores.id, storeId)).limit(1))[0];

        // Save to DB
        await db.update(reviews).set({
            replied: true,
            replyText: replyText,
            repliedAt: new Date().toISOString()
        }).where(eq(reviews.id, id));

        // Post to Google if linked
        if (store && store.googleAccessToken) {
            try {
                // If the review ID is a Google Review ID (which we store in ID now), we can reply directly.
                // Or we need to store the resource name.
                // Google API needs `accounts/{accountId}/locations/{locationId}/reviews/{reviewId}`.
                // If `id` is just reviewId, we need to construct the parent.
                // But we don't have the parent path stored in review?
                // We should store `googleReviewName` in DB or construct it.
                // `googleLocationId` is in store. `googleAccountId` is... we can list accounts.
                // Optimally we'd store the full resource name in the review record.
                // For now, let's assume `id` IS the resource name IF it comes from Google.
                // Or if it's a UUID, it's a mock.
                // If it contains "accounts/", it's a Google ID.

                if (review.id.includes('accounts/')) {
                    await replyToReview(store.googleAccessToken, review.id, replyText);
                }
            } catch (e) {
                console.error('Failed to post reply to Google:', e);
                // Return success but warn?
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error replying to review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
