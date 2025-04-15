const calendarDates = document.querySelector('.calendar-dates');
const monthYear = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

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