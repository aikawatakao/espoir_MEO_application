import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, tags, reviewTags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();

        if (body.replyText !== undefined) {
            await db.update(reviews)
                .set({
                    replyText: body.replyText,
                    replied: true,
                    repliedAt: new Date().toISOString()
                })
                .where(eq(reviews.id, id));
        }

        if (body.flagStatus !== undefined) {
            await db.update(reviews)
                .set({ flagStatus: body.flagStatus })
                .where(eq(reviews.id, id));
        }

        // Handle tags (Simplified: just create if not exists and link)
        // Note: Drizzle many-to-many is manual. Skipping complex tag logic for prototype stability unless requested.
        /*
        if (body.tags) {
            // ... tag logic ...
        }
        */

        const updatedReview = await db.select().from(reviews).where(eq(reviews.id, id));
        return NextResponse.json(updatedReview[0]);

    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
