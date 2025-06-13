// Import importd modules
const nodemailer = import('nodemailer');
const express = import('express');
const cors = import('cors');
const app = express();

// Enable CORS for all origins and allow credentials
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json()); // Parse JSON request bodies

// Configure Nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail', // Email provider
    auth: {
        user: 'wcsstechcrew@gmail.com', // Sender email
        pass: 'iaqkmfajivdmzflb'        // App password
    }
});

// Endpoint to send password reset email
app.post('/send-reset-email', (req, res) => {
    const { email, username, resetCode } = req.body; // Extract data from request
    log(`Password reset email requested for: ${email}, Username: ${username}, Code: ${resetCode}`);

    // Email options for password reset
    const mailOptions = {
        from: 'wcsstechcrew@gmail.com',
        to: email,
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

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

// Endpoint to send event update email (approved/rejected)
app.post('/send-update-email', (req, res) => {
    const {email, name, accepted} = req.body; // Extract data from request
    log(`Update email requested for: ${email}, Name: ${name}, Accepted: ${accepted}`);

    const mailOptions = {};

    if (accepted === true) {
        // Email for approved event
        mailOptions.from = 'wcsstechcrew@gmail.com';
        mailOptions.to = email;
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
        // Email for rejected event
        mailOptions.from = 'wcsstechcrew@gmail.com';
        mailOptions.to = email;
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
        // Invalid request data
        return res.status(400).send('Invalid request data');
    }

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

// Endpoint to send opt-in approval/denial email
app.post('/send-opt-in-email', (req, res) => {
    const {email, username, event, approved} = req.body; // Extract data from request
    log(`Opt-in email requested for: ${email}, Username: ${username}, Approved: ${approved}`);
    const mailOptions = {};
    if (approved === true) {
        // Email for approved opt-in
        mailOptions.from = 'wcsstechcrew@gmail.com';
        mailOptions.to = email;
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
        // Email for denied opt-in
        mailOptions.from = 'wcsstechcrew@gmail.com';
        mailOptions.to = email;
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
        // Invalid request data
        return res.status(400).send('Invalid request data');
    }

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

// Endpoint to send opt-out request email to admin
app.post('/opt-out-request', (req, res) => {
    const { username, eventName, userEmail } = req.body;
    if (!username || !eventName || !userEmail) {
        // Check for missing data
        return res.status(400).send('Missing data');
    }

    // Generate a token for the opt-out request (base64 encoding)
    const token = Buffer.from(`${username}:${eventName}`).toString('base64'); 

    console.log(`Opt-out request received for: ${username}, Event: ${eventName}, Email: ${userEmail}`);
    // Link for admin to approve opt-out
    const approveLink = `http://127.0.0.1:6421/approve-opt-out?token=${encodeURIComponent(token)}`;

    // Email options for admin
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

    // Send the email to admin
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Opt-out email sent to admin');
    });
});

// Root endpoint for health check
app.get("/", (req, res) => {
    res.send("Welcome to the email sender service!");
});

// Simple logging mechanism with buffer
const logBuffer = [];
function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logBuffer.push(line);
    if (logBuffer.length > 200) logBuffer.shift();
    log.log(line);
}

// Endpoint to view logs
app.get('/log', (req, res) => {
    res.type('text/plain').send(logBuffer.join('\n'));
});

// Start the server on port 6420, accessible from any network interface
app.listen(6420, '0.0.0.0', () => {
    log('Server is running on port 6420');
});