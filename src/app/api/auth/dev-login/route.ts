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
        // Check if any store exists to use as dev user
        let store = (await db.select().from(stores).limit(1))[0];

        if (!store) {
            // Create mock store if none exists
            const newStore = await db.insert(stores).values({
                id: "dev-store-001",
                name: "Dev Store",
                email: "dev@example.com",
                password: "dev-password",
                googleAccessToken: "mock-token",
                googleRefreshToken: "mock-refresh",
                googleAccountId: "mock-account",
                googleLocationId: "locations/mock-location-id"
            }).returning();
            store = newStore[0];
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
