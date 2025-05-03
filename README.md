# 🍒 Lychee
**Lychee** is a full-stack AI-powered web app for real-time news analysis. Users can summarize, classify, or analyze the sentiment of news articles by simply pasting a URL.

## 👥 Team
- **Colin Jacobs** — Backend
- **Nelly Nguyen** — Backend
- **Helen Gao** — PM / Frontend

## 📌 Project Features & Requirements Coverage

| Requirement                     | Our Implementation                                                                 |
|--------------------------------|-------------------------------------------------------------------------------------|
| **User Accounts & Roles**      | JWT-authenticated login system with PostgreSQL. Users are marked as free or paid. |
| **Database**                   | PostgreSQL for user credentials and status; MongoDB for summaries.                |
| **Interactive UI**             | React frontend with dynamic button actions, live results, and conditional access. |
| **New Library or Framework**   | Hugging Face Transformers & Newspaper3k (not covered in class).                   |
| **Internal REST API**          | Node.js backend exposes routes like `/api/summarize`, `/api/login`, etc.          |
| **External REST API** *(opt)*  | Flask microservice with AI model endpoints; functions like an external service.   |

## ⚙️ How It Works
1. User logs in and lands on the homepage
2. They paste a news article URL into the input field
3. They choose one of the following actions:
    - **Summarize Article**
    - **Classify Article**
    - **Analyze Sentiment**
4. The frontend sends a request to the Node.js backend:
    - `/summarize` for summary
    - `/classify` for topic classification
    - `/sentiment` for sentiment analysis
5. The Node.js backend forwards the request to a Flask-based Python microservice
6. The Python service:
    - Extracts article text using `newspaper3k`
    - Runs Hugging Face NLP models
7. Results are returned and displayed on the frontend

## 🛠 Tech Stack

### Frontend
- React
- CSS / Material UI

### Backend
- Node.js with Express
    - REST API: `/api/login`, `/api/logout`, `/api/me`, `/api/register`, `/api/subscription`, `/api/password`, `/api/summarize`, `/api/sentiment`, `/api/classify`
    - `node-fetch` for communication with Python service
    - `dotenv`, `cors` for configuration and security
- Redis (backend caching for scraped text)
- PostgreSQL (stores users)
- MongoDB (stores summaries)

### Python Microservice
- Flask (RESTful API)
- Hugging Face Transformers:
    - **Summarization**: `google/pegasus-cnn_dailymail`
    - **Sentiment Analysis**: default sentiment pipeline
    - **Classification**: `ilsilfverskiold/classify-news-category-iptc`
- `newspaper3k`: parses article content

## 📁 Folder Structure
/aisummary → React frontend

/backend → Node.js backend and Python microservice

## 📦 Requirements
- Node.js
- Python
- Redis: https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/
- PostgreSQL
- MongoDB

## 🔧 Setup Instructions
1. Clone the repo
2. Make sure you have appropriate .env
3. Make sure redis is up
4. From the root directory, run 'sh run.sh'

## 📈 High-Level Architecture Diagram

