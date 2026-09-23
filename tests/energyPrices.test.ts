import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRICES,
  FLEET_WEIGHTS,
  calculateWeightedFuelPrice,
  getPricesForDepartment,
} from '../src/services/energyPrices';

describe('Tarifs d\'énergie & Pondérations (Stop-Carburant)', () => {
  it('respecte la somme des pondérations officielles du parc automobile français (100%)', () => {
    const totalWeight = FLEET_WEIGHTS.DIESEL + FLEET_WEIGHTS.ESSENCE + FLEET_WEIGHTS.E85;
    expect(Number(totalWeight.toFixed(2))).toBe(1.00);
  });

  it('définit des prix par défaut cohérents avec les données officielles', () => {
    // Carburant moyen pondéré
    expect(DEFAULT_PRICES.fuelPrice).toBeGreaterThan(1.50);
    expect(DEFAULT_PRICES.fuelPrice).toBeLessThan(2.50);

    // Électricité EDF Option Base et Heures Creuses
    expect(DEFAULT_PRICES.electricityHome).toBe(0.2001);
    expect(DEFAULT_PRICES.electricityHomeHC).toBe(0.1612);

    // Les heures creuses doivent être moins chères que le tarif fixe
    expect(DEFAULT_PRICES.electricityHomeHC).toBeLessThan(DEFAULT_PRICES.electricityHome);

    // La recharge publique doit être plus chère que la recharge à domicile
    expect(DEFAULT_PRICES.electricityPublic).toBeGreaterThan(DEFAULT_PRICES.electricityHome);
  });

  it('calcule correctement le prix pondéré selon les parts de marché', () => {
    // 54% de 2.00 = 1.08, 43% de 2.00 = 0.86, 3% de 1.00 = 0.03 => 1.97
    const result = calculateWeightedFuelPrice(2.00, 2.00, 1.00);
    expect(result).toBe(1.97);
  });

  it('adapte correctement les prix pour un département ciblé', () => {
    const mockPrices = {
      ...DEFAULT_PRICES,
      departmentPricesMap: {
        '33': {
          code: '33',
          name: 'Gironde',
          fuelPrice: 2.15,
          dieselPrice: 2.20,
          essencePrice: 2.10,
          e85Price: 0.88,
        },
      },
    };

    const deptPrices = getPricesForDepartment(mockPrices, '33');
    expect(deptPrices.fuelPrice).toBe(2.15);
    expect(deptPrices.dieselPrice).toBe(2.20);
    expect(deptPrices.departmentCode).toBe('33');
    expect(deptPrices.departmentName).toBe('Gironde');
    expect(deptPrices.isDepartmental).toBe(true);

    // Test avec filtre Gazole
    const dieselPrices = getPricesForDepartment(mockPrices, '33', 'diesel');
    expect(dieselPrices.fuelPrice).toBe(2.20);
    expect(dieselPrices.selectedFuelType).toBe('diesel');

    // Test avec filtre Superéthanol E85
    const e85Prices = getPricesForDepartment(mockPrices, '33', 'e85');
    expect(e85Prices.fuelPrice).toBe(0.88);
    expect(e85Prices.selectedFuelType).toBe('e85');

    // Test avec filtre Essence
    const essencePrices = getPricesForDepartment(mockPrices, '33', 'essence');
    expect(essencePrices.fuelPrice).toBe(2.10);
    expect(essencePrices.selectedFuelType).toBe('essence');
  });
});
