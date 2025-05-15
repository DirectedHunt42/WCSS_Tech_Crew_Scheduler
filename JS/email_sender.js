const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Email provider
    auth: {
        user: 'wcsstechcrew@gmail.com', 
        pass: 'qoxjficgrvakjiju'  
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
        text: 
        `Hi ${username},

        We received a request to reset your password for your account. Your verification code is: ${resetCode}

        If you did not request this, please ignore this email or contact support.

        Thank you,
        The Tech Crew Team`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error sending email');
        }
        res.send('Email sent successfully');
    });
});

app.get("/", (req, res) => {
    res.send("Welcome to the email sender service!");
});

// Start the server
app.listen(6420, () => {
    console.log('Server is running on port 6420');
});

