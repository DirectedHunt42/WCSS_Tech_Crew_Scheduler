import { apiBase2 } from './apiBase.js';
import { apiBase } from './apiBase.js';

const calendarDates = document.querySelector('.calendar-dates');
const monthYear = document.getElementById('month-year');

const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const prevYearBtn = document.getElementById('prev-year');
const nextYearBtn = document.getElementById('next-year');

const monthYearSelect = document.getElementById('month-year-select');
// const calendarDates =document.getElementById('calendar-dates');

const dropdownContent = document.querySelector('.dropdown-content');
const dropbtn = document.querySelector('.dropbtn');

const datesContent = document.querySelector('.dates-content');
const buttonStyle = "background-color: #444; color: white; padding: 4px 8px; border: none; border-radius: 5px; cursor: pointer;";

// Initialize current date, month, and year
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Month names for display
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Check if the current theme is light mode
function isLightMode() {
    return getCookie('theme') === 'light';
}

// Render the calendar for a given month and year
function renderCalendar(month, year) {
    calendarDates.innerHTML = ''; // Clear previous calendar
    monthYear.textContent = `${months[month]} ${year}`;

    // Get the first day of the month (0=Sunday)
    const firstDay = new Date(year, month, 1).getDay();

    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get the last day of the previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Total boxes in the calendar grid (7 columns x 6 rows)
    const totalBoxes = 42;

    // Add ghost days from the previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const div = document.createElement('div');
        div.textContent = day;
        div.classList.add('ghost-day');
        calendarDates.appendChild(div);
    }

    // Add days for the current month
    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.dataset.day = `${year}-${month + 1}-${i}`;
        div.textContent = i;

        // Highlight the current date
        if (
            year === currentDate.getFullYear() &&
            month === currentDate.getMonth() &&
            i === currentDate.getDate()
        ) {
            if (isLightMode()) {
                div.style.borderBottom = '1px solid #222'; // dark underline for light mode
            } else {
                div.style.borderBottom = '1px solid #fff'; // white underline for dark mode
            }
        }

        calendarDates.appendChild(div);
    }

    // Add ghost days from the next month
    const remainingBoxes = totalBoxes - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingBoxes; i++) {
        const div = document.createElement('div');
        div.textContent = i;
        div.classList.add('ghost-day');
        calendarDates.appendChild(div);
    }
}

// Initial render of the calendar
renderCalendar(currentMonth, currentYear);

// Event listeners for navigation buttons
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
});

prevYearBtn.addEventListener('click', () => {
    currentYear--;
    renderCalendar(currentMonth, currentYear);
});

nextYearBtn.addEventListener('click', () => {
    currentYear++;
    renderCalendar(currentMonth, currentYear);
});

// Handle month selection from dropdown
monthYearSelect.addEventListener('click', (event) => {
    const selectedMonth = event.target.dataset.month;
    if (selectedMonth) {
        currentMonth = parseInt(selectedMonth);
        dropdownContent.style.display = 'none';
        renderCalendar(currentMonth, currentYear);
    }
});

// Toggle dropdown visibility
dropbtn.addEventListener('click', () => {
    const isVisible = dropdownContent.style.display === 'block';
    dropdownContent.style.display = isVisible ? 'none' : 'block';
});

// Hide dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown')) {
        dropdownContent.style.display = 'none';
    }
});

// Fetch the user's opt-in status for events
async function fetchOptInStatus() {
    try {
        const response = await fetch(`${apiBase2}:6421/opt-in-status`, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Failed to fetch opt-in status');
            return [];
        }
    } catch (error) {
        console.error('Error fetching opt-in status:', error);
        return [];
    }
}

// Handle opt-in/opt-out/cancel/again actions for events
async function toggleOptIn(eventName, button) {
    let endpoint = '/opt-in';
    let successMsg = 'Opt-in request sent successfully!';
    let failMsg = 'Failed to send opt-in request: ';
    let nextLabel = 'Cancel Request';
    let revertLabel = 'Opt in';

    if (button.textContent === 'Cancel Request') {
        endpoint = '/cancel-opt-in';
        successMsg = 'Opt-in request canceled successfully!';
        failMsg = 'Failed to cancel opt-in request: ';
        nextLabel = 'Opt in';
        revertLabel = 'Cancel Request';
    } else if (button.textContent === 'Opt-in Again') {
        endpoint = '/opt-in-again';
        successMsg = 'Opt-in request submitted again!';
        failMsg = 'Failed to opt-in again: ';
        nextLabel = 'Cancel Request';
        revertLabel = 'Opt in Again';
    }

    try {
        const response = await fetch(`${apiBase2}:6421${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ eventName }),
        });

        if (response.ok) {
            button.textContent = nextLabel;
            button.disabled = false;
            alert(successMsg);
        } else {
            const errorText = await response.text();
            button.textContent = revertLabel;
            button.disabled = false;
            alert(failMsg + errorText);
        }
    } catch (error) {
        button.textContent = revertLabel;
        button.disabled = false;
        alert(failMsg + 'Please try again.');
    }
}

// Handle clicking on a calendar date
calendarDates.addEventListener('click', async (event) => {
    const selectedDate = event.target.dataset.day;
    if (!selectedDate) return;

    // Parse year, month, day for both branches
    const [year, month, day] = selectedDate.split('-').map(Number);

    // Convert to backend format: YYYY-MM-DD (with leading zeros)
    const backendDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    console.log('Selected date:', backendDate);

    // Fetch events for the selected date from the new API
    const response = await fetch(`${apiBase}/api/events-by-date?date=${backendDate}`, { credentials: 'include' });
    if (!response.ok) {
        alert('Failed to fetch events for this date.');
        return;
    }
    const events = await response.json();

    // Fetch opt-in status for the user
    const optInStatus = await fetchOptInStatus();

    // Create and display the popup with events
    if (events.length > 0) {
        const dayOfWeek = new Date(year, month - 1, day).toLocaleString('default', { weekday: 'long' });
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative; border-radius: 5px;">
            <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
            <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            </div>
            <div class="popup-events-list" style="max-height: 220px; overflow-y: auto;">
                ${events.map((event, idx) => {
                    return `
                        <div class="calendar-event-block" data-idx="${idx}">
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-size: large; font-weight: bold;"><strong></strong> ${event.name}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-weight: bold;"><strong>Start Time:</strong> ${event.startTime}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-weight: bold;"><strong>End Time:</strong> ${event.endTime}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-weight: bold;"><strong>Location:</strong> ${event.location}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-weight: bold;"><strong>Tech Required:</strong> ${event.people}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-weight: bold;"><strong>Volunteer Hours:</strong> ${event.volunteerHours}</p>
                            <button class="opt-in-btn" style="${buttonStyle}; margin-bottom: 10px; margin-top: 5px;"></button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Set up opt-in buttons for each event
        const eventBlocks = datesContent.querySelectorAll('.calendar-event-block');
        eventBlocks.forEach((block, idx) => {
            const event = events[idx];
            const button = block.querySelector('.opt-in-btn');
            const userEvent = optInStatus.find(e => e.name === event.name);

            if (userEvent) {
                if (userEvent.status === 'requested') {
                    button.textContent = 'Cancel Request';
                } else if (userEvent.status === 'approved') {
                    button.textContent = 'Opted In';
                    button.disabled = true;
                } else if (userEvent.status === 'denied') {
                    button.textContent = 'Opt-in Again';
                }
            } else {
                button.textContent = 'Opt in';
            }

            button.addEventListener('click', async () => {
                button.disabled = true;
                await toggleOptIn(event.name, button);
            });
        });

        // Add event listener to close button
        const closePopupBtn = datesContent.querySelector('.close-popup-btn');
        closePopupBtn.addEventListener('click', () => {
            datesContent.style.display = 'none';
        });
    } else {
        // If no events, show a message
        const dayOfWeek = new Date(year, month - 1, day).toLocaleString('default', { weekday: 'long' });
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative; ">
            <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
            <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            </div>
            <p>No events for this date.</p>
        `;

        // Add event listener to close button
        const closePopupBtn = datesContent.querySelector('.close-popup-btn');
        closePopupBtn.addEventListener('click', () => {
            datesContent.style.display = 'none';
        });
    }
    datesContent.style.display = 'block';

    // Style the popup for fixed width and scrolling
    datesContent.style.width = '300px';
    datesContent.style.maxHeight = '300px';
    datesContent.style.overflowY = 'auto';
    datesContent.style.borderRadius = '8px';
    datesContent.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
    datesContent.style.padding = '16px';
    datesContent.style.position = 'absolute';

    // Position the popup near the clicked date cell
    const rect = event.target.getBoundingClientRect();
    const popupWidth = datesContent.offsetWidth;
    const popupHeight = datesContent.offsetHeight;

    // Determine column and row indices in the calendar grid
    const columnIndex = Array.from(calendarDates.children).indexOf(event.target) % 7;
    const rowIndex = Math.floor(Array.from(calendarDates.children).indexOf(event.target) / 7);

    // Adjust popup position based on cell location
    if (columnIndex >= 5) {
        datesContent.style.left = `${rect.left - popupWidth + rect.width + window.scrollX}px`;
    } else {
        datesContent.style.left = `${rect.left + window.scrollX}px`;
    }

    if (rowIndex >= 2) {
        datesContent.style.top = `${rect.top - popupHeight + window.scrollY}px`;
    } else {
        datesContent.style.top = `${rect.bottom + window.scrollY}px`;
    }
});

// Close the popup when clicking outside of it or a date cell
document.addEventListener('click', (event) => {
    if (!datesContent.contains(event.target) && !event.target.dataset.day) {
        datesContent.style.display = 'none';
    }
});
