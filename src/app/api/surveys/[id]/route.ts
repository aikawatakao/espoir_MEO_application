import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { surveys } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const survey = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);

        if (!survey || survey.length === 0) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        return NextResponse.json(survey[0]);
    } catch (error) {
        console.error('Error fetching survey:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updatedSurvey = await db.update(surveys)
            .set({
                title: body.title,
                questions: JSON.stringify(body.questions),
                status: body.status
            })
            .where(eq(surveys.id, id))
            .returning();

        return NextResponse.json(updatedSurvey[0]);
    } catch (error) {
        console.error('Error updating survey:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.delete(surveys).where(eq(surveys.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting survey:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
