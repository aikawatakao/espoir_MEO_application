import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { surveys, stores } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const allSurveys = await db.select().from(surveys).orderBy(desc(surveys.createdAt));

        const formattedSurveys = allSurveys.map(survey => {
            const questions = survey.questions ? JSON.parse(survey.questions) : [];
            return {
                id: survey.id,
                name: survey.title,
                targetStore: "渋谷本店", // Hardcoded for now as we don't join stores yet
                questionCount: questions.length,
                status: survey.status,
                lastUpdated: new Date(survey.updatedAt || Date.now()).toLocaleDateString('ja-JP'),
                responseCount: 0 // Mock for now
            };
        });

        return NextResponse.json({ surveys: formattedSurveys });
    } catch (error) {
        console.error('Error fetching surveys:', error);
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

        const newSurvey = await db.insert(surveys).values({
            storeId: firstStore.id,
            title: body.title,
            questions: JSON.stringify(body.questions),
            status: 'published'
        }).returning();

        return NextResponse.json({ success: true, id: newSurvey[0].id });
    } catch (error) {
        console.error('Error creating survey:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
