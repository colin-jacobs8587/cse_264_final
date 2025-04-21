import React, {useEffect, useState} from 'react';

function Profile({isPaid, setIsPaid}) {
    // Track subscription toggle msg
    const [subscriptionMsg, setSubscriptionMsg] = useState('');
    // Track password fields + msg
    const [passwordFields, setPasswordFields] = useState({currentPassword: '', newPassword: ''});
    const [passwordMsg, setPasswordMsg] = useState('');
    const [email, setEmail] = useState('');

    // Get user email
    useEffect(() => {
        fetch("http://localhost:5000/api/me", {credentials: "include"})
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn) setEmail(data.user?.email);
            })
            .catch(() => {
            });
    }, []);

    // Calls /api/subscription to change subscription
    const handleSubscription = async () => {
        setSubscriptionMsg('Updating...');
        try {
            const res = await fetch('http://localhost:5000/api/subscription', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({newStatus: !isPaid})
            });
            const data = await res.json();
            if (!res.ok) return setSubscriptionMsg(data.error);
            setIsPaid(Boolean(data.user?.subscription_status));
            setSubscriptionMsg('Subscription updated!');
        } catch (err) {
            setSubscriptionMsg('Server error');
        }
    };

    // Calls /api/password to change pw
    const handlePassword = async (e) => {
        e.preventDefault();
        setPasswordMsg('Updating...');
        try {
            const res = await fetch('http://localhost:5000/api/password', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(passwordFields)
            });
            const data = await res.json();
            if (!res.ok) return setPasswordMsg(data.error);
            setPasswordMsg('Password updated!');
            setPasswordFields({currentPassword: '', newPassword: ''});
        } catch (err) {
            setPasswordMsg('Server error');
        }
    };

    return (
        <div className="profile-container">
            <h2>Profile</h2>
            {email && <p>Hello, {email}</p>}
            {/* Change subscription */}
            <div className="profile-section">
                <p>Current Plan: {isPaid ? 'Paid ✅' : 'Free ❌'}</p>
                <button onClick={handleSubscription}>
                    {isPaid ? 'Downgrade to Free' : 'Upgrade to Paid'}
                </button>
                {subscriptionMsg && <p>{subscriptionMsg}</p>}
            </div>

            {/* Change password */}
            <div className="profile-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePassword}>
                    <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordFields.currentPassword}
                        onChange={(e) =>
                            setPasswordFields({...passwordFields, currentPassword: e.target.value})
                        }
                        required
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        value={passwordFields.newPassword}
                        onChange={(e) =>
                            setPasswordFields({...passwordFields, newPassword: e.target.value})
                        }
                        required
                    />
                    <button type="submit">Update Password</button>
                </form>
                {passwordMsg && <p>{passwordMsg}</p>}
            </div>
        </div>
    );
}

export default Profile;