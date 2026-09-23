# Guide de Développement — Stop-Carburant

Ce document regroupe toutes les instructions techniques pour contribuer, tester et déployer l'application **Stop-Carburant**.

---

## 🚀 Démarrage Rapide avec Docker

L'environnement de développement et de test est entièrement conteneurisé sous Docker avec rechargement à chaud (Hot Module Reloading) et isolation complète.

### 1. Initialisation (optionnel)
```bash
./setup.sh
# ou npm run setup
```

### 2. Démarrer l'application dans Docker
```bash
# Mode interactif avec logs en direct (Ctrl+C pour arrêter)
./start.sh

# Mode arrière-plan (détaché)
./start.sh -d

# Raccourci npm équivalent
npm run dev:docker
```
L'application est immédiatement accessible sur **[http://localhost:3000](http://localhost:3000)**.

### 3. Vérifier l'état de la stack (< 1 seconde)
Inspecte le démon Docker, le conteneur, le port 3000 et Git :
```bash
npm run status
# ou ./start.sh --status
```

### 4. Contrôles & Options du script `start.sh`
```bash
# Voir les logs en direct du conteneur
./start.sh --logs

# Forcer la libération du port 3000 s'il est déjà occupé
./start.sh --force

# Utiliser un port externe personnalisé (ex: 3001)
./start.sh -p 3001

# Forcer la reconstruction de l'image Docker
./start.sh -b

# Redémarrer le conteneur
./start.sh --restart

# Arrêter le conteneur
./start.sh --stop
```

---

## 💻 Développement sans Docker (Local pur)

Si vous préférez exécuter le serveur Vite directement sur la machine hôte :
```bash
npm install
npm run dev
```
Accessible sur `http://localhost:3000`.

---

## 🧪 Tests & Assurance Qualité

La suite de tests unitaires et d'intégration repose sur **Vitest** et **Testing Library**.

### Exécuter les tests dans Docker
```bash
./start.sh --test
# ou npm run test:docker
```

### Exécuter les tests en local (Node.js)
```bash
# Exécution unique
npm test

# Mode surveillance interactif (watch)
npm run test:watch
```

### Périmètre des tests
- `tests/calculator.test.ts` : validation des équivalences thermiques, calculs d'électricité (Heures Pleines / Heures Creuses / Bornes publiques), économies d'entretien et cash libéré.
- `tests/energyPrices.test.ts` : conformité des pondérations officielles du parc automobile français (54% Diesel, 43% Essence, 3% E85) et tarifs réglementés EDF.
- `tests/loanCalculations.test.ts` : barèmes de crédit auto (Prêt Éco-Mobilité 1,00% TAEG jusqu'à 10 000 € et crédit standard 4,90%).
- `tests/DepartmentSelectorModal.test.tsx` : sélection par département et filtrage dynamique des carburants.
- `tests/personas.e2e.test.tsx` : tests E2E scénarisés sur des profils réels (navetteurs périurbains, soignants itinérants, artisans, grands rouleurs, résidents en appartement).
- `tests/App.test.tsx` : rendu du composant racine React, footer et validation de la navigation étape par étape.

---

## 📦 Scripts NPM Utiles

- `npm run dev` : Lance le serveur de dev Vite en local (port 3000).
- `npm run build` : Compile les assets de production dans `dist/`.
- `npm run test` : Lance la suite de tests complète avec Vitest.
- `npm run data:build` : Compile la base de données des véhicules électriques (`scripts/compile_ev_database.js`).
- `npm run data:refresh` : Rafraîchit les données de marché (`scripts/refresh_market_data.sh`).
