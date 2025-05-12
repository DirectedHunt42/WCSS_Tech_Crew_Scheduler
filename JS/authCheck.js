const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const axios = require('axios'); 
const cors = require('cors');
const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500', // Frontend origin
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Serve static files from the LoginPage directory
app.use(express.static(path.join(__dirname, '../LoginPage.html')));

// login 
app.post('/login', (req, res) => {
    const { username, isAdmin } = req.body;

    if (username) {
        // Set a cookie for the logged-in user
        res.cookie('loggedInUser', username, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        if (isAdmin) {
            // Set a cookie for admin users
            res.cookie('loggedInAdmin', username, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 24 * 60 * 60 * 1000
            });
        }

        res.status(200).send({ message: 'Login successful' });
    } else {
        res.status(400).send({ message: 'Invalid login credentials' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password, type } = req.body;

    try {
        // Forward the login request to the Python login API
        const pythonResponse = await axios.post('http://127.0.0.1:5500/api/login', {
            username,
            password,
            type
        });

        // Check the response from the Python API
        if (pythonResponse.data.success) {
            // Set cookies for the logged-in user
            const cookieName = type === 'user' ? 'loggedInUser' : 'loggedInAdmin';
            res.cookie(cookieName, username, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 3600 * 1000 // 1 hour
            });

            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ message: pythonResponse.data.error });
        }
    } catch (error) {
        console.error('Error communicating with Python login API:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// logout 
app.post('/logout', (req, res) => {
    // Clear cookies with the same attributes as when they were set
    res.clearCookie('loggedInUser', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/' // Ensure the path matches the one used when setting the cookie
    });
    res.clearCookie('loggedInAdmin', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/' // Ensure the path matches the one used when setting the cookie
    });

    res.status(200).send({ message: 'Logout successful' });
});

// Start the server
app.listen(6422, () => {
    console.log(`Server is running on port 6422`);
});