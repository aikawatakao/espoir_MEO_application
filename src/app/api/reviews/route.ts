import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, reviews as reviewsTable } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const storeId = cookieStore.get('session_store_id')?.value;

        if (!storeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch from DB
        // In the new architecture, we rely on background sync (triggered by frontend or cron)
        // rather than syncing on every read. This improves performance.
        const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.storeId, storeId)).orderBy(desc(reviewsTable.date));

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
