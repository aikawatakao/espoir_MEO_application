import { google } from 'googleapis';
import { getClient } from './auth';

// Helper to set credentials
const getAuthenticatedClient = (accessToken: string) => {
    const client = getClient();
    client.setCredentials({ access_token: accessToken });
    return client;
};

// 1. List Accounts
export const listAccounts = async (accessToken: string) => {
    const auth = getAuthenticatedClient(accessToken);
    const mybusinessaccountmanagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth,
    });

    const response = await mybusinessaccountmanagement.accounts.list();
    return response.data.accounts || [];
};

// 2. List Locations for an Account
export const listLocations = async (accessToken: string, accountName: string) => {
    const auth = getAuthenticatedClient(accessToken);
    const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
        version: 'v1',
        auth,
    });

    // accountName format: "accounts/{accountId}"
    const response = await mybusinessbusinessinformation.accounts.locations.list({
        parent: accountName,
        readMask: 'name,title,storeCode',
    });

    return response.data.locations || [];
};

// 3. List Reviews for a Location
export const listReviews = async (accessToken: string, locationName: string) => {
    const auth = getAuthenticatedClient(accessToken);

    // Note: 'mybusinessreviews' might be the identifier for My Business Reviews API
    // If types are not available, we might need to cast or use 'any' if strict
    const mybusinessreviews = google.mybusinessreviews({
        version: 'v4', // Reviews are still under v4 or specific endpoint? 
        // Actually, it's 'mybusinessreviews' v1? Let's try v1.
        // If v1 fails, we can fallback or check docs. 'googleapis' usually supports 'mybusinessreviews'.
        version: 'v1'
    } as any);

    // locationName format: "accounts/{accountId}/locations/{locationId}"
    const response = await mybusinessreviews.accounts.locations.reviews.list({
        parent: locationName,
    });

    return response.data.reviews || [];
};

// 4. Get Review
export const getReview = async (accessToken: string, reviewName: string) => {
    const auth = getAuthenticatedClient(accessToken);
    const mybusinessreviews = google.mybusinessreviews({ version: 'v1', auth } as any);

    const response = await mybusinessreviews.accounts.locations.reviews.get({
        name: reviewName
    });

    return response.data;
}

// 5. Reply to Review
export const replyToReview = async (accessToken: string, reviewName: string, replyText: string) => {
    const auth = getAuthenticatedClient(accessToken);
    const mybusinessreviews = google.mybusinessreviews({ version: 'v1', auth } as any);

    // reviewName format: "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
    const response = await mybusinessreviews.accounts.locations.reviews.updateReply({
        parent: reviewName, // The review to reply to
        requestBody: {
            comment: replyText
        }
    });

    return response.data;
};
