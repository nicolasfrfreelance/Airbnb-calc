// === LOAN ===
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
