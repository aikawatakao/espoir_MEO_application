import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const storeId = cookieStore.get('session_store_id')?.value;

        if (!storeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return await getSettings(storeId);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}

async function getSettings(storeId: string) {
    const result = await db.select().from(stores).where(eq(stores.id, storeId));
    const store = result[0];

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    let settings = {};
    try {
        if (store.settings) {
            settings = JSON.parse(store.settings);
        }
    } catch (e) {
        console.error('Error parsing settings:', e);
    }

    // Return combined object with store info and settings
    return NextResponse.json({
        storeName: store.name,
        timezone: "Asia/Tokyo", // Default or from settings
        googleLinked: !!store.googleAccessToken,
        googleLocationId: store.googleLocationId,
        ...settings
    });
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const targetStoreId = cookieStore.get('session_store_id')?.value;

        if (!targetStoreId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { storeName, googleLocationId, ...settingsUpdates } = body;

        // Fetch current settings
        const result = await db.select().from(stores).where(eq(stores.id, targetStoreId));
        const store = result[0];

        if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

        let currentSettings = {};
        if (store.settings) {
            try {
                currentSettings = JSON.parse(store.settings);
            } catch (e) { }
        }

        // Merge settings
        const newSettings = { ...currentSettings, ...settingsUpdates };

        // Update store
        const updateData: any = {
            settings: JSON.stringify(newSettings)
        };
        if (storeName) updateData.name = storeName;
        if (googleLocationId !== undefined) updateData.googleLocationId = googleLocationId;

        await db.update(stores)
            .set(updateData)
            .where(eq(stores.id, targetStoreId));

        return NextResponse.json({
            success: true,
            storeName: storeName || store.name,
            googleLocationId: googleLocationId || store.googleLocationId,
            ...newSettings
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
