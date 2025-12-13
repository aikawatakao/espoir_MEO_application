import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, reviews } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const period = searchParams.get('period') || '30days';

        if (!storeId) {
            const allStores = await db.select().from(stores).limit(1);
            const firstStore = allStores[0];
            if (!firstStore) return NextResponse.json({ stats: {} });
            return await getDashboardStats(firstStore.id, period);
        }

        return await getDashboardStats(storeId, period);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function getDashboardStats(storeId: string, period: string) {
    // Calculate stats from DB
    const allReviews = await db.select().from(reviews).where(eq(reviews.storeId, storeId));
    const totalReviews = allReviews.length;

    const totalRating = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0.0";

    const unrepliedCount = allReviews.filter(r => !r.replied).length;

    // DEMO MODE: Return hardcoded mocks
    if (process.env.DEMO_MODE === 'true') {
        const stats = {
            reviewCount: totalReviews,
            averageRating: parseFloat(averageRating),
            unrepliedCount,
            impressions: 12500,
            phoneClicks: 45,
            lowRatingRate: 5.2,
            directions: 120,
            websiteClicks: 85,
            ctr: 3.4,
            reviewTrend: [
                { date: "11/01", count: 2 },
                { date: "11/02", count: 1 },
                { date: "11/03", count: 3 },
                { date: "11/04", count: 0 },
                { date: "11/05", count: 4 },
            ],
            replyRate: [
                { date: "11/01", rate: 100 },
                { date: "11/02", rate: 50 },
                { date: "11/03", rate: 66 },
                { date: "11/04", rate: 100 },
                { date: "11/05", rate: 75 },
            ],
            gbpPerformance: [
                { date: "11/01", impressions: 400, actions: 10 },
                { date: "11/02", impressions: 350, actions: 8 },
                { date: "11/03", impressions: 500, actions: 15 },
            ]
        };
        return NextResponse.json(stats);
    }

    // REAL MODE: Return actual DB stats (and 0 for missing GBP metrics)
    const stats = {
        reviewCount: totalReviews,
        averageRating: parseFloat(averageRating),
        unrepliedCount,
        impressions: 0,
        phoneClicks: 0,
        lowRatingRate: 0, // Could calc from DB but let's say 0 for now or implement
        directions: 0,
        websiteClicks: 0,
        ctr: 0,
        reviewTrend: [],
        replyRate: [],
        gbpPerformance: []
    };

    return NextResponse.json(stats);
}
