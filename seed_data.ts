import { db } from './src/lib/db';
import { stores, reviews, surveys, coupons } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        console.log('Seeding data...');

        // Get or create store
        let store = (await db.select().from(stores).limit(1))[0];
        if (!store) {
            const result = await db.insert(stores).values({
                name: 'Seed Store',
                email: 'seed@test.com',
                password: 'hashedpassword',
            }).returning();
            store = result[0];
        }

        // Create Review
        await db.insert(reviews).values({
            storeId: store.id,
            rating: 4,
            author: 'Seed Reviewer',
            date: new Date().toISOString(),
            text: 'This is a seeded review for testing.',
            replied: false,
        });

        // Create Survey
        await db.insert(surveys).values({
            storeId: store.id,
            title: 'Seed Survey',
            questions: JSON.stringify([{ text: 'Do you like seeds?', type: 'rating' }]),
            status: 'published',
        });

        // Create Coupon
        await db.insert(coupons).values({
            storeId: store.id,
            title: 'Seed Coupon',
            description: '50% Off Seeds',
            probability: 50,
            code: 'SEED50',
        });

        console.log('Seeding complete.');
    } catch (e) {
        console.error('Error seeding:', e);
    }
}

main();
