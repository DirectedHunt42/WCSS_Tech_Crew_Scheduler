// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

// Function to apply the theme based on the cookie or browser preference
function applyTheme() {
    const linkElement = document.querySelector('link[rel="stylesheet"]');
    const themeCookie = getCookie('theme');

    if (themeCookie) {
        // Apply the theme from the cookie
        linkElement.href = themeCookie === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css';
        document.getElementById('theme-toggle').checked = themeCookie === 'light' ? false : true;
    } else {
        // Default to browser preference if no cookie exists
        const lightModeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const defaultTheme = lightModeMediaQuery.matches ? 'light' : 'dark';
        linkElement.href = defaultTheme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css';
        setCookie('theme', defaultTheme, 30); // Save the default theme in a cookie for 30 days
        document.getElementById('theme-toggle').checked = defaultTheme === 'light' ? false : true;
    }
}

// Function to toggle between dark and light themes and update the cookie
function toggleTheme() {
    const linkElement = document.querySelector('link[rel="stylesheet"]');
    const currentTheme = linkElement.href.includes('DarkStyle.css') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    linkElement.href = newTheme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css';
    setCookie('theme', newTheme, 30); // Update the theme cookie
}

// Add event listener to the toggle switch
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); // Apply the theme on page load
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', toggleTheme);
});