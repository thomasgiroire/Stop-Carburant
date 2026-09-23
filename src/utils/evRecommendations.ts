import { calculateEVFinancing, LoanRateMode } from './loanCalculations';
import { EVDatabaseService } from '../services/evDatabaseService';
import { getVehicleCorrectionBadge } from './consumptionCorrection';

export interface DailyUsageAdvice {
  pattern: 'nocturne_couvre' | 'nocturne_reserve_weekend' | 'batterie_recharge_espacee';
  title: string;
  badge: string;
  text: string;
}

export interface UsedEVRecommendation {
  model: string;
  yearRange: string;
  bodyType?: 'citadine' | 'compacte' | 'berline' | 'break' | 'suv';
  batteryGrossKwh?: number;
  batteryNetKwh?: number;
  wltpRangeKm?: number;
  realRangeKm: number;
  realConsoKwh100: number; // Consommation électrique réelle mixte (La Chaîne EV)
  highwayRangeKm?: number;
  highwayConsoKwh100?: number;
  rangeDiscountPct?: number; // % décote WLTP vs réel constaté
  hasDirectIRLTest?: boolean;
  correctionBadge?: string;
  monthlyFinancing5Years: number; // Mensualité sur 5 ans (60 mois)
  estimatedMarketPrice: number; // Prix d'achat d'occasion constaté
  leboncoinSampleText: string; // Référence constatée sur Leboncoin
  description: string;
  chargeTimeNote: string;
  strategyBadge: string;
  dailyAdvice?: DailyUsageAdvice;
}

export type EVTier = 'economy' | 'recommended';

export interface TieredEVRecommendations {
  recommended: UsedEVRecommendation;
  economy: UsedEVRecommendation;
}

export interface LeboncoinAdSample {
  id: string;
  title: string;
  price: number;
  monthlyDealer?: number; // mensualité concessionnaire indiquée sur Leboncoin (ex: "dès 260 €/mois")
  calculatedMonthly60m: number; // calculé formule standard 60 mois 0€ apport 4.9%
  year: number;
  km: number;
  location: string;
  batteryInfo?: string;
  badge?: string; // "Bonne affaire", "Prix équitable", "Pro", "Occasion récente"
  category: 'Moins de 8 000 €' | '10 000 € à 18 000 €' | 'Plus de 19 000 €';
}

/**
 * Échantillon d'annonces réelles constatées sur Leboncoin
 * issu du relevé direct du marché de l'occasion en France.
 */
export const LEBONCOIN_PRICE_SAMPLES: LeboncoinAdSample[] = [
  // Moins de 8 000 €
  {
    id: 'zoe-2020-5000',
    title: 'Renault Zoé Life R110',
    price: 5000,
    calculatedMonthly60m: 94,
    year: 2020,
    km: 96382,
    location: 'Particulier',
    batteryInfo: '52 kWh (310 km réels)',
    badge: 'Bonne affaire',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'ion-2016-5000',
    title: 'Peugeot iOn 100% électrique',
    price: 5000,
    calculatedMonthly60m: 94,
    year: 2016,
    km: 39488,
    location: 'Particulier',
    batteryInfo: '14.5 kWh (faible km)',
    badge: 'Ultra petit budget',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'czero-2019-5000',
    title: 'Citroën C-Zéro Confort',
    price: 5000,
    calculatedMonthly60m: 94,
    year: 2019,
    km: 62300,
    location: 'Particulier',
    batteryInfo: '14.5 kWh',
    badge: 'Petit budget',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'leaf-2016-5100',
    title: 'Nissan Leaf 30 kWh',
    price: 5100,
    calculatedMonthly60m: 96,
    year: 2016,
    km: 95000,
    location: 'Particulier',
    batteryInfo: '30 kWh',
    badge: 'Prix équitable',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'kangoo-2016-5300',
    title: 'Renault Kangoo Z.E. (Batterie incluse)',
    price: 5300,
    calculatedMonthly60m: 100,
    year: 2016,
    km: 64000,
    location: 'Pro',
    batteryInfo: '22 kWh',
    badge: 'Très bonne affaire',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'czero-2020-5940',
    title: 'Citroën C-Zero Confort',
    price: 5940,
    calculatedMonthly60m: 112,
    year: 2020,
    km: 56683,
    location: 'Pro',
    batteryInfo: '14.5 kWh',
    badge: 'Garantie Pro',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'smart-2014-5990',
    title: 'Smart Fortwo Coupé Electric Drive',
    price: 5990,
    calculatedMonthly60m: 113,
    year: 2014,
    km: 73000,
    location: 'Pro',
    batteryInfo: '17.6 kWh (batterie incluse)',
    badge: 'Pro',
    category: 'Moins de 8 000 €',
  },
  {
    id: 'spring-2022-7500',
    title: 'Dacia Spring Confort Plus (27 kWh)',
    price: 7500,
    calculatedMonthly60m: 141,
    year: 2022,
    km: 46000,
    location: 'Pro',
    batteryInfo: '27 kWh (180 km réels)',
    badge: 'Bonne affaire',
    category: 'Moins de 8 000 €',
  },

  // 10 000 € à 18 000 €
  {
    id: 'zoe-2021-12490',
    title: 'Renault Zoé Intens R110 (52 kWh)',
    price: 12490,
    calculatedMonthly60m: 235,
    year: 2021,
    km: 55000,
    location: 'Renault Renew (Pro)',
    batteryInfo: '52 kWh (310 km réels)',
    badge: 'Pro',
    category: '10 000 € à 18 000 €',
  },
  {
    id: 'fiat500-2023-15990',
    title: 'Fiat 500e 95ch Pack Confort',
    price: 15990,
    calculatedMonthly60m: 301,
    year: 2023,
    km: 17700,
    location: 'Pro',
    batteryInfo: '24 kWh',
    badge: 'Occasion récente',
    category: '10 000 € à 18 000 €',
  },
  {
    id: 'spring-2026-16480',
    title: 'Dacia Spring 65 EXTREME',
    price: 16480,
    calculatedMonthly60m: 310,
    year: 2026,
    km: 10,
    location: 'Trégueux (22)',
    batteryInfo: '27 kWh (230 km WLTP)',
    badge: 'À la une',
    category: '10 000 € à 18 000 €',
  },
  {
    id: 'e208-2020-16900',
    title: 'Peugeot e-208 50 kWh 136ch Active Business',
    price: 16900,
    calculatedMonthly60m: 318,
    year: 2020,
    km: 12400,
    location: 'Spoticar (Pro)',
    batteryInfo: '50 kWh (290 km réels)',
    badge: 'Faible kilométrage',
    category: '10 000 € à 18 000 €',
  },
  {
    id: 'e208-2021-16900',
    title: 'Peugeot e-208 50 kWh 136ch Allure',
    price: 16900,
    calculatedMonthly60m: 318,
    year: 2021,
    km: 35500,
    location: 'Pro',
    batteryInfo: '50 kWh (290 km réels)',
    badge: 'Garantie Pro',
    category: '10 000 € à 18 000 €',
  },
  {
    id: 'fiat500-2023-18990',
    title: 'Fiat 500e 118ch RED (42 kWh)',
    price: 18990,
    calculatedMonthly60m: 358,
    year: 2023,
    km: 18754,
    location: 'Pro',
    batteryInfo: '42 kWh (250 km réels)',
    badge: 'Pro',
    category: '10 000 € à 18 000 €',
  },

  // Plus de 19 000 €
  {
    id: 'megane-2023-19499',
    title: 'Renault Mégane E-Tech EV40 130ch Techno',
    price: 19499,
    calculatedMonthly60m: 367,
    year: 2023,
    km: 30108,
    location: 'Renault Renew',
    batteryInfo: '40 kWh (300 km réels)',
    badge: 'À la une',
    category: 'Plus de 19 000 €',
  },
  {
    id: 'megane-2023-25000',
    title: 'Renault Mégane E-Tech EV60 220ch Optimum',
    price: 25000,
    calculatedMonthly60m: 471,
    year: 2023,
    km: 48000,
    location: 'Pro',
    batteryInfo: '60 kWh (370 km réels)',
    badge: 'Prix équitable',
    category: 'Plus de 19 000 €',
  },
  {
    id: 'tesla-2021-26990',
    title: 'Tesla Model 3 Long Range Dual Motor',
    price: 26990,
    calculatedMonthly60m: 508,
    year: 2021,
    km: 80000,
    location: 'Colombes (92)',
    batteryInfo: '75 kWh (520 km réels)',
    badge: '462 ch Dual Motor',
    category: 'Plus de 19 000 €',
  },
  {
    id: 'eqa-2022-27990',
    title: 'Mercedes-Benz EQA 190 Progressive Line',
    price: 27990,
    calculatedMonthly60m: 527,
    year: 2022,
    km: 52000,
    location: 'Mercedes-Benz Certified',
    batteryInfo: '66.5 kWh (420 km réels)',
    badge: 'Garantie Pro',
    category: 'Plus de 19 000 €',
  },
  {
    id: 'kona-2026-34990',
    title: 'Hyundai Kona Electrique 65 kWh N Line',
    price: 34990,
    calculatedMonthly60m: 659,
    year: 2026,
    km: 3000,
    location: 'SUMA Motors Nevers',
    batteryInfo: '65 kWh (484 km WLTP)',
    badge: 'Occasion récente',
    category: 'Plus de 19 000 €',
  },
  {
    id: 'tesla-2022-35900',
    title: 'Tesla Model 3 Performance AWD',
    price: 35900,
    calculatedMonthly60m: 676,
    year: 2022,
    km: 44600,
    location: 'Pro',
    batteryInfo: '78 kWh (510 ch)',
    badge: 'Performance AWD',
    category: 'Plus de 19 000 €',
  },
  {
    id: 'ev6-2025-36940',
    title: 'Kia EV6 229ch Air Active 2WD',
    price: 36940,
    calculatedMonthly60m: 696,
    year: 2025,
    km: 11000,
    location: 'Kia Occasion',
    batteryInfo: '77.4 kWh (528 km)',
    badge: 'Garantie 7 ans',
    category: 'Plus de 19 000 €',
  },
];

/**
 * Structure de base d'un modèle de véhicule électrique d'occasion dans le catalogue.
 */
export interface EVModelData {
  model: string;
  yearRange: string;
  bodyType?: 'citadine' | 'compacte' | 'berline' | 'break' | 'suv';
  batteryGrossKwh?: number;
  batteryNetKwh?: number;
  wltpRangeKm?: number;
  realRangeKm: number;
  realConsoKwh100: number; // Consommation réelle mixte (La Chaîne EV)
  highwayRangeKm?: number;
  highwayConsoKwh100?: number;
  rangeDiscountPct?: number;
  hasDirectIRLTest?: boolean;
  estimatedMarketPrice: number;
  leboncoinSampleText: string;
  strategyBadge: string;
  description: string;
  chargeTimeNote: string;
}


/**
 * Catalogue certifié des véhicules électriques d'occasion disponibles sur le marché français,
 * alimenté directement par le Référentiel Open Data (OpenEV Data & ADEME Car Labelling)
 * et étalonné sur les tests de consommation réelle (« La Chaîne EV » / EV-Database).
 */
export const EV_CATALOG: EVModelData[] = EVDatabaseService.getAllModels().map((car) => ({
  model: car.fullName,
  yearRange: car.yearRange,
  bodyType: car.bodyType as any,
  batteryGrossKwh: car.batteryGrossKwh,
  batteryNetKwh: car.batteryNetKwh,
  wltpRangeKm: car.wltpRangeKm,
  realRangeKm: car.realRangeKm,
  realConsoKwh100: car.realConsoKwh100,
  highwayRangeKm: car.highwayRangeKm,
  highwayConsoKwh100: car.highwayConsoKwh100,
  rangeDiscountPct: car.rangeDiscountPct,
  hasDirectIRLTest: car.hasDirectIRLTest,
  estimatedMarketPrice: car.estimatedMarketPrice,
  leboncoinSampleText: car.leboncoinSampleText,
  strategyBadge: car.strategyBadge,
  description: car.description,
  chargeTimeNote: car.chargeTimeNote,
}));

/**
 * Vérifie si une voiture couvre le besoin en kilomètres quotidiens :
 * - Maison : l'autonomie réelle doit au minimum couvrir la journée (charge chaque nuit)
 * - Appartement : sans prise à domicile, l'autonomie doit permettre d'espacer les recharges
 */
export function carCoversDailyNeed(
  carRangeKm: number,
  dailyKm: number,
  housing: 'maison' | 'appartement' = 'maison'
): boolean {
  const safeDailyKm = Math.max(5, dailyKm);
  if (housing === 'maison') {
    // Une nuit de sommeil standard sur simple prise 2,3 kW recharge ~18,4 kWh, soit environ 120 km
    const standardNightlyKm = 120;
    if (safeDailyKm > standardNightlyKm) {
      // Le déficit journalier doit être absorbé par la batterie sur les 5 jours de la semaine
      const weeklyDeficit = (safeDailyKm - standardNightlyKm) * 5;
      const minRequiredRange = Math.max(safeDailyKm, weeklyDeficit);
      return carRangeKm >= minRequiredRange;
    }
    return carRangeKm >= safeDailyKm;
  }
  return carRangeKm >= Math.max(safeDailyKm * 1.25, 140);
}

/**
 * Détermine si la catégorie et le niveau de confort du véhicule sont adaptés à la distance quotidienne :
 * - < 80 km/jour : Tout véhicule convient (citadines économiques type Spring, Zoé, Twingo ou berlines).
 * - 80 à 139 km/jour : On écarte les micro-citadines trop spartiates (Dacia Spring, Twingo), 
 *   les citadines polyvalentes à batterie éprouvée (Zoé 41/52, e-208) et berlines sont adaptées.
 * - >= 140 km/jour (150 km, 160 km, 180 km, 200 km...) : Faire 140 à 200 km par jour au quotidien
 *   sur route et autoroute nécessite un confort routier supérieur (insonorisation acoustique, 
 *   sièges ergonomiques, aides à la conduite niveau 2, suspensions).
 *   On écarte les citadines (Zoé, Spring, Twingo, e-208) pour prioriser les berlines routières
 *   et SUV (Tesla Model 3, MG4 Luxury, VW ID.3, Kona, Model Y...).
 */
export function isCarComfortableForDailyKm(
  car: EVModelData,
  dailyKm: number
): boolean {
  if (dailyKm < 80) return true;

  // Entre 80 et 139 km/jour : exclure les micro-citadines très limitées (Spring, Twingo)
  if (dailyKm < 140) {
    if (car.model.includes('Spring') || car.model.includes('Twingo')) {
      return false;
    }
    return true;
  }

  // Dès 140 km/jour et a fortiori 200 km/jour :
  // Recommander uniquement les berlines, compactes routières et SUV (Tesla, MG4, ID.3, Kona, Niro...)
  // et écarter formellement les citadines pures (Zoé, Spring, Twingo, e-208)
  const isCityCar = car.bodyType === 'citadine' || 
                    car.model.includes('Zoé') || 
                    car.model.includes('Spring') || 
                    car.model.includes('Twingo') || 
                    car.model.includes('208');

  return !isCityCar;
}

/**
 * Détermine le niveau de catégorie du véhicule (Option B : 4 niveaux) :
 * - Niveau 0 : Micro-citadines dépouillées (Dacia Spring, Renault Twingo)
 * - Niveau 1 : Citadines polyvalentes (Renault Zoé, Peugeot e-208, Opel Corsa-e, Fiat 500e, BMW i3, Renault 5...)
 * - Niveau 2 : Compactes (Nissan Leaf II, Citroën ë-C4, Volkswagen ID.3, MG4, Renault Mégane E-Tech...)
 * - Niveau 3 : Berlines routières, SUV & Breaks (Tesla Model 3, Model Y, Kona, e-Niro, ID.4, EV6...)
 */
export function getCarCategoryLevel(car: EVModelData): number {
  if (car.model.includes('Spring') || car.model.includes('Twingo')) {
    return 0;
  }
  if (
    car.bodyType === 'citadine' ||
    car.model.includes('Zoé') ||
    car.model.includes('208') ||
    car.model.includes('Corsa') ||
    car.model.includes('500e') ||
    car.model.includes('i3')
  ) {
    return 1;
  }
  if (car.bodyType === 'compacte') {
    return 2;
  }
  return 3;
}

/**
 * Sélectionne le meilleur modèle économique parmi une liste de candidats :
 * Règle métier : si on a plusieurs choix avec un écart faible (moins de 9 €/mois par rapport au coût minimal),
 * on favorise les modèles avec la plus grosse batterie.
 * En cas d'égalité sur la capacité batterie, on favorise la plus grande autonomie réelle, puis la mensualité la plus basse.
 */
export function pickBestEconomicModel(
  candidateCars: EVModelData[],
  loanMode: LoanRateMode
): EVModelData {
  if (candidateCars.length === 0) {
    throw new Error('Aucun véhicule candidat pour la recommandation économique');
  }

  const carsWithCost = candidateCars.map((car) => {
    const monthly = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60).monthly;
    const battery = car.batteryNetKwh ?? car.batteryGrossKwh ?? 0;
    return { car, monthly, battery };
  });

  const minMonthly = Math.min(...carsWithCost.map((c) => c.monthly));

  // Modèles dans une fourchette d'écart faible (< 9 €/mois par rapport au minimum)
  const closeCandidates = carsWithCost.filter((c) => c.monthly - minMonthly < 9);

  // On favorise les modèles avec la plus grosse batterie
  closeCandidates.sort((a, b) => {
    if (b.battery !== a.battery) return b.battery - a.battery;
    if (b.car.realRangeKm !== a.car.realRangeKm) return b.car.realRangeKm - a.car.realRangeKm;
    return a.monthly - b.monthly;
  });

  return closeCandidates[0].car;
}

/**
 * Algorithme de recommandation des véhicules :
 * 1. On applique le filtre de confort adapté au kilométrage quotidien (priorisant les routières au-delà de 140 km/j).
 * 2. On liste toutes les voitures qui couvrent le besoin en Km quotidien.
 * 3. On sélectionne le modèle économique recommandé (mensualité minimale, en favorisant la plus grosse batterie si écart < 9 €/m).
 * 4. On sélectionne l'alternative confort :
 *    - Cible systématiquement la catégorie supérieure (Option B).
 *    - Priorise les modèles autofinancés dans cette catégorie supérieure.
 *    - Sélectionne le moins cher (mensualité minimale) pour préserver le budget de l'usager.
 */
export function getTieredEVRecommendations(
  dailyKm: number,
  availableLeaseBudget: number,
  housing: 'maison' | 'appartement' = 'maison',
  loanMode: LoanRateMode = 'eco_1pct',
  preferredSegment?: 'all' | 'berline' | 'citadine' | 'suv'
): TieredEVRecommendations {
  const safeDailyKm = Math.max(5, Math.round(dailyKm));

  const candidateCatalog = preferredSegment && preferredSegment !== 'all'
    ? EV_CATALOG.filter((car) => car.bodyType === preferredSegment)
    : EV_CATALOG;

  const baseCatalog = candidateCatalog.length > 0 ? candidateCatalog : EV_CATALOG;

  // 1. Filtrer selon le confort adapté au kilométrage quotidien
  // (ex: privilégier Tesla/MG4/ID.3 et écarter Zoé/Spring pour les trajets quotidiens >= 140 km)
  const comfortableCars = baseCatalog.filter((car) =>
    isCarComfortableForDailyKm(car, safeDailyKm)
  );
  const catalogToUse = comfortableCars.length > 0 ? comfortableCars : baseCatalog;

  // 2. Liste de toutes les voitures qui couvrent le besoin en Km quotidien
  let coveringCars = catalogToUse.filter((car) =>
    carCoversDailyNeed(car.realRangeKm, safeDailyKm, housing)
  );

  // Sécurité si aucune voiture confortable ne couvre l'autonomie requise :
  // élargir à toutes les voitures couvrantes du catalogue de base
  if (coveringCars.length === 0) {
    coveringCars = baseCatalog.filter((car) =>
      carCoversDailyNeed(car.realRangeKm, safeDailyKm, housing)
    );
  }

  // Sécurité ultime si kilométrage exceptionnel : conserver toutes les voitures du catalogue
  if (coveringCars.length === 0) {
    coveringCars = [...baseCatalog];
  }

  // 3. Filtrer les voitures qui permettent de récupérer de l'argent
  // (La mensualité de financement est inférieure ou égale au budget carburant libéré, dégageant un surplus net)
  const profitableCars = coveringCars.filter((car) => {
    const monthly = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60).monthly;
    return monthly <= availableLeaseBudget;
  });

  // A. Modèle recommandé : la voiture qui permet le plus d'économie
  // Règle métier : si plusieurs choix avec écart faible (< 9 €/mois), on favorise la plus grosse batterie
  let recommendedModel: EVModelData;
  if (profitableCars.length > 0) {
    recommendedModel = pickBestEconomicModel(profitableCars, loanMode);
  } else {
    recommendedModel = pickBestEconomicModel(coveringCars, loanMode);
  }

  // B. Option Confort :
  // Règle métier :
  // 1. On cherche systématiquement dans la catégorie supérieure (par rapport au modèle recommandé).
  // 2. Dans cette catégorie supérieure, on priorise les modèles 100% autofinancés (rentables).
  // 3. On sélectionne le moins cher (la mensualité minimale) :
  //    - Le moins cher parmi les autofinancés si au moins un modèle rentre dans le budget libéré.
  //    - Le moins cher de la catégorie supérieure si aucun n'est encore 100% autofinancé (pour minimiser le reste à charge).
  const recommendedLevel = getCarCategoryLevel(recommendedModel);

  // Recherche des voitures de catégories strictement supérieures
  const superiorCars = coveringCars.filter(
    (car) => car.model !== recommendedModel.model && getCarCategoryLevel(car) > recommendedLevel
  );

  let comfortModel: EVModelData;

  if (superiorCars.length > 0) {
    // On cible la catégorie supérieure immédiate disponible (le plus petit niveau > recommendedLevel)
    const minSuperiorLevel = Math.min(...superiorCars.map((c) => getCarCategoryLevel(c)));
    const immediateSuperiorCars = superiorCars.filter(
      (c) => getCarCategoryLevel(c) === minSuperiorLevel
    );

    // Dans cette catégorie supérieure, on priorise les modèles autofinancés
    const profitableSuperiorCars = immediateSuperiorCars.filter((car) => {
      const monthly = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60).monthly;
      return monthly <= availableLeaseBudget;
    });

    const poolToSelectFrom =
      profitableSuperiorCars.length > 0 ? profitableSuperiorCars : immediateSuperiorCars;

    // On sélectionne le modèle le moins cher (mensualité minimale, avec plus grande autonomie en cas d'égalité)
    const sortedSuperior = [...poolToSelectFrom].sort((a, b) => {
      const monthlyA = calculateEVFinancing(a.estimatedMarketPrice, loanMode, 60).monthly;
      const monthlyB = calculateEVFinancing(b.estimatedMarketPrice, loanMode, 60).monthly;
      if (monthlyA !== monthlyB) return monthlyA - monthlyB;
      return b.realRangeKm - a.realRangeKm;
    });

    comfortModel = sortedSuperior[0];
  } else {
    // Cas de repli : pas de catégorie supérieure disponible (ex: modèle recommandé déjà au niveau 3, ou segment forcé)
    // On prend parmi les autres modèles couvrants celui qui offre le meilleur confort / autonomie,
    // en priorisant les autofinancés
    const otherCars = coveringCars.filter((c) => c.model !== recommendedModel.model);
    if (otherCars.length > 0) {
      const profitableOtherCars = otherCars.filter((car) => {
        const monthly = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60).monthly;
        return monthly <= availableLeaseBudget;
      });

      const pool = profitableOtherCars.length > 0 ? profitableOtherCars : otherCars;
      // Pour le confort au sein de la même catégorie haute, on favorise la plus grande autonomie / grand routier
      const sortedByRange = [...pool].sort((a, b) => {
        if (b.realRangeKm !== a.realRangeKm) return b.realRangeKm - a.realRangeKm;
        const monthlyA = calculateEVFinancing(a.estimatedMarketPrice, loanMode, 60).monthly;
        const monthlyB = calculateEVFinancing(b.estimatedMarketPrice, loanMode, 60).monthly;
        return monthlyA - monthlyB;
      });
      comfortModel = sortedByRange[0];
    } else {
      comfortModel = recommendedModel;
    }
  }

  // Construction des objets UsedEVRecommendation avec mensualités réelles
  const buildUsedEV = (car: EVModelData, isComfortTier: boolean): UsedEVRecommendation => {
    const monthly = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60).monthly;
    const surplus = availableLeaseBudget - monthly;
    const isProfitable = surplus > 0;

    let badge = car.strategyBadge;
    if (isComfortTier) {
      badge = isProfitable
        ? (safeDailyKm >= 140
            ? `Option grand confort routier (${car.realRangeKm} km • 100% autofinancée)`
            : `Option confort & autonomie (${car.realRangeKm} km • 100% autofinancée)`)
        : `Option confort & grande autonomie (${car.realRangeKm} km)`;
    } else {
      badge = isProfitable
        ? (safeDailyKm >= 140
            ? `Berline routière confort recommandée (ROI Direct • +${Math.round(surplus)} €/m)`
            : `Modèle le plus économique (ROI Direct • +${Math.round(surplus)} €/m)`)
        : `Modèle le moins cher à financer (~${monthly} €/m)`;
    }

    const correctionBadge = getVehicleCorrectionBadge(car);

    return {
      model: car.model,
      yearRange: car.yearRange,
      bodyType: car.bodyType,
      batteryGrossKwh: car.batteryGrossKwh,
      batteryNetKwh: car.batteryNetKwh,
      wltpRangeKm: car.wltpRangeKm,
      realRangeKm: car.realRangeKm,
      realConsoKwh100: car.realConsoKwh100,
      highwayRangeKm: car.highwayRangeKm,
      highwayConsoKwh100: car.highwayConsoKwh100,
      rangeDiscountPct: car.rangeDiscountPct,
      hasDirectIRLTest: car.hasDirectIRLTest,
      correctionBadge,
      monthlyFinancing5Years: monthly,
      estimatedMarketPrice: car.estimatedMarketPrice,
      leboncoinSampleText: car.leboncoinSampleText,
      strategyBadge: badge,
      description: car.description,
      chargeTimeNote: car.chargeTimeNote,
    };
  };

  const recommended = buildUsedEV(recommendedModel, false);
  const economy = buildUsedEV(comfortModel, true);

  recommended.dailyAdvice = getDailyUsageAdvice(safeDailyKm, recommended.realRangeKm, housing, recommended.model);
  economy.dailyAdvice = getDailyUsageAdvice(safeDailyKm, economy.realRangeKm, housing, economy.model);

  return {
    recommended,
    economy,
  };
}

/**
 * Recommandations de véhicules d'occasion (maintenu pour compatibilité).
 */
export function getRecommendedUsedEV(
  dailyKm: number,
  availableLeaseBudget: number,
  housing: 'maison' | 'appartement' = 'maison'
): UsedEVRecommendation {
  return getTieredEVRecommendations(dailyKm, availableLeaseBudget, housing).recommended;
}

/**
 * Formate la durée de charge quotidienne sur prise domestique standard (2,3 kW / 10A)
 * en langage simple, concret et terre à terre.
 */
export function formatDailyChargeDuration(hours: number): string {
  if (hours <= 0.8) return "moins d'une heure";
  if (hours <= 1.25) return "environ 1 heure";
  if (hours <= 1.75) return "environ 1h30";
  if (hours >= 7.6 && hours <= 8.4) {
    return "environ 8 heures (le temps d'une bonne nuit)";
  }
  const roundedHalf = Math.round(hours * 2) / 2;
  const fullHours = Math.floor(roundedHalf);
  const isHalf = roundedHalf % 1 !== 0;

  if (isHalf) {
    return `environ ${fullHours}h30`;
  }
  return `environ ${fullHours} heures`;
}

/**
 * Retourne la consommation réelle mixte constatée (référence tests La Chaîne EV)
 * Spécifiquement étalonnée selon chaque véhicule réel proposé.
 */
export function getVehicleRealConso(modelName?: string): number {
  if (!modelName) return 15.2;
  // Source unique de vérité : recherche exacte ou approchante dans EV_CATALOG
  const directMatch = EV_CATALOG.find((c) => c.model.toLowerCase() === modelName.toLowerCase() || modelName.toLowerCase().includes(c.model.toLowerCase()));
  if (directMatch) return directMatch.realConsoKwh100;

  const lower = modelName.toLowerCase();
  if (lower.includes('spring')) return 13.5;
  if (lower.includes('highland')) return 14.8;
  if (lower.includes('model y')) return 16.2;
  if (lower.includes('model 3') || lower.includes('tesla')) return 15.2;
  if (lower.includes('zoé') || lower.includes('zoe')) {
    if (lower.includes('52') || lower.includes('r110')) return 15.5;
    return 15.4;
  }
  if (lower.includes('mg4')) return 16.0;
  if (lower.includes('r5') || lower.includes('renault 5')) return 14.8;
  if (lower.includes('soul')) return 15.8;
  if (lower.includes('leaf')) return 16.5;
  return 15.2;
}

/**
 * Génère le conseil d'usage au quotidien pour démystifier la recharge et prouver la simplicité de la routine :
 * Basé sur la consommation réelle constatée (La Chaîne EV) et la durée nécessaire pour charger les km quotidiens :
 * 1. Durée de recharge sur simple prise à domicile (maison, jusqu'à ~140 km/j couverts chaque nuit !)
 * 2. Recharge nocturne + réserve de batterie pour très grands rouleurs (> 140 km/j)
 * 3. Batterie et recharge espacée tous les X semaines / jours (appartement / sans prise)
 */
export function getDailyUsageAdvice(
  dailyKm: number,
  realRangeKm: number,
  housing: 'maison' | 'appartement' = 'maison',
  modelName?: string
): DailyUsageAdvice {
  const safeDailyKm = Math.max(5, Math.round(dailyKm));
  const safeRange = Math.max(80, Math.round(realRangeKm));
  const consoKwh100 = getVehicleRealConso(modelName);

  // Énergie requise chaque jour pour le trajet quotidien (kWh)
  const dailyKwhNeeded = Math.round(((safeDailyKm * consoKwh100) / 100) * 10) / 10;

  // Durée de charge quotidienne sur simple prise domestique 2,3 kW (10A standard sans installation)
  const hoursStandard = dailyKwhNeeded / 2.3;
  const chargeDuration = formatDailyChargeDuration(hoursStandard);

  // Capacité de recharge nocturne sur 8h à domicile (~18,4 kWh à 2,3 kW standard)
  const maxNightlyKm = Math.round((18.4 / consoKwh100) * 100);

  // CAS 1 : APPARTEMENT (sans prise à domicile)
  // RÈGLE : La batterie et une recharge tous les X jours / X semaines
  if (housing === 'appartement') {
    const commuteDays = Math.max(1, Math.floor(safeRange / safeDailyKm));

    // Si l'autonomie couvre 10 jours ou plus de trajets quotidiens (2 semaines de travail ou plus)
    if (commuteDays >= 10) {
      const weeksCount = Math.max(2, Math.round(commuteDays / 5));
      return {
        pattern: 'batterie_recharge_espacee',
        badge: `1 recharge toutes les ${weeksCount} semaines`,
        title: `1 recharge toutes les ${weeksCount} semaines`,
        text: `Même sans prise chez vous, la batterie de ${safeRange} km couvre ${weeksCount} semaines entières de trajets. Une seule recharge de 25 min pendant vos courses suffit pour rouler l'esprit tranquille.`,
      };
    }

    // Si l'autonomie couvre environ une semaine complète de travail (5 à 9 jours)
    if (commuteDays >= 5) {
      return {
        pattern: 'batterie_recharge_espacee',
        badge: '1 seule recharge par semaine',
        title: '1 seule recharge par semaine',
        text: `Même sans prise chez vous, la batterie de ${safeRange} km couvre toute votre semaine de trajets (${safeDailyKm * 5} km). Une seule recharge rapide de 20 à 25 min par semaine pendant vos courses suffit largement.`,
      };
    }

    // Si gros rouleur sans prise (moins de 5 jours d'autonomie)
    const daysCount = Math.max(2, commuteDays);
    return {
      pattern: 'batterie_recharge_espacee',
      badge: `1 recharge tous les ${daysCount} jours`,
      title: `1 recharge tous les ${daysCount} jours`,
      text: `Même sans prise chez vous, la batterie de ${safeRange} km absorbe ${daysCount} jours de trajets d'affilée. Une pause recharge de 20 min tous les ${daysCount} jours (en faisant vos courses ou sur borne publique) couvre tous vos besoins.`,
    };
  }

  // CAS 2 : MAISON (avec prise à domicile)
  // Tant que le kilométrage quotidien peut être rechargé au cours d'une nuit de sommeil (jusqu'à ~120-130 km/j sur simple prise 2,3 kW)
  if (safeDailyKm <= maxNightlyKm) {
    if (safeDailyKm <= 40) {
      return {
        pattern: 'nocturne_couvre',
        badge: 'Recharge nocturne 100% couverte',
        title: 'Recharge nocturne quotidienne',
        text: `Sur une simple prise chez vous (la même que pour votre smartphone !), une nuit de sommeil recharge vos ${safeDailyKm} km quotidiens en seulement ${chargeDuration}. Vous repartez chaque matin avec le plein (ou ne branchez qu'une fois par semaine grâce aux ${safeRange} km de réserve).`,
      };
    }

    return {
      pattern: 'nocturne_couvre',
      badge: 'Recharge nocturne 100% couverte',
      title: 'Recharge nocturne quotidienne',
      text: `Sur une simple prise chez vous (la même que pour votre smartphone !), une nuit de sommeil recharge vos ${safeDailyKm} km quotidiens en seulement ${chargeDuration}. Vous repartez chaque matin avec le plein, sans détour en station.`,
    };
  }

  // CAS 3 : MAISON avec kilométrage très élevé (> 125-130 km/jour)
  // RÈGLE : La nuit compense ~120 km chaque nuit sur simple prise, la batterie absorbe le reste sur la semaine et le week-end fait le plein.
  const dailyMissingKm = safeDailyKm - maxNightlyKm;
  const weeklyDeficit = dailyMissingKm * 5;

  if (safeRange >= weeklyDeficit) {
    return {
      pattern: 'nocturne_reserve_weekend',
      badge: 'Recharge nocturne + réserve week-end',
      title: 'Recharge nocturne + réserve week-end',
      text: `Avec une nuit de sommeil chez vous, vous récupérez environ ${maxNightlyKm} km sur simple prise (la même que pour votre smartphone !), et la batterie de ${safeRange} km absorbe facilement les ${dailyMissingKm} km restants chaque jour pour couvrir toute votre semaine sans stress.`,
    };
  }

  return {
    pattern: 'nocturne_reserve_weekend',
    badge: 'Borne à domicile conseillée',
    title: 'Recharge haute puissance conseillée',
    text: `À ${safeDailyKm} km/jour, une simple prise récupère ${maxNightlyKm} km par nuit. Pour effacer 100% de vos trajets chaque nuit à moindre coût en heures creuses, l'installation d'une prise renforcée (Green'up) ou d'une borne 7,4 kW est idéale.`,
  };
}
