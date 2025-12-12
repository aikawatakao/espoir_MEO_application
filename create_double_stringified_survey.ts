import { db } from './src/lib/db';
import { surveys, stores } from './src/db/schema';

async function main() {
    // 1. Get a store
    const allStores = await db.select().from(stores).limit(1);
    const storeId = allStores[0].id;

    // 2. Insert a survey with DOUBLE stringified questions
    // Single stringified: [{"id":"q1","label":"Double Stringify Test","type":"single","options":["Opt1","Opt2","",""],"required":true}]
    // Double stringified: "[{\"id\":\"q1\",\"label\":\"Double Stringify Test\",\"type\":\"single\",\"options\":[\"Opt1\",\"Opt2\",\"\",\"\"],\"required\":true}]"

    const questionsObj = [{
        id: "q1",
        label: "Double Stringify Test",
        type: "single",
        options: ["Opt1", "Opt2", "", ""],
        required: true
    }];
    const singleString = JSON.stringify(questionsObj);
    const doubleString = JSON.stringify(singleString);

    console.log('Inserting Double Stringified:', doubleString);

    const newSurvey = await db.insert(surveys).values({
        storeId: storeId,
        title: "Double Stringify Test Survey",
        questions: doubleString, // This is what we suspect causes the bug
        status: 'draft'
    }).returning();

    console.log(`Created survey ID: ${newSurvey[0].id}`);
}

main();
