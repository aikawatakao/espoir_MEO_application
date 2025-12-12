import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, stores } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
        return NextResponse.json(allCoupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Get default store
        const allStores = await db.select().from(stores).limit(1);
        const firstStore = allStores[0];
        if (!firstStore) return NextResponse.json({ error: 'No store found' }, { status: 404 });

        const newCoupon = await db.insert(coupons).values({
            storeId: firstStore.id,
            title: body.title,
            description: body.description || '',
            probability: parseInt(body.probability),
            code: body.code || 'COUPON',
            validDays: 30
        }).returning();

        return NextResponse.json(newCoupon[0]);
    } catch (error) {
        console.error('Error creating coupon:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
