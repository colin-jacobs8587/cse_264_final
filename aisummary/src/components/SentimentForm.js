// src/components/SentimentForm.js
import React, { useState } from "react";
import "./styling/Sentiment.css";
import "../App.css";
import {
  SENTIMENT_ANALYSIS,
  ANALYZE_SENTIMENT,
  ENTER_URL,
  SENTIMENT,
  INTERPRETATION,
} from "./Constants/Constants";

function SentimentForm() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [sentimentLabel, setSentimentLabel] = useState("");
  const [sentimentScore, setSentimentScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSentiment = async (e) => {
    e.preventDefault();
    const loaderTimer = setTimeout(() => setLoading(true), 600);

    setMessage("");
    setSentimentLabel("");
    setSentimentScore(0);

    try {
      const res = await fetch("http://localhost:5000/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      clearTimeout(loaderTimer);
      setLoading(false);

      if (!res.ok) {
        setMessage("Failed to analyze sentiment.");
        return;
      }
      const data = await res.json();
      if (data.sentimentLabel) {
        setSentimentLabel(data.sentimentLabel);
        setSentimentScore(data.sentimentScore);
      } else {
        setMessage("No sentiment data available.");
      }
    } catch (err) {
      clearTimeout(loaderTimer);
      setLoading(false);
      console.error(err);
      setMessage("Error fetching sentiment.");
    }
  };

  const normalize = (label, score) =>
    label.toLowerCase().includes("neg") ? -score : score;

  const describe = (val) => {
    if (val <= -0.8) return "Extremely negative";
    if (val <= -0.6) return "Very negative";
    if (val <= -0.2) return "Moderately negative";
    if (val < 0.2) return "Neutral";
    if (val < 0.6) return "Moderately positive";
    if (val < 0.8) return "Very positive";
    return "Extremely positive";
  };

  const getEmoji = (label) => {
    if (label.toLowerCase().includes("neg")) return "😢";
    if (label.toLowerCase().includes("pos")) return "😊";
    return "😐";
  };

  return (
    <div className="sentiment-container">
      {loading ? (
        <div className="orb-overlay">
          <div className="orb" />
        </div>
      ) : (
        <div className="form">
          <h2>{SENTIMENT_ANALYSIS}</h2>
          <form onSubmit={handleSentiment}>
            <input
              type="url"
              placeholder={ENTER_URL}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit">{ANALYZE_SENTIMENT}</button>
          </form>
          {message && <p className="message">{message}</p>}
          {sentimentLabel && (
            <div className="result">
              <h3>
                {SENTIMENT} {getEmoji(sentimentLabel)}
              </h3>
              <p>
                <strong>{INTERPRETATION}:</strong>{" "}
                {describe(normalize(sentimentLabel, sentimentScore))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SentimentForm;
