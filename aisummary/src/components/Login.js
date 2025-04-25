import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import '../styling/Login.css';

function Login({onLoginSuccess}) {
    const [loginCredentials, setLoginCredentials] = useState({username: '', password: ''});
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("Logging in…");
        try {
            const res = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: loginCredentials.username, password: loginCredentials.password}),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) return setMessage(data.error);
            onLoginSuccess();
        } catch (err) {
            setMessage("Server error");
        }
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
                        setLoginCredentials({...loginCredentials, username: e.target.value})
                    }
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={loginCredentials.password}
                    onChange={(e) =>
                        setLoginCredentials({...loginCredentials, password: e.target.value})
                    }
                    required
                />
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
            {/* Register button */}
            <button onClick={handleRegister}>New User Registration</button>
        </div>
    );
}

export default Login;
