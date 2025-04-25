// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import SummarizeForm from "./components/SummarizeForm";
import SentimentForm from "./components/SentimentForm";
import ClassifyForm from "./components/ClassifyForm";
import Profile from "./components/Profile";
import {
  SUMMARIZE,
  SENTIMENT,
  CLASSIFY,
  PROFILE,
  LOGOUT,
} from "./components/Constants/Constants";
import "./App.css";

function App() {
  // Track login, subscription, active tab, and toast state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [activeTab, setActiveTab] = useState("summarize");
  const [toast, setToast] = useState("");

  // Show a toast for 3 seconds
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Main application view once logged in
  const MainApp = () => (
    <>
      <nav className="navbar">
        <div className="nav-buttons">
          <button
            className={activeTab === "summarize" ? "active" : ""}
            onClick={() => setActiveTab("summarize")}
          >
            {SUMMARIZE}
          </button>

          <button
            className={`${!isPaid ? "restricted-tab" : ""} ${
              activeTab === "sentiment" ? "active" : ""
            }`}
            onClick={() => {
              if (!isPaid) {
                showToast(
                  "🔒 Sentiment analysis is available for paid users only."
                );
              } else {
                setActiveTab("sentiment");
              }
            }}
          >
            {SENTIMENT}
          </button>

          <button
            className={`${!isPaid ? "restricted-tab" : ""} ${
              activeTab === "classify" ? "active" : ""
            }`}
            onClick={() => {
              if (!isPaid) {
                showToast(
                  "🔒 Classification is available for paid users only."
                );
              } else {
                setActiveTab("classify");
              }
            }}
          >
            {CLASSIFY}
          </button>

          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            {PROFILE}
          </button>

          <button
            className="logout"
            onClick={async () => {
              await fetch("http://localhost:5000/api/logout", {
                method: "POST",
                credentials: "include",
              });
              setIsLoggedIn(false);
            }}
          >
            {LOGOUT}
          </button>
        </div>
      </nav>

      <div className="form-container">
        {activeTab === "summarize" && <SummarizeForm />}
        {activeTab === "sentiment" && <SentimentForm />}
        {activeTab === "classify" && <ClassifyForm />}
        {activeTab === "profile" && (
          <Profile isPaid={isPaid} setIsPaid={setIsPaid} />
        )}
      </div>
    </>
  );

  // On mount, validate session and subscription status
  useEffect(() => {
    fetch("http://localhost:5000/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.loggedIn);
        setIsPaid(Boolean(data.user?.subStatus));
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <Router>
      <div className="App">
        {toast && <div className="toast">{toast}</div>}
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              !isLoggedIn ? (
                <Login
                  onLoginSuccess={(paid) => {
                    setIsLoggedIn(true);
                    setIsPaid(paid);
                  }}
                />
              ) : (
                <MainApp />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
