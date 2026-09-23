import { describe, it, expect } from 'vitest';
import { EVDatabaseService } from '../src/services/evDatabaseService';

describe('EVDatabaseService - Référentiel Open Data (OpenEV Data & ADEME)', () => {
  it('charge la base de données certifiée et contient tous les modèles majeurs en France', () => {
    const models = EVDatabaseService.getAllModels();
    expect(models.length).toBeGreaterThanOrEqual(15);

    const fullNames = models.map((m) => m.fullName.toLowerCase());
    expect(fullNames.some((n) => n.includes('spring'))).toBe(true);
    expect(fullNames.some((n) => n.includes('zoé') || n.includes('zoe'))).toBe(true);
    expect(fullNames.some((n) => n.includes('208'))).toBe(true);
    expect(fullNames.some((n) => n.includes('mg4'))).toBe(true);
    expect(fullNames.some((n) => n.includes('tesla') || n.includes('model 3'))).toBe(true);
    expect(fullNames.some((n) => n.includes('kona'))).toBe(true);
    expect(fullNames.some((n) => n.includes('twingo'))).toBe(true);
  });

  it('respecte les bornes physiques réalistes pour chaque véhicule', () => {
    const models = EVDatabaseService.getAllModels();

    for (const car of models) {
      // Autonomie réelle réaliste (entre 120 km et 650 km)
      expect(car.realRangeKm).toBeGreaterThanOrEqual(120);
      expect(car.realRangeKm).toBeLessThanOrEqual(650);

      // Consommation réelle mixte étalonnée (entre 12.0 et 22.0 kWh/100 km)
      expect(car.realConsoKwh100).toBeGreaterThanOrEqual(12.0);
      expect(car.realConsoKwh100).toBeLessThanOrEqual(22.0);

      // Capacité de batterie utile (net)
      expect(car.batteryNetKwh).toBeGreaterThanOrEqual(15.0);
      expect(car.batteryNetKwh).toBeLessThanOrEqual(110.0);

      // Prix de marché professionnel constaté
      expect(car.estimatedMarketPrice).toBeGreaterThanOrEqual(5000);

      // Puissances de recharge
      expect(car.acMaxPowerKw).toBeGreaterThanOrEqual(6.0);
      expect(car.dcMaxPowerKw).toBeGreaterThanOrEqual(0.0);
    }
  });

  it('filtre efficacement par marque, carrosserie et budget', () => {
    const ren = EVDatabaseService.filterModels({ make: 'Renault' });
    expect(ren.length).toBeGreaterThanOrEqual(5);
    ren.forEach((c) => expect(c.make).toBe('Renault'));

    const suvs = EVDatabaseService.filterModels({ bodyType: 'suv' });
    expect(suvs.length).toBeGreaterThanOrEqual(8);
    suvs.forEach((c) => expect(c.bodyType).toBe('suv'));

    const breaks = EVDatabaseService.filterModels({ bodyType: 'break' });
    expect(breaks.length).toBeGreaterThanOrEqual(2);
    breaks.forEach((c) => expect(c.bodyType).toBe('break'));

    const budgetUnder15k = EVDatabaseService.filterModels({ maxPrice: 15000 });
    budgetUnder15k.forEach((c) => expect(c.estimatedMarketPrice).toBeLessThanOrEqual(15000));
  });

  it('intègre les modèles phares pour gros rouleurs et retours de flottes', () => {
    const megane40 = EVDatabaseService.getModelById('renault-megane-ev40');
    expect(megane40).toBeDefined();
    expect(megane40?.batteryNetKwh).toBe(38);
    expect(megane40?.estimatedMarketPrice).toBeLessThanOrEqual(21000);

    const scenic = EVDatabaseService.getModelById('renault-scenic-ev87');
    expect(scenic).toBeDefined();
    expect(scenic?.realRangeKm).toBeGreaterThanOrEqual(450);

    const q4 = EVDatabaseService.getModelById('audi-q4-etron-77');
    expect(q4).toBeDefined();
    expect(q4?.bodyType).toBe('suv');

    const id4 = EVDatabaseService.getModelById('volkswagen-id4-pro-77');
    expect(id4).toBeDefined();

    const mg5 = EVDatabaseService.getModelById('mg-mg5-ev-61');
    expect(mg5).toBeDefined();
    expect(mg5?.bodyType).toBe('break');

    const ev6 = EVDatabaseService.getModelById('kia-ev6-77');
    expect(ev6).toBeDefined();
    expect(ev6?.fastCharge10to80Min).toBeLessThanOrEqual(20);
  });

  it('calcule correctement les bilans financiers personnalisés avec le budget carburant', () => {
    const zoe = EVDatabaseService.findModelByName('Renault Zoé R90 (Batterie 41 kWh)');
    expect(zoe).toBeDefined();

    if (zoe) {
      // 150 €/mois de carburant, 70 km/j
      const fin = EVDatabaseService.calculateFinancials(zoe, 150, 70, 'eco_1pct');
      expect(fin.monthlyLoan).toBeGreaterThan(0);
      expect(fin.monthlyElectricityHC).toBeGreaterThan(0);
      expect(fin.maintenanceSavings).toBeGreaterThanOrEqual(15);
      expect(fin.totalMonthlyCostHC).toBe(fin.monthlyLoan + fin.monthlyElectricityHC);
    }
  });

  it('fournit des statistiques de marché Leboncoin réalistes pour les modèles populaires', () => {
    const springStats = EVDatabaseService.getMarketStats('dacia-spring-27');
    expect(springStats).toBeDefined();
    if (springStats) {
      expect(springStats.sampleCount).toBeGreaterThanOrEqual(10);
      expect(springStats.medianPrice).toBeGreaterThanOrEqual(5000);
      expect(springStats.medianPrice).toBeLessThanOrEqual(15000);
      expect(springStats.medianKm).toBeGreaterThanOrEqual(10000);
      expect(springStats.medianKm).toBeLessThanOrEqual(80000);
      expect(springStats.mostAvailableSummary).toContain('Marché le plus disponible');
    }

    const zoeStats = EVDatabaseService.findMarketStatsByName('Renault Zoé R90 (Batterie 41 kWh)');
    expect(zoeStats).toBeDefined();
    if (zoeStats) {
      expect(zoeStats.sampleCount).toBeGreaterThanOrEqual(5);
      expect(zoeStats.medianPrice).toBeGreaterThanOrEqual(5000);
      expect(zoeStats.medianKm).toBeGreaterThanOrEqual(40000);
    }
  });
});
