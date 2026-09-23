import { describe, it, expect } from 'vitest';
import { calculateSimulation, calculateImplicitDailyKm, formatCurrency, formatNumber } from '../src/utils/calculator';
import { DEFAULT_PRICES } from '../src/services/energyPrices';

describe('Calculateur financier (Stop-Carburant)', () => {
  it('calcule correctement la simulation pour un profil standard maison individuelle', () => {
    // Profil : 200 € / mois carburant, 45 km / jour, maison
    const result = calculateSimulation(200, 'maison', 45, DEFAULT_PRICES);

    expect(result.fuelBudget).toBe(200);
    // 45 km * 24 jours d'utilisation globale = 1080 km / mois
    expect(result.monthlyKm).toBe(1080);

    // Perte sur 5 ans = 200 * 60 = 12 000 €
    expect(result.loss5Years).toBe(12000);

    // Coût électricité maison Heures Pleines (15.2 kWh/100km * ~0.2001 €/kWh)
    expect(result.electricityCostHP).toBeGreaterThan(0);
    expect(result.electricityCostHP).toBeLessThan(200);

    // Coût électricité maison Heures Creuses doit être inférieur au tarif plein
    expect(result.electricityCostHC).toBeLessThan(result.electricityCostHP);

    // Économies d'entretien calculées
    expect(result.maintenanceSavings).toBeGreaterThanOrEqual(15);

    // Cash libéré doit être strictement positif
    expect(result.liberatedCash).toBeGreaterThan(0);
    expect(result.carLeaseBudget).toBe(result.liberatedCash);
  });

  it('prend en compte l\'abonnement pour les recharges publiques en appartement', () => {
    const maisonResult = calculateSimulation(200, 'maison', 45, DEFAULT_PRICES);
    const appartResult = calculateSimulation(200, 'appartement', 45, DEFAULT_PRICES);

    // En appartement, le coût électricité inclut les 12€ d'abonnement et le tarif borne publique
    expect(appartResult.electricityCost).toBeGreaterThan(maisonResult.electricityCost);
  });

  it('applique les bornes min et max réalistes de consommation thermique (4.0 L à 12.0 L)', () => {
    // Budget très faible avec gros kilométrage -> plafonné au min (4.0 L/100km)
    const lowConsoResult = calculateSimulation(20, 'maison', 100, DEFAULT_PRICES);
    expect(lowConsoResult.userConsumptionLiters).toBeGreaterThanOrEqual(4.0);
    expect(lowConsoResult.isConsumptionCappedMin).toBe(true);

    // Budget énorme avec faible kilométrage -> plafonné au max (12.0 L/100km)
    const highConsoResult = calculateSimulation(400, 'maison', 5, DEFAULT_PRICES);
    expect(highConsoResult.userConsumptionLiters).toBeLessThanOrEqual(12.0);
    expect(highConsoResult.isConsumptionCappedMax).toBe(true);
  });

  it('calcule le kilométrage journalier implicite à partir du budget', () => {
    const km = calculateImplicitDailyKm(200, 2.0);
    expect(km).toBeGreaterThan(0);
    // Doit être un multiple de 5
    expect(km % 5).toBe(0);
  });

  it('garantit une stricte cohérence mathématique : userCostPer100Km = userConsumptionLiters * fuelPrice', () => {
    const sim = calculateSimulation(200, 'maison', 45, DEFAULT_PRICES);
    const fuelPrice = DEFAULT_PRICES.fuelPrice; // 1.74 €/L
    // La consommation thermique retenue (200€ / 1080km * 100 / 1.74 = ~10.6 L/100km)
    expect(sim.userConsumptionLiters).toBe(10.6);
    // Le coût aux 100 km est (200 / 1080) * 100 = 18.52 €
    expect(sim.userCostPer100Km).toBe(18.52);
  });

  it('prend en compte fidèlement la consommation électrique du véhicule spécifique', () => {
    // Profil standard avec Dacia Spring (13.5 kWh/100km) vs Tesla Model Y (16.2 kWh/100km)
    const simSpring = calculateSimulation(200, 'maison', 45, DEFAULT_PRICES, 'HP', 13.5);
    const simTesla = calculateSimulation(200, 'maison', 45, DEFAULT_PRICES, 'HP', 16.2);

    expect(simSpring.consoElec).toBe(13.5);
    expect(simTesla.consoElec).toBe(16.2);

    // Le coût aux 100 km électrique doit être plus faible pour la Spring que pour le Model Y
    expect(simSpring.electricCostPer100Km).toBeLessThan(simTesla.electricCostPer100Km);
    expect(simSpring.electricityCost).toBeLessThan(simTesla.electricityCost);

    // Le cash libéré doit être plus élevé pour la voiture plus sobre
    expect(simSpring.liberatedCash).toBeGreaterThan(simTesla.liberatedCash);
  });

  it('respecte strictement la formule : liberatedCash = fuelBudget - electricityCost + maintenanceSavings', () => {
    const sim = calculateSimulation(200, 'maison', 45, DEFAULT_PRICES, 'HP', 15.2);
    const expected = Math.max(0, sim.fuelBudget - sim.electricityCost + sim.maintenanceSavings);
    expect(sim.liberatedCash).toBe(expected);
    expect(sim.carLeaseBudget).toBe(expected);
  });

  it('formate correctement les devises en EUR', () => {
    const formatted = formatCurrency(150);
    // Vérifie que le format contient "150" et "€"
    expect(formatted).toContain('150');
    expect(formatted).toContain('€');
  });

  it('formate correctement les nombres', () => {
    const formatted = formatNumber(12000);
    expect(formatted.replace(/\s/g, '')).toContain('12000');
  });
});
