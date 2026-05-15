// js/export.js
(function() {
    const btn = document.getElementById('exportPdfBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        // Récupère le nom de la simu active (si dispo)
        const simName = (window.state && state.currentSimName) || 'Simulation';
        const year = document.getElementById('currentYear')?.textContent || '';

        // Titre dynamique pour le PDF
        const originalTitle = document.title;
        document.title = `Rentabilite_Airbnb_${simName}_${year}`;

        // S'assurer que l'onglet récap est actif
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('summary').classList.add('active');

        // Petit délai pour laisser le DOM se mettre à jour
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 100);
    });
})();