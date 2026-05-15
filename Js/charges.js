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
