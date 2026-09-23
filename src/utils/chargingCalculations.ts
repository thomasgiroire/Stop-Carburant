/**
 * Moteur de calcul physique et financier pour les équipements de recharge à domicile.
 * Intègre les rendements réalistes (pertes de charge AC), la simulation d'autonomie
 * sur la semaine (règle de confort du vendredi soir >= 50%) et l'amortissement du coût d'installation
 * intégrant le crédit d'impôt officiel de 500 €.
 */

export type ChargingEquipmentType = 'standard_plug' | 'reinforced_plug' | 'wallbox_7kw';

export interface ChargingEquipmentOption {
  type: ChargingEquipmentType;
  name: string;
  shortName: string;
  powerKw: number;
  efficiency: number; // Rendement du chargeur embarqué (prise en compte des pertes)
  netPowerKw: number; // Puissance utile réelle injectée dans la batterie
  nightEnergyKwh: number; // Énergie nette en 8h de nuit de sommeil (kWh)
  grossCost: number; // Coût matériel + pose fourchette haute (€)
  taxCredit: number; // Crédit d'impôt officiel en vigueur (€)
  netCost: number; // Reste à financer net (€)
  description: string;
  badge: string;
}

export const CHARGING_EQUIPMENT_OPTIONS: Record<ChargingEquipmentType, ChargingEquipmentOption> = {
  standard_plug: {
    type: 'standard_plug',
    name: 'Simple prise classique 2,3 kW',
    shortName: 'Prise classique',
    powerKw: 2.3,
    efficiency: 0.85, // ~15% de pertes AC (auxiliaires & charge lente à 10A)
    netPowerKw: 1.95,
    nightEnergyKwh: 15.6, // 1.95 kW * 8h
    grossCost: 0,
    taxCredit: 0,
    netCost: 0,
    description: 'Votre prise domestique standard 10A existante (la même que pour votre smartphone).',
    badge: '0 € d\'installation',
  },
  reinforced_plug: {
    type: 'reinforced_plug',
    name: 'Prise renforcée 3,7 kW (Green\'up)',
    shortName: 'Prise renforcée',
    powerKw: 3.7,
    efficiency: 0.88, // ~12% de pertes AC à 16A
    netPowerKw: 3.25,
    nightEnergyKwh: 26.0, // 3.25 kW * 8h
    grossCost: 450, // Matériel Legrand Green'up + disjoncteur différentiel + pose électricien
    taxCredit: 0,
    netCost: 450,
    description: 'Prise sécurisée 16A dédiée au VE. Recharge +60% plus vite qu\'une prise classique.',
    badge: 'Sécurisée 16A',
  },
  wallbox_7kw: {
    type: 'wallbox_7kw',
    name: 'Borne pilotable 7,4 kW (Wallbox)',
    shortName: 'Borne 7,4 kW',
    powerKw: 7.4,
    efficiency: 0.90, // ~10% de pertes AC à 32A monophasé
    netPowerKw: 6.66,
    nightEnergyKwh: 53.3, // 6.66 kW * 8h
    grossCost: 1400, // Matériel pilotable + pose électricien qualifié IRVE
    taxCredit: 500, // Crédit d'impôt officiel pour borne pilotable à domicile
    netCost: 900, // 1 400 € - 500 € crédit d'impôt
    description: 'Borne murale haute puissance 32A. Plein complet garanti chaque nuit pour tous trajets.',
    badge: 'Plein 100% garanti',
  },
};

export interface WorkweekDayStatus {
  day: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi';
  morningKm: number;
  morningPct: number;
  eveningKm: number;
  eveningPct: number;
}

export interface WorkweekBatterySimulation {
  dailyKm: number;
  realRangeKm: number;
  consoKwh100: number;
  equipmentType: ChargingEquipmentType;
  equipment: ChargingEquipmentOption;
  nightlyRecoveredKm: number;
  fridayEveningKm: number;
  fridayEveningPct: number;
  isComfortSufficient: boolean; // Friday evening SoC >= 50%
  days: WorkweekDayStatus[];
}

export interface ChargingRecommendation {
  recommendedType: ChargingEquipmentType;
  recommendedOption: ChargingEquipmentOption;
  simulation: WorkweekBatterySimulation;
  simulations: Record<ChargingEquipmentType, WorkweekBatterySimulation>;
  comfortDiagnosis: string;
}

/**
 * Calcule la distance récupérée nette en une nuit de 8 heures en tenant compte du rendement.
 */
export function calculateNightlyRecoveredKm(equipmentType: ChargingEquipmentType, consoKwh100: number): number {
  const equip = CHARGING_EQUIPMENT_OPTIONS[equipmentType];
  const safeConso = Math.max(10, consoKwh100);
  return Math.round((equip.nightEnergyKwh / safeConso) * 100);
}

/**
 * Simule l'état de la batterie du lundi matin (100%) au vendredi soir (après 5 trajets quotidiens et 4 nuits de charge).
 */
export function simulateWorkweekBattery(
  dailyKm: number,
  realRangeKm: number,
  consoKwh100: number,
  equipmentType: ChargingEquipmentType
): WorkweekBatterySimulation {
  const safeDailyKm = Math.max(5, Math.round(dailyKm));
  const safeRange = Math.max(80, Math.round(realRangeKm));
  const equip = CHARGING_EQUIPMENT_OPTIONS[equipmentType];
  const nightlyRecoveredKm = calculateNightlyRecoveredKm(equipmentType, consoKwh100);

  let currentBatteryKm = safeRange;
  const daysName: Array<'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi'> = [
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
  ];
  const days: WorkweekDayStatus[] = [];

  for (let i = 0; i < 5; i++) {
    const dayName = daysName[i];
    const morningKm = Math.min(safeRange, Math.round(currentBatteryKm));
    const morningPct = Math.min(100, Math.round((morningKm / safeRange) * 100));

    // Consommation du trajet de la journée
    const eveningKm = Math.max(0, morningKm - safeDailyKm);
    const eveningPct = Math.max(0, Math.round((eveningKm / safeRange) * 100));

    days.push({
      day: dayName,
      morningKm,
      morningPct,
      eveningKm,
      eveningPct,
    });

    // Recharge la nuit (lundi soir, mardi soir, mercredi soir, jeudi soir)
    if (i < 4) {
      currentBatteryKm = Math.min(safeRange, eveningKm + nightlyRecoveredKm);
    } else {
      currentBatteryKm = eveningKm;
    }
  }

  const fridayStatus = days[4];
  const fridayEveningKm = fridayStatus.eveningKm;
  const fridayEveningPct = fridayStatus.eveningPct;
  const isComfortSufficient = fridayEveningPct >= 50;

  return {
    dailyKm: safeDailyKm,
    realRangeKm: safeRange,
    consoKwh100,
    equipmentType,
    equipment: equip,
    nightlyRecoveredKm,
    fridayEveningKm,
    fridayEveningPct,
    isComfortSufficient,
    days,
  };
}

/**
 * Arbitrage automatique de l'équipement recommandé selon la règle du vendredi soir (>= 50% restant) :
 * 1. Priorité à la prise classique (0 €). Si le vendredi soir >= 50%, elle suffit.
 * 2. Si < 50%, bascule sur prise renforcée 3,7 kW (Green'up 450 €).
 * 3. Si même la prise renforcée donne < 50% (très grand rouleur), bascule sur borne 7,4 kW (900 € net).
 */
export function getRecommendedChargingEquipment(
  dailyKm: number,
  realRangeKm: number,
  consoKwh100: number,
  housing: 'maison' | 'appartement' = 'maison'
): ChargingRecommendation {
  const simStandard = simulateWorkweekBattery(dailyKm, realRangeKm, consoKwh100, 'standard_plug');
  const simReinforced = simulateWorkweekBattery(dailyKm, realRangeKm, consoKwh100, 'reinforced_plug');
  const simWallbox = simulateWorkweekBattery(dailyKm, realRangeKm, consoKwh100, 'wallbox_7kw');

  const simulations: Record<ChargingEquipmentType, WorkweekBatterySimulation> = {
    standard_plug: simStandard,
    reinforced_plug: simReinforced,
    wallbox_7kw: simWallbox,
  };

  if (housing === 'appartement') {
    // En appartement, pas de prise privative standard par défaut : l'usage principal est la borne publique
    return {
      recommendedType: 'standard_plug',
      recommendedOption: CHARGING_EQUIPMENT_OPTIONS.standard_plug,
      simulation: simStandard,
      simulations,
      comfortDiagnosis: 'Recharge sur borne publique ou pendant vos courses.',
    };
  }

  let recommendedType: ChargingEquipmentType = 'standard_plug';
  let comfortDiagnosis = '';

  if (simStandard.isComfortSufficient) {
    recommendedType = 'standard_plug';
    comfortDiagnosis = `Votre prise classique suffit largement : il vous reste ~${simStandard.fridayEveningPct}% de batterie (${simStandard.fridayEveningKm} km) le vendredi soir pour partir en week-end sans stress.`;
  } else if (simReinforced.isComfortSufficient) {
    recommendedType = 'reinforced_plug';
    comfortDiagnosis = `À ${Math.round(dailyKm)} km/j, la prise renforcée est recommandée pour garantir ~${simReinforced.fridayEveningPct}% de batterie (${simReinforced.fridayEveningKm} km) le vendredi soir (contre ${simStandard.fridayEveningPct}% sur prise classique).`;
  } else {
    recommendedType = 'wallbox_7kw';
    comfortDiagnosis = `Avec un rythme intensif de ${Math.round(dailyKm)} km/j, la borne 7,4 kW est essentielle pour effacer 100% de vos trajets chaque nuit et aborder le week-end avec le plein complet (~${simWallbox.fridayEveningPct}%).`;
  }

  return {
    recommendedType,
    recommendedOption: CHARGING_EQUIPMENT_OPTIONS[recommendedType],
    simulation: simulations[recommendedType],
    simulations,
    comfortDiagnosis,
  };
}
