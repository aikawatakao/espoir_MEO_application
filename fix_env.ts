import fs from 'fs';

const content = `DATABASE_URL=file:./dev.db
GOOGLE_CLIENT_ID=23781452370-r74nrdphj61qg279r5c5jeppmapuoboe.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GEMINI_API_KEY=AIzaSyAiO9QRG5-H3CUKpBS1MCI4SMyGLfuzmn8
`;

fs.writeFileSync('.env', content, 'utf-8');
console.log('.env fixed');
