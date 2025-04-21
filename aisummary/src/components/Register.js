import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState('false'); // Default to false
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/'); // Redirect to login page
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        // Reset message
        setMessage('');

        // POST request (/api/register)
        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password, subscriptionStatus}),
            });

            // Extract data from response
            const data = await response.json();

            if (!response.ok) {
                setMessage('Registration Error: ' + data.error);
                console.error('[Register] Error: ', data.error);
                return;
            }

            if (data.user) {
                setMessage('Registration successful! Please log in again. Redirecting to login in 5 seconds...');
                console.log('User registered:', data.user);
                // Wait 15 seconds, then redirect to log in
                setTimeout(() => {
                    navigate('/');
                }, 5000);
            } else {
                setMessage('Registration Error: ' + data.error);
                console.error('[Register] Error: ', data.error);
            }
        } catch (error) {
            console.error('[Register] Error: ', error);
            setMessage('Server error');
        }
    };

    return (
        <div className="register-container">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {/* Subscription */}
                <div>
                    <label>
                        Paid Subscription
                        <input
                            type="checkbox"
                            checked={subscriptionStatus === 'true'}
                            onChange={(e) => setSubscriptionStatus(e.target.checked ? 'true' : 'false')}
                        />
                    </label>
                </div>
                <button type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
            <button onClick={handleLogin}>Back to Login</button>
        </div>
    );
}

export default Register;
