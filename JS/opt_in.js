const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({
    origin: true, // Allow requests from any origin
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'OPTIONS'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));
app.use(bodyParser.json());
app.use(cookieParser());

const optInFile = path.join(__dirname, '../Resources/optInRequests.json');

// Function to safely read and parse the JSON file
function readOptInFile() {
    try {
        const fileContent = fs.readFileSync(optInFile, 'utf-8');
        return fileContent ? JSON.parse(fileContent) : {}; // Return an empty object if the file is empty
    } catch (error) {
        console.error('Error reading opt-in file:', error);
        return {}; // Return an empty object if there's an error
    }
}

// Ensure the opt-in file exists
if (!fs.existsSync(optInFile)) {
    try {
        fs.writeFileSync(optInFile, JSON.stringify({})); // Create an empty JSON object
    } catch (error) {
        console.error('Error creating opt-in file:', error);
    }
}

// Endpoint to handle opt-in requests
app.post('/opt-in', (req, res) => {
    const userId = `${req.cookies.loggedInUser || ''} ${req.cookies.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    const { eventName } = req.body;

    if (!eventName) {
        return res.status(400).send('Missing eventName');
    }

    try {
        const optInData = readOptInFile();

        if (!optInData[userId]) {
            optInData[userId] = [];
        }

        const existingOptIn = optInData[userId].find(event => event.name.trim() === eventName.trim());
        if (!existingOptIn) {
            optInData[userId].push({ name: eventName, status: 'requested' });
        }

        fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
        res.send('Opt-in request saved successfully');
    } catch (error) {
        console.error('Error writing to opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to get opt-in state for a user
app.get('/opt-in-state', (req, res) => {

    const userId = `${req.cookies.loggedInUser || ''} ${req.cookies.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    try {
        const optInData = readOptInFile();
        res.json(optInData[userId] || []);
    } catch (error) {
        console.error('Error reading opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to get opt-in status
app.get('/opt-in-status', (req, res) => {

    const userId = `${req.cookies.loggedInUser || ''} ${req.cookies.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    try {
        const optInData = readOptInFile();
        res.json(optInData[userId] || []);
    } catch (error) {
        console.error('Error reading opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/approve-opt-in', (req, res) => {
    const { userId, eventName } = req.body;
    if (!userId || !eventName) {
        return res.status(400).send('Missing userId or eventName');
    }

    const optInData = JSON.parse(fs.readFileSync(optInFile, 'utf-8'));

    if (optInData[userId]) {
        const event = optInData[userId].find(event => event.name === eventName);
        if (event) {
            event.status = 'approved';
            fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
            return res.send('Opt-in approved successfully');
        }
    }

    res.status(404).send('Opt-in request not found');
});

app.post('/cancel-opt-in', (req, res) => {
    let userId = `${req.cookies?.loggedInUser || ''} ${req.cookies?.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    const { eventName } = req.body;
    if (!eventName) {
        return res.status(400).send('Missing eventName');
    }

    const optInData = JSON.parse(fs.readFileSync(optInFile, 'utf-8'));

    if (optInData[userId]) {
        optInData[userId] = optInData[userId].filter(event => event.name.trim() !== eventName.trim());
        fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
        return res.send('Opt-in request canceled successfully');
    }

    res.status(404).send('Opt-in request not found');
});

// Endpoint to fetch all opt-in requests for admin
const apiBase = window.location.origin;
app.get(`${apiBase}:6421/admin/opt-in-requests`, (req, res) => {
    try {
        const optInData = readOptInFile();
        res.json(optInData); // Send all opt-in requests to the admin
    } catch (error) {
        console.error('Error reading opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to approve or deny opt-in requests
app.post('/admin/update-opt-in', (req, res) => {
    const { userId, eventName, action } = req.body; // `action` can be 'approve' or 'deny'
    if (!userId || !eventName || !action) {
        return res.status(400).send('Missing userId, eventName, or action');
    }

    try {
        const optInData = readOptInFile();

        if (optInData[userId]) {
            const event = optInData[userId].find(event => event.name === eventName);
            if (event) {
                if (action === 'approve') {
                    event.status = 'approved';
                } else if (action === 'deny') {
                    event.status = 'denied'; // Mark the request as denied
                }
                fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
                return res.send(`Opt-in ${event.status} successfully`);
            }
        }

        res.status(404).send('Opt-in request not found');
    } catch (error) {
        console.error('Error updating opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/remove_event', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing event id');
    }

    // Remove the event from the event list
    const eventListPath = path.join(__dirname, '../Resources/eventList.txt');
    let eventName = null;
    try {
        // Read all events
        const events = fs.readFileSync(eventListPath, 'utf-8').split('\n').filter(line => line.trim() !== '');
        // Find the event line and its name
        const eventIndex = events.findIndex(line => line.endsWith(`,${id}`));
        if (eventIndex === -1) {
            return res.status(404).send('Event not found');
        }
        const eventParts = events[eventIndex].split(',');
        eventName = eventParts[3].trim(); // Assuming event name is the 4th field (index 3)
        // Remove the event
        events.splice(eventIndex, 1);
        fs.writeFileSync(eventListPath, events.join('\n'));
    } catch (error) {
        console.error('Error removing event:', error);
        return res.status(500).send('Internal server error');
    }

    // Remove all opt-in requests for this event
    try {
        const optInData = readOptInFile();
        let changed = false;
        for (const userId in optInData) {
            const before = optInData[userId].length;
            // Trim both event.name and eventName for comparison
            optInData[userId] = optInData[userId].filter(event => event.name.trim() !== eventName.trim());
            if (optInData[userId].length !== before) changed = true;
        }
        if (changed) {
            fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
        }
    } catch (error) {
        console.error('Error cleaning up opt-in requests:', error);
        // Don't fail the whole request if this part fails
    }

    res.send('Event and related opt-in requests removed successfully');
});

app.post('/opt-in-again', (req, res) => {
    const userId = `${req.cookies.loggedInUser || ''} ${req.cookies.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    const { eventName } = req.body;
    if (!eventName) {
        return res.status(400).send('Missing eventName');
    }

    try {
        const optInData = readOptInFile();
        if (!optInData[userId]) {
            optInData[userId] = [];
        }
        let event = optInData[userId].find(event => event.name.trim() === eventName.trim());
        if (event) {
            event.status = 'requested';
        } else {
            optInData[userId].push({ name: eventName, status: 'requested' });
        }
        fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
        res.send('Opt-in status set to requested');
    } catch (error) {
        console.error('Error updating opt-in status to requested:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/approve-opt-out', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');

    try {
        const [username, eventName] = Buffer.from(token, 'base64').toString().split('|');
        if (!username || !eventName) return res.status(400).send('Invalid token');

        const optInData = readOptInFile();
        if (optInData[username]) {
            const event = optInData[username].find(event => event.name.trim() === eventName.trim());
            if (event) {
                event.status = 'opted_out';
                fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
                return res.send(`<h2>Success!</h2><p>${username} has been opted out of <b>${eventName}</b>.</p>`);
            }
        }
        res.status(404).send('Opt-in request not found');
    } catch (err) {
        res.status(400).send('Invalid token');
    }
});

// Start the server
app.listen(6421, () => {
    console.log('Server is running on port 6421');
});