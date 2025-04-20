import React, { useState } from 'react';

function SummarizeForm() {
    const [url, setUrl] = useState('');
    const [message, setMessage] = useState('');
    const [summary, setSummary] = useState('');

    const handleSummarize = async (e) => {
        e.preventDefault();
        setMessage('Fetching summary...');
        setSummary('');

        try {
            const response = await fetch('http://localhost:5000/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                credentials: 'include'
            });

            if (!response.ok) {
                setMessage('Failed to summarize.');
                return;
            }

            const data = await response.json();
            if (data.summary) {
                setSummary(data.summary);
                setMessage('Summary fetched successfully!');
            } else {
                setMessage('No summary available.');
            }
        } catch (error) {
            console.error('[SummarizeForm] Error:', error);
            setMessage('Error fetching summary.');
        }
    };

    return (
        <div className="summarize-form">
            <h2>Summarize</h2>
            <form onSubmit={handleSummarize}>
                <input
                    type="url"
                    placeholder="Enter URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
                <button type="submit">Get Summary</button>
            </form>
            {message && <p>{message}</p>}
            {summary && (
                <div>
                    <h3>Summary</h3>
                    <p>{summary}</p>
                </div>
            )}
        </div>
    );
}

export default SummarizeForm;
