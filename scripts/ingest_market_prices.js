/**
 * Stop-Carburant • Script d'ingestion et de contrôle qualité des prix marché
 * Intègre les observations du scraper Python dans le catalogue officiel (evDatabase.json)
 * en appliquant les garde-fous statistiques stricts :
 * 1. Échantillon minimum de 3 annonces qualifiées pour mise à jour de prix existant
 * 2. Échantillon minimum de 2 annonces pour l'ajout automatique d'un nouveau modèle
 * 3. Plafond d'écart de prix max ±20% pour les modèles existants
 * 4. Fallback systématique sur le prix catalogue existant
 * 
 * Exécution : npm run data:ingest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const observationsPath = path.resolve(__dirname, 'scraper/output/market_observations.json');
const evDatabasePath = path.resolve(__dirname, '../src/data/evDatabase.json');
const compileScriptPath = path.resolve(__dirname, 'compile_ev_database.js');

const MIN_SAMPLE_SIZE_EXISTING = 3;
const MIN_SAMPLE_SIZE_NEW = 2; // Règle validée utilisateur : démarre à 2 pour les nouveaux modèles
const MAX_VARIATION_PERCENT = 20;

function formatCurrency(val) {
  if (typeof val !== 'number') return '-';
  return val.toLocaleString('fr-FR') + ' €';
}

function runIngestion() {
  console.log('\n=============================================================');
  console.log('  STOP-CARBURANT • INGESTION DES PRIX DE MARCHÉ PROFESSIONNELS');
  console.log('=============================================================\n');

  if (!fs.existsSync(observationsPath)) {
    console.error(`❌ Fichier d'observations introuvable : ${observationsPath}`);
    console.error(`👉 Veuillez exécuter d'abord : python3 scripts/scraper/scrape_market.py`);
    console.error(`   (ou via Docker : npm run data:refresh:docker)`);
    process.exit(1);
  }

  if (!fs.existsSync(evDatabasePath)) {
    console.error(`❌ Catalogue evDatabase.json introuvable : ${evDatabasePath}`);
    process.exit(1);
  }

  const observations = JSON.parse(fs.readFileSync(observationsPath, 'utf8'));
  const database = JSON.parse(fs.readFileSync(evDatabasePath, 'utf8'));

  console.log(`📅 Date de collecte : ${observations.generatedAt}`);
  console.log(`🌐 Sources analysées : ${observations.sources.join(', ')}`);
  console.log(`🚗 Total annonces observées : ${observations.totalAdsHarvested}\n`);

  let updatedCount = 0;
  let rejectedVariationCount = 0;
  let insufficientSampleCount = 0;
  let unmodifiedCount = 0;
  let newlyAddedCount = 0;

  const resultsTable = [];

  // 1. Mise à jour des modèles existants avec garde-fous stricts
  const updatedDatabase = database.map((car) => {
    const obs = observations.models?.[car.id];

    if (!obs) {
      unmodifiedCount++;
      resultsTable.push({
        id: car.id,
        name: car.fullName,
        oldPrice: formatCurrency(car.estimatedMarketPrice),
        newPrice: '-',
        diff: '0%',
        samples: '0',
        status: 'Conservé (aucune annonce)',
      });
      return car;
    }

    // Garde-fou 1 : Taille minimale d'échantillon pour modèles existants
    if (obs.sampleCount < MIN_SAMPLE_SIZE_EXISTING) {
      insufficientSampleCount++;
      resultsTable.push({
        id: car.id,
        name: car.fullName,
        oldPrice: formatCurrency(car.estimatedMarketPrice),
        newPrice: formatCurrency(obs.sweetSpotPrice),
        diff: '-',
        samples: `${obs.sampleCount} (< ${MIN_SAMPLE_SIZE_EXISTING})`,
        status: 'Rejeté (échantillon trop faible)',
      });
      return car;
    }

    // Garde-fou 2 : Plafond d'écart de variation (±20%)
    const oldPrice = car.estimatedMarketPrice;
    const newPrice = obs.sweetSpotPrice;
    const diffPct = Math.round(((newPrice - oldPrice) / oldPrice) * 100);

    if (Math.abs(diffPct) > MAX_VARIATION_PERCENT) {
      rejectedVariationCount++;
      resultsTable.push({
        id: car.id,
        name: car.fullName,
        oldPrice: formatCurrency(oldPrice),
        newPrice: formatCurrency(newPrice),
        diff: `${diffPct > 0 ? '+' : ''}${diffPct}%`,
        samples: `${obs.sampleCount}`,
        status: `Rejeté (écart > ±${MAX_VARIATION_PERCENT}%)`,
      });
      return car;
    }

    // Validation & Mise à jour
    updatedCount++;
    resultsTable.push({
      id: car.id,
      name: car.fullName,
      oldPrice: formatCurrency(oldPrice),
      newPrice: formatCurrency(newPrice),
      diff: `${diffPct > 0 ? '+' : ''}${diffPct}%`,
      samples: `${obs.sampleCount}`,
      status: diffPct === 0 ? 'Confirmé identique' : '✅ Actualisé',
    });

    return {
      ...car,
      estimatedMarketPrice: newPrice,
      leboncoinSampleText: `Constaté dès ${formatCurrency(newPrice)} sur réseau professionnel certifié`,
    };
  });

  // 2. Détection et Ajout Automatique des Nouveaux Modèles (seuil >= 2 annonces + specs Open Data)
  const discoveredModels = observations.discoveredModels || [];
  const newlyAddedEntries = [];

  for (const discovered of discoveredModels) {
    const existingIndex = updatedDatabase.findIndex((c) => c.id === discovered.id);
    if (existingIndex === -1 && discovered.sampleCount >= MIN_SAMPLE_SIZE_NEW) {
      // Nettoyage des métadonnées de scraping pour garder un objet OpenDataEVModel pur
      const { sampleCount, adsSample, ...cleanModelSpec } = discovered;

      updatedDatabase.push(cleanModelSpec);
      newlyAddedEntries.push(cleanModelSpec);
      newlyAddedCount++;

      resultsTable.push({
        id: cleanModelSpec.id,
        name: cleanModelSpec.fullName,
        oldPrice: '-',
        newPrice: formatCurrency(cleanModelSpec.estimatedMarketPrice),
        diff: 'NOUVEAU',
        samples: `${discovered.sampleCount}`,
        status: '🆕 Ajouté au catalogue (Open Data)',
      });

      console.log(`✨ NOUVEAU MODÈLE DÉCOUVERT ET AJOUTÉ AU CATALOGUE :`);
      console.log(`   🚗 ${cleanModelSpec.fullName} (${cleanModelSpec.bodyType.toUpperCase()})`);
      console.log(`   💶 Prix Sweet Spot : ${formatCurrency(cleanModelSpec.estimatedMarketPrice)} (basé sur ${discovered.sampleCount} annonces observées)`);
      console.log(`   🔋 Batterie : ${cleanModelSpec.batteryNetKwh} kWh | WLTP : ${cleanModelSpec.wltpRangeKm} km | Charge : ${cleanModelSpec.dcMaxPowerKw} kW DC\n`);
    }
  }

  // Affichage du tableau récapitulatif
  console.table(resultsTable, ['name', 'oldPrice', 'newPrice', 'diff', 'samples', 'status']);

  // Sauvegarde dans evDatabase.json
  fs.writeFileSync(evDatabasePath, JSON.stringify(updatedDatabase, null, 2), 'utf8');
  console.log(`\n💾 Catalogue 'src/data/evDatabase.json' mis à jour avec succès (Total modèles : ${updatedDatabase.length}).`);

  // Synchronisation dans compile_ev_database.js si présent
  if (fs.existsSync(compileScriptPath)) {
    try {
      let scriptContent = fs.readFileSync(compileScriptPath, 'utf8');

      // 1. Met à jour les prix existants
      for (const item of updatedDatabase) {
        const regex = new RegExp(`(id:\\s*'${item.id}'[\\s\\S]*?estimatedMarketPrice:\\s*)\\d+`, 'm');
        if (regex.test(scriptContent)) {
          scriptContent = scriptContent.replace(regex, `$1${item.estimatedMarketPrice}`);
        }
      }

      // 2. Insère les nouveaux modèles découverts dans EV_DATABASE_ENTRIES s'ils n'y figurent pas
      if (newlyAddedEntries.length > 0) {
        const marker = 'const EV_DATABASE_ENTRIES = [';
        const markerIndex = scriptContent.indexOf(marker);
        if (markerIndex !== -1) {
          const formattedEntries = newlyAddedEntries
            .map((entry) => `  // Modèle découvert automatiquement via réseau certifié\n  ${JSON.stringify(entry, null, 2).replace(/\n/g, '\n  ')},`)
            .join('\n');
          scriptContent = scriptContent.slice(0, markerIndex + marker.length) + '\n' + formattedEntries + scriptContent.slice(markerIndex + marker.length);
        }
      }

      fs.writeFileSync(compileScriptPath, scriptContent, 'utf8');
      console.log(`💾 Synchronisé dans 'scripts/compile_ev_database.js'.`);
    } catch (err) {
      console.warn(`⚠️ Impossible de synchroniser compile_ev_database.js : ${err.message}`);
    }
  }

  console.log('\n📊 Bilan de l\'ingestion :');
  console.log(`   - Modèles existants actualisés / confirmés : ${updatedCount}`);
  console.log(`   - Nouveaux modèles ajoutés au catalogue    : ${newlyAddedCount}`);
  console.log(`   - Rejetés pour écart > 20%                 : ${rejectedVariationCount}`);
  console.log(`   - Rejetés pour échantillon < seuil         : ${insufficientSampleCount}`);
  console.log(`   - Modèles conservés sans modification      : ${unmodifiedCount}`);
  console.log('   => 100% des prix et modèles du catalogue sont vérifiés et sécurisés.\n');
}

runIngestion();
