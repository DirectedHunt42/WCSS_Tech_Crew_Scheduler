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
    const body = document.body;

    let theme;
    if (themeCookie) {
        theme = themeCookie;
        linkElement.href = theme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css';
        document.getElementById('theme-toggle').checked = theme === 'light' ? false : true;
    } else {
        const lightModeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        theme = lightModeMediaQuery.matches ? 'light' : 'dark';
        linkElement.href = theme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css';
        setCookie('theme', theme, 30);
        document.getElementById('theme-toggle').checked = theme === 'light' ? false : true;
    }

    // Set body class for theme
    body.classList.remove('lightStyle', 'darkStyle');
    body.classList.add(theme === 'light' ? 'lightStyle' : 'darkStyle');
}

// Function to toggle between dark and light themes and update the cookie
function toggleTheme() {
    const linkElement = document.querySelector('link[rel="stylesheet"]');
    const body = document.body;
    const currentTheme = linkElement.href.includes('DarkStyle.css') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    linkElement.href = newTheme === 'light' ? '/CSS/LightStyle.css' : '/CSS/DarkStyle.css';
    setCookie('theme', newTheme, 30);

    // Set body class for theme
    body.classList.remove('lightStyle', 'darkStyle');
    body.classList.add(newTheme === 'light' ? 'lightStyle' : 'darkStyle');
}

// Add event listener to the toggle switch
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); // Apply the theme on page load
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', toggleTheme);
});