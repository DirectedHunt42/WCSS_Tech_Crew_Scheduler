const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); 
const fs = require('fs');

const app = express();
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Frontend origin
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'OPTIONS'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));
app.use(bodyParser.json());
app.use(cookieParser());

const optInFile = 'optInRequests.json';

// Ensure the opt-in file exists
if (!fs.existsSync(optInFile)) {
    fs.writeFileSync(optInFile, JSON.stringify({}));
}

// Endpoint to handle opt-in requests
app.post('/opt-in', (req, res) => {
    // Get the logged-in user ID from the cookie
    const userId = req.cookies?.loggedInUser || req.cookies?.loggedInAdmin;
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    const { eventName } = req.body;
    if (!eventName) {
        return res.status(400).send('Missing eventName');
    }

    // Load existing opt-in data
    const optInData = JSON.parse(fs.readFileSync(optInFile, 'utf-8'));

    // Add the opt-in state for the user and event
    if (!optInData[userId]) {
        optInData[userId] = [];
    }
    if (!optInData[userId].includes(eventName)) {
        optInData[userId].push(eventName);
    }

    // Save the updated opt-in data
    fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));

    res.send('Opt-in request saved successfully');
});

// Endpoint to get opt-in state for a user
app.get('/opt-in-state', (req, res) => {
    // Get the logged-in user ID from the cookie
    const userId = req.cookies?.loggedInUser || req.cookies?.loggedInAdmin;
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    // Load existing opt-in data
    const optInData = JSON.parse(fs.readFileSync(optInFile, 'utf-8'));

    // Return the opt-in state for the user
    res.json(optInData[userId] || []);
});

// Start the server
app.listen(6421, () => {
    console.log('Server is running on port 6421');
});