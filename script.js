// État de l'application
let state = {
    year: new Date().getFullYear(),
    selectedSeason: 'high',
    days: {},
    prices: { high: 150, medium: 100, low: 60 },
    charges: [
        { id: 1, label: 'Assurance PNO', amount: 25, type: 'monthly' },
        { id: 2, label: 'Internet/Wifi', amount: 30, type: 'monthly' },
        { id: 3, label: 'Électricité/Eau', amount: 80, type: 'monthly' },
        { id: 4, label: 'Charges copropriété', amount: 60, type: 'monthly' },
        { id: 5, label: 'Taxe foncière', amount: 1200, type: 'oneshot' },
        { id: 6, label: 'Ménage (forfait annuel)', amount: 800, type: 'oneshot' },
        { id: 7, label: 'Comptable', amount: 500, type: 'oneshot' },
        { id: 8, label: 'Commission Airbnb (~3%)', amount: 0, type: 'oneshot' }
    ],
    loan: {
        propertyPrice: 200000,
        notaryFees: 16000,
        works: 10000,
        furniture: 8000,
        downPayment: 30000,
        loanRate: 3.5,
        loanDuration: 20,
        insuranceRate: 0.36
    },
    currentSimId: null
};

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['L','M','M','J','V','S','D'];

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

// === CALENDRIER ===
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
        const offset = firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0
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
            
            // Click + drag
            dayDiv.addEventListener('mousedown', e => { e.preventDefault(); isDragging = true; applySeason(key, dayDiv); });
            dayDiv.addEventListener('mouseenter', () => { if (isDragging) applySeason(key, dayDiv); });
            
            grid.appendChild(dayDiv);
        }
        
        monthDiv.appendChild(grid);
        container.appendChild(monthDiv);
        syncQuickFromCalendar();
    }
}

let isDragging = false;
document.addEventListener('mouseup', () => isDragging = false);

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

// === PRIX ===
['priceHigh', 'priceMedium', 'priceLow'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        const key = id.replace('price','').toLowerCase();
        state.prices[key] = parseFloat(e.target.value) || 0;
        saveCurrent();
    });
});

function loadPrices() {
    document.getElementById('priceHigh').value = state.prices.high;
    document.getElementById('priceMedium').value = state.prices.medium;
    document.getElementById('priceLow').value = state.prices.low;
}

// === RÉCAPITULATIF ===
function updateSummary() {
    const yearDays = Object.keys(state.days).filter(k => k.startsWith(state.year + '-'));
    const counts = { high: 0, medium: 0, low: 0 };
    yearDays.forEach(k => { if (counts[state.days[k]] !== undefined) counts[state.days[k]]++; });
    
    const total = counts.high + counts.medium + counts.low;
    const totalYearDays = ((state.year % 4 === 0 && state.year % 100 !== 0) || state.year % 400 === 0) ? 366 : 365;
    const revenue = counts.high * state.prices.high + counts.medium * state.prices.medium + counts.low * state.prices.low;
    
    const annualCharges = getAnnualCharges();
    const loan = calculateLoan();
    const annualLoan = loan.monthlyPayment * 12;
    const cashflow = revenue - annualCharges - annualLoan;
    const totalInvest = loan.totalCost;
    
    const grossYield = totalInvest > 0 ? (revenue / totalInvest * 100) : 0;
    const netYield = totalInvest > 0 ? ((revenue - annualCharges) / totalInvest * 100) : 0;
    
    // Point mort : combien de jours moyens (au prix moyen pondéré) pour couvrir charges + prêt
    const avgPrice = total > 0 ? revenue / total : (state.prices.high + state.prices.medium + state.prices.low) / 3;
    const breakeven = avgPrice > 0 ? Math.ceil((annualCharges + annualLoan) / avgPrice) : 0;
    
    document.getElementById('statDays').textContent = total;
    document.getElementById('statDaysDetail').textContent = `/ ${totalYearDays} jours (année ${state.year})`;
    document.getElementById('statRate').textContent = ((total / totalYearDays) * 100).toFixed(1) + '%';
    document.getElementById('statRevenue').textContent = revenue.toLocaleString('fr-FR') + ' €';
    
    document.getElementById('statCharges').textContent = '-' + annualCharges.toLocaleString('fr-FR') + ' €';
    document.getElementById('statLoan').textContent = '-' + annualLoan.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('statCashflow').textContent = (cashflow >= 0 ? '+' : '') + cashflow.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('statCashflowMonthly').textContent = (cashflow / 12).toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' € / mois';
    
    document.getElementById('statGrossYield').textContent = grossYield.toFixed(2) + '%';
    document.getElementById('statNetYield').textContent = netYield.toFixed(2) + '%';
    document.getElementById('statBreakeven').textContent = breakeven + ' j';
    
    document.getElementById('bdHigh').textContent = `${counts.high} jours - ${(counts.high * state.prices.high).toLocaleString('fr-FR')} €`;
    document.getElementById('bdMedium').textContent = `${counts.medium} jours - ${(counts.medium * state.prices.medium).toLocaleString('fr-FR')} €`;
    document.getElementById('bdLow').textContent = `${counts.low} jours - ${(counts.low * state.prices.low).toLocaleString('fr-FR')} €`;
}


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
    state.currentSimId = sim.id;
    loadPrices();
    renderCalendar();
    renderSimList();
    showToast(`📂 "${sim.name}" chargée`);
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
        setSims(sims);
    }
}

// === TOAST ===
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}
// === CHARGES ===
function renderCharges() {
    const list = document.getElementById('chargesList');
    list.innerHTML = state.charges.map(c => `
        <div class="charge-row" data-id="${c.id}">
            <input type="text" class="charge-label" value="${c.label}" placeholder="Libellé">
            <input type="number" class="charge-amount" value="${c.amount}" min="0" step="0.01">
            <select class="charge-type">
                <option value="monthly" ${c.type === 'monthly' ? 'selected' : ''}>Mensuel</option>
                <option value="oneshot" ${c.type === 'oneshot' ? 'selected' : ''}>Ponctuel/Annuel</option>
            </select>
            <button class="btn-remove" onclick="removeCharge(${c.id})">🗑</button>
        </div>
    `).join('');

    list.querySelectorAll('.charge-row').forEach(row => {
        const id = parseInt(row.dataset.id);
        row.querySelector('.charge-label').addEventListener('input', e => updateCharge(id, 'label', e.target.value));
        row.querySelector('.charge-amount').addEventListener('input', e => updateCharge(id, 'amount', parseFloat(e.target.value) || 0));
        row.querySelector('.charge-type').addEventListener('change', e => updateCharge(id, 'type', e.target.value));
    });

    updateChargesSummary();
}

function updateCharge(id, field, value) {
    const c = state.charges.find(x => x.id === id);
    if (c) { c[field] = value; updateChargesSummary(); saveCurrent(); }
}

window.removeCharge = function(id) {
    state.charges = state.charges.filter(c => c.id !== id);
    renderCharges();
    saveCurrent();
};

document.getElementById('addCharge').addEventListener('click', () => {
    const newId = state.charges.length ? Math.max(...state.charges.map(c => c.id)) + 1 : 1;
    state.charges.push({ id: newId, label: 'Nouvelle charge', amount: 0, type: 'monthly' });
    renderCharges();
    saveCurrent();
});

function updateChargesSummary() {
    const monthly = state.charges.filter(c => c.type === 'monthly').reduce((s, c) => s + c.amount, 0);
    const oneshot = state.charges.filter(c => c.type === 'oneshot').reduce((s, c) => s + c.amount, 0);
    const annual = monthly * 12 + oneshot;
    document.getElementById('totalMonthly').textContent = monthly.toLocaleString('fr-FR') + ' €';
    document.getElementById('totalOneShot').textContent = oneshot.toLocaleString('fr-FR') + ' €';
    document.getElementById('totalAnnual').textContent = annual.toLocaleString('fr-FR') + ' €';
}

function getAnnualCharges() {
    const monthly = state.charges.filter(c => c.type === 'monthly').reduce((s, c) => s + c.amount, 0);
    const oneshot = state.charges.filter(c => c.type === 'oneshot').reduce((s, c) => s + c.amount, 0);
    return monthly * 12 + oneshot;
}

// === LOAN ===
const NOTARY_RATE = 0.08;
const loanFields = ['propertyPrice', 'works', 'furniture', 'downPayment', 'loanRate', 'loanDuration', 'insuranceRate'];

loanFields.forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        state.loan[id] = parseFloat(e.target.value) || 0;
        if (id === 'propertyPrice') {
            state.loan.notaryFees = state.loan.propertyPrice * NOTARY_RATE;
            document.getElementById('notaryFees').value = Math.round(state.loan.notaryFees);
        }
        updateLoanSummary();
        saveCurrent();
    });
});

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
};
function loadLoan() {
    state.loan.notaryFees = state.loan.propertyPrice * NOTARY_RATE;
    loanFields.forEach(id => { document.getElementById(id).value = state.loan[id]; });
    document.getElementById('notaryFees').value = Math.round(state.loan.notaryFees);
    updateLoanSummary();
}

function calculateLoan() {
    const totalCost = state.loan.propertyPrice + state.loan.notaryFees + state.loan.works + state.loan.furniture;
    const loanAmount = Math.max(0, totalCost - state.loan.downPayment);
    const monthlyRate = (state.loan.loanRate / 100) / 12;
    const months = state.loan.loanDuration * 12;
    
    let monthlyPayment = 0;
    if (loanAmount > 0 && months > 0) {
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / months;
        } else {
            monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        }
    }
    
    const monthlyInsurance = (loanAmount * (state.loan.insuranceRate / 100)) / 12;
    const totalMonthly = monthlyPayment + monthlyInsurance;
    const totalLoanCost = totalMonthly * months;
    const totalInterests = totalLoanCost - loanAmount;
    
    return { totalCost, loanAmount, monthlyPayment: totalMonthly, totalLoanCost, totalInterests };
}

function updateLoanSummary() {
    const r = calculateLoan();
    document.getElementById('totalCost').textContent = r.totalCost.toLocaleString('fr-FR') + ' €';
    document.getElementById('loanAmount').textContent = r.loanAmount.toLocaleString('fr-FR') + ' €';
    document.getElementById('monthlyPayment').textContent = r.monthlyPayment.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('totalLoanCost').textContent = r.totalLoanCost.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('totalInterests').textContent = r.totalInterests.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
}
// === QUICK FILL ===
function getYearDayCount(year) {
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function syncQuickFromCalendar() {
    const counts = { high: 0, medium: 0, low: 0 };
    Object.keys(state.days).forEach(k => {
        if (k.startsWith(state.year + '-') && counts[state.days[k]] !== undefined) {
            counts[state.days[k]]++;
        }
    });
    const total = counts.high + counts.medium + counts.low;
    const yearDays = getYearDayCount(state.year);
    document.getElementById('qfHigh').value = counts.high;
    document.getElementById('qfMedium').value = counts.medium;
    document.getElementById('qfLow').value = counts.low;
    document.getElementById('qfRate').value = ((total / yearDays) * 100).toFixed(1);
}

function applyQuickFill() {
    const high = parseInt(document.getElementById('qfHigh').value) || 0;
    const medium = parseInt(document.getElementById('qfMedium').value) || 0;
    const low = parseInt(document.getElementById('qfLow').value) || 0;
    const yearDays = getYearDayCount(state.year);
    const total = high + medium + low;

    if (total > yearDays) {
        showToast(`⚠️ Total (${total}) > ${yearDays} jours dispo`);
        return;
    }

    // Efface uniquement les jours de l'année courante
    Object.keys(state.days).forEach(k => {
        if (k.startsWith(state.year + '-')) delete state.days[k];
    });

    // Construit la liste des dates de l'année
    const allDates = [];
    const start = new Date(state.year, 0, 1);
    const end = new Date(state.year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.push(`${state.year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    // Stratégie : Haute = été (juin-août) + vacances décembre
    // Moyenne = printemps (avril-mai) + automne (sept-oct)
    // Basse = reste (jan-mars, nov)
    const priority = {
        high: allDates.filter(d => {
            const m = parseInt(d.split('-')[1]);
            return m === 7 || m === 8 || m === 6 || m === 12;
        }).concat(allDates.filter(d => {
            const m = parseInt(d.split('-')[1]);
            return !(m === 7 || m === 8 || m === 6 || m === 12);
        })),
        medium: allDates.filter(d => {
            const m = parseInt(d.split('-')[1]);
            return m === 4 || m === 5 || m === 9 || m === 10;
        }).concat(allDates.filter(d => {
            const m = parseInt(d.split('-')[1]);
            return !(m === 4 || m === 5 || m === 9 || m === 10);
        })),
        low: allDates.filter(d => {
            const m = parseInt(d.split('-')[1]);
            return m === 1 || m === 2 || m === 3 || m === 11;
        }).concat(allDates.filter(d => {
            const m = parseInt(d.split('-')[1]);
            return !(m === 1 || m === 2 || m === 3 || m === 11);
        }))
    };

    const used = new Set();
    
    function assign(season, count) {
        let assigned = 0;
        for (const d of priority[season]) {
            if (assigned >= count) break;
            if (!used.has(d)) {
                state.days[d] = season;
                used.add(d);
                assigned++;
            }
        }
    }

    assign('high', high);
    assign('medium', medium);
    assign('low', low);

    document.getElementById('qfRate').value = ((total / yearDays) * 100).toFixed(1);
    renderCalendar();
    saveCurrent();
    showToast(`✅ ${total} jours répartis`);
}

function applyOccupancyRate() {
    const rate = parseFloat(document.getElementById('qfRate').value) || 0;
    const yearDays = getYearDayCount(state.year);
    const targetTotal = Math.round((rate / 100) * yearDays);
    
    const high = parseInt(document.getElementById('qfHigh').value) || 0;
    const medium = parseInt(document.getElementById('qfMedium').value) || 0;
    const low = parseInt(document.getElementById('qfLow').value) || 0;
    const currentTotal = high + medium + low;

    if (currentTotal === 0) {
        // Répartition par défaut : 40% haute / 35% moyenne / 25% basse
        const newHigh = Math.round(targetTotal * 0.40);
        const newMedium = Math.round(targetTotal * 0.35);
        const newLow = targetTotal - newHigh - newMedium;
        document.getElementById('qfHigh').value = newHigh;
        document.getElementById('qfMedium').value = newMedium;
        document.getElementById('qfLow').value = newLow;
    } else {
        // Conserve les proportions existantes
        const ratio = targetTotal / currentTotal;
        const newHigh = Math.round(high * ratio);
        const newMedium = Math.round(medium * ratio);
        const newLow = targetTotal - newHigh - newMedium;
        document.getElementById('qfHigh').value = newHigh;
        document.getElementById('qfMedium').value = newMedium;
        document.getElementById('qfLow').value = Math.max(0, newLow);
    }
}

document.getElementById('qfApply').addEventListener('click', applyQuickFill);

document.getElementById('qfReset').addEventListener('click', () => {
    if (!confirm(`Effacer tous les jours de l'année ${state.year} ?`)) return;
    Object.keys(state.days).forEach(k => {
        if (k.startsWith(state.year + '-')) delete state.days[k];
    });
    document.getElementById('qfHigh').value = 0;
    document.getElementById('qfMedium').value = 0;
    document.getElementById('qfLow').value = 0;
    document.getElementById('qfRate').value = 0;
    renderCalendar();
    saveCurrent();
    showToast('🔄 Calendrier réinitialisé');
});

// Quand on tape un taux, ça redistribue automatiquement les jours
document.getElementById('qfRate').addEventListener('change', applyOccupancyRate);
// === INIT ===
loadPrices();
loadLoan();
renderCharges();
renderCalendar();