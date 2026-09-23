import { getDepartmentByCode } from '../data/departments';

export type FuelType = 'all' | 'diesel' | 'essence' | 'e85';

export const FUEL_LABELS: Record<FuelType, string> = {
  all: 'Moyenne (Tous)',
  diesel: 'Gazole / Diesel',
  essence: 'Essence (SP95 / E10)',
  e85: 'Superéthanol (E85)',
};

export interface DepartmentFuelPrices {
  code: string;
  name: string;
  fuelPrice: number; // Moyenne pondérée locale (€/L)
  dieselPrice: number;
  essencePrice: number;
  e85Price: number;
}

export interface EnergyPrices {
  fuelPrice: number; // €/L (Moyenne pondérée ou prix du carburant sélectionné)
  dieselPrice?: number;
  essencePrice?: number;
  e85Price?: number;
  selectedFuelType?: FuelType;
  electricityHome: number; // €/kWh (Tarif réglementé EDF - Option Base TTC)
  electricityHomeHP: number; // €/kWh (Tarif réglementé EDF - Option Heures Pleines TTC)
  electricityHomeHC: number; // €/kWh (Tarif réglementé EDF - Option Heures Creuses TTC)
  electricityPublic: number; // €/kWh (Bornes publiques rapides avec abonnement)
  publicSubscription: number; // €/mois (Abonnement recharge publique/rapide type Mobilize, Ionity, Electra)
  isLive: boolean;
  lastUpdated?: string;
  sourceLabel: string;
  departmentCode?: string;
  departmentName?: string;
  isDepartmental?: boolean;
  nationalFuelPrice?: number;
  nationalDieselPrice?: number;
  nationalEssencePrice?: number;
  nationalE85Price?: number;
  departmentPricesMap?: Record<string, DepartmentFuelPrices>;
}

// Pondération officielle du parc automobile thermique français en circulation (Source : SDES / Ministère de la Transition Écologique)
// - Diesel / Gazole : ~54 % du parc
// - Essence (SP95-E10, SP95, SP98) : ~43 % du parc
// - Superéthanol E85 : ~3 % du parc
export const FLEET_WEIGHTS = {
  DIESEL: 0.54,
  ESSENCE: 0.43,
  E85: 0.03,
};

// Valeurs de référence officielles actuelles (France)
export const DEFAULT_PRICES: EnergyPrices = {
  fuelPrice: 1.74,
  dieselPrice: 1.73,
  essencePrice: 1.82,
  e85Price: 0.85,
  electricityHome: 0.2001,
  electricityHomeHP: 0.2001,
  electricityHomeHC: 0.1612,
  electricityPublic: 0.38,
  publicSubscription: 12.0,
  isLive: false,
  sourceLabel: 'Tarifs officiels pondérés parc français (1,74 €/L) • EDF (Tarif fixe: 0,2001 € • HC: 0,1612 €/kWh)',
};

/**
 * Calcule la moyenne pondérée du carburant selon les prix des différents carburants
 */
export function calculateWeightedFuelPrice(diesel: number, essence: number, e85: number): number {
  const weighted = (diesel * FLEET_WEIGHTS.DIESEL) +
                   (essence * FLEET_WEIGHTS.ESSENCE) +
                   (e85 * FLEET_WEIGHTS.E85);
  return Math.round(weighted * 100) / 100;
}

/**
 * Détermine le prix actif selon le carburant choisi (ou pondéré si 'all')
 */
export function getActiveFuelPrice(
  prices: { fuelPrice: number; dieselPrice?: number; essencePrice?: number; e85Price?: number },
  fuelType: FuelType = 'all'
): number {
  if (fuelType === 'diesel' && typeof prices.dieselPrice === 'number' && prices.dieselPrice > 0) {
    return prices.dieselPrice;
  }
  if (fuelType === 'essence' && typeof prices.essencePrice === 'number' && prices.essencePrice > 0) {
    return prices.essencePrice;
  }
  if (fuelType === 'e85' && typeof prices.e85Price === 'number' && prices.e85Price > 0) {
    return prices.e85Price;
  }
  return prices.fuelPrice;
}

/**
 * Adapte les prix énergétiques pour un département spécifique et un carburant ciblé
 */
export function getPricesForDepartment(
  basePrices: EnergyPrices,
  departmentCode: string,
  fuelType?: FuelType
): EnergyPrices {
  if (!departmentCode) {
    return basePrices;
  }

  const effectiveFuelType = fuelType ?? basePrices.selectedFuelType ?? 'all';
  const deptInfo = getDepartmentByCode(departmentCode);
  const deptData = basePrices.departmentPricesMap?.[departmentCode];
  const deptName = deptData?.name || deptInfo?.name || departmentCode;

  const weightedFuelPrice = deptData?.fuelPrice ?? basePrices.fuelPrice;
  const dieselPrice = deptData?.dieselPrice ?? basePrices.dieselPrice;
  const essencePrice = deptData?.essencePrice ?? basePrices.essencePrice;
  const e85Price = deptData?.e85Price ?? basePrices.e85Price;

  const activeFuelPrice = getActiveFuelPrice(
    { fuelPrice: weightedFuelPrice, dieselPrice, essencePrice, e85Price },
    effectiveFuelType
  );

  const fuelLabel = FUEL_LABELS[effectiveFuelType] || 'Carburant';

  return {
    ...basePrices,
    fuelPrice: activeFuelPrice,
    dieselPrice,
    essencePrice,
    e85Price,
    departmentCode,
    departmentName: deptName,
    isDepartmental: true,
    selectedFuelType: effectiveFuelType,
    sourceLabel: `Moyenne en direct (${departmentCode} - ${deptName} • ${fuelLabel}) : ${activeFuelPrice.toFixed(2)} €/L • EDF (Tarif fixe: ${basePrices.electricityHomeHP.toFixed(4)} € • HC: ${basePrices.electricityHomeHC.toFixed(4)} €/kWh)`,
  };
}

/**
 * Réinitialise les prix sur la moyenne nationale française avec le carburant ciblé
 */
export function resetPricesToNational(
  basePrices: EnergyPrices,
  fuelType?: FuelType
): EnergyPrices {
  const effectiveFuelType = fuelType ?? basePrices.selectedFuelType ?? 'all';
  const nationalFuel = basePrices.nationalFuelPrice ?? DEFAULT_PRICES.fuelPrice;
  const nationalDiesel = basePrices.nationalDieselPrice ?? DEFAULT_PRICES.dieselPrice;
  const nationalEssence = basePrices.nationalEssencePrice ?? DEFAULT_PRICES.essencePrice;
  const nationalE85 = basePrices.nationalE85Price ?? DEFAULT_PRICES.e85Price;

  const activeFuelPrice = getActiveFuelPrice(
    { fuelPrice: nationalFuel, dieselPrice: nationalDiesel, essencePrice: nationalEssence, e85Price: nationalE85 },
    effectiveFuelType
  );

  const fuelLabel = FUEL_LABELS[effectiveFuelType] || 'Carburant';

  return {
    ...basePrices,
    fuelPrice: activeFuelPrice,
    dieselPrice: nationalDiesel,
    essencePrice: nationalEssence,
    e85Price: nationalE85,
    departmentCode: undefined,
    departmentName: undefined,
    isDepartmental: false,
    selectedFuelType: effectiveFuelType,
    sourceLabel: `Moyenne nationale (${fuelLabel}) : ${activeFuelPrice.toFixed(2)} €/L • EDF (Tarif fixe: ${basePrices.electricityHomeHP.toFixed(4)} € • HC: ${basePrices.electricityHomeHC.toFixed(4)} €/kWh)`,
  };
}

/**
 * Récupère les prix des carburants en temps réel via l'API Open Data du gouvernement,
 * regroupés par département, et applique la pondération selon le taux d'équipement réel des Français.
 */
export async function fetchLiveEnergyPrices(
  targetDepartmentCode?: string,
  fuelType?: FuelType
): Promise<EnergyPrices> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?group_by=departement,code_departement&select=avg(gazole_prix)%20as%20avg_diesel,avg(e10_prix)%20as%20avg_e10,avg(sp95_prix)%20as%20avg_sp95,avg(sp98_prix)%20as%20avg_sp98,avg(e85_prix)%20as%20avg_e85&limit=105',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return DEFAULT_PRICES;
    }

    const data = await response.json();
    const records = data?.results || [];

    const departmentPricesMap: Record<string, DepartmentFuelPrices> = {};
    const allNationalDiesel: number[] = [];
    const allNationalEssence: number[] = [];
    const allNationalE85: number[] = [];

    for (const record of records) {
      const code = record.code_departement;
      if (!code || typeof code !== 'string') continue;

      const diesel = typeof record.avg_diesel === 'number' && record.avg_diesel > 1 && record.avg_diesel < 3.5
        ? record.avg_diesel
        : DEFAULT_PRICES.dieselPrice || 1.73;

      // Essence moyenne (E10 prioritaire car > 55% des ventes essence en France, sinon SP95 / SP98)
      const essences: number[] = [];
      if (typeof record.avg_e10 === 'number' && record.avg_e10 > 1 && record.avg_e10 < 3.5) essences.push(record.avg_e10);
      if (typeof record.avg_sp95 === 'number' && record.avg_sp95 > 1 && record.avg_sp95 < 3.5) essences.push(record.avg_sp95);
      if (typeof record.avg_sp98 === 'number' && record.avg_sp98 > 1 && record.avg_sp98 < 3.5) essences.push(record.avg_sp98);

      const essence = essences.length > 0
        ? essences.reduce((a, b) => a + b, 0) / essences.length
        : DEFAULT_PRICES.essencePrice || 1.82;

      const e85 = typeof record.avg_e85 === 'number' && record.avg_e85 > 0.5 && record.avg_e85 < 2.0
        ? record.avg_e85
        : DEFAULT_PRICES.e85Price || 0.85;

      const weighted = calculateWeightedFuelPrice(diesel, essence, e85);

      const deptMeta = getDepartmentByCode(code);
      const name = record.departement || deptMeta?.name || code;

      departmentPricesMap[code] = {
        code,
        name,
        fuelPrice: weighted,
        dieselPrice: Math.round(diesel * 100) / 100,
        essencePrice: Math.round(essence * 100) / 100,
        e85Price: Math.round(e85 * 100) / 100,
      };

      allNationalDiesel.push(diesel);
      allNationalEssence.push(essence);
      allNationalE85.push(e85);
    }

    // Calcul de la moyenne nationale pondérée
    const nationalDiesel = allNationalDiesel.length > 0
      ? allNationalDiesel.reduce((a, b) => a + b, 0) / allNationalDiesel.length
      : DEFAULT_PRICES.dieselPrice || 1.73;

    const nationalEssence = allNationalEssence.length > 0
      ? allNationalEssence.reduce((a, b) => a + b, 0) / allNationalEssence.length
      : DEFAULT_PRICES.essencePrice || 1.82;

    const nationalE85 = allNationalE85.length > 0
      ? allNationalE85.reduce((a, b) => a + b, 0) / allNationalE85.length
      : DEFAULT_PRICES.e85Price || 0.85;

    const nationalFuelPrice = calculateWeightedFuelPrice(nationalDiesel, nationalEssence, nationalE85);
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const baseResult: EnergyPrices = {
      fuelPrice: nationalFuelPrice,
      dieselPrice: Math.round(nationalDiesel * 100) / 100,
      essencePrice: Math.round(nationalEssence * 100) / 100,
      e85Price: Math.round(nationalE85 * 100) / 100,
      electricityHome: 0.2001,
      electricityHomeHP: 0.2001,
      electricityHomeHC: 0.1612,
      electricityPublic: 0.38,
      publicSubscription: 12.0,
      isLive: true,
      lastUpdated: timeStr,
      nationalFuelPrice,
      nationalDieselPrice: Math.round(nationalDiesel * 100) / 100,
      nationalEssencePrice: Math.round(nationalEssence * 100) / 100,
      nationalE85Price: Math.round(nationalE85 * 100) / 100,
      sourceLabel: `Moyenne pondérée nationale (${nationalFuelPrice.toFixed(2)} €/L : 54% Diesel, 43% SP, 3% E85) • EDF (Tarif fixe: 0,2001 € • HC: 0,1612 €/kWh)`,
      departmentPricesMap,
    };

    if (targetDepartmentCode && departmentPricesMap[targetDepartmentCode]) {
      return getPricesForDepartment(baseResult, targetDepartmentCode, fuelType);
    }

    return resetPricesToNational(baseResult, fuelType);
  } catch {
    // Si offline ou erreur réseau, retour aux valeurs de référence officielles
  }

  return targetDepartmentCode
    ? getPricesForDepartment(DEFAULT_PRICES, targetDepartmentCode, fuelType)
    : resetPricesToNational(DEFAULT_PRICES, fuelType);
}
