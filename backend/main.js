require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const redis = require("redis");
const {MongoClient} = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pg = require("pg");
const cookieParser = require("cookie-parser");

// Express Setup
const app = express();
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:3000",  // React server
        credentials: true
    })
);
app.use(express.json());

// Initialize Redis client
const redisClient = redis.createClient({
    url: "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect().catch(console.error);

// Mongo connection
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/?${process.env.MONGO_OPTIONS}`;
let summariesCollection;

MongoClient.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(client => {
        const db = client.db(process.env.MONGO_DB_DB);
        summariesCollection = db.collection(process.env.MONGO_COLLECTION);
        console.log("Connected to MongoDB");
    })
    .catch(err => console.error("MongoDB connection error:", err));

// Postgres connection
const {Client} = pg;
const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DBNAME,
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    ssl: {rejectUnauthorized: false},
});

client.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("Postgres connection error:", err));

const query = async (text, values) => {
    try {
        return await client.query(text, values);
    } catch (err) {
        console.error("Postgres query error:", err);
        throw err;
    }
};

const userTable = "lychee_users";

// Auth helper
const JWT_SECRET = process.env.JWT_SECRET

function authRequired(req, res, next) {
    const route = `[${req.method}] ${req.originalUrl}`;     // Logging purposes
    const token = req.cookies.token;
    // Missing token in request
    if (!token) {
        console.warn(`[AUTH] No cookie on ${route}`);
        return res.status(401).json({error: "Not authenticated"});
    }
    // Verify token
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        console.info(`[AUTH] OK user=${req.user.id} email=${req.user.email} route=${route}`);
        next();
    } catch (err) {
        console.error(`[AUTH] Invalid token on ${route}: ${err.name} – ${err.message}`);
        return res.status(401).json({error: "Invalid or expired token"});
    }
}

// Paid subscription check helper fn
function paidRequired(req, res, next) {
    const isPaid = req.user.subStatus === true;
    if (!isPaid) {
        console.warn(`[PLAN] User ${req.user.id} tried to access paid endpoint.`);
        return res.status(403).json({ error: "Paid plan required" });
    }
    next();
}

// Routes
// Login route
app.post("/api/login", async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password)
        return res.status(400).json({error: "Email and password are required."});

    try {
        // Query for user in db
        const sql = `select id, email, password_hash, subscription_status
                     from ${userTable}
                     where email = $1`;
        const {rows: [user]} = await query(sql, [email]);
        // If user not found or pw don't match
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(400).json({error: "Invalid credentials."});
        }

        // Sign jwt token with user info that expires in 1h
        const payload = {id: user.id, email: user.email, subStatus: user.subscription_status};
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "1h"});
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // True for prod
            sameSite: "lax",
        });
        res.json({message: "Logged in", user: payload});
    } catch (err) {
        console.error("[LOGIN] Error:", err);
        res.status(500).json({error: "Error logging in."});
    }
});

// Logout route
app.post("/api/logout", (req, res) => {
    res.clearCookie("token", {sameSite: "lax"});
    res.json({message: "Logged out."});
});

// Session check route
app.get("/api/me", (req, res) => {
    try {
        const user = jwt.verify(req.cookies.token, JWT_SECRET); // Verify and decode JWT
        res.json({loggedIn: true, user});
    } catch {
        res.json({loggedIn: false});
    }
});

// Registration route
app.post("/api/register", async (req, res) => {
    const {email, password, subscriptionStatus} = req.body;

    // Validate required fields
    if (!email || !password) {
        console.log("[REGISTER] Error: Missing email or password.");
        return res.status(400).json({error: "Email and password are required."});
    }

    // Existing (already registered) users validation
    try {
        const checkSql = `select *
                          from ${userTable}
                          where email = $1`;
        const {rows: existing} = await query(checkSql, [email]);
        if (existing.length) {
            console.log("[REGISTER] Error: User already registered.");
            return res.status(400).json({error: "User already registered"});
        }

        // Once validated, hash pw and insert user
        const hashed = await bcrypt.hash(password, 10);
        const insertSql = `
            insert into ${userTable} (email, password_hash, subscription_status)
            values ($1, $2, $3) returning id, email, subscription_status, created_at
        `;
        const {rows: [newUser]} = await query(insertSql, [
            email,
            hashed,
            subscriptionStatus
        ]);

        // Success response
        res.status(201).json({user: newUser});
    } catch (error) {
        console.error("[REGISTER] Error in Express route:", error);
        res.status(500).json({error: "Error processing registration."});
    }
});

// Subscription update route
app.patch("/api/subscription", authRequired, async (req, res) => {
    const {newStatus} = req.body;

    // Query to update subscription_status with the newStatus
    try {
        const sql = `
            update ${userTable}
            set subscription_status = $1
            where id = $2 returning id, email, subscription_status, created_at`
        const {rows: [updatedUsr]} = await query(sql, [newStatus, req.user.id]);
        res.json({user: updatedUsr});
    } catch (err) {
        console.error("[SUBSCRIPTION] Error: ", err);
        res.status(500).json({error: "Error updating subscription."});
    }
});

// Password update route
app.patch("/api/password", authRequired, async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({error: "Both current and new password fields are required."});
    }

    try {
        // Query for current pw hash
        const sql = `
            select password_hash
            from ${userTable}
            where id = $1`;
        const {rows: [user]} = await query(sql, [req.user.id]);

        // Validate current pw
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
            return res.status(403).json({error: "Incorrect current password."});
        }

        // Hash up the new pw
        const hashed = await bcrypt.hash(newPassword, 10);
        // Insert new pw hash into db
        const updateSql = `
            update ${userTable}
            set password_hash = $1
            where id = $2 returning id, email, subscription_status, created_at
        `;
        const {rows: [updatedUsr]} = await query(updateSql, [hashed, req.user.id]);
        res.json({user: updatedUsr});
    } catch (err) {
        console.error("[PASSWORD] Error:", err);
        res.status(500).json({error: "Error updating password."});
    }
});

// Summarize route
app.post("/api/summarize", authRequired, async (req, res) => {
    const {url} = req.body;
    console.log("[SUMMARIZE] Received request for URL:", url);

    // Create a unique cache key for the URL
    const cacheKey = `${url}`;

    try {
        if (summariesCollection) {
            const document = await summariesCollection.findOne({url});
            if (document) {
                console.log("[SUMMARIZE] MongoDB hit for URL:", url);
                return res.json({summary: document.summary_text});
            }
        }
        // Check if the summary exists in Redis
        const cached_text = await redisClient.get(cacheKey);
        if (cached_text) {
            console.log("[SUMMARIZE] Cache hit for URL:", url);
            // Forward the cached summary to the Python cached endpoint
            const pyCachedResponse = await fetch(
                "http://127.0.0.1:5001/summarize/cached",
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({url, summary: cached_text}),
                }
            );
            if (!pyCachedResponse.ok) {
                const errText = await pyCachedResponse.text();
                console.error("[SUMMARIZE] Python cached service error:", errText);
                return res
                    .status(500)
                    .json({error: "Error processing cached summary."});
            }
            const cachedData = await pyCachedResponse.json();
            return res.json({summary: cachedData.summary_text});
        }

        // If no cache entry exists, forward to the normal Python summarization service
        console.log(
            "[SUMMARIZE] Cache miss. Forwarding to Python summarization service."
        );
        const pyResponse = await fetch("http://127.0.0.1:5001/summarize", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({url}),
        });
        if (!pyResponse.ok) {
            const errText = await pyResponse.text();
            console.error("[SUMMARIZE] Python service error:", errText);
            return res.status(500).json({error: "Error summarizing the text."});
        }
        const data = await pyResponse.json();
        console.log("[SUMMARIZE] Received data from Python:", data);

        // Return the summary to the frontend
        res.json({summary: data.summary_text});
    } catch (error) {
        console.error("[SUMMARIZE] Error in Express route:", error);
        res.status(500).json({error: "Error processing summary."});
    }
});

// Sentiment route
app.post("/api/sentiment", paidRequired, authRequired, async (req, res) => {
    const {url} = req.body;
    const cacheKey = `${url}`;

    try {
        // Check if the sentiment exists in Redis
        const cached_text = await redisClient.get(cacheKey);
        if (cached_text) {
            console.log("[SUMMARIZE] Cache hit for URL:", url);
            // Forward the cached text to the Python cached endpoint
            const pyCachedResponse = await fetch(
                "http://127.0.0.1:5001/sentiment/cached",
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({url, summary: cached_text}),
                }
            );
            if (!pyCachedResponse.ok) {
                const errText = await pyCachedResponse.text();
                console.error("[SUMMARIZE] Python cached service error:", errText);
                return res
                    .status(500)
                    .json({error: "Error processing cached summary."});
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
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({url}),
            });
            if (!pyResponse.ok) {
                const errText = await pyResponse.text();
                console.error("[SUMMARIZE] Python service error:", errText);
                return res.status(500).json({error: "Error summarizing the text."});
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
        res.status(500).json({error: "Error processing sentiment."});
    }
});

// Classification route
app.post("/api/classify", paidRequired, authRequired, async (req, res) => {
    const {url} = req.body;
    console.log("[CLASSIFY] Received request for URL:", url);
    const cacheKey = `${url}`;

    try {
        const cached_text = await redisClient.get(cacheKey);

        if (cached_text) {
            console.log("[SUMMARIZE] Cache hit for URL:", url);
            // Forward the cached text to the Python cached endpoint
            const pyCachedResponse = await fetch(
                "http://127.0.0.1:5001/classify/cached",
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({url, summary: cached_text}),
                }
            );
            if (!pyCachedResponse.ok) {
                const errText = await pyCachedResponse.text();
                console.error("[CLASSIFY] Python cached service error:", errText);
                return res
                    .status(500)
                    .json({error: "Error processing cached summary."});
            }
            const cachedData = await pyCachedResponse.json();
            // Return classification data to frontend
            res.json(cachedData);
        } else {
            console.log("[SUMMARIZE] Cache miss for URL:", url);

            // Forward to Python's /classify endpoint
            const pyResponse = await fetch("http://127.0.0.1:5001/classify", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({url}),
            });

            if (!pyResponse.ok) {
                const errText = await pyResponse.text();
                console.error("[CLASSIFY] Python service error:", errText);
                return res.status(500).json({error: "Error classifying the text."});
            }

            const data = await pyResponse.json();
            console.log("[CLASSIFY] Received data from Python:", data);

            // Return classification data to frontend
            res.json(data);
        }
    } catch (error) {
        console.error("[CLASSIFY] Error in Express route:", error);
        res.status(500).json({error: "Error processing classification."});
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});