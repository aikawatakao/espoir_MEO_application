import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { surveyResponses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { answers } = body;

        if (!answers) {
            return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
        }

        // Validate that answers is a valid JSON structure if needed, 
        // but schema says it's a text (JSON string), so we just stringify whatever we got.
        // Ideally we should validate against the survey questions, but for now we trust the client.

        const newResponse = await db.insert(surveyResponses).values({
            surveyId: id,
            answers: JSON.stringify(answers),
        }).returning();

        return NextResponse.json(newResponse[0]);
    } catch (error) {
        console.error('Error submitting survey response:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
