const { spawn } = require('child_process');
const path = require('path');

// Define the paths to the Node.js server files
const servers = [
    path.join(__dirname, 'authCheck.js'),
    path.join(__dirname, 'email_sender.js'),
    path.join(__dirname, 'opt_in.js')
];

// Start the Python server in unbuffered mode (-u)
const pythonServer = spawn('python3', ['-u', path.join(__dirname, '../PY/server.py')]);

// Listen for standard output from the Python server and print it
pythonServer.stdout.on('data', (data) => {
    process.stdout.write(`[server.py]: ${data.toString()}`);
});

// Listen for error output from the Python server and print it
pythonServer.stderr.on('data', (data) => {
    process.stderr.write(`[server.py ERROR]: ${data.toString()}`);
});

// Log when the Python server process exits
pythonServer.on('close', (code) => {
    console.log(`[server.py] exited with code ${code}`);
});

// Log if there is an error starting the Python server
pythonServer.on('error', (error) => {
    console.error(`[server.py ERROR]: ${error}`);
});

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
