const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

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

// // login endpoint
// app.post('/api/login', (req, res) => {
//     const { username, password } = req.body;

//     // Replace this with your actual authentication logic
//     if (username === 'testuser' && password === 'password123') {
//         res.status(200).json({ message: 'Login successful' });
//     } else {
//         res.status(401).json({ message: 'Invalid username or password' });
//     }
// });

// logout 
app.post('/logout', (req, res) => {
    res.clearCookie('loggedInUser');
    res.clearCookie('loggedInAdmin');
    res.status(200).send({ message: 'Logout successful' });
});

// Start the server
app.listen(6422, () => {
    console.log(`Server is running on port 6422`);
});