# Stop-Carburant.fr — Simulateur d'économies & Neutralisation de budget carburant

> **🌐 Démo en ligne : [https://thomasgiroire.github.io/Stop-Carburant/](https://thomasgiroire.github.io/Stop-Carburant/)**

Application web interactive d'aide à la décision financière pour comparer les coûts d'un véhicule thermique et l'acquisition d'un véhicule électrique (occasion / neuf), en exploitant les flux en temps réel de l'Open Data des carburants et les tarifs réglementés de l'électricité en France (EDF).

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
Inspiré de LineUP, inspecte le démon Docker, le conteneur, le port 3000 et Git :
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
- `tests/App.test.tsx` : rendu du composant racine React et validation de la navigation étape par étape.

---

## 💻 Développement sans Docker (Local pur)

Si vous préférez exécuter le serveur Vite directement sur la machine hôte :
```bash
npm install
npm run dev
```
Accessible sur `http://localhost:3000`.