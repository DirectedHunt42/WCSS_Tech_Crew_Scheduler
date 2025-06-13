const { spawn } = require('child_process');
const path = require('path');

// Correct relative paths to the server files
const servers = [
    path.join(__dirname, 'authCheck.js'),
    path.join(__dirname, 'email_sender.js'),
    path.join(__dirname, 'opt_in.js')
];

// Start the Node.js servers
servers.forEach((server) => {
    const process = spawn('node', [server]);

    process.stdout.on('data', (data) => {
        process.stdout.write(`[${server}]: ${data.toString()}`);
    });

    process.stderr.on('data', (data) => {
        process.stderr.write(`[${server} ERROR]: ${data.toString()}`);
    });

    process.on('close', (code) => {
        console.log(`[${server}] exited with code ${code}`);
    });
});
