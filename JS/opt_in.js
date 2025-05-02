const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint to handle opt-in requests
app.post('/opt-in', (req, res) => {
    const { userId, eventName } = req.body;

    if (!userId || !eventName) {
        return res.status(400).send('Missing userId or eventName');
    }

    // Save the opt-in request to a file or database
    const optInData = { userId, eventName, timestamp: new Date().toISOString() };
    fs.appendFile('optInRequests.txt', JSON.stringify(optInData) + '\n', (err) => {
        if (err) {
            console.error('Error saving opt-in request:', err);
            return res.status(500).send('Failed to save opt-in request');
        }
        res.send('Opt-in request saved successfully');
    });
});

// Start the server
app.listen(6420, () => {
    console.log('Server is running on port 6420');
});