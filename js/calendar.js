// === CALENDRIER ===
let isDragging = false;
document.addEventListener('mouseup', () => isDragging = false);

function renderCalendar() {
    document.getElementById('currentYear').textContent = state.year;
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';

    for (let m = 0; m < 12; m++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';
        monthDiv.innerHTML = `<h3>${MONTHS_FR[m]}</h3>`;

        const grid = document.createElement('div');
        grid.className = 'month-grid';

        DAYS_FR.forEach(d => {
            const h = document.createElement('div');
            h.className = 'day-header';
            h.textContent = d;
            grid.appendChild(h);
        });

        const firstDay = new Date(state.year, m, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(state.year, m + 1, 0).getDate();

        for (let i = 0; i < offset; i++) {
            const e = document.createElement('div');
            e.className = 'day empty';
            grid.appendChild(e);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            const key = `${state.year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const season = state.days[key];
            dayDiv.className = 'day' + (season ? ' ' + season : '');
            dayDiv.textContent = d;
            dayDiv.dataset.key = key;

            dayDiv.addEventListener('mousedown', e => { e.preventDefault(); isDragging = true; applySeason(key, dayDiv); });
            dayDiv.addEventListener('mouseenter', () => { if (isDragging) applySeason(key, dayDiv); });

            grid.appendChild(dayDiv);
        }

        monthDiv.appendChild(grid);
        container.appendChild(monthDiv);
        syncQuickFromCalendar();
    }
}

function applySeason(key, el) {
    if (state.selectedSeason === 'none') {
        delete state.days[key];
        el.className = 'day';
    } else {
        state.days[key] = state.selectedSeason;
        el.className = 'day ' + state.selectedSeason;
    }
    saveCurrent();
}
