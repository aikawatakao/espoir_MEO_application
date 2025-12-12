import { NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const tokens = await getTokens(code);
        const userInfo = await getUserInfo(tokens.access_token!);

        // Check if user exists
        const existingUser = (await db.select().from(stores).where(eq(stores.email, userInfo.email!)).limit(1))[0];

        let storeId;

        if (existingUser) {
            storeId = existingUser.id;
            // Update tokens
            await db.update(stores).set({
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                // Only update ID if not present? Or always?
                // googleAccountId: ... we might need to fetch this from GBP API separately or use user id
            }).where(eq(stores.id, storeId));
        } else {
            // Create new user
            const newUser = await db.insert(stores).values({
                name: userInfo.name || 'No Name',
                email: userInfo.email!,
                password: 'google-oauth-user', // Placeholder
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
            }).returning();
            storeId = newUser[0].id;
        }

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('session_store_id', storeId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        console.error('Auth Callback Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
