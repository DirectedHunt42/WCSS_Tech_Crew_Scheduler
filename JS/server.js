const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5501;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (e.g., AdminEventBooking.html)
app.use(express.static(path.join(__dirname, '../AdminPage')));

// Endpoint to handle form submission
app.post('/save-event', (req, res) => {
    const { date, EventName, Location, Stime, Etime, people, VolHours } = req.body;

    // Format the data as a CSV line
    const eventData = `${date},${EventName},${Location},${Stime},${Etime},${people},${VolHours}\n`;

    // Path to the eventList.txt file
    const eventListPath = path.join(__dirname, '../Resources/eventList.txt');

    // Append the data to eventList.txt
    fs.appendFile(eventListPath, eventData, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return res.status(500).send('Internal Server Error');
        }
        console.log('Event saved successfully!');
        // Redirect back to the AdminPage.html
        res.redirect('/AdminPage.html');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});