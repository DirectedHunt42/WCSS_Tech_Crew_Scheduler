const { spawn } = require('child_process');
const path = require('path');

// Correct relative paths to the server files
const servers = [
    path.join(__dirname, 'authCheck.js'),
    path.join(__dirname, 'email_sender.js'),
    path.join(__dirname, 'opt_in.js')
];

// Start the Python server
const pythonServer = spawn('python', [path.join(__dirname, '../PY/server.py')]);

pythonServer.stdout.on('data', (data) => {
    console.log(`[server.py]: ${data}`);
});

pythonServer.stderr.on('data', (data) => {
    console.error(`[server.py ERROR]: ${data}`);
});

pythonServer.on('close', (code) => {
    console.log(`[server.py] exited with code ${code}`);
});

// Start the Node.js servers
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