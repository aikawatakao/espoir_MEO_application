import { db } from './src/lib/db';
import { stores } from './src/db/schema';

async function main() {
    try {
        console.log('Inserting test store...');
        const result = await db.insert(stores).values({
            name: 'Drizzle Test Store',
            email: 'drizzle@test.com',
            password: 'hashedpassword',
        }).returning();
        console.log('Inserted:', result);

        console.log('Querying stores...');
        const allStores = await db.select().from(stores);
        console.log('All Stores:', allStores);
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
