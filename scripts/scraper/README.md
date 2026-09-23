# Pipeline de Scraping Marché Professionnel VE

Ce dossier contient les outils de collecte automatisée sur les réseaux de concessions et reconditionneurs professionnels certifiés :
- **Renault Renew** (`fr.renew.auto`)
- **Stellantis Spoticar** (`www.spoticar.fr`)
- **Aramisauto** (`www.aramisauto.com`)

---

## ⚡ Option 1 (Recommandée) : Exécution clé en main via Docker

Aucune installation Python ou Playwright n'est requise sur votre machine hôte :

```bash
# Lance le scraping dans le conteneur Docker et ingère les prix dans evDatabase.json
npm run data:refresh:docker
```

---

## 🤖 Option 2 : Automatisation GitHub Actions (CRON)

Le workflow [`.github/workflows/market-price-update.yml`](file:///Users/thomasgiroire/antigravity/Stop-Carburant/.github/workflows/market-price-update.yml) est déjà configuré :
- **Planification hebdomadaire** : s'exécute automatiquement tous les dimanches à 02h00 UTC.
- **Déclenchement manuel** : bouton *Run workflow* disponible dans l'onglet Actions de GitHub.
- **Validation continue** : exécute le scraping, ingère les données, valide les tests unitaires et le build Vite, puis ouvre automatiquement une Pull Request si les prix ont évolué.

---

## 💻 Option 3 : Exécution en local sur votre Mac (sans Docker)

Si vous souhaitez exécuter le scraper directement sans Docker :

```bash
# 1. Créer et activer l'environnement virtuel Python
python3 -m venv scripts/scraper/venv
source scripts/scraper/venv/bin/activate

# 2. Installer les dépendances et navigateurs
pip install -r scripts/scraper/requirements.txt
playwright install chromium

# 3. Lancer la commande combinée de scraping et d'ingestion
npm run data:refresh
```

### Options supplémentaires de collecte
```bash
# Cibler une source spécifique
bash scripts/refresh_market_data.sh --source renew
bash scripts/refresh_market_data.sh --source spoticar
bash scripts/refresh_market_data.sh --source aramis

# Mode test/démonstration rapide (sans téléchargement navigateur)
npm run data:refresh:mock
```
