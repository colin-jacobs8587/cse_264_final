// src/components/ClassifyForm.js
import React, { useState } from "react";
import "../App.css";
import {
  TOPIC_CLASSIFICATION,
  CLASSIFY,
  CLASSIFICATION_RESULTS,
  TOPIC,
  CONFIDENCE,
  ENTER_URL,
} from "./Constants/Constants";

function ClassifyForm() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleClassify = async (e) => {
    e.preventDefault();
    const loaderTimer = setTimeout(() => setLoading(true), 500);

    setMessage("");
    setResult([]);

    try {
      const res = await fetch("http://localhost:5000/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      clearTimeout(loaderTimer);
      setLoading(false);

      if (!res.ok) {
        setMessage("Failed to classify.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        setResult(data);
      } else {
        setMessage("No classification results.");
      }
    } catch (err) {
      clearTimeout(loaderTimer);
      setLoading(false);
      console.error(err);
      setMessage("Error during classification.");
    }
  };

  return (
    <div className="classify-container">
      {loading ? (
        <div className="orb-overlay">
          <div className="orb" />
        </div>
      ) : (
        <div className="form">
          <h2>{TOPIC_CLASSIFICATION}</h2>
          <form onSubmit={handleClassify}>
            <input
              type="url"
              placeholder={ENTER_URL}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit">{CLASSIFY}</button>
          </form>
          {message && <p className="message">{message}</p>}
          {result.length > 0 && (
            <div className="result">
              <h3>{CLASSIFICATION_RESULTS}</h3>
              {result.map(({ label, score }, i) => (
                <p key={i}>
                  <strong>{TOPIC}</strong> {label} <br />
                  <strong>{CONFIDENCE}</strong> {score.toFixed(4)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClassifyForm;
