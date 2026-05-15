// === INIT ===
loadPrices();
loadLoan();
renderCharges();
renderCalendar();
console.log('✅ App initialisée');
document.getElementById('qfOccHigh').value = state.occupancy.high;
document.getElementById('qfOccMedium').value = state.occupancy.medium;
document.getElementById('qfOccLow').value = state.occupancy.low;
updateAvgOccupancy();