import benchmarksData from '../data/consumptionBenchmarks.json';
import { OpenDataEVModel } from '../services/evDatabaseService';

export interface SegmentCorrectionFactors {
  sampleCount: number;
  rangeDiscountMixedPct: number;
  rangeDiscountHighwayPct: number;
  consoInflationFactor: number;
}

export interface CorrectedVehicleSpecs {
  wltpRangeKm: number;
  realRangeKm: number;
  nominalRealRangeKm?: number;
  estimatedSoHPct?: number;
  usableBatteryKwh?: number;
  realConsoKwh100: number;
  highwayRangeKm: number;
  highwayConsoKwh100: number;
  rangeDiscountPct: number;
  hasDirectIRLTest: boolean;
  sourceText: string;
  badgeText: string;
}

export const CONSUMPTION_BENCHMARKS = benchmarksData;

/**
 * Calcule l'estimation du State of Health (SoH %) moyen constaté sur le marché de l'occasion
 * selon l'année médiane du modèle et sa technologie thermique de batterie.
 */
export function calculateEstimatedSoHPct(yearRange?: string, modelId?: string): number {
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

/**
 * Récupère les facteurs de correction statistiques pour un type de carrosserie
 */
export function getSegmentCorrection(bodyType?: string): SegmentCorrectionFactors {
  const segments = (CONSUMPTION_BENCHMARKS.globalStats?.segments || {}) as Record<string, SegmentCorrectionFactors>;
  const key = (bodyType || 'compacte').toLowerCase();
  
  if (segments[key]) {
    return segments[key];
  }

  // Fallback sur la moyenne globale
  return {
    sampleCount: CONSUMPTION_BENCHMARKS.totalModels || 37,
    rangeDiscountMixedPct: CONSUMPTION_BENCHMARKS.globalStats?.averageRangeDiscountMixedPct ?? -8.85,
    rangeDiscountHighwayPct: CONSUMPTION_BENCHMARKS.globalStats?.averageRangeDiscountHighwayPct ?? -31.1,
    consoInflationFactor: CONSUMPTION_BENCHMARKS.globalStats?.averageConsoInflationFactor ?? 1.097,
  };
}

/**
 * Calcule les spécifications réelles (IRL) à partir des données constructeur pures (WLTP)
 * en appliquant le coefficient de décote mesuré par La Chaîne EV.
 */
export function applyCorrectionToConstructorData(
  wltpRangeKm: number,
  batteryNetKwh: number,
  bodyType?: string
): {
  realRangeKm: number;
  realConsoKwh100: number;
  highwayRangeKm: number;
  highwayConsoKwh100: number;
  rangeDiscountPct: number;
} {
  const safeWltp = Math.max(50, wltpRangeKm);
  const safeBattery = Math.max(10, batteryNetKwh);
  const segment = getSegmentCorrection(bodyType);

  const rangeDiscountPct = segment.rangeDiscountMixedPct;
  const realRangeKm = Math.round(safeWltp * (1 + (rangeDiscountPct / 100)));
  const realConsoKwh100 = Math.round((safeBattery / realRangeKm) * 100 * 10) / 10;

  const highwayRangeKm = Math.round(safeWltp * (1 + (segment.rangeDiscountHighwayPct / 100)));
  const highwayConsoKwh100 = Math.round((safeBattery / highwayRangeKm) * 100 * 10) / 10;

  return {
    realRangeKm,
    realConsoKwh100,
    highwayRangeKm,
    highwayConsoKwh100,
    rangeDiscountPct,
  };
}

/**
 * Détermine les spécifications réelles étalonnées pour un véhicule :
 * - Si le véhicule possède un test direct La Chaîne EV, utilise la mesure exacte.
 * - Sinon, applique le coefficient de décote IRL du segment aux données constructeur.
 */
export function getCorrectedVehicleSpecs(
  vehicle: Partial<OpenDataEVModel>
): CorrectedVehicleSpecs {
  const modelId = vehicle.id;
  const modelBenchmark = modelId ? (CONSUMPTION_BENCHMARKS.models as Record<string, any>)?.[modelId] : null;
  const estimatedSoHPct = vehicle.estimatedSoHPct ?? modelBenchmark?.estimatedSoHPct ?? calculateEstimatedSoHPct(vehicle.yearRange, modelId);
  const battery = vehicle.batteryNetKwh || 50;
  const usableBatteryKwh = vehicle.usableBatteryKwh ?? modelBenchmark?.usableBatteryKwh ?? (Math.round(battery * (estimatedSoHPct / 100) * 10) / 10);

  // 1. Cas : Mesure directe certifiée par La Chaîne EV
  if (vehicle.hasDirectIRLTest || modelBenchmark?.hasDirectIRLTest) {
    const nominalRealRange = vehicle.nominalRealRangeKm || modelBenchmark?.nominalRealRangeKm || vehicle.realRangeKm || modelBenchmark?.realRangeKm || 300;
    const realRange = vehicle.realRangeKm || modelBenchmark?.realRangeKm || Math.round(nominalRealRange * (estimatedSoHPct / 100));
    const realConso = vehicle.realConsoKwh100 || modelBenchmark?.realConsoKwh100 || 15.5;
    const wltp = vehicle.wltpRangeKm || modelBenchmark?.wltpRangeKm || nominalRealRange;
    const discount = vehicle.rangeDiscountPct ?? modelBenchmark?.rangeDiscountPct ?? (Math.round(((nominalRealRange - wltp) / wltp) * 1000) / 10);
    const nominalHighwayRange = vehicle.nominalHighwayRangeKm || modelBenchmark?.nominalHighwayRangeKm || vehicle.highwayRangeKm || modelBenchmark?.highwayRangeKm || Math.round(nominalRealRange * 0.75);
    const highwayRange = vehicle.highwayRangeKm || modelBenchmark?.highwayRangeKm || Math.round(nominalHighwayRange * (estimatedSoHPct / 100));
    const highwayConso = vehicle.highwayConsoKwh100 || modelBenchmark?.highwayConsoKwh100 || Math.round(realConso * 1.3 * 10) / 10;

    const formattedDiscount = discount <= 0 ? `${discount}%` : `+${discount}%`;

    return {
      wltpRangeKm: wltp,
      nominalRealRangeKm: nominalRealRange,
      estimatedSoHPct,
      usableBatteryKwh,
      realRangeKm: realRange,
      realConsoKwh100: realConso,
      highwayRangeKm: highwayRange,
      highwayConsoKwh100: highwayConso,
      rangeDiscountPct: discount,
      hasDirectIRLTest: true,
      sourceText: 'Mesure directe certifiée La Chaîne EV (Test IRL)',
      badgeText: 'Mesure réelle sur route (La Chaîne EV)',
    };
  }

  // 2. Cas : Véhicule sans mesure directe -> application du coefficient de décote du segment
  const wltp = vehicle.wltpRangeKm || 350;
  const corrected = applyCorrectionToConstructorData(wltp, battery, vehicle.bodyType);
  const formattedDiscount = corrected.rangeDiscountPct <= 0 ? `${corrected.rangeDiscountPct}%` : `+${corrected.rangeDiscountPct}%`;
  const nominalRealRange = vehicle.nominalRealRangeKm || corrected.realRangeKm;
  const nominalHighwayRange = vehicle.nominalHighwayRangeKm || corrected.highwayRangeKm;
  const realRange = vehicle.realRangeKm || Math.round(nominalRealRange * (estimatedSoHPct / 100));
  const highwayRange = vehicle.highwayRangeKm || Math.round(nominalHighwayRange * (estimatedSoHPct / 100));

  return {
    wltpRangeKm: wltp,
    nominalRealRangeKm: nominalRealRange,
    estimatedSoHPct,
    usableBatteryKwh,
    realRangeKm: realRange,
    realConsoKwh100: vehicle.realConsoKwh100 || corrected.realConsoKwh100,
    highwayRangeKm: highwayRange,
    highwayConsoKwh100: vehicle.highwayConsoKwh100 || corrected.highwayConsoKwh100,
    rangeDiscountPct: corrected.rangeDiscountPct,
    hasDirectIRLTest: false,
    sourceText: `Étalonné via mesures réelles La Chaîne EV (${vehicle.bodyType || 'segment'})`,
    badgeText: 'Autonomie réelle étalonnée',
  };
}

/**
 * Génère le libellé de certification de données réelles pour un véhicule.
 * Exemples :
 * - "Mesure réelle sur route (La Chaîne EV) • Santé batterie ~85%" si mesure directe
 * - "Autonomie réelle étalonnée • Santé batterie ~92%" si estimation segment
 */
export function getVehicleCorrectionBadge(car: {
  rangeDiscountPct?: number;
  hasDirectIRLTest?: boolean;
  estimatedSoHPct?: number;
}): string | undefined {
  if (car.rangeDiscountPct === undefined) return undefined;
  const baseTestStr = car.hasDirectIRLTest
    ? 'Mesure réelle sur route (La Chaîne EV)'
    : 'Autonomie réelle étalonnée';

  if (car.estimatedSoHPct && car.estimatedSoHPct < 99) {
    return `${baseTestStr} • Santé batterie ~${Math.round(car.estimatedSoHPct)}%`;
  }

  return baseTestStr;
}
