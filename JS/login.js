// Object to store valid credentials
let validCredentials = {};

// Load credentials from logInList.txt
function loadCredentials() {
    return fetch('/Resources/logInList.txt')
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

// Function to show the cookie consent popup
function showCookiePopup() {
    const popup = document.createElement("div");
    popup.id = "cookie-popup";
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = "#111";
    popup.style.border = "1px solid #ccc";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    popup.style.zIndex = "1000";

    popup.innerHTML = `
        <p>This site uses cookies. Do you accept?</p>
        <button id="accept-cookies">Accept</button>
        <button id="reject-cookies">Reject</button>
    `;

    document.body.appendChild(popup);

    document.getElementById("accept-cookies").addEventListener("click", () => {
        setCookie("cookiesAccepted", "true", 3600 * 24 * 100); // Set cookie for 100 days
        popup.remove();
    });

    document.getElementById("reject-cookies").addEventListener("click", () => {
        window.location.href = "/UserPage/UserPage.html"; // Redirect to main page
    });
}

// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");

    // Check if the user has already accepted cookies
    if (!getCookie("cookiesAccepted")) {
        showCookiePopup();
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, type: 'user' }) // 'user' for regular login
            });

            const result = await response.json();

            if (response.ok) {
                // Set a cookie or redirect on successful login
                document.cookie = `loggedInUser=${username}; path=/; max-age=3600`;
                window.location.href = "/MemberPage/membersPage.html";
            } else {
                errorMessage.textContent = result.error || "Login failed";
                errorMessage.style.display = "block";
            }
        } catch (error) {
            console.error("Error:", error);
            errorMessage.textContent = "An error occurred. Please try again.";
            errorMessage.style.display = "block";
        }
    });
});