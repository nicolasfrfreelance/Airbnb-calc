# 🧪 TNR - Tests de Non-Régression

> À dérouler après chaque modification du code.
> Durée : ~5 minutes. Cocher au fur et à mesure.

**Date du test :** ___________  
**Version testée :** ___________

---

## 1. 🚀 Chargement initial

- [ ] La page se charge sans erreur
- [ ] **F12 → Console** : message `✅ App initialisée` présent
- [ ] **F12 → Console** : aucune erreur rouge
- [ ] L'onglet "Calendrier" est actif par défaut
- [ ] Le calendrier affiche les 12 mois de l'année en cours
- [ ] Les jours fériés/week-ends s'affichent correctement (lundi en 1ère colonne)

---

## 2. 📅 Calendrier — Sélection manuelle

- [ ] Cliquer sur un jour le colore en **rouge** (haute saison par défaut)
- [ ] Sélectionner "Moyenne" puis cliquer un jour → couleur **orange**
- [ ] Sélectionner "Basse" puis cliquer un jour → couleur **bleue**
- [ ] Sélectionner "Effacer" puis cliquer un jour coloré → redevient blanc
- [ ] **Drag** : maintenir clic + glisser sur plusieurs jours → tous se colorent
- [ ] Changer d'année (◀ ▶) → le calendrier change et les jours déjà saisis sont conservés

---

## 3. ⚡ Quick Fill (avec taux d'occupation par saison)

- [ ] Les 3 champs "Occupation" affichent 50% par défaut
- [ ] Le "Taux moyen" affiche 0.0% quand aucun jour saisi
- [ ] Saisir Haute=100j/95%, Moyenne=80j/70%, Basse=60j/40%
- [ ] Taux moyen se met à jour en live = ((100×95)+(80×70)+(60×40))/100/365 = 47.9%
- [ ] Cliquer "Appliquer" → 240 jours répartis dans le calendrier
- [ ] Onglet Récap : CA = (95j×prixH) + (56j×prixM) + (24j×prixB)
- [ ] Recharger la page : taux d'occupation conservés
- [ ] Sauvegarder une simulation, en charger une autre, recharger la 1ère → taux restaurés
- [ ] Cliquer "Réinitialiser" → jours à 0, taux d'occupation **conservés**

---

## 4. ⚙️ Tarifs

- [ ] Onglet "Tarifs" s'ouvre
- [ ] Les 3 champs prix sont préremplis (150 / 100 / 60)
- [ ] Modifier un prix → la valeur se sauvegarde (vérifier en changeant d'onglet et revenant)

---

## 5. 💸 Charges

- [ ] Onglet "Charges" s'ouvre
- [ ] 8 charges par défaut s'affichent
- [ ] Modifier le montant d'une charge → totaux en bas se mettent à jour
- [ ] Changer le type (Mensuel/Ponctuel) → totaux se mettent à jour
- [ ] Cliquer "➕ Ajouter une charge" → nouvelle ligne "Nouvelle charge" apparaît
- [ ] Cliquer 🗑 sur une charge → elle disparaît
- [ ] Total annuel = (mensuel × 12) + ponctuel ✅ cohérent

---

## 6. 🏦 Financement

- [ ] Onglet "Financement" s'ouvre
- [ ] Tous les champs sont préremplis
- [ ] Frais de notaire = 8% du prix du bien (ex: 200000 → 16000)
- [ ] Modifier le prix du bien → notaire recalculé auto
- [ ] Modifier taux/durée → mensualité recalculée
- [ ] Synthèse affiche : coût total, montant emprunté, mensualité, coût crédit, intérêts

---

## 7. 📊 Récapitulatif

- [ ] Onglet "Récap" s'ouvre
- [ ] Jours occupés = somme des jours colorés de l'année
- [ ] Taux d'occupation = jours / 365 (ou 366)
- [ ] Revenus = somme (jours × prix par saison)
- [ ] Breakdown par saison cohérent
- [ ] Cashflow = Revenus - Charges - Mensualités×12
- [ ] Rentabilité brute / nette / point mort affichés

---

## 8. 💾 Simulations

- [ ] Onglet "Simulations" s'ouvre
- [ ] Saisir un nom "Test 1" + cliquer 💾 → toast de confirmation
- [ ] La simulation apparaît dans la liste avec ⭐ (courante)
- [ ] Modifier des jours dans le calendrier → auto-save (silencieux)
- [ ] Cliquer "➕ Nouvelle" + confirmer → calendrier vidé
- [ ] Cliquer "Charger" sur "Test 1" → calendrier restauré + toast
- [ ] Cliquer 🗑 + confirmer → simulation supprimée

---

## 9. 🔄 Persistance (localStorage)

- [ ] Sauvegarder une simulation
- [ ] Recharger la page (F5)
- [ ] Onglet "Simulations" → la simulation est toujours là
- [ ] La charger → toutes les données reviennent

---

## 10. 🐛 Edge cases

- [ ] Quick fill avec total > 365 → message d'erreur (pas de crash)
- [ ] Année bissextile (2024) → 366 jours, février a 29 jours
- [ ] Mensualité avec apport ≥ coût total → mensualité = 0 €
- [ ] Aucun jour sélectionné → cashflow négatif (= -charges -mensualités), pas de NaN

---

## ✅ Résultat global

- [ ] **Tous les tests passent** → on peut développer la suite 🚀
- [ ] **Échec(s) détecté(s)** → noter ci-dessous, corriger avant d'avancer

### Échecs constatés
