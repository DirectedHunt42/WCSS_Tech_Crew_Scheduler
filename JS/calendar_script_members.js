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
        div.dataset.day = currentYear + '-' + (currentMonth + 1) + '-' + i;
        div.textContent = i;
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


calendarDates.addEventListener('click', async (event) => {
    const selectedDate = event.target.dataset.day;
    if (!selectedDate) return;

    const [year, month, day] = selectedDate.split('-').map(Number);

    // Fetch and parse the event list
    const response = await fetch('eventList.txt');
    const text = await response.text();
    const events = text.split('\n').map(line => line.split(','));

    // Filter events for the selected date
    const matchingEvents = events.filter(event => 
        parseInt(event[0]) === year &&
        parseInt(event[1]) === month &&
        parseInt(event[2]) === day
    );

    // Create and display the popup
    if (matchingEvents.length > 0) {
        datesContent.innerHTML = matchingEvents.map(event => `
            <p>Event Name: ${event[3]}</p>
            <p>Start Time: ${event[4]}</p>
            <p>End Time: ${event[5]}</p>
            <p>Location: ${event[6]}</p>
            <p>Tech Required: ${event[7]}</p>
            <p>Volunteer Hours: ${event[8]}</p>
            <button class="opt-in-btn">Opt In</button>
        `).join('');

        // Add event listeners to the buttons
        const optInButtons = datesContent.querySelectorAll('.opt-in-btn');
        optInButtons.forEach(button => {
            button.addEventListener('click', () => {
            alert('Opt in request sent');
            button.disabled = true; // Disable the button
            button.textContent = 'Request Sent'; // Update button text
            });
        });
    } else {
        datesContent.innerHTML = '<p>No events for this date.</p>';
    }
    datesContent.style.display = 'block';

    const rect = event.target.getBoundingClientRect();
    datesContent.style.top = `${rect.bottom + window.scrollY}px`;
    datesContent.style.left = `${rect.left + window.scrollX}px`;
});

// Close the popup when clicking outside
document.addEventListener('click', (event) => {
    if (!datesContent.contains(event.target) && !event.target.dataset.day) {
        datesContent.style.display = 'none';
    }
});

