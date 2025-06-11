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
    console.log(`Password reset email requested for: ${email}, Username: ${username}, Code: ${resetCode}`);

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
    console.log(`Update email requested for: ${email}, Name: ${name}, Accepted: ${accepted}`);

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
            console.error(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

app.post('/opt-out-request', (req, res) => {
    const { username, eventName, userEmail } = req.body;
    if (!username || !eventName || !userEmail) {
        return res.status(400).send('Missing data');
    }

    // Generate a unique token (for demo, use a simple base64, but use a secure random string in production)
    const token = Buffer.from(`${username}|${eventName}|${Date.now()}`).toString('base64');
    // Store the token and request info somewhere persistent (e.g., a file or DB) for real security

    // The link the admin will click
    const approveLink = `http://127.0.0.1:6421/approve-opt-out?token=${encodeURIComponent(token)}`;

    const mailOptions = {
        from: 'wcsstechcrew@gmail.com',
        to: 'jbour10@ocdsb.ca',  // change to real admin email 
        subject: `Opt-Out Request: ${username} for ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Opt-Out Request</h2>
                <p><b>User:</b> ${username} (${userEmail})</p>
                <p><b>Event:</b> ${eventName}</p>
                <p>
                    <a href="${approveLink}" style="display:inline-block;padding:10px 18px;background:#1976d2;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                        Click here to approve opt-out
                    </a>
                </p>
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
        res.send('Opt-out email sent to admin');
    });
});

app.get("/", (req, res) => {
    res.send("Welcome to the email sender service!");
});

// Start the server
app.listen(6420, () => {
    console.log('Server is running on port 6420');
});