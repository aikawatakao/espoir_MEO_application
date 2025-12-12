import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    // ONLY FOR DEVELOPMENT
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    try {
        // Create or get a mock store
        const mockStoreId = "store-1"; // Assuming this exists or we create it
        // Or better, check if any store exists, if not create one
        let store = await db.select().from(stores).limit(1).get();

        if (!store) {
            // Create mock store
            const newStore = await db.insert(stores).values({
                name: "Dev Store",
                id: "dev-store-001",
                googleAccessToken: "mock-token",
                googleRefreshToken: "mock-refresh",
                googleAccountId: "mock-account",
                googleLocationId: "locations/mock-location-id"
            }).returning().get();
            store = newStore;
        }

        const cookieStore = await cookies();
        cookieStore.set('session_store_id', store.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        console.error('Dev login failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
