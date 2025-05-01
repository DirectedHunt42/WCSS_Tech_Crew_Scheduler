// Function to get a cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Function to delete a cookie
function deleteCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0`;
}

// Function to handle sign out
function signOut() {
    deleteCookie('loggedInUser'); // Delete the loggedInUser cookie
}

// Function to check if the user is logged in
function checkLoggedInUser(redirectToLogin = true) {
    const loggedInUser = getCookie('loggedInUser');
    if (!loggedInUser) {
        if (redirectToLogin) {
            // Redirect to the login page if no user is logged in
            window.location.href = "/LoginPage/LogInPage.html";
        } else {
            console.log("No user is logged in.");
        }
    } else {
        console.log(`Logged in as: ${loggedInUser}`);
        return loggedInUser;
    }
}

// Function to bypass login if the user is already logged in
function bypassLoginIfLoggedIn() {
    const loggedInUser = getCookie('loggedInUser');
    if (loggedInUser) {
        // Redirect to the members page if the user is already logged in
        if (window.location.pathname === "/LoginPage/LogInPage.html") {
            window.location.href = "/MemberPage/membersPage.html";
        }
    }
}

// Example usage: Call this function on the login page
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/LoginPage/LogInPage.html") {
        // Use this on the login page to bypass login if the user is already logged in
        bypassLoginIfLoggedIn();
    } else {
        // Redirect to login page if not logged in (for other pages)
        checkLoggedInUser();
    }
});