import fs from 'fs';
try {
    const content = fs.readFileSync('.env', 'utf-8');
    const lines = content.split('\n');
    const keyLine = lines.find(line => line.startsWith('GEMINI_API_KEY='));
    if (keyLine) {
        console.log('GEMINI_API_KEY is present.');
        console.log('Length:', keyLine.split('=')[1].trim().length);
    } else {
        console.log('GEMINI_API_KEY is MISSING.');
    }
    console.log('--- ENV CONTENT ---');
    console.log(content);
    console.log('-------------------');
} catch (e) {
    console.error('Error reading .env:', e);
}
