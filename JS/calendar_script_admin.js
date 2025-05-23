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

calendarDates.addEventListener('click', (event) => {
    if (datesContent.style.display === 'block') {
        return;
    }

    const selectedDate = event.target.dataset.day;
    if (selectedDate != null) {
        event.stopPropagation(); // Prevent the click event from bubbling up to the document

        const date = new Date(selectedDate);
        const [year, month, day] = selectedDate.split('-').map(Number);

        console.log("date clicked was " + date);
        const dateContent = document.getElementById('dates-content');

        const dayOfWeek = new Date(year, month - 1, day).toLocaleString('default', { weekday: 'long' });
        datesContent.innerHTML = `
            <div class="popup-header" style="display: grid; grid-template-columns: 1fr auto; align-items: center; position: relative; border-radius: 5px;">
            <h1 style="font-size: 1.3em; font-family: monospace; text-align: center; grid-column: 1 / -1;">${dayOfWeek}, ${months[month - 1]} ${day}</h1>
            <button class="close-popup-btn" style="position: absolute; right: 0; top: 0; ${buttonStyle}">&times;</button>
            </div>
        `;

        // Add event listener to close button
        const closePopupBtn = datesContent.querySelector('.close-popup-btn');
        closePopupBtn.addEventListener('click', () => {
            datesContent.style.display = 'none';
        });

        dateContent.style.display = 'block';

        const rect = event.target.getBoundingClientRect();

        dateContent.style.top = rect.top + 'px';
        dateContent.style.left = rect.left + 'px';

        // Adjust the size of the popup
        dateContent.style.width = '300px';
        dateContent.style.height = '125px';
        dateContent.style.padding = '10px';
        dateContent.style.boxSizing = 'border-box';

        // Create a button for redirecting to AdminEventBooking.html
        const redirectButton = document.createElement('button');
        redirectButton.id = 'redirect-button';
        redirectButton.textContent = 'Book Event';
        redirectButton.style.backgroundColor = 'green'; // Green background
        redirectButton.style.color = '#fff'; // Optional: white text for contrast
        redirectButton.style.fontSize = '12px'; // Make the button smaller
        redirectButton.style.marginTop = '10px';
        dateContent.style.textAlign = 'center'; // Center the button

        redirectButton.addEventListener('click', () => {
            window.location.href = `AdminEventBooking.html?date=${encodeURIComponent(selectedDate)}`;
        });

        // Append the button to the popup
        datesContent.appendChild(redirectButton);
    }
});

document.addEventListener('click', (event) => {
    if (datesContent.contains(event.target)) {
        return;
    }
    datesContent.style.display = 'none';
});




