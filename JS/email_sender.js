const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Email provider
    auth: {
        user: 'wcsstechcrew@gmail.com',
        pass: 'iaqkmfajivdmzflb'
    }
});

// Endpoint to send email
app.post('/send-reset-email', (req, res) => {
    const { email, username, resetCode } = req.body; // Separate email, username, and code
    log(`Password reset email requested for: ${email}, Username: ${username}, Code: ${resetCode}`);

    const mailOptions = {
        from: 'wcsstechcrew@gmail.com', // Sender address
        to: email, // Recipient address
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hi ${username},</h2>
                <p>We received a request to reset your password for your account.</p>
                <p style="font-size: 18px; font-weight: bold; color:rgb(23, 161, 28);">
                    Your verification code is: <span>${resetCode}</span>
                </p>
                <p>This code is valid for <strong>10 minutes</strong>. Please enter this code in the application to proceed with resetting your password.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>Thank you,</p>
                <p style="font-weight: bold;">The Tech Crew Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">
                    Note: This is an automated message, please do not reply to this email.
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

app.post('/send-update-email', (req, res) => {
    const {email, name, accepted} = req.body; // Separate email, name, and accepted status
    log(`Update email requested for: ${email}, Name: ${name}, Accepted: ${accepted}`);

    const mailOptions = {};

    if (accepted === true) {
        mailOptions.from = 'wcsstechcrew@gmail.com'; // Sender address
        mailOptions.to = email; // Recipient address
        mailOptions.subject = 'Event Approved';
        mailOptions.html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${email},</h2>
                <p>This is an update regarding your event request <strong>${name}</strong>.</p>
                <p>We are pleased to inform you that your request has been <span style="color: green; font-weight: bold;">approved</span>.</p>
                <p>Thank you,</p>
                <p style="font-weight: bold;">The Tech Crew Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">
                    Note: This is an automated message, please do not reply to this email.
                </p>
                </div>
            </div>
        `;
    } else if (accepted === false) {
        mailOptions.from = 'wcsstechcrew@gmail.com'; // Sender address
        mailOptions.to = email; // Recipient address
        mailOptions.subject = 'Event Rejected';
        mailOptions.html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${email},</h2>
                <p>This is an update regarding your event request <strong>${name}</strong>.</p>
                <p>We regret to inform you that your request has been <span style="color: red; font-weight: bold;">rejected</span>.</p>
                <p>Thank you,</p>
                <p style="font-weight: bold;">The Tech Crew Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">
                    Note: This is an automated message, please do not reply to this email.
                </p>
                </div>
            </div>
        `;
    } else {
        return res.status(400).send('Invalid request data');
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

app.post('/send-opt-in-email', (req, res) => {
    const {email, username, event, approved} = req.body; // Separate email, username, and approved status
    log(`Opt-in email requested for: ${email}, Username: ${username}, Approved: ${approved}`);
    const mailOptions = {};
    if (approved === true) {
        mailOptions.from = 'wcsstechcrew@gmail.com'; // Sender address
        mailOptions.to = email; // Recipient address
        mailOptions.subject = 'Opt-in Approved';
        mailOptions.html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${username},</h2>
                <p>This is an update regarding your opt-in request for <strong>${event}</strong>.</p>
                <p>We are pleased to inform you that your request has been <span style="color: green; font-weight: bold;">approved</span>.</p>
                <p>Thank you,</p>
                <p style="font-weight: bold;">The Tech Crew Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">
                    Note: This is an automated message, please do not reply to this email.
                </p>
                </div>
            </div>
        `;
    } else if (approved === false) {
        mailOptions.from = 'wcsstechcrew@gmail.com'; // Sender address
        mailOptions.to = email; // Recipient address
        mailOptions.subject = 'Opt-in Denied';
        mailOptions.html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${username},</h2>
                <p>This is an update regarding your opt-in request for <strong>${event}</strong>.</p>
                <p>We regret to inform you that your request has been <span style="color: red; font-weight: bold;">denied</span>.</p>
                <p>Thank you,</p>
                <p style="font-weight: bold;">The Tech Crew Team</p>
                <hr>
                <p style="font-size: 12px; color: #888;">
                    Note: This is an automated message, please do not reply to this email.
                </p>
                </div>
            </div>
        `;
    } else {
        return res.status(400).send('Invalid request data');
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

app.get("/", (req, res) => {
    res.send("Welcome to the email sender service!");
});

const logBuffer = [];
function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logBuffer.push(line);
    if (logBuffer.length > 200) logBuffer.shift();
    console.log(line);
}

app.get('/log', (req, res) => {
    res.type('text/plain').send(logBuffer.join('\n'));
});

// Start the server
app.listen(6420, '0.0.0.0', () => {
    log('Server is running on port 6420');
});