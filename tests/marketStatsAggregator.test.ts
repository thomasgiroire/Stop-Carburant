import { describe, it, expect } from 'vitest';
import {
  matchAdToModelId,
  aggregateMarketStats,
  isQuadricycleTitle,
  ScrapedAd,
} from '../src/utils/marketStatsAggregator';

describe('marketStatsAggregator - Agrégation et détermination de l\'offre la plus disponible', () => {
  it('exclut les quadricycles et voiturettes sans permis', () => {
    expect(isQuadricycleTitle('Citroën Ami Pop')).toBe(true);
    expect(isQuadricycleTitle('Renault Twizy 45')).toBe(true);
    expect(isQuadricycleTitle('Aixam City')).toBe(true);
    expect(isQuadricycleTitle('Ligier Myli')).toBe(true);
    expect(isQuadricycleTitle('Renault Zoé R90')).toBe(false);
    expect(isQuadricycleTitle('Peugeot e-208')).toBe(false);

    expect(matchAdToModelId('Citroën Ami 2021')).toBe('quadricycle-ignore');
    expect(matchAdToModelId('Renault Twizy 80')).toBe('quadricycle-ignore');
  });

  it('associe fidèlement les annonces aux identifiants modèles sans faux positifs', () => {
    expect(matchAdToModelId('Dacia Spring 45ch Expression')).toBe('dacia-spring-27');
    expect(matchAdToModelId('Peugeot e-208 GT')).toBe('peugeot-e208-50');
    expect(matchAdToModelId('MG MG4 Luxury 64 kWh')).toBe('mg-mg4-luxury-64');
    expect(matchAdToModelId('Hyundai Kona EV 64 kWh Executive')).toBe('hyundai-kona-ev-64');
    expect(matchAdToModelId('Fiat 500e Icone 42 kWh')).toBe('fiat-500e-42');
    expect(matchAdToModelId('Nissan Leaf 40 kWh Tekna')).toBe('nissan-leaf-40');
    expect(matchAdToModelId('BMW i3 120Ah Suite')).toBe('bmw-i3-120ah');
    expect(matchAdToModelId('Volkswagen ID.3 Pro Life')).toBe('volkswagen-id3-pro-58');

    // Vérification que les mots contenant "ion" (comme "occasion" ou "propulsion") ne matchent pas Peugeot iOn
    expect(matchAdToModelId('Tesla Model 3 Propulsion - Véhicule d\'occasion')).toBe('tesla-model-3-standard-60');
    expect(matchAdToModelId('Peugeot iOn 67 ch')).toBe('citroen-czero-peugeot-ion');
    expect(matchAdToModelId('Peugeot iOn EV 67 Active')).toBe('citroen-czero-peugeot-ion');
    expect(matchAdToModelId('Citroën C-Zéro Confort')).toBe('citroen-czero-peugeot-ion');

    // Nouveaux modèles gros rouleurs, retours de flottes et breaks
    expect(matchAdToModelId('RENAULT Megane E-Tech EV40 130ch standard charge Equilibre')).toBe('renault-megane-ev40');
    expect(matchAdToModelId('RENAULT Megane E-Tech EV60 220 ch super charge Techno')).toBe('renault-megane-ev60');
    expect(matchAdToModelId('Renault Scenic E-Tech EV87 220ch iconic')).toBe('renault-scenic-ev87');
    expect(matchAdToModelId('Renault 5 E-Tech 52 kWh')).toBe('renault-5-ev52');
    expect(matchAdToModelId('Peugeot e-2008 GT 50 kWh')).toBe('peugeot-e2008-50');
    expect(matchAdToModelId('Peugeot e-3008 Allure 73 kWh')).toBe('peugeot-e3008-73');
    expect(matchAdToModelId('Peugeot 308 SW électrique 54 kWh')).toBe('peugeot-e308-sw-54');
    expect(matchAdToModelId('MG5 EV Comfort Long Range 61 kWh')).toBe('mg-mg5-ev-61');
    expect(matchAdToModelId('Volkswagen ID.4 Pro Performance 77 kWh')).toBe('volkswagen-id4-pro-77');
    expect(matchAdToModelId('Audi Q4 40 e-tron 77 kWh')).toBe('audi-q4-etron-77');
    expect(matchAdToModelId('Kia EV6 Air Active 77.4 kWh')).toBe('kia-ev6-77');
    expect(matchAdToModelId('Ford Mustang Mach-E Standard Range 76 kWh')).toBe('ford-mustang-mache-76');
    expect(matchAdToModelId('BMW i4 eDrive40 M Sport')).toBe('bmw-i4-edrive40-81');
  });

  it('calcule la médiane, la moyenne et le sweet spot quand un modèle est collecté plusieurs fois', () => {
    const mockAds: ScrapedAd[] = [
      { id: '1', title: 'Renault Zoé Zen', price: 5000, km: 80000, year: 2015 },
      { id: '2', title: 'Renault Zoé Life', price: 5400, km: 75000, year: 2016 },
      { id: '3', title: 'Renault Zoé Intens', price: 5800, km: 70000, year: 2017 },
      { id: '4', title: 'Renault Zoé Zen', price: 6200, km: 65000, year: 2018 },
      { id: '5', title: 'Renault Zoé Life', price: 7000, km: 50000, year: 2018 },
    ];

    const stats = aggregateMarketStats(mockAds);
    const zoeStats = stats['renault-zoe-r90-41'];

    expect(zoeStats).toBeDefined();
    expect(zoeStats.sampleCount).toBe(5);
    // Médiane des prix [5000, 5400, 5800, 6200, 7000] = 5800
    expect(zoeStats.medianPrice).toBe(5800);
    // Moyenne des prix (5000+5400+5800+6200+7000)/5 = 5880
    expect(zoeStats.averagePrice).toBe(5880);
    // Médiane des km [50000, 65000, 70000, 75000, 80000] = 70000
    expect(zoeStats.medianKm).toBe(70000);
    // Moyenne des km (50000+65000+70000+75000+80000)/5 = 68000
    expect(zoeStats.averageKm).toBe(68000);

    expect(zoeStats.minPrice).toBe(5000);
    expect(zoeStats.maxPrice).toBe(7000);
    expect(zoeStats.sweetSpotPrice).toBe(5800);
    expect(zoeStats.sweetSpotKm).toBe(70000);
    expect(zoeStats.mostAvailableSummary).toContain('Marché le plus disponible : 5 800 € pour ~70 000 km');
  });
});
