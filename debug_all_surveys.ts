import { db } from './src/lib/db';
import { surveys } from './src/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
    const allSurveys = await db.select().from(surveys).orderBy(desc(surveys.createdAt));

    console.log(`Found ${allSurveys.length} surveys.`);

    allSurveys.forEach(s => {
        console.log(`\nID: ${s.id}`);
        console.log(`Title: ${s.title}`);
        console.log(`Questions (Raw): ${s.questions}`);
        try {
            const parsed = JSON.parse(s.questions as string);
            console.log(`Questions (Parsed):`, JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(`Failed to parse questions: ${e}`);
        }
    });
}

main();
