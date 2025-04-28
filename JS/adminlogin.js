// Object to store valid credentials
let validCredentials = {};

// Load credentials from adminLogInList.txt
function loadCredentials() {
    return fetch('/Resources/adminLogInList.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load admin credentials file');
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
            console.error('Error loading admin credentials:', error);
        });
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
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            // Check if credentials are valid
            if (validCredentials[username] && validCredentials[username] === password) {
                // Redirect to the admin success page
                window.location.href = "/AdminPage/AdminPage.html";
            } else {
                // Show error message
                errorMessage.textContent = "Invalid username or password.";
                errorMessage.style.display = "block";
            }
        });
    }).catch(error => {
        // Handle errors during credential loading
        errorMessage.textContent = "Error loading admin credentials. Please try again later.";
        errorMessage.style.display = "block";
    });
});