import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styling/Login.css";
import "../App.css";
import { LOGIN, NEW_USER_REGISTRATION } from "./Constants/Constants";

function Login({ onLoginSuccess }) {
  const [loginCredentials, setLoginCredentials] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    // only show spinner if fetch takes >200ms
    const loaderTimer = setTimeout(() => setLoading(true),300);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginCredentials.username,
          password: loginCredentials.password,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        clearTimeout(loaderTimer);
        return setMessage(data.error);
      }

      onLoginSuccess(data.user?.subscription_status);
    } catch (err) {
      setMessage("Server error");
    } finally {
      clearTimeout(loaderTimer);
      setLoading(false);
    }
  };


  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="login-container">
      {loading ? (
        <div className="orb-overlay">
          <div className="orb" />
        </div>
      ) : (
        <>
          <h2>{LOGIN}</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username (Email)"
              value={loginCredentials.username}
              onChange={(e) =>
                setLoginCredentials({
                  ...loginCredentials,
                  username: e.target.value,
                })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginCredentials.password}
              onChange={(e) =>
                setLoginCredentials({
                  ...loginCredentials,
                  password: e.target.value,
                })
              }
              required
            />
            <button type="submit">{LOGIN}</button>
          </form>
          {message && <p>{message}</p>}
          <button onClick={handleRegister}>{NEW_USER_REGISTRATION}</button>
        </>
      )}
    </div>
  );
}

export default Login;
