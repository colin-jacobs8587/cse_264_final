import React, { useState } from 'react';
import Login from './components/Login';
import SummarizeForm from './components/SummarizeForm';
import SentimentForm from './components/SentimentForm';
import ClassifyForm from './components/ClassifyForm';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('summarize');

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <>
          <nav className="navbar">
            <button
              className={activeTab === 'summarize' ? 'active' : ''}
              onClick={() => setActiveTab('summarize')}
            >
              Summarize
            </button>
            <button
              className={activeTab === 'sentiment' ? 'active' : ''}
              onClick={() => setActiveTab('sentiment')}
            >
              Sentiment
            </button>
            <button
              className={activeTab === 'classify' ? 'active' : ''}
              onClick={() => setActiveTab('classify')}
            >
              Classify
            </button>
          </nav>
          <div className="form-container">
            {activeTab === 'summarize' && <SummarizeForm />}
            {activeTab === 'sentiment' && <SentimentForm />}
            {activeTab === 'classify' && <ClassifyForm />}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
