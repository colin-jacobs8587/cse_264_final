import React, { useState, useEffect } from "react";
import "./styling/Summarize.css";
import "../App.css";
import { SUMMARIZE, GET_SUMMARY, ENTER_URL } from "./Constants/Constants";


function SummarizeForm() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [rawSummary, setRawSummary] = useState("");
  const [typed, setTyped] = useState("");
  const [Loading, setLoading] = useState(false);

  // whenever rawSummary changes, kick off the typewriter
  useEffect(() => {
    if (!rawSummary) return;
  
    const clean = rawSummary
      .split(/.<n>/g)
      .map(s => s.trim().replace(/\.$/, ""))
      .filter(Boolean)
      .join(". ")
      .concat(".");
  
    let i = 0;
    setTyped(clean.charAt(0));   
  
    const speed = 20;
    const timer = setInterval(() => {
      setTyped(t => t + clean[i]);
      i++;
      if (i >= clean.length) clearInterval(timer);
    }, speed);
  
    return () => clearInterval(timer);
  }, [rawSummary]);
  

  const handleSummarize = async (e) => {
    e.preventDefault();
    setMessage("");
    setRawSummary("");
    setTyped("");
    const loaderTimer = setTimeout(() => setLoading(true), 200);

    try {
      const res = await fetch("http://localhost:5000/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      clearTimeout(loaderTimer);
      setLoading(false);

      if (!res.ok) {
        setMessage("Failed to summarize.");
        return;
      }

      const { summary } = await res.json();
      if (summary) setRawSummary(summary);
      else setMessage("No summary available.");
    } catch (err) {
      console.error(err);
      clearTimeout(loaderTimer);
      setLoading(false);
      setMessage("Error fetching summary.");
    }
  };

  return (
    <div className="summarize-container">
      {Loading ? (
        <div className="orb-overlay">
          <div className="orb" />
        </div>
      ) : (
        <div className="form">
          <h2>{SUMMARIZE}</h2>
          <form onSubmit={handleSummarize}>
            <input
              type="url"
              placeholder={ENTER_URL}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit">{GET_SUMMARY}</button>
          </form>
          {message && <p>{message}</p>}
          {typed && <div className="typewriter">{typed}</div>}
        </div>
      )}
    </div>
  );
}

export default SummarizeForm;
