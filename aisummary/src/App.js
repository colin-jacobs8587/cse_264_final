import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import SummarizeForm from './components/SummarizeForm';
import SentimentForm from './components/SentimentForm';
import ClassifyForm from './components/ClassifyForm';
import './App.css';

function App() {
    // Track login, subs, active tab, toast msg state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [activeTab, setActiveTab] = useState('summarize');
    const [toast, setToast] = useState('');

    // Toast message for 3s
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const MainApp = () => (
        <>
            <nav className="navbar">
                {/* Tab: Summarize */}
                <button
                    className={activeTab === 'summarize' ? 'active' : ''}
                    onClick={() => setActiveTab('summarize')}
                >
                    Summarize
                </button>
                {/* Tab: Sentiment (paid only) */}
                <button
                    className={`${!isPaid ? 'restricted-tab' : ''} ${activeTab === 'sentiment' ? 'active' : ''}`}
                    onClick={() => {
                        if (!isPaid) showToast("🔒 Sentiment analysis is available for paid users only.");
                        else setActiveTab('sentiment');
                    }}
                >
                    Sentiment
                </button>
                {/* Tab: Classify (paid only) */}
                <button
                    className={`${!isPaid ? 'restricted-tab' : ''} ${activeTab === 'classify' ? 'active' : ''}`}
                    onClick={() => {
                        if (!isPaid) showToast("🔒 Classification is available for paid users only.");
                        else setActiveTab('classify');
                    }}
                >
                    Classify
                </button>
                {/* Logout button */}
                <button onClick={async () => {
                    await fetch("http://localhost:5000/api/logout", {
                        method: "POST",
                        credentials: "include"
                    });
                    setIsLoggedIn(false);
                }}>
                    Logout
                </button>
            </nav>
            {/* Show form based on activeTab */}
            <div className="form-container">
                {activeTab === 'summarize' && <SummarizeForm/>}
                {activeTab === 'sentiment' && <SentimentForm/>}
                {activeTab === 'classify' && <ClassifyForm/>}
            </div>
        </>
    );

    // Hit /api/me to validate jwt to update isLoggedIn, update isPaid
    useEffect(() => {
        fetch("http://localhost:5000/api/me", {credentials: "include"})
            .then(r => r.json())
            .then(d => {
                setIsLoggedIn(d.loggedIn);
                setIsPaid(Boolean(d.user?.subStatus));
            })
            .catch(() => setIsLoggedIn(false));
    }, []);

    return (
        <Router>
            <div className="App">
                {toast && <div className="toast">{toast}</div>}
                <Routes>
                    <Route
                        path="/register"
                        element={<Register/>}
                    />
                    {/* Root: If not logged in, show login page. If logged in, show app */}
                    <Route
                        path="/"
                        element={
                            !isLoggedIn
                                ? <Login onLoginSuccess={(paid) => {
                                    setIsLoggedIn(true);
                                    setIsPaid(paid);
                                }}/>
                                : <MainApp/>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
