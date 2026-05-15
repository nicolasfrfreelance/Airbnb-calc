// === NAVIGATION ===
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'summary') updateSummary();
        if (btn.dataset.tab === 'simulations') renderSimList();
        if (btn.dataset.tab === 'charges') renderCharges();
        if (btn.dataset.tab === 'loan') loadLoan();
    });
});

// === SAISON ===
document.querySelectorAll('.season-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedSeason = btn.dataset.season;
    });
});

// === ANNÉE ===
document.getElementById('prevYear').addEventListener('click', () => { state.year--; renderCalendar(); });
document.getElementById('nextYear').addEventListener('click', () => { state.year++; renderCalendar(); });

// === TOAST ===
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}
