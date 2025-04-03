require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const redis = require("redis");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Redis client
const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect().catch(console.error);

// Summarize route
app.post("/api/summarize", async (req, res) => {
  const { url } = req.body;
  console.log("[SUMMARIZE] Received request for URL:", url);

  // Create a unique cache key for the URL
  const cacheKey = `${url}`;

  try {
    // Check if the summary exists in Redis
    const cached_text = await redisClient.get(cacheKey);
    console.log("look here ", cached_text);
    if (cached_text) {
      console.log("[SUMMARIZE] Cache hit for URL:", url);
      // Forward the cached summary to the Python cached endpoint
      const pyCachedResponse = await fetch(
        "http://127.0.0.1:5001/summarize/cached",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, summary: cached_text }),
        }
      );
      if (!pyCachedResponse.ok) {
        const errText = await pyCachedResponse.text();
        console.error("[SUMMARIZE] Python cached service error:", errText);
        return res
          .status(500)
          .json({ error: "Error processing cached summary." });
      }
      const cachedData = await pyCachedResponse.json();
      return res.json({ summary: cachedData.summary_text });
    }

    // If no cache entry exists, forward to the normal Python summarization service
    console.log(
      "[SUMMARIZE] Cache miss. Forwarding to Python summarization service."
    );
    const pyResponse = await fetch("http://127.0.0.1:5001/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!pyResponse.ok) {
      const errText = await pyResponse.text();
      console.error("[SUMMARIZE] Python service error:", errText);
      return res.status(500).json({ error: "Error summarizing the text." });
    }
    const data = await pyResponse.json();
    console.log("[SUMMARIZE] Received data from Python:", data);

    // Return the summary to the frontend
    res.json({ summary: data.summary_text });
  } catch (error) {
    console.error("[SUMMARIZE] Error in Express route:", error);
    res.status(500).json({ error: "Error processing summary." });
  }
});

// Sentiment route
app.post("/api/sentiment", async (req, res) => {
  const { url } = req.body;
  const cacheKey = `${url}`;

  try {
    // Check if the sentiment exists in Redis
    const cached_text = await redisClient.get(cacheKey);
    if (cached_text) {
      console.log("[SUMMARIZE] Cache hit for URL:", url);
      // Forward the cached text to the Python cached endpoint
      const pyCachedResponse = await fetch(
        "http://localhost:5001/sentiment/cached",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, summary: cached_text }),
        }
      );
      if (!pyCachedResponse.ok) {
        const errText = await pyCachedResponse.text();
        console.error("[SUMMARIZE] Python cached service error:", errText);
        return res
          .status(500)
          .json({ error: "Error processing cached summary." });
      }
      const cachedData = await pyCachedResponse.json();
      res.json({
        sentimentLabel: cachedData.sentiment_label,
        sentimentScore: cachedData.sentiment_score,
      });
    } else {
      // If no cache entry exists, forward to the normal Python summarization service
      console.log(
        "[SUMMARIZE] Cache miss. Forwarding to Python summarization service."
      );
      const pyResponse = await fetch("http://127.0.0.1:5001/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!pyResponse.ok) {
        const errText = await pyResponse.text();
        console.error("[SUMMARIZE] Python service error:", errText);
        return res.status(500).json({ error: "Error summarizing the text." });
      }
      const data = await pyResponse.json();
      console.log("[SUMMARIZE] Received data from Python:", data);

      // Return the sentiment data to the frontend
      res.json({
        sentimentLabel: data.sentiment_label,
        sentimentScore: data.sentiment_score,
      });
    }
  } catch (error) {
    console.error("[SENTIMENT] Error in Express route:", error);
    res.status(500).json({ error: "Error processing sentiment." });
  }
});

// Classification route
app.post("/api/classify", async (req, res) => {
  const { url, labels } = req.body;
  console.log("[CLASSIFY] Received request for URL:", url);
  console.log("[CLASSIFY] Candidate labels:", labels);
  const cacheKey = `${url}`;

  try {
    const cached_text = await redisClient.get(cacheKey);

    if (cached_text) {
      console.log("[SUMMARIZE] Cache hit for URL:", url);
      // Forward the cached text to the Python cached endpoint
      const pyCachedResponse = await fetch(
        "http://localhost:5001/classify/cached",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, labels, summary: cached_text }),
        }
      );
      if (!pyCachedResponse.ok) {
        const errText = await pyCachedResponse.text();
        console.error("[CLASSIFY] Python cached service error:", errText);
        return res
          .status(500)
          .json({ error: "Error processing cached summary." });
      }
      const cachedData = await pyCachedResponse.json();
      // Return classification data to frontend
      res.json(cachedData);
    } else {
        console.log("[SUMMARIZE] Cache miss for URL:", url);

      // Forward to Python's /classify endpoint
      const pyResponse = await fetch("http://localhost:5001/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, labels }),
      });

      if (!pyResponse.ok) {
        const errText = await pyResponse.text();
        console.error("[CLASSIFY] Python service error:", errText);
        return res.status(500).json({ error: "Error classifying the text." });
      }

      const data = await pyResponse.json();
      console.log("[CLASSIFY] Received data from Python:", data);

      // Return classification data to frontend
      res.json(data);
    }
  } catch (error) {
    console.error("[CLASSIFY] Error in Express route:", error);
    res.status(500).json({ error: "Error processing classification." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
