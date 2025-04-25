// src/components/SentimentForm.js
import React, { useState } from "react";
import "./styling/Sentiment.css";
import "../App.css";
import {
  SENTIMENT_ANALYSIS,
  ANALYZE_SENTIMENT,
  SENTIMENT,
  INTERPRETATION,
  ENTER_URL,
} from "./Constants/Constants";

function SentimentForm() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [sentimentLabel, setSentimentLabel] = useState("");
  const [sentimentScore, setSentimentScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSentiment = async (e) => {
    e.preventDefault();

    // only show spinner if request takes >500ms
    const loaderTimer = setTimeout(() => setLoading(true), 500);

    setSentimentLabel("");
    setSentimentScore(0);

    try {
      const response = await fetch("http://localhost:5000/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      clearTimeout(loaderTimer);
      setLoading(false);

      if (!response.ok) {
        setMessage("Failed to analyze sentiment.");
        return;
      }

      const data = await response.json();
      if (data.sentimentLabel) {
        setSentimentLabel(data.sentimentLabel);
        setSentimentScore(data.sentimentScore);
      } else {
        setMessage("No sentiment data available.");
      }
    } catch (error) {
      clearTimeout(loaderTimer);
      setLoading(false);
      console.error("[SentimentForm] Error:", error);
      setMessage("Error fetching sentiment.");
    }
  };

  // normalize 0–1 score to –1…+1
  const normalize = (label, score) => {
    return label.toLowerCase().includes("neg") ? -score : score;
  };

  // bucket normalized value into descriptions
  const describe = (val) => {
    if (val <= -0.8) return "Extremely negative";
    if (val <= -0.6) return "Very negative";
    if (val <= -0.2) return "Moderately negative";
    if (val < 0.2) return "Neutral";
    if (val < 0.6) return "Moderately positive";
    if (val < 0.8) return "Very positive";
    return "Extremely positive";
  };

  // pick an emoji
  const getEmoji = (label) => {
    const l = label.toLowerCase();
    if (l.includes("neg")) return "😢";
    if (l.includes("pos")) return "😊";
    return "😐";
  };

  return (
    <div className="form">
      {loading ? (
        <div className="orb-overlay">
          <div className="orb" />
        </div>
      ) : (
        <>
          <h2>{SENTIMENT_ANALYSIS}</h2>
          <form onSubmit={handleSentiment}>
            <input
              type="url"
              placeholder= {ENTER_URL}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit">{ANALYZE_SENTIMENT}</button>
          </form>

          {message && <p className="message">{message}</p>}

          {sentimentLabel && (
            <div className="result">
              <h3>{SENTIMENT} {getEmoji(sentimentLabel)}</h3>
              {(() => {
                const norm = normalize(sentimentLabel, sentimentScore);
                return (
                  <p>
                    <strong>{INTERPRETATION}</strong> {describe(norm)}
                  </p>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SentimentForm;
