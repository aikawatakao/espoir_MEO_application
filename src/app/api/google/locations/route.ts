import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { listAccounts, listLocations } from '@/lib/google';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const storeId = cookieStore.get('session_store_id')?.value;

        if (!storeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.select().from(stores).where(eq(stores.id, storeId));
        const store = result[0];

        if (!store || !store.googleAccessToken) {
            return NextResponse.json({ error: 'Google account not linked' }, { status: 400 });
        }

        let allLocations: any[] = [];

        const debugLogs: string[] = [];

        try {
            // 1. List Accounts
            const accounts = await listAccounts(store.googleAccessToken);
            debugLogs.push(`Found ${accounts.length} accounts.`);
            console.log(`[API] Found ${accounts.length} accounts.`);

            // 2. List Locations for each account
            for (const account of accounts) {
                try {
                    const locations = await listLocations(store.googleAccessToken, account.name);
                    debugLogs.push(`Account ${account.name}: Found ${locations.length} locations.`);
                    console.log(`[API] Account ${account.name} has ${locations.length} locations.`);
                    allLocations = [...allLocations, ...locations];
                } catch (e) {
                    console.error("Failed to list locations for account", account.name, e);
                    debugLogs.push(`Failed to list locations for ${account.name}: ${(e as any).message}`);
                }
            }
        } catch (apiError) {
            console.error("Google API Error:", apiError);
            debugLogs.push(`API Error: ${(apiError as any).message}`);
            if ((apiError as any).code === 403) {
                console.error("Error 403: Insufficient permissions.");
                debugLogs.push("Error 403: Permissions missing.");
            }
            return NextResponse.json({
                error: 'Google API Error',
                details: (apiError as any).message,
                debugLogs
            }, { status: 500 });
        }

        // Removed forced mock data fallback.
        // If 0 locations found, it returns empty array unless user intentionally adds mock logic elsewhere.

        return NextResponse.json({ locations: allLocations, debugLogs });

    } catch (error) {
        // Only valid if something CRITICAL failed outside the inner try/catch blocks
        // e.g. DB connection
        console.error('Error fetching Google locations:', error);
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }
}
