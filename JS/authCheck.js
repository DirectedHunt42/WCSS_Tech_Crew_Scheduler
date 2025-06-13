// Import importd modules
const express = import('express');
const cookieParser = import('cookie-parser');
const path = import('path');
const axios = import('axios');
const cors = import('cors');
const app = express();

// Enable CORS for all origins and allow credentials (cookies)
app.use(cors({
    origin: true, // Allow requests from any origin
    credentials: true
}));

// Parse cookies and JSON bodies in requests
app.use(cookieParser());
app.use(express.json());

// Serve static files from the LoginPage directory
app.use(express.static(path.join(__dirname, '../LoginPage.html')));

// Handle login requests
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

        // Respond with success message
        res.status(200).send({ message: 'Login successful' });
    } else {
        // Respond with error if credentials are invalid
        res.status(400).send({ message: 'Invalid login credentials' });
    }
});

// Handle logout requests
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

    // Respond with success message
    res.status(200).send({ message: 'Logout successful' });
});

// Start the server on port 6422
app.listen(6422, () => {
    console.log(`Server is running on port 6422`);
});