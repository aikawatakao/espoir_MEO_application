import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        // In a real scenario, this would trigger a background job to fetch data from GBP
        // For now, we'll just update the "last synced" timestamp (if we had one) or just return success

        const allStores = await db.select().from(stores).limit(1);
        const store = allStores[0];

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Mock sync logic
        console.log(`Syncing data for store: ${store.name} (${store.id})`);

        // Simulate updating some data
        await db.update(stores)
            .set({ updatedAt: new Date().toISOString() })
            .where(eq(stores.id, store.id));

        return NextResponse.json({ success: true, message: 'Sync started' });
    } catch (error) {
        console.error('Error syncing data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
