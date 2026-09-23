/**
 * Utilitaires de calcul du crédit auto pour véhicules électriques d'occasion.
 * Intègre les barèmes du Prêt Éco-Mobilité (Crédit Mutuel & CIC) à taux bonifié de 1,00% TAEG
 * et les barèmes standards de crédit auto à 4,90% TAEG.
 */

export type LoanRateMode = 'eco_1pct' | 'standard_4_9pct';

export interface LoanFinancingResult {
  monthly: number;
  totalCost: number;
  totalInterest: number;
  taegDisplay: string;
  isEcoMobility: boolean;
  capital: number;
  months: number;
  downPayment?: number;
  equipmentNetCost?: number;
}

/**
 * Formule standard d'amortissement d'un prêt à taux fixe.
 * M = [Capital * (t/12)] / [1 - (1 + t/12)^(-n)]
 */
export function calculateRawMonthly(capital: number, annualRate: number, months: number = 60): number {
  if (capital <= 0) return 0;
  if (annualRate <= 0) return capital / months;
  const monthlyRate = annualRate / 12;
  return (capital * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

/**
 * Calcule la mensualité et les intérêts selon l'offre choisie :
 * - 'eco_1pct' : Offre Crédit Mutuel & CIC Éco-Mobilité à 1,00% TAEG fixe jusqu'à 10 000 € (0 € frais de dossier).
 *   Pour un capital <= 10 000 €, 100% du crédit est à 1,00%. Au-delà, le surplus est calculé au taux standard 4,90%.
 * - 'standard_4_9pct' : Crédit auto amortissable classique moyen à 4,90% TAEG.
 * - downPayment : Apport personnel éventuel (reprise de l'ancien véhicule), déduit du capital à emprunter.
 * - equipmentNetCost : Coût net de l'équipement de recharge à domicile (après déduction du crédit d'impôt).
 */
export function calculateEVFinancing(
  price: number,
  mode: LoanRateMode = 'eco_1pct',
  months: number = 60,
  downPayment: number = 0,
  equipmentNetCost: number = 0
): LoanFinancingResult {
  const totalPrice = Math.max(0, price + Math.max(0, equipmentNetCost));
  const effectiveDownPayment = Math.max(0, Math.min(totalPrice, Math.max(0, downPayment || 0)));
  const capital = Math.max(0, totalPrice - effectiveDownPayment);

  if (capital === 0) {
    return {
      monthly: 0,
      totalCost: 0,
      totalInterest: 0,
      taegDisplay: mode === 'eco_1pct' ? '1,00% TAEG fixe' : '4,90% TAEG fixe',
      isEcoMobility: mode === 'eco_1pct',
      capital: 0,
      months,
      downPayment: effectiveDownPayment,
    };
  }

  if (mode === 'eco_1pct') {
    // Crédit Mutuel & CIC Éco-mobilité : 1.00% TAEG fixe jusqu'à 10 000 € sur 60 mois
    const ecoCappedAmount = Math.min(capital, 10000);
    const remainderAmount = Math.max(0, capital - 10000);

    const monthlyEco = calculateRawMonthly(ecoCappedAmount, 0.01, months);
    const monthlyRemainder = remainderAmount > 0 
      ? calculateRawMonthly(remainderAmount, 0.049, months) 
      : 0;

    const rawMonthly = monthlyEco + monthlyRemainder;
    const monthly = Math.round(rawMonthly);
    const totalCost = monthly * months;
    const totalInterest = Math.max(0, totalCost - capital);

    return {
      monthly,
      totalCost,
      totalInterest,
      taegDisplay: remainderAmount > 0 ? '1,00% (jusqu\'à 10k€) + 4,90%' : '1,00% TAEG fixe',
      isEcoMobility: true,
      capital,
      months,
      downPayment: effectiveDownPayment,
    };
  }

  // Taux standard bancaire classique 4.90%
  const rawMonthly = calculateRawMonthly(capital, 0.049, months);
  const monthly = Math.round(rawMonthly);
  const totalCost = monthly * months;
  const totalInterest = Math.max(0, totalCost - capital);

  return {
    monthly,
    totalCost,
    totalInterest,
    taegDisplay: '4,90% TAEG fixe',
    isEcoMobility: false,
    capital,
    months,
    downPayment: effectiveDownPayment,
  };
}

/**
 * Calcule l'apport (reprise véhicule) minimum nécessaire pour annuler le reste à charge mensuel
 * (rendre l'opération neutre / 100% autofinancée avec mensualité <= targetMonthly).
 * Arrondi au pas souhaité (par défaut 100 €).
 */
export function calculateBreakEvenDownPayment(
  price: number,
  targetMonthly: number,
  mode: LoanRateMode = 'eco_1pct',
  months: number = 60,
  step: number = 100,
  equipmentNetCost: number = 0
): number {
  const totalPrice = price + Math.max(0, equipmentNetCost);
  if (targetMonthly <= 0) return totalPrice;
  if (totalPrice <= 0) return 0;

  // Si déjà autofinancé sans apport
  if (calculateEVFinancing(price, mode, months, 0, equipmentNetCost).monthly <= targetMonthly) {
    return 0;
  }

  // Recherche du premier palier d'apport permettant de couvrir l'intégralité du reste à charge
  for (let d = step; d < totalPrice; d += step) {
    if (calculateEVFinancing(price, mode, months, d, equipmentNetCost).monthly <= targetMonthly) {
      return d;
    }
  }

  return totalPrice;
}


export const ECO_MOBILITY_PARTNERS = {
  creditMutuel: {
    name: 'Crédit Mutuel',
    offerName: 'Prêt Éco-Mobilité',
    rateDisplay: '1,00% TAEG fixe',
    maxAmountAt1Pct: 10000,
    maxDurationMonths: 60,
    fees: 0,
    url: 'https://www.creditmutuel.fr/fr/particuliers/credits/eco-mobilite.html',
    badge: 'Dividende Sociétal',
  },
  cic: {
    name: 'CIC',
    offerName: 'Prêt Auto Éco-Mobilité',
    rateDisplay: '1,00% TAEG fixe',
    maxAmountAt1Pct: 10000,
    maxDurationMonths: 60,
    fees: 0,
    url: 'https://www.cic.fr/fr/particuliers/credits/eco-mobilite.html',
    badge: 'Offre Mobilité Propre',
  },
};
