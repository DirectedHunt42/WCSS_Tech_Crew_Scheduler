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
const buttonStyle = "padding: 4px 8px; border-radius: 5px; cursor: pointer;";


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
    if (currentDateDiv) {
        currentDateDiv.style.borderBottom = '1px solid lightblue';
    }
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
    if (currentDateDiv) {
        currentDateDiv.style.borderBottom = '1px solid lightblue';
    }
});

prevYearBtn.addEventListener('click', () => {
    currentYear--;
    renderCalendar(currentMonth, currentYear);
    if (currentDateDiv) {
        currentDateDiv.style.borderBottom = '1px solid lightblue';
    }
});

nextYearBtn.addEventListener('click', () => {
    currentYear++;
    renderCalendar(currentMonth, currentYear);
    if (currentDateDiv) {
        currentDateDiv.style.borderBottom = '1px solid lightblue';
    }
});

monthYearSelect.addEventListener('click', (event) => {
    const selectedMonth = event.target.dataset.month;
    if (selectedMonth) {
        currentMonth = parseInt(selectedMonth);
        dropdownContent.style.display = 'none';
        renderCalendar(currentMonth, currentYear);
        if (currentDateDiv) {
            currentDateDiv.style.borderBottom = '1px solid lightblue';
        }
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

calendarDates.addEventListener('click', async (event) => {
    const selectedDate = event.target.dataset.day;
    if (!selectedDate) return;

    // Parse year, month, day for both branches
    const [year, month, day] = selectedDate.split('-').map(Number);

    // Convert to backend format: YYYY,MM,DD (no leading zeros)
    const backendDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    console.log('Selected date:', backendDate);

    // Fetch events for the selected date from the new API
    const response = await fetch(`/api/events-by-date?date=${backendDate}`);
    const events = await response.json();

    // Create and display the popup
    if (events.length > 0) {
        const dayOfWeek = new Date(year, month - 1, day).toLocaleString('default', { weekday: 'long' });
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative; border-radius: 5px;">
            <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
            <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            <button class="book-event-btn" style="margin-bottom: 10px; padding: 8px; background-color: green; color: white; border: none; border-radius: 5px; cursor: pointer;" onClick="window.location.href='BookingPage.html?date=${backendDate}'">Book Event</button>
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
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Add event listener to close button
        const closePopupBtn = datesContent.querySelector('.close-popup-btn');
        closePopupBtn.addEventListener('click', () => {
            datesContent.style.display = 'none';
        });
    } else {
        const dayOfWeek = new Date(year, month - 1, day).toLocaleString('default', { weekday: 'long' });
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative; ">
            <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
            <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            <button class="book-event-btn" style="margin-bottom: 10px; padding: 8px; background-color: green; color: white; border: none; border-radius: 5px; cursor: pointer;" onClick="window.location.href='BookingPage.html?date=${backendDate}'">Book Event</button>
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

document.addEventListener('click', (event) => {
    if (datesContent.contains(event.target)) {
        return;
    }
    datesContent.style.display = 'none';
});