// Object to store valid credentials
let validCredentials = {};

// Load credentials from logInList.txt
function loadCredentials() {
    return fetch('/Resources/AdminLogInList.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load credentials file');
            }
            return response.text();
        })
        .then(data => {
            // Parse the file content into the validCredentials object
            const lines = data.split('\n');
            lines.forEach(line => {
                const [username, password] = line.trim().split(':');
                if (username && password) {
                    validCredentials[username] = password;
                }
            });
        })
        .catch(error => {
            console.error('Error loading credentials:', error);
        });
}

// Function to set a cookie
function setCookie(name, value, maxAgeSeconds) {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}`;
}

// Function to get a cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");

    // Load credentials before setting up the form listener
    loadCredentials().then(() => {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent form from submitting

            // Get username and password values
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            // Check if credentials are valid
            if (validCredentials[username] && validCredentials[username] === password) {
                // Set a cookie for the logged-in user (expires in 1 hour)
                setCookie('loggedInAdmin', username, 3600);

                // Redirect to a success page
                window.location.href = "/AdminPage/AdminPage.html";
            } else {
                // Show error message
                errorMessage.textContent = "Invalid username or password.";
                errorMessage.style.display = "block";
            }
        });
    });
});