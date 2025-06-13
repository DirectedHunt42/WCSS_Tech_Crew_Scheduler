const { spawn } = require('child_process');
const path = require('path');

// Correct relative paths to the server files
const servers = [
    path.join(__dirname, 'authCheck.js'),
    path.join(__dirname, 'email_sender.js'),
    path.join(__dirname, 'opt_in.js')
];

// Start the Python server in unbuffered mode (-u)
const pythonServer = spawn('python3', ['-u', path.join(__dirname, '../PY/server.py')]);

pythonServer.stdout.on('data', (data) => {
    process.stdout.write(`[server.py]: ${data.toString()}`);
});

pythonServer.stderr.on('data', (data) => {
    process.stderr.write(`[server.py ERROR]: ${data.toString()}`);
});

pythonServer.on('close', (code) => {
    console.log(`[server.py] exited with code ${code}`);
});

pythonServer.on('error', (error) => {
    console.error(`[server.py ERROR]: ${error}`);
});

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
