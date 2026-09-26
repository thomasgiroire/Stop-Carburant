/**
 * Stop-Carburant • Compilation de la Base de Connaissances de Consommation Réelle
 * Croise les observations La Chaîne EV avec le catalogue evDatabase.json et calcule :
 * 1. Les coefficients moyens de décote IRL vs WLTP (global et par carrosserie)
 * 2. L'enrichissement de chaque véhicule avec ses mesures directes ou étalonnées
 * 3. La persistance de 'src/data/consumptionBenchmarks.json' et mise à jour de 'src/data/evDatabase.json'
 * 
 * Exécution : node scripts/compile_consumption_benchmarks.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lachaineevPath = path.resolve(__dirname, 'scraper/output/lachaineev_observations.json');
const evDatabasePath = path.resolve(__dirname, '../src/data/evDatabase.json');
const benchmarksOutputPath = path.resolve(__dirname, '../src/data/consumptionBenchmarks.json');

/**
 * Calcule l'estimation du State of Health (SoH %) moyen constaté sur le marché de l'occasion
 * selon l'année médiane du modèle et sa technologie thermique de batterie.
 */
function calculateEstimatedSoHPct(yearRange, modelId) {
  const currentYear = 2026;
  const match = (yearRange || '').match(/(\d{4})\s*-\s*(\d{4})/);
  const medianYear = match 
    ? Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2) 
    : 2021;
  const ageYears = Math.max(0.5, currentYear - medianYear);
  const initialLossPct = 2.5;
  let annualDegradationRate = 1.35; // Liquide actif régulé standard
  const lowerId = (modelId || '').toLowerCase();
  if (lowerId.includes('leaf')) {
    annualDegradationRate = 2.6; // Refroidissement passif sans clim
  } else if (lowerId.includes('zoe') || lowerId.includes('twingo') || lowerId.includes('czero')) {
    annualDegradationRate = 1.8; // Refroidissement air pulsé
  } else if (lowerId.includes('spring')) {
    annualDegradationRate = 1.7; // Petite batterie urbaine
  } else if (lowerId.includes('tesla') || lowerId.includes('model-3') || lowerId.includes('model-y')) {
    annualDegradationRate = 1.15; // Liquide haute précision
  }
  const totalLoss = initialLossPct + (Math.max(0, ageYears - 1) * annualDegradationRate);
  return Math.max(75, Math.round((100 - totalLoss) * 10) / 10);
}

function run() {
  console.log('\n=============================================================');
  console.log('  STOP-CARBURANT • BASE DE CONNAISSANCES CONSOMMATION RÉELLE');
  console.log('=============================================================\n');

  if (!fs.existsSync(lachaineevPath)) {
    console.error(`❌ Fichier d'observations introuvable : ${lachaineevPath}`);
    console.error(`👉 Veuillez exécuter d'abord : python3 scripts/scraper/scrape_lachaineev.py`);
    process.exit(1);
  }

  if (!fs.existsSync(evDatabasePath)) {
    console.error(`❌ Catalogue evDatabase.json introuvable : ${evDatabasePath}`);
    process.exit(1);
  }

  const lachaineevData = JSON.parse(fs.readFileSync(lachaineevPath, 'utf8'));
  const database = JSON.parse(fs.readFileSync(evDatabasePath, 'utf8'));

  const stats = lachaineevData.stats || {};
  const mappings = lachaineevData.catalogMappings || {};

  console.log(`📅 Relevé La Chaîne EV : ${lachaineevData.generatedAt}`);
  console.log(`🚗 Véhicules testés au total : ${lachaineevData.totalObservations}`);
  console.log(`🔗 Modèles appariés au catalogue : ${Object.keys(mappings).length}`);
  console.log(`📉 Décote moyenne globale mixte : ${stats.averageRangeDiscountMixedPct}%`);
  console.log(`🛣️ Décote moyenne autoroute 130 km/h : ${stats.averageRangeDiscountHighwayPct}%`);
  console.log(`⚡ Facteur de surconsommation réelle : ×${stats.averageConsoInflationFactor}\n`);

  const benchmarksByModel = {};
  let directMatchesCount = 0;
  let calibratedMatchesCount = 0;

  const updatedDatabase = database.map((car) => {
    const directTest = mappings[car.id];
    const segment = stats.segments?.[car.bodyType] || {
      rangeDiscountMixedPct: stats.averageRangeDiscountMixedPct || -12.5,
      rangeDiscountHighwayPct: stats.averageRangeDiscountHighwayPct || -35.0,
      consoInflationFactor: stats.averageConsoInflationFactor || 1.14,
    };

    const baselineNominalRealRange = car.nominalRealRangeKm || car.realRangeKm;
    const baselineNominalHighwayRange = car.nominalHighwayRangeKm || car.highwayRangeKm;
    let effectiveRealRange = baselineNominalRealRange;
    let effectiveRealConso = car.realConsoKwh100;
    let effectiveDiscountPct = 0;
    let isDirect = false;

    if (directTest && (directTest.realRangeKm || directTest.realConsoKwh100)) {
      isDirect = true;
      directMatchesCount++;

      // Si le test direct a mesuré un écart %, on l'enregistre
      const measuredDiscount = directTest.rangeDiscountPct ?? (
        directTest.wltpRangeKm && directTest.realRangeKm
          ? Math.round(((directTest.realRangeKm - directTest.wltpRangeKm) / directTest.wltpRangeKm) * 1000) / 10
          : segment.rangeDiscountMixedPct
      );

      if (baselineNominalRealRange && baselineNominalRealRange > 0 && baselineNominalRealRange <= car.wltpRangeKm) {
        effectiveRealRange = baselineNominalRealRange;
        effectiveRealConso = car.realConsoKwh100;
        effectiveDiscountPct = Math.round(((effectiveRealRange - car.wltpRangeKm) / car.wltpRangeKm) * 1000) / 10;
      } else if (directTest.realRangeKm && directTest.realRangeKm <= car.wltpRangeKm && (!directTest.wltpRangeKm || Math.abs(directTest.wltpRangeKm - car.wltpRangeKm) < 50)) {
        effectiveRealRange = directTest.realRangeKm;
        effectiveRealConso = car.realConsoKwh100 || Math.round((car.batteryNetKwh / effectiveRealRange) * 100 * 10) / 10;
        effectiveDiscountPct = Math.round(((effectiveRealRange - car.wltpRangeKm) / car.wltpRangeKm) * 1000) / 10;
      } else {
        effectiveDiscountPct = measuredDiscount <= 0 ? measuredDiscount : -Math.abs(measuredDiscount);
        effectiveRealRange = Math.round(car.wltpRangeKm * (1 + (effectiveDiscountPct / 100)));
        effectiveRealConso = car.realConsoKwh100 || Math.round((car.batteryNetKwh / effectiveRealRange) * 100 * 10) / 10;
      }
    } else {
      calibratedMatchesCount++;
      // Véhicule sans test direct La Chaîne EV :
      // Si déjà calibré avec ADEME / test IRL, on calcule son discount exact vs WLTP
      if (baselineNominalRealRange && baselineNominalRealRange > 0 && baselineNominalRealRange <= car.wltpRangeKm) {
        effectiveRealRange = baselineNominalRealRange;
        effectiveRealConso = car.realConsoKwh100;
        effectiveDiscountPct = Math.round(((effectiveRealRange - car.wltpRangeKm) / car.wltpRangeKm) * 1000) / 10;
      } else {
        // Sinon, application du coefficient moyen de décote du segment
        effectiveDiscountPct = segment.rangeDiscountMixedPct || -12.5;
        effectiveRealRange = Math.round(car.wltpRangeKm * (1 + (effectiveDiscountPct / 100)));
        effectiveRealConso = Math.round((car.batteryNetKwh / effectiveRealRange) * 100 * 10) / 10;
      }
    }

    const highwayRange = (isDirect && directTest?.highwayRangeKm && directTest.highwayRangeKm < effectiveRealRange)
      ? directTest.highwayRangeKm
      : (baselineNominalHighwayRange && baselineNominalHighwayRange < effectiveRealRange
          ? baselineNominalHighwayRange
          : Math.round(car.wltpRangeKm * (1 + (segment.rangeDiscountHighwayPct / 100))));

    const highwayConso = (isDirect && directTest?.highwayConsoKwh100)
      ? directTest.highwayConsoKwh100
      : Math.round((car.batteryNetKwh / highwayRange) * 100 * 10) / 10;

    const estimatedSoHPct = calculateEstimatedSoHPct(car.yearRange, car.id);
    const usableBatteryKwh = Math.round(car.batteryNetKwh * (estimatedSoHPct / 100) * 10) / 10;
    const nominalRealRangeKm = effectiveRealRange;
    const nominalHighwayRangeKm = highwayRange;

    // Autonomie réelle résiduelle constatée d'occasion tenant compte du vieillissement SoH
    const usedRealRangeKm = Math.round(nominalRealRangeKm * (estimatedSoHPct / 100));
    const usedHighwayRangeKm = Math.round(nominalHighwayRangeKm * (estimatedSoHPct / 100));

    benchmarksByModel[car.id] = {
      modelId: car.id,
      fullName: car.fullName,
      bodyType: car.bodyType,
      hasDirectIRLTest: isDirect,
      wltpRangeKm: car.wltpRangeKm,
      nominalRealRangeKm,
      nominalHighwayRangeKm,
      estimatedSoHPct,
      usableBatteryKwh,
      realRangeKm: usedRealRangeKm,
      highwayRangeKm: usedHighwayRangeKm,
      rangeDiscountPct: effectiveDiscountPct,
      realConsoKwh100: effectiveRealConso,
      highwayConsoKwh100: highwayConso,
      source: isDirect ? 'La Chaîne EV (Test IRL certifié)' : `Étalonné via coefficient IRL (${car.bodyType} : ${effectiveDiscountPct}%)`,
      testUrl: directTest?.url || 'https://www.lachaineev.fr',
    };

    return {
      ...car,
      nominalRealRangeKm,
      nominalHighwayRangeKm,
      estimatedSoHPct,
      usableBatteryKwh,
      realRangeKm: usedRealRangeKm,
      highwayRangeKm: usedHighwayRangeKm,
      realConsoKwh100: effectiveRealConso,
      highwayConsoKwh100: highwayConso,
      rangeDiscountPct: effectiveDiscountPct,
      hasDirectIRLTest: isDirect,
      source: isDirect
        ? `${car.source ? car.source.split(' & La Chaîne')[0] : 'OpenEV Data'} & La Chaîne EV (IRL)`
        : car.source,
    };
  });

  const benchmarkDataset = {
    generatedAt: new Date().toISOString(),
    source: 'https://www.lachaineev.fr & OpenEV Data',
    description: 'Référentiel des écarts réels WLTP vs IRL et facteurs de correction pour Stop-Carburant.fr',
    globalStats: {
      averageRangeDiscountMixedPct: stats.averageRangeDiscountMixedPct,
      averageRangeDiscountHighwayPct: stats.averageRangeDiscountHighwayPct,
      averageConsoInflationFactor: stats.averageConsoInflationFactor,
      segments: stats.segments,
    },
    totalModels: updatedDatabase.length,
    directMatchesCount,
    calibratedMatchesCount,
    models: benchmarksByModel,
  };

  // 1. Sauvegarde du fichier de benchmark
  fs.writeFileSync(benchmarksOutputPath, JSON.stringify(benchmarkDataset, null, 2), 'utf8');
  console.log(`💾 Base de connaissances enregistrée dans : ${benchmarksOutputPath}`);

  // 2. Mise à jour de evDatabase.json
  fs.writeFileSync(evDatabasePath, JSON.stringify(updatedDatabase, null, 2), 'utf8');
  console.log(`💾 Catalogue 'src/data/evDatabase.json' synchronisé avec les données IRL (Total : ${updatedDatabase.length}).`);

  console.log('\n📊 Bilan de la base de connaissances :');
  console.log(`   - Modèles avec test direct La Chaîne EV : ${directMatchesCount}`);
  console.log(`   - Modèles étalonnés via décote de segment : ${calibratedMatchesCount}`);
  console.log('   => 100% du catalogue dispose d\'un coefficient de correction garanti.\n');
}

run();
