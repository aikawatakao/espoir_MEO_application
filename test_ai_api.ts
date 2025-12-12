import fetch from 'node-fetch';

async function testAI() {
    try {
        console.log("Testing AI API on port 3000...");
        const response = await fetch('http://localhost:3000/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'survey_preview',
                context: {
                    title: 'Test Survey',
                    keywords: ['test']
                }
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testAI();
