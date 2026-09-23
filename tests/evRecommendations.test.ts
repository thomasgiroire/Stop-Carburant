import { describe, it, expect } from 'vitest';
import {
  getDailyUsageAdvice,
  carCoversDailyNeed,
  getTieredEVRecommendations,
} from '../src/utils/evRecommendations';

describe('evRecommendations - Éligibilité et messages vulgarisés', () => {
  describe('carCoversDailyNeed - Filtrage par besoin quotidien et recharge de nuit', () => {
    it('en maison avec trajet standard (<= 120 km), exige au moins le trajet du jour', () => {
      expect(carCoversDailyNeed(180, 70, 'maison')).toBe(true);
      expect(carCoversDailyNeed(60, 70, 'maison')).toBe(false);
    });

    it('en maison avec grand rouleur (ex: 175 km/j), exige une batterie couvrant le déficit hebdo (280 km)', () => {
      // 175 km/j : 119-120 km de recharge nocturne -> déficit de 55-56 km/j -> 275-280 km sur 5 jours
      // Zoé 41 kWh (240 km) ne suffit pas pour couvrir la semaine sans recharge extérieure
      expect(carCoversDailyNeed(240, 175, 'maison')).toBe(false);

      // Zoé 52 kWh (310 km) et MG4 (385 km) couvrent le déficit hebdomadaire
      expect(carCoversDailyNeed(310, 175, 'maison')).toBe(true);
      expect(carCoversDailyNeed(385, 175, 'maison')).toBe(true);
      expect(carCoversDailyNeed(430, 175, 'maison')).toBe(true);
    });

    it('recommande un véhicule adapté avec batterie >= 280 km pour 175 km/j en maison', () => {
      const recommendations = getTieredEVRecommendations(175, 400, 'maison');
      expect(recommendations.recommended.realRangeKm).toBeGreaterThanOrEqual(280);
      expect(recommendations.recommended.model).not.toContain('41 kWh');
    });

    it('en maison avec très grand rouleur (235 km/j, budget 620 €/m), recommande impérativement une berline routière (Tesla) et écarte la Zoé', () => {
      // Cas utilisateur réel : 235 km/j et 620 €/m de carburant
      // Zoé et citadines ne couvrent ni l'autonomie ni l'exigence de confort
      expect(carCoversDailyNeed(204, 235, 'maison')).toBe(false);
      expect(carCoversDailyNeed(310, 235, 'maison')).toBe(false);
      expect(carCoversDailyNeed(405, 235, 'maison')).toBe(true);
      expect(carCoversDailyNeed(483, 235, 'maison')).toBe(true);

      const recommendations = getTieredEVRecommendations(235, 500, 'maison');
      expect(recommendations.recommended.model).toMatch(/Tesla|Volkswagen ID\.3|MG4|Hyundai Kona|Scénic/);
      expect(recommendations.recommended.model).not.toContain('Zoé');
      expect(recommendations.recommended.model).not.toContain('Spring');
      expect(recommendations.recommended.bodyType).not.toBe('citadine');
      expect(recommendations.recommended.realRangeKm).toBeGreaterThanOrEqual(350);

      // L'option confort est une routière haut de gamme
      expect(recommendations.economy.model).toMatch(/Tesla|Scénic|EV6|BMW|Enyaq/);
      expect(recommendations.economy.realRangeKm).toBeGreaterThanOrEqual(400);
    });
  });

  describe('getDailyUsageAdvice - Messages sans jargon technique', () => {
    it('ne contient plus de jargon technique (kWh/100 km, données La Chaîne EV)', () => {
      const testCases = [
        getDailyUsageAdvice(30, 240, 'maison'),
        getDailyUsageAdvice(70, 240, 'maison'),
        getDailyUsageAdvice(175, 310, 'maison', 'Renault Zoé Intens R110 (Batterie 52 kWh)'),
        getDailyUsageAdvice(20, 240, 'appartement'),
        getDailyUsageAdvice(40, 240, 'appartement'),
        getDailyUsageAdvice(90, 240, 'appartement'),
      ];

      testCases.forEach((advice) => {
        expect(advice.text).not.toContain('kWh/100 km');
        expect(advice.text).not.toContain('données La Chaîne EV');
      });
    });

    describe('Cas Maison (avec prise à domicile)', () => {
      it('génère le message simplifié pour petit trajet (<= 40 km/j)', () => {
        const advice = getDailyUsageAdvice(30, 240, 'maison');
        expect(advice.pattern).toBe('nocturne_couvre');
        expect(advice.text).toContain('la même que pour votre smartphone !');
        expect(advice.text).toContain('recharge vos 30 km quotidiens');
        expect(advice.text).toContain('240 km de réserve');
      });

      it('génère le message simplifié pour trajet standard (> 40 km/j et <= ~120 km/j)', () => {
        const advice = getDailyUsageAdvice(70, 240, 'maison');
        expect(advice.pattern).toBe('nocturne_couvre');
        expect(advice.text).toContain('la même que pour votre smartphone !');
        expect(advice.text).toContain('recharge vos 70 km quotidiens');
        expect(advice.text).toContain('sans détour en station');
      });

      it('génère le message grand rouleur avec mise en avant des kilomètres manquants (175 km/j)', () => {
        // Pour la Zoé Intens R110 (conso 15.5 kWh/100km) : recharge nocturne = 119 km, manque = 56 km/j
        const advice = getDailyUsageAdvice(175, 310, 'maison', 'Renault Zoé Intens R110 (Batterie 52 kWh)');
        expect(advice.pattern).toBe('nocturne_reserve_weekend');
        expect(advice.text).toContain('environ 119 km sur simple prise (la même que pour votre smartphone !)');
        expect(advice.text).toContain('batterie de 310 km absorbe facilement les 56 km restants chaque jour');
        expect(advice.text).toContain('pour couvrir toute votre semaine sans stress');
      });

      it('génère le conseil prise renforcée/borne si la batterie ne peut pas absorber le déficit hebdo', () => {
        // Si batterie de 240 km pour 175 km/j (déficit de 280 km > 240 km)
        const advice = getDailyUsageAdvice(175, 240, 'maison', 'Renault Zoé Intens R110 (Batterie 52 kWh)');
        expect(advice.badge).toBe('Borne à domicile conseillée');
        expect(advice.text).toContain('prise renforcée (Green\'up) ou d\'une borne 7,4 kW');
      });
    });

    describe('Cas Appartement (sans prise à domicile)', () => {
      it('génère le message simplifié pour longue autonomie (>= 10 jours de trajets)', () => {
        const advice = getDailyUsageAdvice(20, 240, 'appartement');
        expect(advice.pattern).toBe('batterie_recharge_espacee');
        expect(advice.badge).toContain('semaines');
        expect(advice.text).toContain('Même sans prise chez vous');
        expect(advice.text).toContain('semaines entières de trajets');
        expect(advice.text).toContain('pendant vos courses');
      });

      it('génère le message simplifié pour autonomie hebdomadaire (5 à 9 jours)', () => {
        const advice = getDailyUsageAdvice(40, 240, 'appartement');
        expect(advice.pattern).toBe('batterie_recharge_espacee');
        expect(advice.badge).toBe('1 seule recharge par semaine');
        expect(advice.text).toContain('Même sans prise chez vous');
        expect(advice.text).toContain('toute votre semaine de trajets (200 km)');
        expect(advice.text).toContain('pendant vos courses');
      });

      it('génère le message simplifié pour autonomie courte (< 5 jours)', () => {
        const advice = getDailyUsageAdvice(90, 240, 'appartement');
        expect(advice.pattern).toBe('batterie_recharge_espacee');
        expect(advice.badge).toBe('1 recharge tous les 2 jours');
        expect(advice.text).toContain('Même sans prise chez vous');
        expect(advice.text).toContain('absorbe 2 jours de trajets d\'affilée');
        expect(advice.text).toContain('tous les 2 jours');
      });
    });
  });

  describe('Hiérarchie des catégories et Option Confort (Option B)', () => {
    it('classe correctement les véhicules dans les 4 niveaux de l\'Option B', async () => {
      const { getCarCategoryLevel } = await import('../src/utils/evRecommendations');
      
      expect(getCarCategoryLevel({ model: 'Dacia Spring Confort Plus (27 kWh)', bodyType: 'citadine' } as any)).toBe(0);
      expect(getCarCategoryLevel({ model: 'Renault Twingo E-Tech Électrique (22 kWh)', bodyType: 'citadine' } as any)).toBe(0);
      expect(getCarCategoryLevel({ model: 'Renault Zoé R90 (Batterie 41 kWh)', bodyType: 'citadine' } as any)).toBe(1);
      expect(getCarCategoryLevel({ model: 'Peugeot e-208 GT / Allure (50 kWh)', bodyType: 'citadine' } as any)).toBe(1);
      expect(getCarCategoryLevel({ model: 'Nissan Leaf II (40 kWh)', bodyType: 'compacte' } as any)).toBe(2);
      expect(getCarCategoryLevel({ model: 'Citroën ë-C4 (50 kWh)', bodyType: 'compacte' } as any)).toBe(2);
      expect(getCarCategoryLevel({ model: 'Tesla Model 3 Standard (60 kWh)', bodyType: 'berline' } as any)).toBe(3);
      expect(getCarCategoryLevel({ model: 'Hyundai Kona Electric (64 kWh)', bodyType: 'suv' } as any)).toBe(3);
    });

    it('propose une alternative confort issue de la catégorie supérieure avec priorité aux autofinancés', () => {
      // Cas 1 : Recommandé = Zoé 41 kWh (Niveau 1, 7 450 €)
      // L'alternative confort doit être une compacte (Niveau 2), la moins chère autofinancée (Nissan Leaf II à 9 950 €)
      const rec = getTieredEVRecommendations(70, 200, 'maison');
      expect(rec.recommended.bodyType).toBe('citadine');
      expect(rec.economy.bodyType).toBe('compacte');
      expect(rec.economy.model).toContain('Nissan Leaf');
    });

    it('sélectionne le modèle le moins cher dans la catégorie supérieure même sans autofinancement complet', () => {
      // Petit budget libéré (50 €/mois) : aucune voiture n'est autofinancée
      const rec = getTieredEVRecommendations(30, 50, 'maison');
      // Le recommandé est la citadine la moins chère
      expect(rec.recommended.bodyType).toBe('citadine');
      // L'alternative confort va chercher la catégorie supérieure et prend la moins chère (Nissan Leaf II)
      expect(rec.economy.bodyType).toBe('compacte');
      expect(rec.economy.model).toContain('Nissan Leaf');
    });

    it('scénario utilisateur (45 km/j, 200 € carburant en maison) : recommande Zoé 41 kWh et alternative Nissan Leaf II 100% autofinancée', () => {
      // Budget libéré : ~195 €/mois
      const rec = getTieredEVRecommendations(45, 195, 'maison');
      expect(rec.recommended.model).toContain('Zoé');
      expect(rec.economy.bodyType).toBe('compacte');
      expect(rec.economy.model).toContain('Nissan Leaf');
      // La mensualité de la Nissan Leaf II doit être inférieure au budget libéré (100% autofinancée)
      expect(rec.economy.monthlyFinancing5Years).toBeLessThanOrEqual(195);
    });

    it('dans la catégorie économique, si écart faible (< 9 €/mois), favorise le modèle avec la plus grosse batterie', async () => {
      const { pickBestEconomicModel } = await import('../src/utils/evRecommendations');

      // Deux véhicules avec 7 € d'écart mensuel (< 9 €) :
      // Modèle 1 : Dacia Spring (7 000 € -> ~122 €/m, batterie 26.8 kWh)
      // Modèle 2 : Renault Zoé (7 450 € -> ~127 €/m, batterie 41 kWh)
      const mockCars: any[] = [
        {
          model: 'Dacia Spring (27 kWh)',
          estimatedMarketPrice: 7000,
          batteryNetKwh: 26.8,
          realRangeKm: 180,
        },
        {
          model: 'Renault Zoé R90 (41 kWh)',
          estimatedMarketPrice: 7450,
          batteryNetKwh: 41,
          realRangeKm: 240,
        },
      ];

      const best = pickBestEconomicModel(mockCars, 'eco_1pct');
      // Avec seulement 5 € d'écart mensuel (< 9 €), on privilégie la Zoé (41 kWh vs 26.8 kWh)
      expect(best.model).toBe('Renault Zoé R90 (41 kWh)');

      // Si l'écart dépasse 9 € (ex: 20 € d'écart), on reste sur le modèle le moins cher :
      const mockCarsLargeGap: any[] = [
        {
          model: 'Dacia Spring (27 kWh)',
          estimatedMarketPrice: 7000,
          batteryNetKwh: 26.8,
          realRangeKm: 180,
        },
        {
          model: 'Renault Zoé Intens (52 kWh)',
          estimatedMarketPrice: 9000, // Mensualité ~157 €/m, écart > 30 €
          batteryNetKwh: 52,
          realRangeKm: 310,
        },
      ];

      const bestLargeGap = pickBestEconomicModel(mockCarsLargeGap, 'eco_1pct');
      expect(bestLargeGap.model).toBe('Dacia Spring (27 kWh)');
    });
  });
});
