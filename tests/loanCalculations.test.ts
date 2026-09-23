import { describe, it, expect } from 'vitest';
import { calculateRawMonthly, calculateEVFinancing, ECO_MOBILITY_PARTNERS } from '../src/utils/loanCalculations';

describe('Calculateur de financement auto (Stop-Carburant)', () => {
  it('calcule correctement la mensualité brute avec amortissement à taux fixe', () => {
    // 10 000 € sur 60 mois à 1%
    const monthly = calculateRawMonthly(10000, 0.01, 60);
    // [10000 * (0.01/12)] / [1 - (1 + 0.01/12)^(-60)] = ~170.94 €
    expect(monthly).toBeGreaterThan(165);
    expect(monthly).toBeLessThan(175);
  });

  it('gère l\'offre Éco-mobilité 1.00% jusqu\'à 10 000 €', () => {
    const loan = calculateEVFinancing(10000, 'eco_1pct', 60);
    expect(loan.monthly).toBe(171);
    expect(loan.isEcoMobility).toBe(true);
    expect(loan.taegDisplay).toContain('1,00%');
    expect(loan.totalInterest).toBeLessThan(500);
  });

  it('applique le taux mixte (1.00% sur 10k + 4.90% au-delà) pour un véhicule à 15 000 €', () => {
    const loan = calculateEVFinancing(15000, 'eco_1pct', 60);
    expect(loan.monthly).toBeGreaterThan(250);
    expect(loan.taegDisplay).toContain('1,00% (jusqu\'à 10k€) + 4,90%');
  });

  it('calcule correctement le taux bancaire standard à 4.90%', () => {
    const loan = calculateEVFinancing(10000, 'standard_4_9pct', 60);
    expect(loan.isEcoMobility).toBe(false);
    expect(loan.taegDisplay).toBe('4,90% TAEG fixe');
    // Le coût mensuel à 4.90% doit être supérieur à celui à 1.00%
    const ecoLoan = calculateEVFinancing(10000, 'eco_1pct', 60);
    expect(loan.monthly).toBeGreaterThan(ecoLoan.monthly);
  });

  it('contient les références des partenaires Éco-Mobilité certifiés', () => {
    expect(ECO_MOBILITY_PARTNERS.creditMutuel.name).toBe('Crédit Mutuel');
    expect(ECO_MOBILITY_PARTNERS.cic.name).toBe('CIC');
    expect(ECO_MOBILITY_PARTNERS.creditMutuel.fees).toBe(0);
  });

  it('déduit l\'apport personnel (valeur résiduelle) du capital et réduit la mensualité', () => {
    // Véhicule à 6 000 €, sans apport : mensualité ~103 € sur 60 mois
    const loanNoDownPayment = calculateEVFinancing(6000, 'eco_1pct', 60, 0);
    expect(loanNoDownPayment.monthly).toBe(103);
    expect(loanNoDownPayment.capital).toBe(6000);

    // Véhicule à 6 000 € avec 2 000 € d'apport (reprise véhicule actuel) -> capital = 4 000 €
    const loanWithDownPayment = calculateEVFinancing(6000, 'eco_1pct', 60, 2000);
    expect(loanWithDownPayment.capital).toBe(4000);
    expect(loanWithDownPayment.downPayment).toBe(2000);
    expect(loanWithDownPayment.monthly).toBe(68);
    expect(loanWithDownPayment.monthly).toBeLessThan(loanNoDownPayment.monthly);

    // Si apport = prix total (véhicule 100% payé par la reprise)
    const loanFullyPaid = calculateEVFinancing(6000, 'eco_1pct', 60, 6000);
    expect(loanFullyPaid.capital).toBe(0);
    expect(loanFullyPaid.monthly).toBe(0);
    expect(loanFullyPaid.totalCost).toBe(0);
    expect(loanFullyPaid.totalInterest).toBe(0);
  });
});
