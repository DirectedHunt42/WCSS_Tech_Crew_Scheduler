const { spawn } = require('child_process');
const path = require('path');

// Define the paths to the Node.js server files
const servers = [
    path.join(__dirname, 'authCheck.js'),
    path.join(__dirname, 'email_sender.js'),
    path.join(__dirname, 'opt_in.js')
];

// Start each Node.js server file as a separate process
servers.forEach((server) => {
    const process = spawn('node', [server]);

    // Listen for standard output from the Node.js server and print it
    process.stdout.on('data', (data) => {
        process.stdout.write(`[${server}]: ${data.toString()}`);
    });

    // Listen for error output from the Node.js server and print it
    process.stderr.on('data', (data) => {
        process.stderr.write(`[${server} ERROR]: ${data.toString()}`);
    });

    // Log when the Node.js server process exits
    process.on('close', (code) => {
        console.log(`[${server}] exited with code ${code}`);
    });
});
