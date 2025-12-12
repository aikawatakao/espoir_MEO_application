import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        // Note: listModels is not directly exposed on genAI instance in some versions, 
        // but let's try accessing it via the model manager if available, or just try a known model.
        // Actually, the SDK doesn't have a simple listModels method exposed in the main class easily.
        // I'll try to use the API directly via fetch to list models.

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('No API Key');
            return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log('Error listing models:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
