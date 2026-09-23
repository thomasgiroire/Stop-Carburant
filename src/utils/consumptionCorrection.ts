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

  // 1. Cas : Mesure directe certifiée par La Chaîne EV
  if (vehicle.hasDirectIRLTest || modelBenchmark?.hasDirectIRLTest) {
    const realRange = vehicle.realRangeKm || modelBenchmark?.realRangeKm || 300;
    const realConso = vehicle.realConsoKwh100 || modelBenchmark?.realConsoKwh100 || 15.5;
    const wltp = vehicle.wltpRangeKm || modelBenchmark?.wltpRangeKm || realRange;
    const discount = vehicle.rangeDiscountPct ?? modelBenchmark?.rangeDiscountPct ?? (Math.round(((realRange - wltp) / wltp) * 1000) / 10);
    const highwayRange = vehicle.highwayRangeKm || modelBenchmark?.highwayRangeKm || Math.round(realRange * 0.75);
    const highwayConso = vehicle.highwayConsoKwh100 || modelBenchmark?.highwayConsoKwh100 || Math.round(realConso * 1.3 * 10) / 10;

    const formattedDiscount = discount <= 0 ? `${discount}%` : `+${discount}%`;

    return {
      wltpRangeKm: wltp,
      realRangeKm: realRange,
      realConsoKwh100: realConso,
      highwayRangeKm: highwayRange,
      highwayConsoKwh100: highwayConso,
      rangeDiscountPct: discount,
      hasDirectIRLTest: true,
      sourceText: 'Mesure directe certifiée La Chaîne EV (Test IRL)',
      badgeText: `IRL certifié ${formattedDiscount} vs WLTP`,
    };
  }

  // 2. Cas : Véhicule sans mesure directe -> application du coefficient de décote du segment
  const wltp = vehicle.wltpRangeKm || 350;
  const battery = vehicle.batteryNetKwh || (wltp * 0.16);
  const corrected = applyCorrectionToConstructorData(wltp, battery, vehicle.bodyType);
  const formattedDiscount = corrected.rangeDiscountPct <= 0 ? `${corrected.rangeDiscountPct}%` : `+${corrected.rangeDiscountPct}%`;

  return {
    wltpRangeKm: wltp,
    realRangeKm: vehicle.realRangeKm || corrected.realRangeKm,
    realConsoKwh100: vehicle.realConsoKwh100 || corrected.realConsoKwh100,
    highwayRangeKm: vehicle.highwayRangeKm || corrected.highwayRangeKm,
    highwayConsoKwh100: vehicle.highwayConsoKwh100 || corrected.highwayConsoKwh100,
    rangeDiscountPct: corrected.rangeDiscountPct,
    hasDirectIRLTest: false,
    sourceText: `Étalonné via coefficient IRL La Chaîne EV (${vehicle.bodyType || 'segment'} : ${formattedDiscount})`,
    badgeText: `Corrigé IRL ${formattedDiscount} vs WLTP`,
  };
}

/**
 * Génère le libellé du badge de certification IRL pour un véhicule
 * Exemples :
 * - "IRL certifié -8.5% vs WLTP (La Chaîne EV)" si mesure directe
 * - "Étalonné -9.8% vs WLTP (coefficient IRL)" si estimation segment
 */
export function getVehicleCorrectionBadge(car: {
  rangeDiscountPct?: number;
  hasDirectIRLTest?: boolean;
}): string | undefined {
  if (car.rangeDiscountPct === undefined) return undefined;
  const discountStr = car.rangeDiscountPct <= 0 ? `${car.rangeDiscountPct}%` : `+${car.rangeDiscountPct}%`;
  return car.hasDirectIRLTest
    ? `IRL certifié ${discountStr} vs WLTP (La Chaîne EV)`
    : `Étalonné ${discountStr} vs WLTP (coefficient IRL)`;
}
