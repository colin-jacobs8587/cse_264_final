require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1) Summarize route
app.post('/api/summarize', async (req, res) => {
    const { url } = req.body;
    console.log('[SUMMARIZE] Received request for URL:', url);

    try {
        // Forward to Python's /summarize endpoint
        const pyResponse = await fetch('http://localhost:5001/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!pyResponse.ok) {
            const errText = await pyResponse.text();
            console.error('[SUMMARIZE] Python service error:', errText);
            return res.status(500).json({ error: 'Error summarizing the text.' });
        }

        const data = await pyResponse.json();
        console.log('[SUMMARIZE] Received data from Python:', data);

        // Return summary to frontend
        res.json({
            summary: data.summary_text
        });
    } catch (error) {
        console.error('[SUMMARIZE] Error in Express route:', error);
        res.status(500).json({ error: 'Error processing summary.' });
    }
});

// 2) Sentiment route
app.post('/api/sentiment', async (req, res) => {
    const { url } = req.body;
    console.log('[SENTIMENT] Received request for URL:', url);

    try {
        // Forward to Python's /sentiment endpoint
        const pyResponse = await fetch('http://localhost:5001/sentiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!pyResponse.ok) {
            const errText = await pyResponse.text();
            console.error('[SENTIMENT] Python service error:', errText);
            return res.status(500).json({ error: 'Error analyzing sentiment.' });
        }

        const data = await pyResponse.json();
        console.log('[SENTIMENT] Received data from Python:', data);

        // Return sentiment to frontend
        res.json({
            sentimentLabel: data.sentiment_label,
            sentimentScore: data.sentiment_score
        });
    } catch (error) {
        console.error('[SENTIMENT] Error in Express route:', error);
        res.status(500).json({ error: 'Error processing sentiment.' });
    }
});

// 3) Classification route
app.post('/api/classify', async (req, res) => {
    const { url, labels } = req.body;
    console.log('[CLASSIFY] Received request for URL:', url);
    console.log('[CLASSIFY] Candidate labels:', labels);

    try {
        // Forward to Python's /classify endpoint
        const pyResponse = await fetch('http://localhost:5001/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, labels })
        });

        if (!pyResponse.ok) {
            const errText = await pyResponse.text();
            console.error('[CLASSIFY] Python service error:', errText);
            return res.status(500).json({ error: 'Error classifying the text.' });
        }

        const data = await pyResponse.json();
        console.log('[CLASSIFY] Received data from Python:', data);

        // Return classification data to frontend
        res.json(data);
    } catch (error) {
        console.error('[CLASSIFY] Error in Express route:', error);
        res.status(500).json({ error: 'Error processing classification.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});
