// === SIMULATIONS ===
function getSims() { return JSON.parse(localStorage.getItem('airbnb_sims') || '[]'); }
function setSims(s) { localStorage.setItem('airbnb_sims', JSON.stringify(s)); }

document.getElementById('saveSim').addEventListener('click', () => {
    const name = document.getElementById('simName').value.trim();
    if (!name) { showToast('Veuillez entrer un nom'); return; }

    const sims = getSims();
    const sim = {
        id: state.currentSimId || Date.now().toString(),
        name,
        date: new Date().toISOString(),
        days: state.days,
        prices: state.prices,
        year: state.year,
        charges: state.charges,
        loan: state.loan
    };

    const idx = sims.findIndex(s => s.id === sim.id);
    if (idx >= 0) sims[idx] = sim; else sims.push(sim);

    setSims(sims);
    state.currentSimId = sim.id;
    document.getElementById('simName').value = '';
    showToast('✅ Simulation sauvegardée');
    renderSimList();
});

document.getElementById('newSim').addEventListener('click', () => {
    if (!confirm('Créer une nouvelle simulation ? Les données non sauvegardées seront perdues.')) return;
    state.days = {};
    state.currentSimId = null;
    renderCalendar();
    showToast('🆕 Nouvelle simulation');
});

function renderSimList() {
    const list = document.getElementById('simList');
    const sims = getSims();

    if (sims.length === 0) {
        list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">Aucune simulation sauvegardée</p>';
        return;
    }

    list.innerHTML = sims.map(s => {
        const total = Object.values(s.days).length;
        const date = new Date(s.date).toLocaleDateString('fr-FR');
        const isCurrent = s.id === state.currentSimId;
        return `
            <div class="sim-item ${isCurrent ? 'current' : ''}">
                <div class="sim-info">
                    <div class="sim-name">${s.name} ${isCurrent ? '⭐' : ''}</div>
                    <div class="sim-meta">Année ${s.year} • ${total} jours occupés • ${date}</div>
                </div>
                <div class="sim-buttons">
                    <button class="btn-load" onclick="loadSim('${s.id}')">Charger</button>
                    <button class="btn-delete" onclick="deleteSim('${s.id}')">🗑</button>
                </div>
            </div>
        `;
    }).join('');
}

window.loadSim = function(id) {
    const sim = getSims().find(s => s.id === id);
    if (!sim) return;
    state.days = sim.days;
    state.prices = sim.prices;
    state.year = sim.year;
    state.charges = sim.charges || state.charges;
    state.loan = sim.loan || state.loan;
    state.currentSimId = sim.id;
    loadPrices();
    loadLoan();
    renderCharges();
    renderCalendar();
    renderSimList();
    showToast(`📂 "${sim.name}" chargée`);
    state.occupancy = sim.occupancy || { high: 50, medium: 50, low: 50 };
    // Puis remettre dans l'UI
    document.getElementById('qfOccHigh').value = state.occupancy.high;
    document.getElementById('qfOccMedium').value = state.occupancy.medium;
    document.getElementById('qfOccLow').value = state.occupancy.low;
    updateAvgOccupancy();
};

window.deleteSim = function(id) {
    if (!confirm('Supprimer cette simulation ?')) return;
    setSims(getSims().filter(s => s.id !== id));
    if (state.currentSimId === id) state.currentSimId = null;
    renderSimList();
    showToast('🗑 Supprimée');
};

// === AUTO-SAVE ===
function saveCurrent() {
    if (!state.currentSimId) return;
    const sims = getSims();
    const idx = sims.findIndex(s => s.id === state.currentSimId);
    if (idx >= 0) {
        sims[idx].days = state.days;
        sims[idx].prices = state.prices;
        sims[idx].year = state.year;
        sims[idx].charges = state.charges;
        sims[idx].loan = state.loan;
        sims[idx].occupancy = state.occupancy;
        setSims(sims);
    }
}
