export type HousingType = 'maison' | 'appartement';
export type ElecTarifMode = 'HP' | 'HC';
export type StoryStage = 'departure' | 'commute' | 'gas_station' | 'revelation';

export interface SimulatorState {
  fuelBudget: number; // in € / month
  housing: HousingType;
  dailyKm: number; // in km / day
}

export interface ActiveSimulationContext {
  vehicleModel?: string;
  consoElec?: number;
  activeTarif?: ElecTarifMode;
  loanMode?: 'eco_1pct' | 'standard_4_9pct';
  downPayment?: number;
}

export interface CalculationResult {
  fuelBudget: number;
  monthlyKm: number;
  loss5Years: number;
  fuelLitersMonthly: number;
  electricityCost: number; // Coût mensuel retenu selon tarif actif
  electricityCostHP: number; // Coût calculé en Heures Pleines EDF (ou borne publique)
  electricityCostHC: number; // Coût calculé en Heures Creuses EDF la nuit
  activeTarif: ElecTarifMode; // 'HP' ou 'HC'
  isProfitabilityUnlockedByHC: boolean; // Vrai si le passage en Heures Creuses élimine un reste à charge
  maintenanceSavings: number;
  liberatedCash: number;
  carLeaseBudget: number;
  housing: HousingType;
  dailyKm: number;
  userCostPer100Km: number;
  consoElec: number; // Consommation électrique réelle retenue (kWh / 100 km)
  electricCostPer100Km: number; // Coût actif aux 100 km
  electricCostPer100KmHP: number; // Coût aux 100 km en Heures Pleines
  electricCostPer100KmHC: number; // Coût aux 100 km en Heures Creuses
  userConsumptionLiters: number;
  rawConsumptionLiters?: number;
  isConsumptionCappedMin?: boolean;
  isConsumptionCappedMax?: boolean;
  savingsPer100Km: number;
}

export interface FAQItem {
  id: string;
  myth: string;
  verdict: string;
  explanation: string;
  sourceName: string;
  sourceUrl: string;
  badge: string;
}
