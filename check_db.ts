import { db } from './src/lib/db';
import { stores, reviews, surveys, coupons } from './src/db/schema';

async function main() {
    const allStores = await db.select().from(stores);
    console.log('Stores:', allStores.length);

    const allReviews = await db.select().from(reviews);
    console.log('Reviews:', allReviews);

    const allSurveys = await db.select().from(surveys);
    console.log('Surveys:', allSurveys);

    const allCoupons = await db.select().from(coupons);
    console.log('Coupons:', allCoupons);
}
main();
