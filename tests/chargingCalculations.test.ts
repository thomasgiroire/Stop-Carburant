import { describe, it, expect } from 'vitest';
import {
  CHARGING_EQUIPMENT_OPTIONS,
  calculateNightlyRecoveredKm,
  simulateWorkweekBattery,
  getRecommendedChargingEquipment,
} from '../src/utils/chargingCalculations';

describe('Calculateur d\'équipement de recharge (Stop-Carburant)', () => {
  describe('Spécifications physiques et financières', () => {
    it('intègre les rendements réalistes (pertes AC) pour chaque équipement', () => {
      // Prise classique : 85% de rendement (perte ~15%)
      expect(CHARGING_EQUIPMENT_OPTIONS.standard_plug.efficiency).toBe(0.85);
      expect(CHARGING_EQUIPMENT_OPTIONS.standard_plug.nightEnergyKwh).toBeCloseTo(15.6, 1);

      // Prise renforcée : 88% de rendement (perte ~12%)
      expect(CHARGING_EQUIPMENT_OPTIONS.reinforced_plug.efficiency).toBe(0.88);
      expect(CHARGING_EQUIPMENT_OPTIONS.reinforced_plug.nightEnergyKwh).toBeCloseTo(26.0, 1);

      // Borne 7,4 kW : 90% de rendement (perte ~10%)
      expect(CHARGING_EQUIPMENT_OPTIONS.wallbox_7kw.efficiency).toBe(0.90);
      expect(CHARGING_EQUIPMENT_OPTIONS.wallbox_7kw.nightEnergyKwh).toBeCloseTo(53.3, 1);
    });

    it('applique le crédit d\'impôt de 500 € pour la borne 7,4 kW', () => {
      const wallbox = CHARGING_EQUIPMENT_OPTIONS.wallbox_7kw;
      expect(wallbox.grossCost).toBe(1400);
      expect(wallbox.taxCredit).toBe(500);
      expect(wallbox.netCost).toBe(900);

      const standard = CHARGING_EQUIPMENT_OPTIONS.standard_plug;
      expect(standard.grossCost).toBe(0);
      expect(standard.netCost).toBe(0);

      const reinforced = CHARGING_EQUIPMENT_OPTIONS.reinforced_plug;
      expect(reinforced.grossCost).toBe(450);
      expect(reinforced.netCost).toBe(450);
    });

    it('calcule les kilomètres récupérés en 8h selon la consommation du véhicule', () => {
      // MG4 Luxury : 16.0 kWh/100km
      const mg4Standard = calculateNightlyRecoveredKm('standard_plug', 16.0);
      expect(mg4Standard).toBe(Math.round((15.6 / 16.0) * 100)); // 98 km

      const mg4Reinforced = calculateNightlyRecoveredKm('reinforced_plug', 16.0);
      expect(mg4Reinforced).toBe(Math.round((26.0 / 16.0) * 100)); // 163 km

      const mg4Wallbox = calculateNightlyRecoveredKm('wallbox_7kw', 16.0);
      expect(mg4Wallbox).toBe(Math.round((53.3 / 16.0) * 100)); // 333 km
    });
  });

  describe('Règle de décision Confort week-end (>= 50% de batterie le vendredi soir)', () => {
    it('maintient la simple prise classique (0 €) si le vendredi soir reste >= 50%', () => {
      // Profil 45 km/jour avec autonomie réelle de 260 km et conso 15.2 kWh/100km
      const rec = getRecommendedChargingEquipment(45, 260, 15.2, 'maison');
      expect(rec.recommendedType).toBe('standard_plug');
      expect(rec.simulation.isComfortSufficient).toBe(true);
      expect(rec.simulation.fridayEveningPct).toBeGreaterThanOrEqual(50);
      expect(rec.recommendedOption.netCost).toBe(0);
    });

    it('bascule sur prise renforcée si la prise classique laisse moins de 50% le vendredi soir', () => {
      // Profil 130 km/jour avec autonomie réelle de 310 km et conso 15.5 kWh/100km
      // Sur prise classique : récupère ~101 km/nuit, déficit quotidien de 29 km
      const rec = getRecommendedChargingEquipment(130, 310, 15.5, 'maison');
      expect(rec.simulations.standard_plug.isComfortSufficient).toBe(false);
      expect(rec.simulations.standard_plug.fridayEveningPct).toBeLessThan(50);

      // La prise renforcée récupère ~168 km/nuit (> 130 km/j), assure le plein chaque matin
      expect(rec.recommendedType).toBe('reinforced_plug');
      expect(rec.simulation.isComfortSufficient).toBe(true);
      expect(rec.simulation.fridayEveningPct).toBeGreaterThanOrEqual(50);
      expect(rec.recommendedOption.netCost).toBe(450);
    });

    it('bascule sur borne 7,4 kW pour très grand rouleur si la prise renforcée ne suffit pas', () => {
      // Profil 230 km/jour avec autonomie de 380 km et conso 16.0 kWh/100km
      // Même la prise renforcée (163 km/nuit) accuse un déficit de 67 km/j
      const rec = getRecommendedChargingEquipment(230, 380, 16.0, 'maison');
      expect(rec.simulations.standard_plug.isComfortSufficient).toBe(false);
      expect(rec.simulations.reinforced_plug.isComfortSufficient).toBe(false);

      expect(rec.recommendedType).toBe('wallbox_7kw');
      expect(rec.recommendedOption.netCost).toBe(900); // 1 400 - 500
      expect(rec.recommendedOption.taxCredit).toBe(500);
    });

    it('adapte le conseil pour un logement en appartement', () => {
      const rec = getRecommendedChargingEquipment(50, 250, 15.2, 'appartement');
      expect(rec.comfortDiagnosis).toContain('borne publique');
    });
  });
});
