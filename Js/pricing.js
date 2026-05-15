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
    const isQuick = state.inputMode === 'quick';

    // === COMPTAGE DES JOURS selon le mode ===
    let counts = { high: 0, medium: 0, low: 0 };

    if (isQuick) {
        // Mode Quick Fill : on prend les valeurs saisies par l'utilisateur
        const qf = state.quickFill || { high: 0, medium: 0, low: 0 };
        counts.high   = qf.high   || 0;
        counts.medium = qf.medium || 0;
        counts.low    = qf.low    || 0;
    } else {
        // Mode Calendrier : on compte les jours peints sur l'année
        const yearDays = Object.keys(state.days).filter(k => k.startsWith(state.year + '-'));
        yearDays.forEach(k => { if (counts[state.days[k]] !== undefined) counts[state.days[k]]++; });
    }

    const total = counts.high + counts.medium + counts.low;
    const totalYearDays = ((state.year % 4 === 0 && state.year % 100 !== 0) || state.year % 400 === 0) ? 366 : 365;

    // === CALCUL DU CA selon le mode ===
    let revenue, revH, revM, revL;

    if (isQuick) {
        // Quick : jours × occupation × tarif
        revH = counts.high   * state.prices.high   * (state.occupancy.high   / 100);
        revM = counts.medium * state.prices.medium * (state.occupancy.medium / 100);
        revL = counts.low    * state.prices.low    * (state.occupancy.low    / 100);
    } else {
        // Calendrier : jours × tarif (sans occupation)
        revH = counts.high   * state.prices.high;
        revM = counts.medium * state.prices.medium;
        revL = counts.low    * state.prices.low;
    }
   revenue = revH + revM + revL;

 // === JOURS RÉELLEMENT LOUÉS (pondérés par occupation) ===
    const occ = state.occupancy || { high: 100, medium: 100, low: 100 };
    const rentedDays =
        Math.round(counts.high   * (occ.high   / 100)) +
        Math.round(counts.medium * (occ.medium / 100)) +
        Math.round(counts.low    * (occ.low    / 100));

 // === CHARGES ANNUELLES (depuis state.charges) ===
    const annualCharges = (state.charges || []).reduce((sum, c) => {
        return sum + (c.type === 'monthly' ? c.amount * 12 : c.amount);
    }, 0);
    const loan = calculateLoan();
    const annualLoan = loan.monthlyPayment * 12;
    const cashflow = revenue - annualCharges - annualLoan;
    const totalInvest = loan.totalCost;

    const grossYield = totalInvest > 0 ? (revenue / totalInvest * 100) : 0;
    const netYield = totalInvest > 0 ? ((revenue - annualCharges) / totalInvest * 100) : 0;

    const avgPrice = total > 0 ? revenue / total : (state.prices.high + state.prices.medium + state.prices.low) / 3;
    const annualCost = annualCharges + annualLoan;
    const avgPriceRented = rentedDays > 0 ? revenue / rentedDays : 0;
// 1) Jours pour être rentable (existant)
    const breakeven = avgPriceRented > 0 ? Math.ceil(annualCost / avgPriceRented) : 0;

// 2) Emprunt max & Prix bien max pour cashflow ≥ 0
// Logique : on inverse calculateLoan() en partant de la mensualité max
//   a) Mensualité max       = (revenue - charges) / 12
//   b) Facteur mensualité/€ = facteurCapital + tauxAssurance/12
//   c) Emprunt max          = mensualité_max / facteur
//   d) Prix bien max        = (emprunt + apport - travaux - meubles) / (1 + NOTARY_RATE)

const maxMonthlyForBreakeven = (revenue - annualCharges) / 12;

let breakevenMaxLoan = 0;
let breakevenPrice   = 0;
let breakevenNotary  = 0;

if (maxMonthlyForBreakeven > 0) {
    const taux      = (state.loan.loanRate      || 0) / 100 / 12;
    const tauxAssur = (state.loan.insuranceRate || 0) / 100 / 12;
    const n         = (state.loan.loanDuration  || 20) * 12;
    const apport    =  state.loan.downPayment   || 0;
    const works     =  state.loan.works         || 0;
    const furniture =  state.loan.furniture     || 0;

    // 1️⃣ Facteur mensualité par € emprunté (capital + assurance)
    const facteurCapital = (taux > 0)
        ? (taux * Math.pow(1 + taux, n)) / (Math.pow(1 + taux, n) - 1)
        : 1 / n;
    const facteurTotal = facteurCapital + tauxAssur;

    // 2️⃣ Emprunt max (assurance incluse dans la mensualité)
    breakevenMaxLoan = maxMonthlyForBreakeven / facteurTotal;

    // 3️⃣ Prix bien max (inverse de calculateLoan())
    const priceCandidate = (breakevenMaxLoan + apport - works - furniture) / (1 + NOTARY_RATE);
    if (priceCandidate > 0) {
        breakevenPrice  = priceCandidate;
        breakevenNotary = priceCandidate * NOTARY_RATE;
    }
}
 // 3) Tarif moyen cible pour couvrir charges + prêt sur les jours actuels
    const breakevenAvgPrice = rentedDays > 0 ? annualCost / rentedDays : 0;

    // === AFFICHAGE ===
    document.getElementById('statDays').textContent = rentedDays;
    document.getElementById('statDaysDetail').textContent = `/ ${totalYearDays} jours (année ${state.year}) · ${total} j ouverts`;
    document.getElementById('statRate').textContent = ((rentedDays / totalYearDays) * 100).toFixed(1) + '%';
    document.getElementById('statRevenue').textContent = revenue.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('statAvgPrice').textContent = avgPrice.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
    document.getElementById('statAvgPriceRented').textContent = avgPriceRented.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
    document.getElementById('statCharges').textContent = '-' + annualCharges.toLocaleString('fr-FR') + ' €';
    document.getElementById('statLoan').textContent = '-' + annualLoan.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('statCashflow').textContent = (cashflow >= 0 ? '+' : '') + cashflow.toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('statCashflowMonthly').textContent = (cashflow / 12).toLocaleString('fr-FR', {maximumFractionDigits: 0}) + ' € / mois';

    document.getElementById('statGrossYield').textContent = grossYield.toFixed(2) + '%';
    document.getElementById('statNetYield').textContent = netYield.toFixed(2) + '%';
    document.getElementById('statBreakeven').textContent = breakeven + ' j';
    document.getElementById('statBreakevenPrice').textContent = breakevenPrice.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
    document.getElementById('statBreakevenPrice2').textContent = breakevenAvgPrice.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
    document.getElementById('statBreakevenMaxLoan').textContent =breakevenMaxLoan.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
    document.getElementById('statBreakevenPriceDetail').textContent =`Notaire ${Math.round(breakevenNotary).toLocaleString('fr-FR')} € · ` +`Travaux ${Math.round(statLoan.works || 0).toLocaleString('fr-FR')} €`;
    // Détail par saison (affichage adapté au mode)
    if (isQuick) {
        document.getElementById('bdHigh').textContent   = `${counts.high} j × ${state.occupancy.high}% × ${state.prices.high}€ = ${revH.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €`;
        document.getElementById('bdMedium').textContent = `${counts.medium} j × ${state.occupancy.medium}% × ${state.prices.medium}€ = ${revM.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €`;
        document.getElementById('bdLow').textContent    = `${counts.low} j × ${state.occupancy.low}% × ${state.prices.low}€ = ${revL.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €`;
    } else {
        document.getElementById('bdHigh').textContent   = `${counts.high} j × ${state.prices.high}€ = ${revH.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €`;
        document.getElementById('bdMedium').textContent = `${counts.medium} j × ${state.prices.medium}€ = ${revM.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €`;
        document.getElementById('bdLow').textContent    = `${counts.low} j × ${state.prices.low}€ = ${revL.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €`;
    }

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
    const elH = document.getElementById('qfHigh');
    const elM = document.getElementById('qfMedium');
    const elL = document.getElementById('qfLow');
    if (elH) elH.value = counts.high;
    if (elM) elM.value = counts.medium;
    if (elL) elL.value = counts.low;
    
    // Restaure les taux d'occupation depuis le state
    const elOH = document.getElementById('qfOccHigh');
    const elOM = document.getElementById('qfOccMedium');
    const elOL = document.getElementById('qfOccLow');
    if (elOH) elOH.value = state.occupancy.high;
    if (elOM) elOM.value = state.occupancy.medium;
    if (elOL) elOL.value = state.occupancy.low;
    
    if (typeof updateAvgOccupancy === 'function') updateAvgOccupancy();
}

function applyQuickFill() {
    const high = parseInt(document.getElementById('qfHigh').value) || 0;
    const medium = parseInt(document.getElementById('qfMedium').value) || 0;
    const low = parseInt(document.getElementById('qfLow').value) || 0;
    const total = high + medium + low;
    const yearDays = getYearDayCount(state.year);

    if (total > yearDays) {
        showToast(`❌ Total ${total} > ${yearDays} jours dans l'année`);
        return;
    }

    // Sauvegarde des taux d'occupation
    state.occupancy.high = parseFloat(document.getElementById('qfOccHigh').value) || 0;
    state.occupancy.medium = parseFloat(document.getElementById('qfOccMedium').value) || 0;
    state.occupancy.low = parseFloat(document.getElementById('qfOccLow').value) || 0;

    // Efface l'année courante
    Object.keys(state.days).forEach(k => {
        if (k.startsWith(state.year + '-')) delete state.days[k];
    });

    // Répartition saisonnière : été=haute, printemps/automne=moyenne, hiver=basse
    const assign = (season, count) => {
        if (count <= 0) return;
        const monthsBySeason = {
            high: [6, 7, 8],           // juil, août, sept
            medium: [3, 4, 5, 9, 10],  // avr, mai, juin, oct, nov
            low: [0, 1, 2, 11]         // jan, fév, mars, déc
        };
        const months = monthsBySeason[season];
        let assigned = 0;
        let monthIdx = 0;
        while (assigned < count && monthIdx < months.length * 31) {
            const m = months[monthIdx % months.length];
            const day = Math.floor(monthIdx / months.length) + 1;
            const daysInMonth = new Date(state.year, m + 1, 0).getDate();
            if (day <= daysInMonth) {
                const key = `${state.year}-${m}-${day}`;
                if (!state.days[key]) {
                    state.days[key] = season;
                    assigned++;
                }
            }
            monthIdx++;
        }
    };

    assign('high', high);
    assign('medium', medium);
    assign('low', low);

    updateAvgOccupancy();
    renderCalendar();
    saveCurrent();
    showToast(`✅ ${total} jours répartis`);
}

function updateAvgOccupancy() {
    const high = parseInt(document.getElementById('qfHigh').value) || 0;
    const medium = parseInt(document.getElementById('qfMedium').value) || 0;
    const low = parseInt(document.getElementById('qfLow').value) || 0;
    
    const occH = parseFloat(document.getElementById('qfOccHigh').value) || 0;
    const occM = parseFloat(document.getElementById('qfOccMedium').value) || 0;
    const occL = parseFloat(document.getElementById('qfOccLow').value) || 0;
    
    const occupiedDays = (high * occH + medium * occM + low * occL) / 100;
    const yearDays = getYearDayCount(state.year);
    const avg = yearDays > 0 ? (occupiedDays / yearDays) * 100 : 0;
    
    document.getElementById('qfAvgRate').textContent = avg.toFixed(1);
}

document.getElementById('qfReset').addEventListener('click', () => {
    if (!confirm(`Effacer tous les jours de l'année ${state.year} ?`)) return;
    Object.keys(state.days).forEach(k => {
        if (k.startsWith(state.year + '-')) delete state.days[k];
    });
    document.getElementById('qfHigh').value = 0;
    document.getElementById('qfMedium').value = 0;
    document.getElementById('qfLow').value = 0;
    updateAvgOccupancy();
    renderCalendar();
    saveCurrent();
    showToast('🔄 Calendrier réinitialisé');
});

// Recalcul automatique de la moyenne quand on change un champ
['qfHigh', 'qfMedium', 'qfLow', 'qfOccHigh', 'qfOccMedium', 'qfOccLow'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        // Sauvegarde live des taux dans le state
        state.occupancy.high = parseFloat(document.getElementById('qfOccHigh').value) || 0;
        state.occupancy.medium = parseFloat(document.getElementById('qfOccMedium').value) || 0;
        state.occupancy.low = parseFloat(document.getElementById('qfOccLow').value) || 0;
        updateAvgOccupancy();
        saveCurrent();
        if (typeof updateSummary === 'function') updateSummary();
    });
});
// Bouton Appliquer du mode Quick Fill
const btnQfApply = document.getElementById('qfApply');
if (btnQfApply) {
    btnQfApply.addEventListener('click', () => {
        const h = parseInt(document.getElementById('qfHigh').value)   || 0;
        const m = parseInt(document.getElementById('qfMedium').value) || 0;
        const l = parseInt(document.getElementById('qfLow').value)    || 0;

        const totalYearDays = ((state.year % 4 === 0 && state.year % 100 !== 0) || state.year % 400 === 0) ? 366 : 365;
        const totalSaisi = h + m + l;

        if (totalSaisi > totalYearDays) {
            if (typeof showToast === 'function') {
                showToast(`❌ Total ${totalSaisi} j > ${totalYearDays} j (année ${state.year})`);
            } else {
                alert(`Le total (${totalSaisi} jours) dépasse l'année (${totalYearDays} jours).`);
            }
            return;
        }

        state.quickFill = { high: h, medium: m, low: l };

        const occH = document.getElementById('qfOccHigh');
        const occM = document.getElementById('qfOccMedium');
        const occL = document.getElementById('qfOccLow');
        if (occH && occM && occL) {
            state.occupancy = {
                high:   Math.min(100, Math.max(0, parseInt(occH.value) || 0)),
                medium: Math.min(100, Math.max(0, parseInt(occM.value) || 0)),
                low:    Math.min(100, Math.max(0, parseInt(occL.value) || 0))
            };
        }

        saveCurrent();
        updateSummary();
        if (typeof showToast === 'function') showToast(`✅ Calcul appliqué (${totalSaisi}/${totalYearDays} j)`);
    });
}
// === MODE TOGGLE (Calendrier / Quick Fill) ===
function applyInputMode() {
    const mode = state.inputMode || 'calendar';
    const toolbar = document.getElementById('calendarToolbar');
    const calContainer = document.getElementById('calendarContainer');
    const quickSection = document.getElementById('quickFillSection');
    const btnCal = document.getElementById('modeCalendar');
    const btnQuick = document.getElementById('modeQuick');

    if (mode === 'calendar') {
        toolbar.classList.remove('hidden');
        calContainer.classList.remove('hidden');
        quickSection.classList.add('hidden');
        btnCal.classList.add('active');
        btnQuick.classList.remove('active');
    } else {
        toolbar.classList.add('hidden');
        calContainer.classList.add('hidden');
        quickSection.classList.remove('hidden');
        btnCal.classList.remove('active');
        btnQuick.classList.add('active');
    }
    if (typeof updateSummary === 'function') updateSummary();
}

document.getElementById('modeCalendar').addEventListener('click', () => {
    state.inputMode = 'calendar';
    saveCurrent();
    applyInputMode();
});

document.getElementById('modeQuick').addEventListener('click', () => {
    state.inputMode = 'quick';
    saveCurrent();
    applyInputMode();
});

// Appliquer le mode au chargement
applyInputMode();
