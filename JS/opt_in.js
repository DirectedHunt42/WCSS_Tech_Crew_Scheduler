// Import importd modules
const express = import('express');
const cors = import('cors');
const bodyParser = import('body-parser');
const cookieParser = import('cookie-parser');
const fs = import('fs');
const path = import('path');
const fetch = import('node-fetch'); // For making HTTP requests

const app = express();

// Enable CORS with specific settings
app.use(cors({
    origin: [
        'http://10.191.28.44:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies and cookies
app.use(bodyParser.json());
app.use(cookieParser());

// Path to the opt-in requests JSON file
const optInFile = path.join(__dirname, '../Resources/optInRequests.json');

// Function to safely read and parse the opt-in JSON file
function readOptInFile() {
    try {
        const fileContent = fs.readFileSync(optInFile, 'utf-8');
        return fileContent ? JSON.parse(fileContent) : {};
    } catch (error) {
        log('Error reading opt-in file:', error);
        return 503;
    }
}

// Ensure the opt-in file exists, create if not
if (!fs.existsSync(optInFile)) {
    try {
        fs.writeFileSync(optInFile, JSON.stringify({}));
    } catch (error) {
        log('Error creating opt-in file:', error);
    }
}

// Endpoint: User submits an opt-in request for an event
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

        // Only add if not already opted in
        const existingOptIn = optInData[userId].find(event => event.name.trim() === eventName.trim());
        if (!existingOptIn) {
            optInData[userId].push({ name: eventName, status: 'requested' });
        }

        fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
        res.send('Opt-in request saved successfully');
    } catch (error) {
        log('Error writing to opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint: Get opt-in state for the logged-in user
app.get('/opt-in-state', (req, res) => {
    const userId = `${req.cookies.loggedInUser || ''} ${req.cookies.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    try {
        const optInData = readOptInFile();
        res.json(optInData[userId] || []);
    } catch (error) {
        log('Error reading opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint: Get opt-in status for the logged-in user (duplicate of above)
app.get('/opt-in-status', (req, res) => {
    const userId = `${req.cookies.loggedInUser || ''} ${req.cookies.loggedInAdmin || ''}`.trim();
    if (!userId) {
        return res.status(401).send('User is not logged in');
    }

    try {
        const optInData = readOptInFile();
        res.json(optInData[userId] || []);
    } catch (error) {
        log('Error reading opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint: Admin approves a user's opt-in request
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

// Endpoint: User cancels their opt-in request for an event
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

// Endpoint: Admin fetches all opt-in requests
app.get('/admin/opt-in-requests', (req, res) => {
    try {
        const optInData = readOptInFile();
        res.json(optInData);
    } catch (error) {
        log('Error reading opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint: Admin approves, denies, or removes an opt-in request
app.post('/admin/update-opt-in', async (req, res) => {
    const { userId, eventName, action } = req.body;
    if (!userId || !eventName || !action) {
        return res.status(400).send('Missing userId, eventName, or action');
    }

    try {
        const optInData = readOptInFile();
        if (optInData === 503) {
            return res.status(503).send('Service unavailable, please try again later');
        }

        if (optInData[userId]) {
            const event = optInData[userId].find(event => event.name === eventName);
            if (event || action === 'remove') {
                if (action === 'approve') {
                    try {
                        // Fetch user email from another service
                        const userEmailRes = await fetch('http://localhost:5500/get-user-email?userId=' + encodeURIComponent(userId));
                        const userEmailData = await userEmailRes.json();
                        const userEmail = userEmailData.email;
                        if (!userEmail) {
                            log('User email not found for userId:', userId);
                            return res.status(404).send('User email not found');
                        }
                        log('userId:', userId);
                        log('eventName:', eventName);
                        log('userEmail:', userEmail);
                        event.status = 'approved';
                        log(`Approving opt-in for user: ${userId}, event: ${eventName}`);
                        log('userEmail:', userEmail);
                        // Send approval email
                        const emailRes = await fetch('http://localhost:6421/send-opt-in-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: userEmail,
                                username: userId,
                                event: eventName,
                                approved: true
                            })
                        });
                        const emailText = await emailRes.text();
                        log('Email sender response:', emailRes.status, emailText);
                        if (!emailRes.ok) {
                            return res.status(503).send('Email sender error: ' + emailText);
                        }
                    } catch (emailError) {
                        log('Error sending approval email:', emailError);
                        return res.status(512).send('Error sending approval email');
                    }
                } else if (action === 'deny') {
                    try {
                        // Fetch user email from another service
                        const userEmailRes = await fetch('http://localhost:5500/get-user-email?userId=' + encodeURIComponent(userId));
                        const userEmailData = await userEmailRes.json();
                        const userEmail = userEmailData.email;
                        if (!userEmail) {
                            log('User email not found for userId:', userId);
                            return res.status(404).send('User email not found');
                        }
                        log('userId:', userId);
                        log('eventName:', eventName);
                        log('userEmail:', userEmail);
                        // Remove the denied event
                        optInData[userId] = optInData[userId].filter(e => e.name !== eventName);
                        log(`Opt-in request for ${eventName} denied for user ${userId}`);
                        // Send denial email
                        const emailRes = await fetch('http://localhost:6421/send-opt-in-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: userEmail,
                                username: userId,
                                event: eventName,
                                approved: false
                            })
                        });
                        const emailText = await emailRes.text();
                        log('Email sender response:', emailRes.status, emailText);
                        if (!emailRes.ok) {
                            return res.status(503).send('Email sender error: ' + emailText);
                        }
                    } catch (emailError) {
                        log('Error sending denial email:', emailError);
                        return res.status(512).send('Error sending denial email');
                    }
                } else if (action === 'remove') {
                    // Remove the opt-in request for this event
                    optInData[userId] = optInData[userId].filter(e => e.name !== eventName);
                    log(`Opt-in request for ${eventName} removed for user ${userId}`);
                    fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
                    return res.status(200).send('Opt-in removed successfully');
                }
                fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
                return res.status(200).send(`Opt-in ${event && event.status ? event.status : action} successfully`);
            }
        }

        res.status(404).send('Opt-in request not found');
    } catch (error) {
        log('Error updating opt-in file:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint: Remove an event and all related opt-in requests
app.post('/remove_event', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).send('Missing event id');
    }

    // Remove the event from the event list file
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
        log('Error removing event:', error);
        return res.status(500).send('Internal server error');
    }

    // Remove all opt-in requests for this event
    try {
        const optInData = readOptInFile();
        let changed = false;
        for (const userId in optInData) {
            const before = optInData[userId].length;
            optInData[userId] = optInData[userId].filter(event => event.name.trim() !== eventName.trim());
            if (optInData[userId].length !== before) changed = true;
        }
        if (changed) {
            fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
        }
    } catch (error) {
        log('Error cleaning up opt-in requests:', error);
        // Don't fail the whole request if this part fails
    }

    res.send('Event and related opt-in requests removed successfully');
});

// Endpoint: User opts in again for an event (sets status back to requested)
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
        log('Error updating opt-in status to requested:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint: Approve opt-out via a token (used for email links)
app.get('/approve-opt-out', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');

    try {
        // Decode token to get username and event name
        const [username, eventName] = Buffer.from(token, 'base64').toString().split('|');
        if (!username || !eventName) return res.status(400).send('Invalid token');

        const optInData = readOptInFile();
        if (optInData[username]) {
            const event = optInData[username].find(event => event.name.trim() === eventName.trim());
            if (event) {
                event.status = 'opted_out';
                fs.writeFileSync(optInFile, JSON.stringify(optInData, null, 2));
                // Return a confirmation HTML page
                return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Opt-Out Approved</title>
                    <link rel="stylesheet" href="/CSS/DarkStyle.css">
                    <link rel="icon" type="image/x-icon" href="/FavIcon.ico">
                    <style>
                        body {
                            background: #181818;
                            color: #fff;
                            font-family: Arial, sans-serif;
                            min-height: 100vh;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .center-box {
                            background: #232323;
                            padding: 40px 60px;
                            border-radius: 14px;
                            box-shadow: 0 2px 16px #0008;
                            text-align: center;
                        }
                        .center-box h2 {
                            margin-top: 0;
                            color: #90caf9;
                        }
                        .center-box b {
                            color: #fff59d;
                        }
                        .center-box a {
                            color: #90caf9;
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="center-box">
                        <h2>Opt-Out Approved</h2>
                        <p><b>${username}</b> has been opted out of <b>${eventName}</b>.</p>
                        <p><a href="/MemberPage/MembersEventList.html">Return to your events page</a></p>
                    </div>
                </body>
                </html>
                `);
            }
        }
        res.status(404).send('Opt-in request not found');
    } catch (err) {
        res.status(400).send('Invalid token');
    }
});

// Endpoint: Clear all opt-in requests (admin)
app.post('/clear-opt-in-requests', (req, res) => {
    try {
        fs.writeFileSync(optInFile, JSON.stringify({}, null, 2));
        res.send('All opt-in requests cleared successfully');
    } catch (error) {
        log('Error clearing opt-in requests:', error);
        res.status(500).send('Internal server error');
    }
});

// Simple in-memory log buffer for debugging
const logBuffer = [];
function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logBuffer.push(line);
    if (logBuffer.length > 200) logBuffer.shift();
    console.log(line);
}

// Endpoint: Get server logs
app.get('/log', (req, res) => {
    res.type('text/plain').send(logBuffer.join('\n'));
});

// Start the server on port 6421
app.listen(6421, '0.0.0.0', () => {
    log('Server is running on port 6421');
});