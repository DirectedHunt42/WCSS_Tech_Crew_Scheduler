document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/LoginPage/LogInPage.html" || window.location.pathname === "/AdminPage/AdminLogInPage.html") {
        // Use this on the login pages to bypass login if the user or admin is already logged in
    } else {
        // Redirect to login page if not logged in (for other pages)
        checkLoggedInUser();
    }

    // Check for accepted cookies
    checkAcceptedCookies();
});

// Function to check if the user is logged in
async function checkLoggedInUser(redirectToLogin = true) {
    try {
        const apiBase = window.location.origin + ":5500";
        console.log(`Checking login status at ${apiBase}/auth/status`);
        const response = await fetch(`${apiBase}/auth/status`, { credentials: 'include' });
        const data = await response.json();

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
            if (data.loggedInAdmin) {
                console.log("Admin is logged in. No redirection needed.");
                return data.loggedInAdmin;
            }

            if (data.loggedInUser && window.location.pathname.startsWith("/AdminPage")) {
                console.log("User cannot access admin pages. Redirecting to member page...");
                window.location.href = "/MemberPage/membersPage.html";
            } else {
                console.log(`Logged in as: ${data.loggedInUser}`);
                return data.loggedInUser;
            }
        }
    } catch (error) {
        console.error("Error checking login status:", error);
    }
}

// Function to check for the "acceptedcookies" cookie
function checkAcceptedCookies() {
    const acceptedCookies = getCookie('acceptedcookies');

    if (!acceptedCookies) {
        // Detect the user's preferred color scheme
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Create the overlay
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

        // Create the popup
        const popup = document.createElement('div');
        popup.id = 'cookie-popup';
        popup.style.padding = '20px';
        popup.style.borderRadius = '5px';
        popup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        popup.style.textAlign = 'center';

        // Apply styles based on the theme
        if (isDarkMode) {
            popup.style.backgroundColor = '#333';
            popup.style.color = '#fff';
        } else {
            popup.style.backgroundColor = '#fff';
            popup.style.color = '#000';
            popup.style.border = '1px solid #ccc';
        }

        popup.innerHTML = `
            <p>We use cookies to make this site work. By using our site, you accept the use of cookies.</p>
            <button id="accept-cookies" style="margin-top: 10px; padding: 10px 20px; background-color: green; color: white; border: none; border-radius: 3px; cursor: pointer;">Accept</button>
            <button id="decline-cookies" style="margin-top: 10px; padding: 10px 20px; background-color: red; color: white; border: none; border-radius: 3px; cursor: pointer;" onclick="window.close()">Reject</button>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Add event listener to the "Accept" button
        document.getElementById('accept-cookies').addEventListener('click', () => {
            setCookie('acceptedcookies', 'true', 365); // Set the cookie for 1 year
            document.body.removeChild(overlay); // Remove the overlay and popup
        });
    }
}

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/`;
}

// Function to get a cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

async function logout() {
    try {
        const apiBase = window.location.origin + ":5500";
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
        console.error('Error during logout:', error);
    }
}

async function signOut() {
    try {
        const apiBase = window.location.origin + ":5500";
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
        console.error("Error during sign out:", error);
        alert("An error occurred. Please try again.");
    }
}