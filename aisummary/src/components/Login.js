import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
    const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Accept any username and password for now
        onLoginSuccess();
        setMessage('');
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
        </div>
    );
}

export default Login;
