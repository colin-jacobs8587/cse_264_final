import React, { useState } from 'react';

function SentimentForm() {
    const [url, setUrl] = useState('');
    const [message, setMessage] = useState('');
    const [sentimentLabel, setSentimentLabel] = useState('');
    const [sentimentScore, setSentimentScore] = useState('');

    const handleSentiment = async (e) => {
        e.preventDefault();
        setMessage('Analyzing sentiment...');
        setSentimentLabel('');
        setSentimentScore('');

        try {
            const response = await fetch('http://localhost:5000/api/sentiment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                setMessage('Failed to analyze sentiment.');
                return;
            }

            const data = await response.json();
            if (data.sentimentLabel) {
                setSentimentLabel(data.sentimentLabel);
                setSentimentScore(data.sentimentScore);
                setMessage('Sentiment analyzed successfully!');
            } else {
                setMessage('No sentiment data available.');
            }
        } catch (error) {
            console.error('[SentimentForm] Error:', error);
            setMessage('Error fetching sentiment.');
        }
    };

    return (
        <div className="sentiment-form">
            <h2>Sentiment Analysis</h2>
            <form onSubmit={handleSentiment}>
                <input
                    type="url"
                    placeholder="Enter URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
                <button type="submit">Analyze Sentiment</button>
            </form>
            {message && <p>{message}</p>}
            {sentimentLabel && (
                <div>
                    <h3>Sentiment</h3>
                    <p>
                        <strong>Label:</strong> {sentimentLabel} <br />
                        <strong>Score:</strong> {sentimentScore}
                    </p>
                </div>
            )}
        </div>
    );
}

export default SentimentForm;
