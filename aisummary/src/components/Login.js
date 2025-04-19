import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLoginSuccess }) {
    const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate

    const handleLogin = (e) => {
        e.preventDefault();
        // Backend calls for login
        onLoginSuccess();
        setMessage('');
    };

    const handleRegister = () => {
        navigate('/register'); // Navigate to registration form
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={loginCredentials.username}
                    onChange={(e) =>
                        setLoginCredentials({ ...loginCredentials, username: e.target.value })
                    }
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={loginCredentials.password}
                    onChange={(e) =>
                        setLoginCredentials({ ...loginCredentials, password: e.target.value })
                    }
                    required
                />
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
            <button onClick={handleRegister}>New User Registration</button> {/* Register button */}
        </div>
    );
}

export default Login;
