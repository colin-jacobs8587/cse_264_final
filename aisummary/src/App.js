import React, {useState} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import SummarizeForm from './components/SummarizeForm';
import SentimentForm from './components/SentimentForm';
import ClassifyForm from './components/ClassifyForm';
import './App.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('summarize');

    const MainApp = () => (
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
                {activeTab === 'summarize' && <SummarizeForm/>}
                {activeTab === 'sentiment' && <SentimentForm/>}
                {activeTab === 'classify' && <ClassifyForm/>}
            </div>
        </>
    );

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route
                        path="/register"
                        element={<Register/>}
                    />
                    <Route
                        path="/"
                        element={
                            !isLoggedIn
                                ? <Login onLoginSuccess={() => setIsLoggedIn(true)}/>
                                : <MainApp/>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
