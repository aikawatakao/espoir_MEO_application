import { google } from 'googleapis';

const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
    (process.env.NODE_ENV === 'production'
        ? 'https://espoir-meo-application.vercel.app/api/auth/callback/google'
        : 'http://localhost:3000/api/auth/callback/google');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
);

export const getAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/business.manage',
        // 'https://www.googleapis.com/auth/business.manage', // This ensures the scope is present
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true,
        prompt: 'consent',
    });
};

export const getTokens = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

export const getUserInfo = async (accessToken: string) => {
    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2',
    });

    oauth2Client.setCredentials({ access_token: accessToken });

    const { data } = await oauth2.userinfo.get();
    return data;
};

export const getClient = () => oauth2Client;
