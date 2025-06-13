import { apiBase } from './apiBase.js';

document.addEventListener("DOMContentLoaded", () => {
    // Check if the current page is a login page or admin login page
    if (window.location.pathname === "/LoginPage/LogInPage.html" || window.location.pathname === "/AdminPage/AdminLogInPage.html") {
        // On login pages, do nothing (bypass login check)
    } else {
        // On all other pages, check if the user is logged in
        checkLoggedInUser();
    }

    // Always check if the user has accepted cookies
    checkAcceptedCookies();
});

// Function to check if the user or admin is logged in
async function checkLoggedInUser(redirectToLogin = true) {
    try {
        console.log(`Checking login status at ${apiBase}/auth/status`);
        // Call the backend to check login status
        const response = await fetch(`${apiBase}/auth/status`, { credentials: 'include' });
        const data = await response.json();

        // If no user or admin is logged in and not on user or login pages, redirect to login
        if (
            !data.loggedInUser &&
            !data.loggedInAdmin &&
            !window.location.pathname.startsWith("/UserPage/") &&
            !window.location.pathname.startsWith("/LoginPage/")
        ) {
            console.log("No user or admin is logged in. Redirecting to login page...");
            if (redirectToLogin) {
                window.location.href = "/LoginPage/LogInPage.html";
            } else {
                console.log("No user or admin is logged in.");
            }
        } else {
            // If admin is logged in, do nothing
            if (data.loggedInAdmin) {
                console.log("Admin is logged in. No redirection needed.");
                return data.loggedInAdmin;
            }

            // If user is logged in but tries to access admin pages, redirect to member page
            if (data.loggedInUser && window.location.pathname.startsWith("/AdminPage")) {
                console.log("User cannot access admin pages. Redirecting to member page...");
                window.location.href = "/MemberPage/membersPage.html";
            } else {
                // User is logged in and on allowed page
                console.log(`Logged in as: ${data.loggedInUser}`);
                return data.loggedInUser;
            }
        }
    } catch (error) {
        // Handle errors in checking login status
        console.error("Error checking login status:", error);
    }
}

// Function to check if the "acceptedcookies" cookie exists, and show a popup if not
function checkAcceptedCookies() {
    const acceptedCookies = getCookie('acceptedcookies');

    if (!acceptedCookies) {
        // Detect the user's preferred color scheme (dark or light)
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Create a full-screen overlay for the cookie popup
        const overlay = document.createElement('div');
        overlay.id = 'cookie-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999'; // Ensure it appears above all other elements
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create the popup dialog
        const popup = document.createElement('div');
        popup.id = 'cookie-popup';
        popup.style.padding = '20px';
        popup.style.borderRadius = '5px';
        popup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        popup.style.textAlign = 'center';

        // Apply styles based on the user's theme
        if (isDarkMode) {
            popup.style.backgroundColor = '#333';
            popup.style.color = '#fff';
        } else {
            popup.style.backgroundColor = '#fff';
            popup.style.color = '#000';
            popup.style.border = '1px solid #ccc';
        }

        // Set the popup HTML content
        popup.innerHTML = `
            <p>We use cookies to make this site work. By using our site, you accept the use of cookies.</p>
            <button id="accept-cookies" style="margin-top: 10px; padding: 10px 20px; background-color: green; color: white; border: none; border-radius: 3px; cursor: pointer;">Accept</button>
            <button id="decline-cookies" style="margin-top: 10px; padding: 10px 20px; background-color: red; color: white; border: none; border-radius: 3px; cursor: pointer;" onclick="window.close()">Reject</button>
        `;

        // Add the popup to the overlay and the overlay to the document
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // When the user clicks "Accept", set the cookie and remove the popup
        document.getElementById('accept-cookies').addEventListener('click', () => {
            setCookie('acceptedcookies', 'true', 365); // Set the cookie for 1 year
            document.body.removeChild(overlay); // Remove the overlay and popup
        });
    }
}

// Helper function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/`;
}

// Helper function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Function to log out the user or admin
async function logout() {
    try {
        const response = await fetch(`${apiBase}/logout`, {
            method: 'POST',
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            console.log('Logout successful');
            window.location.href = '/LoginPage/LogInPage.html'; // Redirect to login page
        } else {
            console.error('Failed to log out:', await response.text());
        }
    } catch (error) {
        // Handle errors during logout
        console.error('Error during logout:', error);
    }
}

// Function to sign out a user (different endpoint than logout)
async function signOut() {
    try {
        const response = await fetch(`${apiBase}/api/signout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            alert("You have been signed out successfully.");
            window.location.href = "/UserPage/UserPage.html"; // Redirect to the login page
        } else {
            alert("Failed to sign out. Please try again.");
        }
    } catch (error) {
        // Handle errors during sign out
        console.error("Error during sign out:", error);
        alert("An error occurred. Please try again.");
    }
}