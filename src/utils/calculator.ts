import { CONSTANTS } from '../constants';
import { CalculationResult, HousingType, ElecTarifMode } from '../types';
import { EnergyPrices, DEFAULT_PRICES } from '../services/energyPrices';

/**
 * Calcule les indicateurs financiers personnalisés
 * Le montant en Étape 1 (budget carburant) combiné au kilométrage quotidien en Étape 2
 * permet de déduire le coût réel de l'utilisateur aux 100 km, sa consommation équivalente,
 * et d'ajuster avec précision le coût de recharge électrique et le cash libéré.
 *
 * Règle tarifaire :
 * Calcule toujours le coût de recharge à domicile en Heures Pleines (HP) et en Heures Creuses (HC).
 */
export function calculateSimulation(
  fuelBudget: number,
  housing: HousingType = 'maison',
  dailyKm: number = 50,
  prices: EnergyPrices = DEFAULT_PRICES,
  forcedTarif?: ElecTarifMode,
  customConsoElec?: number
): CalculationResult {
  const safeFuelBudget = Math.max(10, fuelBudget);
  const currentFuelPrice = prices.fuelPrice || CONSTANTS.P_CARB;
  const safeDailyKm = Math.max(1, dailyKm);

  // Consommation électrique réelle du véhicule (ou valeur moyenne réelle La Chaîne EV)
  const effectiveConsoElec = customConsoElec && customConsoElec > 0 ? customConsoElec : CONSTANTS.C_ELEC;

  // Kilométrage mensuel global déduit des kilomètres quotidiens
  // Basé sur l'utilisation réelle du véhicule (~5,5 jours/semaine = 24 jours équivalents/mois incluant travail, courses, école et week-ends)
  const drivingDays = CONSTANTS.DRIVING_DAYS_PER_MONTH || CONSTANTS.WORKING_DAYS_PER_MONTH || 24;
  const monthlyKm = Math.max(30, Math.round(safeDailyKm * drivingDays));

  // Consommation thermique équivalente déduite (en L / 100 km, encadrée entre 4,0 L et 12,0 L / 100 km)
  const minConso = CONSTANTS.MIN_CONSUMPTION_L ?? 4.0;
  const maxConso = CONSTANTS.MAX_CONSUMPTION_L ?? 12.0;
  const rawCostPer100Km = (safeFuelBudget / monthlyKm) * 100;
  const rawConsumptionLiters = rawCostPer100Km / currentFuelPrice;
  const isConsumptionCappedMin = rawConsumptionLiters < minConso;
  const isConsumptionCappedMax = rawConsumptionLiters > maxConso;
  const userConsumptionLiters = Math.min(maxConso, Math.max(minConso, rawConsumptionLiters));

  // Règle de cohérence stricte : Coût aux 100 km = Conso retenue (L/100 km) × Prix carburant (€/L)
  // Si la consommation est plafonnée, le coût aux 100 km est immédiatement ajusté à cette consommation
  const userCostPer100Km = userConsumptionLiters * currentFuelPrice;

  // Tarifs de l'électricité à domicile :
  // Tarif fixe EDF standard (Option Base ~0,20 €/kWh) vs Heures Creuses la nuit (~0,16 €/kWh)
  const pricePerKwhHP = housing === 'maison'
    ? (prices.electricityHomeHP || prices.electricityHome || CONSTANTS.P_DOM_HP || CONSTANTS.P_DOM || 0.2001)
    : (prices.electricityPublic || CONSTANTS.P_PUB);

  const pricePerKwhHC = housing === 'maison'
    ? (prices.electricityHomeHC || CONSTANTS.P_DOM_HC || 0.1612)
    : (prices.electricityPublic || CONSTANTS.P_PUB);

  // Coûts électriques aux 100 km basés sur la consommation réelle constatée (La Chaîne EV)
  const electricCostPer100KmHP = effectiveConsoElec * pricePerKwhHP;
  const electricCostPer100KmHC = effectiveConsoElec * pricePerKwhHC;

  // Coût mensuel de recharge électrique pour ce kilométrage exact
  const subscription = housing === 'appartement' ? (prices.publicSubscription ?? 12) : 0;
  const electricityCostHP = ((monthlyKm / 100) * electricCostPer100KmHP) + subscription;
  const electricityCostHC = ((monthlyKm / 100) * electricCostPer100KmHC) + subscription;

  // Tarif actif (par défaut Heures Pleines sauf si forcé en HC)
  const activeTarif: ElecTarifMode = forcedTarif || 'HP';
  const electricityCost = activeTarif === 'HC' ? electricityCostHC : electricityCostHP;
  const electricCostPer100Km = activeTarif === 'HC' ? electricCostPer100KmHC : electricCostPer100KmHP;

  // Économie directe aux 100 km
  const savingsPer100Km = Math.max(0, userCostPer100Km - electricCostPer100Km);

  // Perte financière sur 5 ans (60 mois de carburant littéralement brûlé)
  const loss5Years = safeFuelBudget * 60;

  // Litres de carburant brûlés chaque mois
  const fuelLitersMonthly = safeFuelBudget / currentFuelPrice;

  // Gain d'entretien thermique (fourchette basse) : 0,015 € / km (~1,50 € / 100 km, minimum 15 €/mois, arrondi au pas de 5 €)
  // Basé sur l'absence de vidange moteur, courroie, bougies, turbo et usure des freins divisée par 3 grâce à la régénération
  const maintRate = CONSTANTS.G_ENT_PER_KM ?? 0.015;
  const minMaint = CONSTANTS.MIN_MAINTENANCE_SAVINGS ?? 15;
  const maintenanceSavings = Math.max(minMaint, Math.round((monthlyKm * maintRate) / 5) * 5);

  // Cash net libéré par mois (budget carburant réalloué - recharge électrique + économies d'entretien fourchette basse)
  const liberatedCash = Math.max(0, safeFuelBudget - electricityCost + maintenanceSavings);
  const carLeaseBudget = liberatedCash;

  return {
    fuelBudget: Math.round(safeFuelBudget),
    monthlyKm: Math.round(monthlyKm),
    loss5Years: Math.round(loss5Years),
    fuelLitersMonthly: Math.round(fuelLitersMonthly),
    electricityCost: Math.round(electricityCost),
    electricityCostHP: Math.round(electricityCostHP),
    electricityCostHC: Math.round(electricityCostHC),
    activeTarif,
    isProfitabilityUnlockedByHC: false,
    maintenanceSavings: Math.round(maintenanceSavings),
    liberatedCash: Math.round(liberatedCash),
    carLeaseBudget: Math.round(carLeaseBudget),
    housing,
    dailyKm: safeDailyKm,
    consoElec: effectiveConsoElec,
    userCostPer100Km: Number(userCostPer100Km.toFixed(2)),
    electricCostPer100Km: Number(electricCostPer100Km.toFixed(2)),
    electricCostPer100KmHP: Number(electricCostPer100KmHP.toFixed(2)),
    electricCostPer100KmHC: Number(electricCostPer100KmHC.toFixed(2)),
    userConsumptionLiters: Number(userConsumptionLiters.toFixed(1)),
    rawConsumptionLiters: Number(rawConsumptionLiters.toFixed(1)),
    isConsumptionCappedMin,
    isConsumptionCappedMax,
    savingsPer100Km: Number(savingsPer100Km.toFixed(2)),
  };
}

/**
 * Calcule le kilométrage journalier implicite déduit du budget carburant (sur base jours travaillés en France, arrondi par tranche de 5 km)
 */
export function calculateImplicitDailyKm(fuelBudget: number, fuelPrice: number = CONSTANTS.P_CARB): number {
  const safeBudget = Math.max(10, fuelBudget);
  const drivingDays = CONSTANTS.DRIVING_DAYS_PER_MONTH || CONSTANTS.WORKING_DAYS_PER_MONTH || 24;
  const monthlyKm = (safeBudget / fuelPrice) * (100 / CONSTANTS.C_THERM);
  const rawDaily = monthlyKm / drivingDays;
  const rounded = Math.round(rawDaily / 5) * 5;
  return Math.min(400, Math.max(10, rounded));
}

export interface FuelBudgetRange {
  minBudget: number;
  maxBudget: number;
  medianBudget: number;
}

/**
 * Extrapole la fourchette de budget carburant mensuel probable en fonction du kilométrage quotidien et du prix du carburant.
 * - Basé sur un rythme moyen d'utilisation (~24 à 28 jours/mois)
 * - Fourchette de consommation thermique réaliste :
 *   - Basse (véhicule sobre / diesel / route fluide) : ~5.5 L / 100 km
 *   - Moyenne (parc moyen français) : ~6.5 L / 100 km (CONSTANTS.C_THERM)
 *   - Haute (essence urbaine / SUV / trajets courts fréquents) : ~7.5 L / 100 km
 * Arrondi au pas de 10 € pour coïncider avec les crans du slider.
 */
export function estimateMonthlyFuelBudget(
  dailyKm: number,
  fuelPrice: number = CONSTANTS.P_CARB
): FuelBudgetRange {
  const safeDailyKm = Math.max(10, dailyKm);
  const safePrice = Math.max(0.5, fuelPrice);

  // Estimation basse : 5.5 L/100 km sur 24 jours
  const rawMin = safeDailyKm * 24 * 0.055 * safePrice;
  // Estimation médiane : 6.5 L/100 km sur 24 jours (référence C_THERM)
  const rawMedian = safeDailyKm * 24 * (CONSTANTS.C_THERM / 100) * safePrice;
  // Estimation haute : 7.5 L/100 km sur 27 jours (usage quotidien intensif / ville)
  const rawMax = safeDailyKm * 27 * 0.075 * safePrice;

  const minBudget = Math.min(650, Math.max(30, Math.round(rawMin / 10) * 10));
  const medianBudget = Math.min(650, Math.max(minBudget, Math.round(rawMedian / 10) * 10));
  const maxBudget = Math.min(650, Math.max(Math.min(650, medianBudget + 10), Math.round(rawMax / 10) * 10));

  return {
    minBudget,
    maxBudget,
    medianBudget,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export const SMIC_NET_MENSUEL = 1426;

export interface SurplusEquivalent {
  type: 'smic' | 'mobile' | 'internet' | 'cinema' | 'groceries';
  prefix: string;
  highlight: string;
  suffix: string;
  fullText: string;
}

/**
 * Calcule l'équivalent concret ou le nombre de mois de salaire pour un gain mensuel donné.
 * Règle : Si le gain annuel est inférieur à 1 mois de SMIC net (< 1 426 €/an, soit ~119 €/mois),
 * on ne parle pas de "mois de salaire", on affiche un équivalent concret du quotidien :
 * - < 25 €/mois : Forfait mobile
 * - 25 à 49 €/mois : Box internet
 * - 50 à 85 €/mois (ex: 55 €) : Sortie ciné en famille
 * - 86 à 118 €/mois : Un caddie de courses
 */
export function getSurplusEquivalent(monthlySurplus: number): SurplusEquivalent {
  const annualSurplus = Math.round(monthlySurplus * 12);
  const smicRatio = annualSurplus / SMIC_NET_MENSUEL;

  if (smicRatio >= 1.0) {
    const rawRatio = smicRatio.toFixed(1).replace('.', ',');
    const displayRatio = rawRatio.endsWith(',0') ? rawRatio.slice(0, -2) : rawRatio;
    return {
      type: 'smic',
      prefix: "Soit l'équivalent de",
      highlight: `${displayRatio} mois de salaire par an`,
      suffix: ' !',
      fullText: `Soit l'équivalent de ${displayRatio} mois de salaire par an !`,
    };
  }

  if (monthlySurplus < 25) {
    return {
      type: 'mobile',
      prefix: "Soit l'équivalent de votre",
      highlight: 'forfait mobile chaque mois',
      suffix: ' !',
      fullText: "Soit l'équivalent de votre forfait mobile chaque mois !",
    };
  }

  if (monthlySurplus < 50) {
    return {
      type: 'internet',
      prefix: "Soit l'équivalent de votre",
      highlight: 'box internet chaque mois',
      suffix: ' !',
      fullText: "Soit l'équivalent de votre box internet chaque mois !",
    };
  }

  if (monthlySurplus < 86) {
    return {
      type: 'cinema',
      prefix: "Soit l'équivalent d'une",
      highlight: 'sortie ciné en famille chaque mois',
      suffix: ' !',
      fullText: "Soit l'équivalent d'une sortie ciné en famille chaque mois !",
    };
  }

  return {
    type: 'groceries',
    prefix: "Soit l'équivalent d'un",
    highlight: 'caddie de courses chaque mois',
    suffix: ' !',
    fullText: "Soit l'équivalent d'un caddie de courses chaque mois !",
  };
}
