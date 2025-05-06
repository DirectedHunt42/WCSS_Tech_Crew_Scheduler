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
            // Redirect to the login page if no user or admin is logged in
            window.location.href = "/LoginPage/LogInPage.html";
        } else {
            console.log("No user or admin is logged in.");
        }
    } else {
        // Allow admins to access both admin and member pages
        if (loggedInAdmin) {
            console.log("Admin is logged in. No redirection needed.");
            return loggedInAdmin;
        }

        // Redirect members trying to access admin pages
        if (loggedInUser && window.location.pathname.startsWith("/AdminPage")) {
            console.log("User cannot access admin pages. Redirecting to member page...");
            window.location.href = "/MemberPage/membersPage.html";
        } else {
            console.log(`Logged in as: ${loggedInUser}`);
            return loggedInUser;
        }
    }
}

// Function to bypass login if the user or admin is already logged in
function bypassLoginIfLoggedIn() {
    const loggedInUser = getCookie('loggedInUser');
    const loggedInAdmin = getCookie('loggedInAdmin');

    // Redirect logged-in users from the regular login page
    if (loggedInUser && window.location.pathname === "/LoginPage/LogInPage.html") {
        window.location.href = "/MemberPage/membersPage.html";
    } 
    // Redirect logged-in admins from the admin login page
    else if (loggedInAdmin && window.location.pathname === "/AdminPage/AdminLogInPage.html") {
        window.location.href = "/AdminPage/AdminPage.html";
    }

    // Allow access to the admin login page without a cookie
    else if (!loggedInAdmin && window.location.pathname === "/AdminPage/AdminLogInPage.html") {
        console.log("Accessing admin login page without a cookie.");
        // Do nothing, allow access to the page
    }

    // Allow access to the regular login page without a cookie
    else if (!loggedInUser && window.location.pathname === "/LoginPage/LogInPage.html") {
        console.log("Accessing regular login page without a cookie.");
        // Do nothing, allow access to the page
    }

    // Redirect users without cookies from other pages to the regular login page
    else if (!loggedInUser && !loggedInAdmin && window.location.pathname !== "/AdminPage/AdminLogInPage.html") {
        window.location.href = "/LoginPage/LogInPage.html";
    }
}

// Example usage: Call this function on the login page
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/LoginPage/LogInPage.html" || window.location.pathname === "/AdminPage/AdminLogInPage.html") {
        // Use this on the login pages to bypass login if the user or admin is already logged in
        bypassLoginIfLoggedIn();
    } else {
        // Redirect to login page if not logged in (for other pages)
        checkLoggedInUser();
    }
});