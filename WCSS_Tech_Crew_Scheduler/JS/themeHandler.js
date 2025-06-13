// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to set a cookie with a specified name, value, and expiration in days
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Set expiration date
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

// Function to apply the theme based on the cookie or browser preference
function applyTheme() {
    const linkElement = document.querySelector('link[rel="stylesheet"]'); // Get the stylesheet link element
    const themeCookie = getCookie('theme'); // Get the theme from cookie
    const body = document.body;

    let theme;
    if (themeCookie) {
        // If a theme cookie exists, use its value
        theme = themeCookie;
        linkElement.href = theme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css'; // Set stylesheet
        document.getElementById('theme-toggle').checked = theme === 'light' ? false : true; // Set toggle state
    } else {
        // If no cookie, use browser preference and set cookie
        const lightModeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        theme = lightModeMediaQuery.matches ? 'light' : 'dark';
        linkElement.href = theme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css'; // Set stylesheet
        setCookie('theme', theme, 30); // Save preference in cookie
        document.getElementById('theme-toggle').checked = theme === 'light' ? false : true; // Set toggle state
    }

    // Set body class for theme (for additional styling)
    body.classList.remove('lightStyle', 'darkStyle');
    body.classList.add(theme === 'light' ? 'lightStyle' : 'darkStyle');
}

// Function to toggle between dark and light themes and update the cookie
function toggleTheme() {
    const linkElement = document.querySelector('link[rel="stylesheet"]'); // Get the stylesheet link element
    const body = document.body;
    const currentTheme = linkElement.href.includes('DarkStyle.css') ? 'dark' : 'light'; // Determine current theme
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; // Toggle theme

    linkElement.href = newTheme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css'; // Update stylesheet
    setCookie('theme', newTheme, 30); // Update cookie

    // Set body class for theme (for additional styling)
    body.classList.remove('lightStyle', 'darkStyle');
    body.classList.add(newTheme === 'light' ? 'lightStyle' : 'darkStyle');
}

// Add event listener to the toggle switch after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); // Apply the theme on page load
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', toggleTheme); // Listen for toggle changes
});