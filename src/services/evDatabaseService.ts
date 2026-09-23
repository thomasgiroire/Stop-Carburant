import rawEvDatabase from '../data/evDatabase.json';
import rawMarketStats from '../data/marketPriceStats.json';
import { calculateEVFinancing, LoanRateMode } from '../utils/loanCalculations';
import { CONSTANTS } from '../constants';

export interface MarketAdSummary {
  id: string;
  title: string;
  price: number;
  year?: number | null;
  km?: number | null;
  isPro?: boolean;
  location?: string;
  badge?: string;
  href?: string;
}

export interface ModelMarketStats {
  modelId: string;
  canonicalName: string;
  sampleCount: number;
  averagePrice: number;
  medianPrice: number;
  averageKm: number;
  medianKm: number;
  minPrice: number;
  maxPrice: number;
  minKm: number;
  maxKm: number;
  sweetSpotPrice: number;
  sweetSpotKm: number;
  mostAvailableSummary: string;
  topAds: MarketAdSummary[];
}

export interface OpenDataEVModel {
  id: string;
  make: string;
  model: string;
  trim: string;
  fullName: string;
  bodyType: 'citadine' | 'compacte' | 'berline' | 'break' | 'suv' | 'utilitaire';
  yearRange: string;
  batteryGrossKwh: number;
  batteryNetKwh: number;
  wltpRangeKm: number;
  realRangeKm: number;
  realConsoKwh100: number; // Consommation réelle mixte étalonnée (kWh/100 km)
  acMaxPowerKw: number;
  dcMaxPowerKw: number;
  estimatedMarketPrice: number; // Prix d'occasion professionnel indicatif (€)
  leboncoinSampleText: string;
  strategyBadge: string;
  description: string;
  chargeTimeNote: string;
  fastCharge10to80Min: number;
  source: string;
  marketStats?: ModelMarketStats;
}

export interface EVFilterOptions {
  make?: string;
  bodyType?: string;
  maxPrice?: number;
  minRangeKm?: number;
  searchQuery?: string;
}

export interface EVFinancials {
  monthlyLoan: number;
  monthlyElectricityHP: number;
  monthlyElectricityHC: number;
  maintenanceSavings: number;
  totalMonthlyCostHC: number;
  netLiberatedCashHC: number;
  is100PctAutofinanced: boolean;
}

/**
 * Service d'accès au Référentiel Open Data des véhicules électriques
 * 100% natif à l'application web (embarqué dans le bundle Vite, zéro dépendance externe)
 */
export class EVDatabaseService {
  private static marketStatsMap: Record<string, ModelMarketStats> = rawMarketStats as unknown as Record<string, ModelMarketStats>;

  private static cachedModels: OpenDataEVModel[] = (rawEvDatabase as OpenDataEVModel[]).map((car) => {
    const stats = (rawMarketStats as unknown as Record<string, ModelMarketStats>)[car.id];
    return stats ? { ...car, marketStats: stats } : car;
  });

  /**
   * Retourne l'ensemble des modèles de véhicules électriques du référentiel
   */
  public static getAllModels(): OpenDataEVModel[] {
    return [...this.cachedModels];
  }

  /**
   * Retourne les statistiques de marché observées pour un modèle spécifique
   */
  public static getMarketStats(modelId: string): ModelMarketStats | undefined {
    return this.marketStatsMap[modelId];
  }

  /**
   * Retourne l'ensemble des statistiques de marché constatées
   */
  public static getAllMarketStats(): Record<string, ModelMarketStats> {
    return { ...this.marketStatsMap };
  }

  /**
   * Recherche les statistiques de marché associées à un véhicule par son nom
   */
  public static findMarketStatsByName(name: string): ModelMarketStats | undefined {
    if (!name) return undefined;
    const model = this.findModelByName(name);
    if (model?.marketStats) return model.marketStats;

    const lower = name.toLowerCase().trim();
    for (const [id, stats] of Object.entries(this.marketStatsMap)) {
      if (
        lower.includes(id) ||
        stats.canonicalName.toLowerCase().includes(lower) ||
        lower.includes(stats.canonicalName.toLowerCase())
      ) {
        return stats;
      }
    }
    return undefined;
  }

  /**
   * Recherche un modèle par son identifiant unique
   */
  public static getModelById(id: string): OpenDataEVModel | undefined {
    return this.cachedModels.find((m) => m.id === id);
  }

  /**
   * Recherche un modèle par correspondance de nom (exacte ou partielle)
   */
  public static findModelByName(name: string): OpenDataEVModel | undefined {
    if (!name) return undefined;
    const lower = name.toLowerCase().trim();
    return this.cachedModels.find(
      (m) =>
        m.fullName.toLowerCase() === lower ||
        m.fullName.toLowerCase().includes(lower) ||
        lower.includes(m.fullName.toLowerCase()) ||
        `${m.make} ${m.model}`.toLowerCase() === lower
    );
  }

  /**
   * Retourne la liste unique des marques disponibles
   */
  public static getMakes(): string[] {
    return Array.from(new Set(this.cachedModels.map((m) => m.make))).sort();
  }

  /**
   * Filtre les véhicules selon des critères multiples
   */
  public static filterModels(options: EVFilterOptions): OpenDataEVModel[] {
    return this.cachedModels.filter((car) => {
      if (options.make && options.make !== 'all' && car.make !== options.make) {
        return false;
      }
      if (options.bodyType && options.bodyType !== 'all' && car.bodyType !== options.bodyType) {
        return false;
      }
      if (options.maxPrice && car.estimatedMarketPrice > options.maxPrice) {
        return false;
      }
      if (options.minRangeKm && car.realRangeKm < options.minRangeKm) {
        return false;
      }
      if (options.searchQuery && options.searchQuery.trim().length > 0) {
        const query = options.searchQuery.toLowerCase().trim();
        const searchable = `${car.make} ${car.model} ${car.trim} ${car.fullName}`.toLowerCase();
        if (!searchable.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Calcule le bilan financier complet d'un modèle choisi face au budget carburant de l'utilisateur
   */
  public static calculateFinancials(
    car: OpenDataEVModel,
    userFuelBudget: number,
    dailyKm: number,
    loanMode: LoanRateMode = 'eco_1pct'
  ): EVFinancials {
    const drivingDays = CONSTANTS.DRIVING_DAYS_PER_MONTH || CONSTANTS.WORKING_DAYS_PER_MONTH || 24;
    const monthlyDistance = dailyKm * drivingDays;
    const monthlyFinancing = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60).monthly;

    const kwhMonthly = (monthlyDistance * car.realConsoKwh100) / 100;
    const monthlyElecHP = Math.round(kwhMonthly * CONSTANTS.P_DOM_HP);
    const monthlyElecHC = Math.round(kwhMonthly * CONSTANTS.P_DOM_HC);

    const rawMaintenance = monthlyDistance * CONSTANTS.G_ENT_PER_KM;
    const maintenanceSavings = Math.round(Math.max(CONSTANTS.MIN_MAINTENANCE_SAVINGS, rawMaintenance));

    // Coût net total VE en Heures Creuses (mensualité + électricité - gain entretien)
    const totalMonthlyCostHC = monthlyFinancing + monthlyElecHC;
    const netLiberatedCashHC = Math.round(userFuelBudget + maintenanceSavings - totalMonthlyCostHC);
    const is100PctAutofinanced = netLiberatedCashHC >= 0;

    return {
      monthlyLoan: monthlyFinancing,
      monthlyElectricityHP: monthlyElecHP,
      monthlyElectricityHC: monthlyElecHC,
      maintenanceSavings,
      totalMonthlyCostHC,
      netLiberatedCashHC,
      is100PctAutofinanced,
    };
  }
}
