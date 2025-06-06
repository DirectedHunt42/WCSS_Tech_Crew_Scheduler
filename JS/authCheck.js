const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: true, // Allow requests from any origin
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

app.get('/auth/status', (req, res) => {
    const loggedInUser = req.cookies.loggedInUser || null;
    const loggedInAdmin = req.cookies.loggedInAdmin || null;

    res.status(200).json({
        loggedInUser,
        loggedInAdmin
    });
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