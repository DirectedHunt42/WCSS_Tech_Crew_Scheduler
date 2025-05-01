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
    deleteCookie('loggedInAdmin'); // Delete the loggedInAdmin cookie
    window.location.href = '/UserPage/UserPage.html'; // Redirect to the main page
}

// Function to check if the user is logged in
function checkLoggedInUser(redirectToLogin = true) {
    const loggedInUser = getCookie('loggedInUser');
    const loggedInAdmin = getCookie('loggedInAdmin');

    if (!loggedInUser && !loggedInAdmin) {
        if (redirectToLogin) {
            // Prevent redirection on the admin login page
            if (window.location.pathname === "/AdminPage/AdminLogInPage.html") {
                console.log("No admin is logged in, staying on the admin login page.");
                return;
            }
            // Redirect to the regular login page for other pages
            window.location.href = "/LoginPage/LogInPage.html";
        } else {
            console.log("No user or admin is logged in.");
        }
    } else {
        // Ensure users cannot access admin pages and vice versa
        if (loggedInUser && window.location.pathname.startsWith("/AdminPage")) {
            console.log("User cannot access admin pages. Redirecting...");
            window.location.href = "/LoginPage/LogInPage.html";
        } else if (loggedInAdmin && !window.location.pathname.startsWith("/AdminPage")) {
            console.log("Admin cannot access user pages. Redirecting...");
            window.location.href = "/AdminPage/AdminPage.html";
        } else {
            console.log(`Logged in as: ${loggedInUser || loggedInAdmin}`);
            return loggedInUser || loggedInAdmin;
        }
    }
}

// Function to bypass login if the user or admin is already logged in
function bypassLoginIfLoggedIn() {
    const loggedInUser = getCookie('loggedInUser');
    const loggedInAdmin = getCookie('loggedInAdmin');

    // Check if the user is on the regular login page
    if (loggedInUser && window.location.pathname === "/LoginPage/LogInPage.html") {
        // Redirect to the members page if the user is already logged in
        window.location.href = "/MemberPage/membersPage.html";
    } 
    // Check if the user is on the admin login page
    else if (loggedInAdmin && window.location.pathname === "/AdminPage/AdminLogInPage.html") {
        // Redirect to the admin dashboard if the admin is already logged in
        window.location.href = "/AdminPage/AdminPage.html";
    }
}

// Example usage: Call this function on the login page
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/LoginPage/LogInPage.html") {
        // Use this on the login page to bypass login if the user or admin is already logged in
        bypassLoginIfLoggedIn();
    } else {
        // Redirect to login page if not logged in (for other pages)
        checkLoggedInUser();
    }
});