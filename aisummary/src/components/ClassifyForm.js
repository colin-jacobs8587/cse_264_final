import React, { useState } from 'react';

function ClassifyForm() {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleClassify = async (e) => {
    e.preventDefault();
    setMessage('Classifying...');
    setResult(null);
    try {
      const response = await fetch('http://localhost:5000/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        setMessage('Failed to classify.');
        return;
      }
      const data = await response.json();
      setResult(data);
      setMessage('Classification successful!');
    } catch (error) {
      console.error('[ClassifyForm] Error:', error);
      setMessage('Error during classification.');
    }
  };

  return (
    <div className="classify-form">
      <h2>Topic Classification</h2>
      <form onSubmit={handleClassify}>
        <input
          type="url"
          placeholder="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit">Classify</button>
      </form>
      {message && <p>{message}</p>}
      {result && (
        <div>
          <h3>Classification Results</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ClassifyForm;
