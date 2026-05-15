// === ÉTAT GLOBAL ===
let state = {
    year: new Date().getFullYear(),
    selectedSeason: 'high',
    days: {},
    prices: { high: 150, medium: 100, low: 60 },
    occupancy: { high: 50, medium: 50, low: 50 },
    quickFill: { high: 0, medium: 0, low: 0 },
    inputMode: 'calendar', // 'calendar' ou 'quick'  // ← NOUVEAU
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
const NOTARY_RATE = 0.08;
