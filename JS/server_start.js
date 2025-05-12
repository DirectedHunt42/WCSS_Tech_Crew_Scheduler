const { spawn } = require('child_process');
const path = require('path');

// Correct relative paths to the server files
const servers = [
    path.join(__dirname, 'authCheck.js'),
    path.join(__dirname, 'email_sender.js'),
    path.join(__dirname, 'opt_in.js')
];

servers.forEach((server) => {
    const process = spawn('node', [server]);

    process.stdout.on('data', (data) => {
        console.log(`[${server}]: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`[${server} ERROR]: ${data}`);
    });

    process.on('close', (code) => {
        console.log(`[${server}] exited with code ${code}`);
    });
});