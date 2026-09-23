import { describe, it, expect } from 'vitest';
import {
  getSegmentCorrection,
  applyCorrectionToConstructorData,
  getCorrectedVehicleSpecs,
  getVehicleCorrectionBadge,
  calculateEstimatedSoHPct,
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
    expect(specs.nominalRealRangeKm).toBe(290);
    expect(specs.realRangeKm).toBe(peugeot208!.realRangeKm);
    expect(specs.badgeText).toContain('Mesure réelle sur route');
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
    expect(specs.badgeText).toContain('Autonomie réelle étalonnée');
  });

  it('garantit que 100% des véhicules du catalogue officiel disposent de métriques IRL et SoH', () => {
    for (const car of evDatabase) {
      expect(car.realRangeKm).toBeGreaterThan(0);
      expect(car.realConsoKwh100).toBeGreaterThan(0);
      expect(car.rangeDiscountPct).toBeDefined();
      expect(car.rangeDiscountPct).toBeLessThan(0);
      expect(car.realRangeKm).toBeLessThanOrEqual(car.wltpRangeKm);
      expect(car.estimatedSoHPct).toBeGreaterThanOrEqual(75);
      expect(car.estimatedSoHPct).toBeLessThanOrEqual(100);
      expect(car.usableBatteryKwh).toBeLessThanOrEqual(car.batteryNetKwh);
    }
  });

  it('calcule la dégradation de batterie (SoH) selon l\'ancienneté et la technologie thermique', () => {
    // Véhicule très récent (2024-2025, ~1-2 ans) : dégradation minime (~97%)
    const recentSoH = calculateEstimatedSoHPct('2024 - 2025', 'volvo-ex30-51');
    expect(recentSoH).toBeGreaterThanOrEqual(95);

    // Véhicule intermédiaire liquide (2020-2023, ~4-5 ans) : dégradation modérée (~92-94%)
    const intermediateSoH = calculateEstimatedSoHPct('2020 - 2023', 'peugeot-e208-50');
    expect(intermediateSoH).toBeLessThan(recentSoH);
    expect(intermediateSoH).toBeGreaterThan(88);

    // Véhicule ancien à air pulsé (2017-2019, ~8 ans) : usure plus prononcée (~84-86%)
    const olderAirSoH = calculateEstimatedSoHPct('2017 - 2019', 'renault-zoe-r90-41');
    expect(olderAirSoH).toBeLessThan(intermediateSoH);
    expect(olderAirSoH).toBeGreaterThanOrEqual(80);

    // Véhicule à refroidissement passif (Leaf 2018-2021) : dégradation thermique passive
    const passiveLeafSoH = calculateEstimatedSoHPct('2018 - 2021', 'nissan-leaf-40');
    expect(passiveLeafSoH).toBeLessThan(intermediateSoH);
  });

  it('génère un libellé de badge de certification précis avec transparence SoH', () => {
    const directBadge = getVehicleCorrectionBadge({
      rangeDiscountPct: -8.5,
      hasDirectIRLTest: true,
      estimatedSoHPct: 85,
    });
    expect(directBadge).toBe('Mesure réelle sur route (La Chaîne EV) • Santé batterie ~85%');

    const estimatedBadge = getVehicleCorrectionBadge({
      rangeDiscountPct: -9.8,
      hasDirectIRLTest: false,
      estimatedSoHPct: 92,
    });
    expect(estimatedBadge).toBe('Autonomie réelle étalonnée • Santé batterie ~92%');

    const undefinedBadge = getVehicleCorrectionBadge({});
    expect(undefinedBadge).toBeUndefined();
  });
});
