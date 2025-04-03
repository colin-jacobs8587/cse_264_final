from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
from transformers import pipeline
import logging
from boilerpy3 import extractors
import newspaper
import redis
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os
load_dotenv()  # load variables from .env file

# Construct the MongoDB URI from environment variables
mongo_user = os.getenv("MONGO_USER")
mongo_pass = os.getenv("MONGO_PASS")
mongo_host = os.getenv("MONGO_HOST")
mongo_options = os.getenv("MONGO_OPTIONS")
mongo_db_db = os.getenv("MONGO_DB_DB")
mongo_collection= os.getenv("MONGO_COLLECTION")


uri = f"mongodb+srv://{mongo_user}:{mongo_pass}@{mongo_host}/?{mongo_options}"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# sets which mongodb db to use
db = client[mongo_db_db]

# sets the summaries collection
summaries_collection = db[mongo_collection]

# Initialize Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=0)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

summarizer = pipeline(
    "summarization",
    model="google/pegasus-cnn_dailymail",
    tokenizer="google/pegasus-cnn_dailymail",
    use_fast=False
)
logging.debug("Summarization model loaded.")

sentiment_analyzer = pipeline("sentiment-analysis")
logging.debug("Sentiment analysis model loaded.")


classifier = pipeline("text-classification", model="textattack/distilbert-base-uncased-ag-news")
logging.debug("AG News classifier model loaded.")

def extract_text_with_newspaper(url):
    article = newspaper.Article(url, language='en')
    article.download()
    article.parse()
    #print(article.text)
    return article.text

@app.route('/classify', methods=['POST'])
def classify():
    data = request.get_json()
    url = data.get('url', '')
    logging.debug(f"[CLASSIFY] Received URL: {url}")

    try:
        text = extract_text_with_newspaper(url)
         # Save the full extracted text in Redis with the URL as the key
        redis_client.set(url, text)
        logging.debug(f"Url: {url}")
        logging.debug(f"Text: {text}")
        truncated_text = text[:1024]

        # Run text classification using the AG News model.
        classification_result = classifier(truncated_text, truncation=True)

        # model returns labels 
        label_mapping = {
            "LABEL_0": "World",
            "LABEL_1": "Sports",
            "LABEL_2": "Business",
            "LABEL_3": "Sci/Tech"
        }

        # Remap the labels in the classification result.
        for result in classification_result:
            result['label'] = label_mapping.get(result['label'], result['label'])

        logging.debug(f"[CLASSIFY] Classification result: {classification_result}")

        return jsonify(classification_result)
    except Exception as e:
        logging.error("[CLASSIFY] Error:", exc_info=True)
        return jsonify({'error': 'Error classifying the text.'}), 500

@app.route('/classify/cached', methods=['POST'])
def classify_cached():
    data = request.get_json()
    url = data.get('url', '')
    logging.debug(f"[CLASSIFY] Received URL: {url}")
    cached_text = data.get('summary', '')
    logging.debug(f"[CLASSIFY-CACHED] Received URL: {url} with cached summary.")
    logging.debug(f"Url: {url}")
    logging.debug(f"Text: {cached_text}")
    try:
        cached_text = extract_text_with_newspaper(url)
        truncated_text = cached_text[:1024]

        # Run text classification using the AG News model.
        classification_result = classifier(truncated_text, truncation=True)

        # model returns labels 
        label_mapping = {
            "LABEL_0": "World",
            "LABEL_1": "Sports",
            "LABEL_2": "Business",
            "LABEL_3": "Sci/Tech"
        }

        # Remap the labels in the classification result.
        for result in classification_result:
            result['label'] = label_mapping.get(result['label'], result['label'])

        logging.debug(f"[CLASSIFY] Classification result: {classification_result}")

        return jsonify(classification_result)
    except Exception as e:
        logging.error("[CLASSIFY] Error:", exc_info=True)
        return jsonify({'error': 'Error classifying the text.'}), 500

# summarizes the data if its first attempt
@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    url = data.get('url', '')
    logging.debug(f"[SUMMARIZE] Received URL: {url}")
    try:
        # Extract text from the URL
        text = extract_text_with_newspaper(url)
        
        # Save the full extracted text in Redis with the URL as the key
        redis_client.set(url, text)
        logging.debug(f"Url: {url}")
        logging.debug(f"Text: {text}")
        
        # Use a truncated version of the text for summarization
        truncated_text = text[:3000]
        summary_result = summarizer(
            truncated_text,
            max_length=150,
            min_length=40,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.7
        )
        summary_text = summary_result[0].get('summary_text', 'No summary available')
        logging.debug(f"[SUMMARIZE] Summary: {summary_text}")
          
        # Insert the summary into MongoDB 
        summaries_collection.insert_one({
            "url": url,
            "summary_text": summary_text,
        })   
        return jsonify({'summary_text': summary_text})
    except Exception as e:
        logging.error("[SUMMARIZE] Error:", exc_info=True)
        return jsonify({'error': 'Error summarizing the text.'}), 500

# The url was found the the redis cache so we don't need to scrape the website
@app.route('/summarize/cached', methods=['POST'])
def summarize_cached():
    data = request.get_json()
    url = data.get('url', '')
    cached_text = data.get('summary', '')
    logging.debug(f"[SUMMARIZE-CACHED] Received URL: {url} with cached summary.")
    logging.debug(f"Url: {url}")
    logging.debug(f"Text: {cached_text}")
    try:
        truncated_text = cached_text[:3000]
        summary_result = summarizer(
            truncated_text,
            max_length=150,
            min_length=40,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.7
        )
        summary_text = summary_result[0].get('summary_text', 'No summary available')
        logging.debug(f"[SUMMARIZE-CACHED] Final Summary: {summary_text}")

        # Insert the summary into MongoDB 
        summaries_collection.insert_one({
            "url": url,
            "summary_text": summary_text,
        })   
        return jsonify({'summary_text': summary_text})
    except Exception as e:
        logging.error("[SUMMARIZE-CACHED] Error:", exc_info=True)
        return jsonify({'error': 'Error summarizing the cached summary.'}), 500


@app.route('/sentiment', methods=['POST'])
def sentiment():
    data = request.get_json()
    url = data.get('url', '')
    logging.debug(f"[SENTIMENT] Received URL: {url}")
    try:
        text = extract_text_with_newspaper(url)
        print(text)
        redis_client.set(url, text)
        short_text = text[:2000]
        sentiment_result = sentiment_analyzer(short_text, truncation=True)
        label = sentiment_result[0]['label']
        score = sentiment_result[0]['score']
        logging.debug(f"[SENTIMENT] {label} (score: {score})")
        return jsonify({
            'sentiment_label': label,
            'sentiment_score': score
        })
    except Exception as e:
        logging.error("[SENTIMENT] Error:", exc_info=True)
        return jsonify({'error': 'Error analyzing sentiment.'}), 500

@app.route('/sentiment/cached', methods=['POST'])
def sentiment_cached():
    data = request.get_json()
    url = data.get('url', '')
    cached_text = data.get('summary', '')
    logging.debug(f"[SENTIMENT-CACHED] Received URL: {url}")
    logging.debug(f"Url: {url}")
    logging.debug(f"Text: {cached_text}")    
    try:
        short_text = cached_text[:2000]
        sentiment_result = sentiment_analyzer(short_text, truncation=True)
        label = sentiment_result[0]['label']
        score = sentiment_result[0]['score']
        logging.debug(f"[SENTIMENT] {label} (score: {score})")
        return jsonify({
            'sentiment_label': label,
            'sentiment_score': score
        })
    except Exception as e:
        logging.error("[SENTIMENT] Error:", exc_info=True)
        return jsonify({'error': 'Error analyzing sentiment.'}), 500


if __name__ == '__main__':
    logging.debug("Starting Python service on port 5001...")
    app.run(port=5001)