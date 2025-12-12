import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();

        const updatedCoupon = await db.update(coupons)
            .set({
                title: body.title,
                description: body.description,
                probability: parseInt(body.probability),
                code: body.code,
                isActive: body.isActive
            })
            .where(eq(coupons.id, id))
            .returning();

        return NextResponse.json(updatedCoupon[0]);
    } catch (error) {
        console.error('Error updating coupon:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await db.delete(coupons).where(eq(coupons.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
