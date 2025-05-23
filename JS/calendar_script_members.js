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
const buttonStyle = "background-color: red; color: white; padding: 4px 8px; border: none; border-radius: 5px; cursor: pointer;";

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();



const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function renderCalendar(month, year) {
    calendarDates.innerHTML = ''; // Clear previous calendar
    monthYear.textContent = `${months[month]} ${year}`;

    // Get the first day of the month
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
        div.classList.add('ghost-day'); // Add a class for styling
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
            div.style.borderBottom = '1px solid lightblue';
        }

        calendarDates.appendChild(div);
    }

    // Add ghost days from the next month
    const remainingBoxes = totalBoxes - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingBoxes; i++) {
        const div = document.createElement('div');
        div.textContent = i;
        div.classList.add('ghost-day'); // Add a class for styling
        calendarDates.appendChild(div);
    }
}

// Initial render
renderCalendar(currentMonth, currentYear);

// Make current date have a light blue border
const currentDateDiv = document.querySelector(`[data-day="${currentYear}-${currentMonth + 1}-${currentDate.getDate()}"]`);
console.log(currentDateDiv);
if (currentDateDiv) {
    currentDateDiv.style.borderBottom = '1px solid lightblue';
}

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

monthYearSelect.addEventListener('click', (event) => {
    const selectedMonth = event.target.dataset.month;
    if (selectedMonth) {
        currentMonth = parseInt(selectedMonth);
        dropdownContent.style.display = 'none';
        renderCalendar(currentMonth, currentYear);
    }
});

dropbtn.addEventListener('click', () => {
    const isVisible = dropdownContent.style.display === 'block';
    dropdownContent.style.display = isVisible ? 'none' : 'block';
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown')) {
        dropdownContent.style.display = 'none';
    }
});

// Helper to get user's opt-in status for all events
async function fetchOptInStatus() {
    try {
        const response = await fetch('http://127.0.0.1:6421/opt-in-status', {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('Error fetching opt-in status:', e);
    }
    return [];
}

// Handles opt-in, cancel, and opt-in again
async function toggleOptIn(eventName, button) {
    const isCanceling = button.textContent === 'Cancel Request';
    const isOptInAgain = button.textContent === 'Opt-in Again';
    let endpoint = '/opt-in';
    let successMsg = 'Opt-in request sent successfully!';
    let failMsg = 'Failed to send opt-in request: ';
    let nextLabel = 'Cancel Request';
    let revertLabel = 'Opt In';

    if (isCanceling) {
        endpoint = '/cancel-opt-in';
        successMsg = 'Opt-in request canceled successfully!';
        failMsg = 'Failed to cancel opt-in request: ';
        nextLabel = 'Opt In';
        revertLabel = 'Cancel Request';
    } else if (isOptInAgain) {
        endpoint = '/opt-in-again';
        successMsg = 'Opt-in request submitted again!';
        failMsg = 'Failed to opt-in again: ';
        nextLabel = 'Cancel Request';
        revertLabel = 'Opt-in Again';
    }

    try {
        const response = await fetch(`http://127.0.0.1:6421${endpoint}`, {
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

calendarDates.addEventListener('click', async (event) => {
    const selectedDate = event.target.dataset.day;
    if (!selectedDate) return;

    const [year, month, day] = selectedDate.split('-').map(Number);

    // Fetch and parse the event list
    const response = await fetch('/Resources/eventList.txt');
    const text = await response.text();
    const events = text.split('\n').map(line => line.split(','));

    // Filter events for the selected date
    const matchingEvents = events.filter(event =>
        parseInt(event[0]) === year &&
        parseInt(event[1]) === month &&
        parseInt(event[2]) === day
    );

    // Fetch user's opt-in status
    const userOptInStatus = await fetchOptInStatus();

    // Create and display the popup
    const dayOfWeek = new Date(year, month - 1, day).toLocaleString('default', { weekday: 'long' });
    if (matchingEvents.length > 0) {
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative; border-radius: 5px;">
                <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1; margin: 0;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
                <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            </div>
            <div class="popup-events-list" style="max-height: 300px; overflow-y: auto; width: 100%; box-sizing: border-box;">
                ${matchingEvents.map(event => {
                    const eventName = event[3];
                    const userEvent = userOptInStatus.find(e => e.name.trim() === eventName.trim());
                    let buttonLabel = 'Opt In';
                    let disabled = '';
                    if (userEvent) {
                        if (userEvent.status === 'requested') buttonLabel = 'Cancel Request';
                        else if (userEvent.status === 'denied') buttonLabel = 'Opt-in Again';
                        else if (userEvent.status === 'approved') {
                            buttonLabel = 'Opted In';
                            disabled = 'disabled';
                        }
                    }
                    return `
                        <div style="border-bottom: 1px solid #333; padding: 8px 0; overflow: hidden;">
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word; font-size: large; font-weight: bold;"><strong></strong> ${event[3]}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word;"><strong>Start Time:</strong> ${event[4]}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word;"><strong>End Time:</strong> ${event[5]}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word;"><strong>Location:</strong> ${event[6]}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word;"><strong>Tech Required:</strong> ${event[7]}</p>
                            <p style="margin: 0; overflow-wrap: anywhere; word-break: break-word;"><strong>Volunteer Hours:</strong> ${event[8]}</p>
                            <button class="opt-in-btn" data-event-name="${eventName}" ${disabled} style="${buttonStyle}; margin-top: 5px;">${buttonLabel}</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Add event listeners to the buttons
        const optInButtons = datesContent.querySelectorAll('.opt-in-btn');
        optInButtons.forEach((button, idx) => {
            const eventName = button.getAttribute('data-event-name');
            button.addEventListener('click', async () => {
                await toggleOptIn(eventName, button);
            });
        });

        // Add event listener to close button
        const closePopupBtn = datesContent.querySelector('.close-popup-btn');
        closePopupBtn.addEventListener('click', () => {
            datesContent.style.display = 'none';
        });
    } else {
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative;">
                <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
                <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            </div>
            <p>No events for this date.</p>
        `;
        const closePopupBtn = datesContent.querySelector('.close-popup-btn');
        closePopupBtn.addEventListener('click', () => {
            datesContent.style.display = 'none';
        });
    }

    // Style the popup for fixed width and scrolling
    datesContent.style.display = 'block';
    datesContent.style.width = '300px';
    datesContent.style.maxHeight = '300px';
    datesContent.style.overflow = 'hidden';
    datesContent.style.background = '#222';
    datesContent.style.color = '#fff';
    datesContent.style.borderRadius = '8px';
    datesContent.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
    datesContent.style.padding = '16px';
    datesContent.style.position = 'absolute';

    const rect = event.target.getBoundingClientRect();
    const popupWidth = datesContent.offsetWidth;
    const popupHeight = datesContent.offsetHeight;

    // Determine column and row indices
    const columnIndex = Array.from(calendarDates.children).indexOf(event.target) % 7;
    const rowIndex = Math.floor(Array.from(calendarDates.children).indexOf(event.target) / 7);

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

// Close the popup when clicking outside
document.addEventListener('click', (event) => {
    if (!datesContent.contains(event.target) && !event.target.dataset.day) {
        datesContent.style.display = 'none';
    }
});

