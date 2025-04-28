// src/components/ClassifyForm.js
import React, { useState } from "react";
import {
  TOPIC_CLASSIFICATION,
  CLASSIFY,
  CLASSIFICATION_RESULTS,
  TOPIC,
  CONFIDENCE,
  ENTER_URL,
} from "./Constants/Constants";
import "../App.css";
function ClassifyForm() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleClassify = async (e) => {
    e.preventDefault();

    // only show spinner if request takes >500ms
    const loaderTimer = setTimeout(() => setLoading(true), 500);

    setResult([]);

    try {
      const response = await fetch("http://localhost:5000/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      clearTimeout(loaderTimer);
      setLoading(false);

      if (!response.ok) {
        setMessage("Failed to classify.");
        return;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setResult(data);
      } else {
        setMessage("No classification results.");
      }
    } catch (error) {
      clearTimeout(loaderTimer);
      setLoading(false);
      console.error("[ClassifyForm] Error:", error);
      setMessage("Error during classification.");
    }
  };

  return (
    <div className="form">
      {loading ? (
        <div className="orb-overlay">
          <div className="orb" />
        </div>
      ) : (
        <>
          <h2>{TOPIC_CLASSIFICATION}</h2>
          <form onSubmit={handleClassify}>
            <input
              type="url"
              placeholder= {ENTER_URL}
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
              {result.map(({ label, score }, idx) => (
                <p key={idx}>
                  <strong>{TOPIC}</strong> {label} <br />
                  <strong>{CONFIDENCE}</strong> {score.toFixed(4)}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ClassifyForm;
