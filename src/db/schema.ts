import { pgTable, text, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Store Model
export const stores = pgTable('stores', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    settings: text('settings'), // JSON string

    // Google Business Profile Integration
    googleAccessToken: text('google_access_token'),
    googleRefreshToken: text('google_refresh_token'),
    googleAccountId: text('google_account_id'),
    googleLocationId: text('google_location_id'),

    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Review Model
export const reviews = pgTable('reviews', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    storeId: text('store_id').notNull().references(() => stores.id),
    rating: integer('rating').notNull(),
    author: text('author').notNull(),
    date: text('date').notNull(), // ISO string
    text: text('text').notNull(),
    language: text('language').default('ja'),
    translatedText: text('translated_text'),
    replyText: text('reply_text'),
    replied: boolean('replied').default(false), // Changed to boolean type
    repliedAt: text('replied_at'),
    flagStatus: text('flag_status').default('none'), // none, pending, resolved

    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tag Model
export const tags = pgTable('tags', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
});

// ReviewTags Join Table (Many-to-Many)
export const reviewTags = pgTable('review_tags', {
    reviewId: text('review_id').notNull().references(() => reviews.id),
    tagId: text('tag_id').notNull().references(() => tags.id),
}, (t) => ({
    pk: uniqueIndex('pk_review_tags').on(t.reviewId, t.tagId),
}));

// Survey Model
export const surveys = pgTable('surveys', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    storeId: text('store_id').notNull().references(() => stores.id),
    title: text('title').notNull(),
    questions: text('questions').notNull(), // JSON string
    status: text('status').default('draft'), // published, draft, stopped

    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// SurveyResponse Model
export const surveyResponses = pgTable('survey_responses', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    surveyId: text('survey_id').notNull().references(() => surveys.id),
    answers: text('answers').notNull(), // JSON string

    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Coupon Model
export const coupons = pgTable('coupons', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    storeId: text('store_id').notNull().references(() => stores.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    probability: integer('probability').notNull(), // 0-100
    validDays: integer('valid_days').default(30),
    isActive: boolean('is_active').default(true), // Changed to boolean type
    code: text('code'),

    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
