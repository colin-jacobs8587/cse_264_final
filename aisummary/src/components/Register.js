import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styling/Register.css'; 

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('false');
  const [message, setMessage] = useState('');
  const [showOrb, setShowOrb] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, subscriptionStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        // show error
        return setMessage(data.error);
      }

      // on success: show the orb, then redirect
      setShowOrb(true);
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      setMessage('Server error');
    }
  };

  return (
    <div className="register-container">
      {showOrb ? (
        // single orb element shown on success
        <div className="orb" />
      ) : (
        <>
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <label>
              Paid Subscription
              <input
                type="checkbox"
                checked={subscriptionStatus === 'true'}
                onChange={e => setSubscriptionStatus(e.target.checked ? 'true' : 'false')}
              />
            </label>
            <button type="submit">Register</button>
          </form>
          {message && <p>{message}</p>}
          <button onClick={handleLogin}>Back to Login</button>
        </>
      )}
    </div>
  );
}

export default Register;