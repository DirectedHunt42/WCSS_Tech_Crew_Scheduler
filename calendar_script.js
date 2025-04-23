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
        div.dataset.day = `${year}-${month + 1}-${i}`;
        div.textContent = i;

        // Highlight the current date
        if (
            year === currentDate.getFullYear() &&
            month === currentDate.getMonth() &&
            i === currentDate.getDate()
        ) {
            div.style.borderBottom = '2px solid lightblue';
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
    currentDateDiv.style.borderBottom = '2px solid lightblue';
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
        currentDateDiv.style.borderBottom = '2px solid lightblue';
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
        currentDateDiv.style.borderBottom = '2px solid lightblue';
    }
});

prevYearBtn.addEventListener('click', () => {
    currentYear--;
    renderCalendar(currentMonth, currentYear);
    if (currentDateDiv) {
        currentDateDiv.style.borderBottom = '2px solid lightblue';
    }
});

nextYearBtn.addEventListener('click', () => {
    currentYear++;
    renderCalendar(currentMonth, currentYear);
    if (currentDateDiv) {
        currentDateDiv.style.borderBottom = '2px solid lightblue';
    }
});

monthYearSelect.addEventListener('click', (event) => {
    const selectedMonth = event.target.dataset.month;
    if (selectedMonth) {
        currentMonth = parseInt(selectedMonth);
        dropdownContent.style.display = 'none';
        renderCalendar(currentMonth, currentYear);
        if (currentDateDiv) {
            currentDateDiv.style.borderBottom = '2px solid lightblue';
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

calendarDates.addEventListener('click', (event) => {
    if (datesContent.style.display === 'block') {
        return;
    }

    const selectedDate = event.target.dataset.day;
    if (selectedDate != null) {
        event.stopPropagation(); // Prevent the click event from bubbling up to the document

        const date = new Date(selectedDate);
        console.log("date clicked was " + date);
        const dateContent = document.getElementById('dates-content');
        const thisSelectedDate = document.getElementById('current-date');
        thisSelectedDate.textContent = date.toLocaleDateString();

        dateContent.style.display = 'block';

        const rect = event.target.getBoundingClientRect();

        dateContent.style.top = rect.top + 'px';
        dateContent.style.left = rect.left + 'px';
    }
});

document.addEventListener('click', (event) => {
    if (datesContent.contains(event.target)) {
        return;
    }
    datesContent.style.display = 'none';
});




