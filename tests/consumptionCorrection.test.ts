import { describe, it, expect } from 'vitest';
import {
  getSegmentCorrection,
  applyCorrectionToConstructorData,
  getCorrectedVehicleSpecs,
  getVehicleCorrectionBadge,
  CONSUMPTION_BENCHMARKS,
} from '../src/utils/consumptionCorrection';
import evDatabase from '../src/data/evDatabase.json';

describe('Module de correction de consommation et autonomie IRL (La Chaîne EV)', () => {
  it('charge correctement la base de connaissances et les statistiques globales', () => {
    expect(CONSUMPTION_BENCHMARKS).toBeDefined();
    expect(CONSUMPTION_BENCHMARKS.globalStats).toBeDefined();
    expect(CONSUMPTION_BENCHMARKS.globalStats.averageRangeDiscountMixedPct).toBeLessThan(0);
    expect(CONSUMPTION_BENCHMARKS.globalStats.averageRangeDiscountHighwayPct).toBeLessThan(
      CONSUMPTION_BENCHMARKS.globalStats.averageRangeDiscountMixedPct
    );
    expect(CONSUMPTION_BENCHMARKS.globalStats.averageConsoInflationFactor).toBeGreaterThan(1);
  });

  it('fournit des facteurs de correction cohérents par segment de carrosserie', () => {
    const segments = ['citadine', 'compacte', 'berline', 'suv', 'break'];
    for (const segment of segments) {
      const factors = getSegmentCorrection(segment);
      expect(factors).toBeDefined();
      expect(factors.rangeDiscountMixedPct).toBeLessThan(0);
      expect(factors.rangeDiscountHighwayPct).toBeLessThan(factors.rangeDiscountMixedPct);
      expect(factors.consoInflationFactor).toBeGreaterThan(1);
    }
  });

  it('applique correctement la décote aux données pures constructeur (WLTP)', () => {
    const wltp = 400;
    const battery = 54;
    const corrected = applyCorrectionToConstructorData(wltp, battery, 'suv');

    expect(corrected.rangeDiscountPct).toBeLessThan(0);
    // L'autonomie réelle doit être inférieure à l'autonomie WLTP
    expect(corrected.realRangeKm).toBeLessThan(wltp);
    expect(corrected.realRangeKm).toBeGreaterThan(250);

    // L'autonomie autoroute 130 km/h doit être encore plus faible
    expect(corrected.highwayRangeKm).toBeLessThan(corrected.realRangeKm);

    // La consommation réelle (kWh/100) doit être supérieure à la consommation théorique WLTP
    const theoreticalConso = (battery / wltp) * 100;
    expect(corrected.realConsoKwh100).toBeGreaterThan(theoreticalConso);
    expect(corrected.highwayConsoKwh100).toBeGreaterThan(corrected.realConsoKwh100);
  });

  it('priorise le test direct La Chaîne EV lorsqu\'il existe pour un modèle', () => {
    const peugeot208 = evDatabase.find((c) => c.id === 'peugeot-e208-50');
    expect(peugeot208).toBeDefined();

    const specs = getCorrectedVehicleSpecs(peugeot208!);
    expect(specs.hasDirectIRLTest).toBe(true);
    expect(specs.realRangeKm).toBe(290);
    expect(specs.badgeText).toContain('IRL certifié');
    expect(specs.sourceText).toContain('La Chaîne EV');
  });

  it('calcule une estimation étalonnée pour un véhicule sans test direct', () => {
    const mockNewCar = {
      id: 'nouveau-modele-virtuel-60',
      fullName: 'Nouveau Modèle Virtuel 60 kWh',
      bodyType: 'suv' as const,
      wltpRangeKm: 450,
      batteryNetKwh: 60,
      hasDirectIRLTest: false,
    };

    const specs = getCorrectedVehicleSpecs(mockNewCar);
    expect(specs.hasDirectIRLTest).toBe(false);
    expect(specs.realRangeKm).toBeLessThan(mockNewCar.wltpRangeKm);
    expect(specs.realConsoKwh100).toBeGreaterThan(13);
    expect(specs.badgeText).toContain('Corrigé IRL');
  });

  it('garantit que 100% des véhicules du catalogue officiel disposent de métriques IRL', () => {
    for (const car of evDatabase) {
      expect(car.realRangeKm).toBeGreaterThan(0);
      expect(car.realConsoKwh100).toBeGreaterThan(0);
      expect(car.rangeDiscountPct).toBeDefined();
      expect(car.rangeDiscountPct).toBeLessThan(0);
      expect(car.realRangeKm).toBeLessThanOrEqual(car.wltpRangeKm);
    }
  });

  it('génère un libellé de badge de certification précis selon le type de mesure', () => {
    const directBadge = getVehicleCorrectionBadge({
      rangeDiscountPct: -8.5,
      hasDirectIRLTest: true,
    });
    expect(directBadge).toBe('IRL certifié -8.5% vs WLTP (La Chaîne EV)');

    const estimatedBadge = getVehicleCorrectionBadge({
      rangeDiscountPct: -9.8,
      hasDirectIRLTest: false,
    });
    expect(estimatedBadge).toBe('Étalonné -9.8% vs WLTP (coefficient IRL)');

    const undefinedBadge = getVehicleCorrectionBadge({});
    expect(undefinedBadge).toBeUndefined();
  });
});
