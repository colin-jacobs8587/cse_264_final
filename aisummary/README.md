# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:
### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)




## Project Overview

**Lychee** is an intelligent news processing web application that allows users to analyze online news articles using natural language processing (NLP). Users can paste a URL and receive a **summary**, **sentiment analysis**, and **category classification**.

The app offers both a free tier (summarization only) and a paid tier (full access). Built with a modern web stack, Lychee aims to make news consumption more efficient and insightful.

---

## Team Members & Roles

- **Helen Gao** – Project Manager & Frontend Developer  
- **Colin Jacobs** – Backend Developer  
- **Nelly Nguyen** – Backend Developer

---

## Application Features

### Free & Paid Access
- **Free Tier:** Access to summarization only  
- **Paid Tier:** Access to summarization, sentiment analysis, and topic classification

### Data Storage
- **MongoDB:** Stores article summaries  
- **PostgreSQL:** Stores user data  
- **Redis:** Backend caching for performance

### REST API Architecture
- **Node.js Backend:** Handles frontend requests and routes them to the Python microservice
- **Python Flask Microservice:** Executes NLP tasks using Hugging Face Transformers and returns results as JSON

### User Interface
- Built with **React**
- Users paste a URL and select an action:
  - Summarize Article
  - Classify Article
  - Analyze Sentiment

### NLP Integration
- **Summarization Model:** `google/pegasus-cnn_dailymail`
- **Classification Model:** `textattack/distilbert-base-uncased-ag-news`
- **Sentiment Model:** Default Hugging Face sentiment analyzer
- **Text Extraction:** `newspaper3k` library for parsing article content

### User Story / Flow
1. User logs into the app
2. Pastes a news article URL
3. Selects one of the NLP actions
4. Backend extracts article text and performs the selected NLP task
5. The result is returned as JSON and displayed on the frontend

---

## Installation & Setup Instructions
###To Run: sh run.sh
Note: Make sure to edit the .env files to your directory

## Requirements
- Node.js
- Python 3.x
- MongoDB
- PostgreSQL
- Redis
- pip / npm
