import { describe, it, expect } from 'vitest';
import { calculateSimulation } from '../src/utils/calculator';
import { getTieredEVRecommendations, carCoversDailyNeed, EV_CATALOG } from '../src/utils/evRecommendations';
import { calculateEVFinancing } from '../src/utils/loanCalculations';
import { DEFAULT_PRICES } from '../src/services/energyPrices';

/**
 * Suite de tests des 7 Personnas réels identifiés pour Stop-Carburant :
 * 1. Julien (Salarié navetteur périurbain, 70 km/j, maison)
 * 2. Sandrine (Ouvrière rurale en horaires postés 3x8, 90 km/j, maison)
 * 3. Nathalie (Professionnelle libérale / IDEL tournée rurale, 130 km/j, maison)
 * 4. Marc (Artisan indépendant / électricien itinérant, 110 km/j, maison)
 * 5. Karim (Chauffeur Taxi conventionné / VSL rural-urbain, 180 km/j, maison)
 * 6. Élodie (Navetteuse périurbaine en appartement, 50 km/j, borne publique)
 * 7. Gérard (Grand rouleur pendulaire interurbain, 160 km/j, maison)
 */

describe('Personnas Véhicules Thermiques — Scénarios réels de transition vers VE', () => {

  // =========================================================================
  // PERSONA 1 : Julien — Navetteur périurbain (70 km/j, maison)
  // =========================================================================
  describe('Persona 1 : Julien (Navetteur périurbain, 70 km/j, maison)', () => {
    const fuelBudget = 150; // Budget carburant réel moyen pour 70 km/j (~1 274 km/mois à 6,8 L/100km)
    const housing = 'maison';
    const dailyKm = 70;

    it('calcule des gains financiers substantiels pour le trajet domicile-travail', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES);

      expect(res.monthlyKm).toBe(1680); // 70 * 24 = 1680 km/mois
      expect(res.loss5Years).toBe(9000); // 150 * 60 = 9000 €

      // Coût recharge électrique domicile (15.2 kWh/100km à ~0.2001 € en HP et ~0.1612 € en HC)
      expect(res.electricityCostHP).toBeCloseTo((1680 / 100) * 15.2 * 0.2001, 0);
      expect(res.electricityCostHC).toBeLessThan(res.electricityCostHP);
      expect(res.electricityCostHC).toBeCloseTo((1680 / 100) * 15.2 * 0.1612, 0);

      // Économie d'entretien (~1680 * 0.015 = 25.2 -> arrondi pas de 5 = 25 €)
      expect(res.maintenanceSavings).toBe(25);

      // Cash libéré supérieur à 120 €/mois
      expect(res.liberatedCash).toBeGreaterThan(120);
      expect(res.savingsPer100Km).toBeGreaterThan(5); // Au moins 5 € d'économie aux 100 km
    });

    it('recommande un véhicule d\'occasion couvrant les 70 km/j avec autofinancement intégral', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct');

      // Le modèle économique doit couvrir facilement 70 km
      expect(carCoversDailyNeed(rec.recommended.realRangeKm, dailyKm, housing)).toBe(true);
      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(180);

      // La mensualité de prêt doit être intégralement couverte par le cash libéré (surplus net positif)
      expect(rec.recommended.monthlyFinancing5Years).toBeLessThanOrEqual(sim.carLeaseBudget);

      // L'option confort doit être dans la catégorie supérieure (Nissan Leaf II)
      expect(rec.economy.bodyType).toBe('compacte');
      expect(rec.economy.model).toContain('Nissan Leaf');
    });

    it('cas frugal (130 €/mois) : les Heures Creuses réduisent le reste à charge à seulement 13 €/mois', () => {
      const simHP = calculateSimulation(130, housing, dailyKm, DEFAULT_PRICES, 'HP');
      const simHC = calculateSimulation(130, housing, dailyKm, DEFAULT_PRICES, 'HC');

      const recHP = getTieredEVRecommendations(dailyKm, simHP.carLeaseBudget, housing, 'eco_1pct');
      const recHC = getTieredEVRecommendations(dailyKm, simHC.carLeaseBudget, housing, 'eco_1pct');

      const gapHP = recHP.recommended.monthlyFinancing5Years - simHP.carLeaseBudget;
      const gapHC = recHC.recommended.monthlyFinancing5Years - simHC.carLeaseBudget;

      expect(gapHC).toBeLessThan(gapHP);
      expect(gapHC).toBeLessThanOrEqual(15); // Reste à charge quasi nul (~13 €/mois)
    });

    it('recharge sans contrainte nocturne sur simple prise 220V', () => {
      // 70 km consomment ~10.6 kWh. Une nuit de 8h sur prise standard 2.3 kW délivre ~18.4 kWh (>120 km)
      const energyNeededKwh = (dailyKm / 100) * 15.2;
      const energySupplied8h = 2.3 * 8; // 18.4 kWh
      expect(energyNeededKwh).toBeLessThan(energySupplied8h);
    });
  });

  // =========================================================================
  // PERSONA 2 : Sandrine — Ouvrière rurale en 3x8 (90 km/j, maison)
  // =========================================================================
  describe('Persona 2 : Sandrine (Ouvrière rurale en 3x8, 90 km/j, maison)', () => {
    const fuelBudget = 185;
    const housing = 'maison';
    const dailyKm = 90;

    it('divise sa facture énergétique par 3 et libère un budget essentiel', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES);

      expect(res.monthlyKm).toBe(2160); // 90 * 24 = 2160 km/mois
      expect(res.loss5Years).toBe(11100); // 185 * 60 = 11 100 €

      // Coût électricité en Heures Creuses (idéal pour 3x8 rentrant la nuit ou dormant le jour)
      const resHC = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');
      expect(resHC.electricityCost).toBeLessThan(60); // Moins de 60 € d'électricité pour 2160 km

      // Cash net libéré supérieur à 150 €/mois
      expect(resHC.liberatedCash).toBeGreaterThan(150);
      expect(resHC.maintenanceSavings).toBe(30); // 2160 * 0.015 = 32.4 -> 30 €
    });

    it('propose des véhicules très accessibles financièrement (type Zoé 41 kWh ou Spring)', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct');

      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(dailyKm * 1.5);
      expect(rec.recommended.monthlyFinancing5Years).toBeLessThanOrEqual(sim.carLeaseBudget);
      expect(rec.recommended.estimatedMarketPrice).toBeLessThanOrEqual(13000);
    });
  });

  // =========================================================================
  // PERSONA 3 : Nathalie — Infirmière libérale IDEL (130 km/j, tournée rurale)
  // =========================================================================
  describe('Persona 3 : Nathalie (Infirmière libérale IDEL, 130 km/j, maison)', () => {
    const fuelBudget = 250;
    const housing = 'maison';
    const dailyKm = 130;

    it('libère plus de 200 € par mois tout en maintenant ses indemnités kilométriques', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');

      expect(res.monthlyKm).toBe(3120); // 130 * 24 = 3120 km/mois
      expect(res.loss5Years).toBe(15000); // 250 * 60 = 15 000 € brûlés

      // Maintenance thermique évitée (vidanges fréquentes d'une IDEL)
      expect(res.maintenanceSavings).toBe(45); // 3120 * 0.015 = 46.8 -> 45 €/mois

      // Facture carburant 250 € -> facture élec HC ~76 €
      expect(res.electricityCost).toBeLessThan(85);
      expect(res.liberatedCash).toBeGreaterThan(210);
    });

    it('propose une Zoé 52 kWh (310 km) ou MG4 / Tesla garantissant zéro angoisse d\'autonomie', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct');

      // La voiture recommandée doit couvrir largement les 130 km de tournée sans recharge intermédiaire
      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(180);
      expect(rec.economy.bodyType).toBe('compacte');
      expect(rec.economy.realRangeKm).toBeGreaterThanOrEqual(130);

      // Avec 227 € de budget libéré, une Zoé 52 kWh ou Zoé 41 kWh est 100% autofinancée
      expect(rec.recommended.monthlyFinancing5Years).toBeLessThanOrEqual(sim.carLeaseBudget);
    });

    it('gère l\'absorption du kilométrage quotidien sur une nuit de charge', () => {
      // 130 km nécessitent 19.7 kWh. Sur prise renforcée Green'up 3.7 kW (16A), 10h fournissent 37 kWh (>240 km)
      const kwhNeeded = (dailyKm / 100) * 15.2;
      const greenUpKwh = 3.7 * 8; // 29.6 kWh
      expect(kwhNeeded).toBeLessThan(greenUpKwh);
    });
  });

  // =========================================================================
  // PERSONA 4 : Marc — Artisan indépendant itinérant (110 km/j, maison)
  // =========================================================================
  describe('Persona 4 : Marc (Artisan indépendant électricien, 110 km/j, maison)', () => {
    const fuelBudget = 240;
    const housing = 'maison';
    const dailyKm = 110;

    it('réduit considérablement ses charges d\'exploitation professionnelles', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES);

      expect(res.monthlyKm).toBe(2640);
      expect(res.loss5Years).toBe(14400);

      // Économies de maintenance élevées dues aux fréquents démarrages/arrêts thermiques
      expect(res.maintenanceSavings).toBe(40);

      // Plus de 195 € libérés chaque mois
      expect(res.liberatedCash).toBeGreaterThanOrEqual(195);
    });

    it('permet l\'acquisition d\'un VE compact ou break autofinancé', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES);
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct');

      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(dailyKm);
      expect(rec.recommended.monthlyFinancing5Years).toBeLessThanOrEqual(sim.carLeaseBudget);
    });
  });

  // =========================================================================
  // PERSONA 5 : Karim — Taxi conventionné / Chauffeur VSL (180 km/j, maison)
  // =========================================================================
  describe('Persona 5 : Karim (Taxi conventionné / VSL rural-urbain, 180 km/j, maison)', () => {
    const fuelBudget = 360;
    const housing = 'maison';
    const dailyKm = 180;

    it('dégage un gain spectaculaire de trésorerie sur un kilométrage élevé', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');

      expect(res.monthlyKm).toBe(4320);
      expect(res.loss5Years).toBe(21600); // 21 600 € de diesel brûlés en 5 ans

      // Entretien évité majeur : 65 € / mois (plaquettes, vidanges, courroies, FAP, AdBlue)
      expect(res.maintenanceSavings).toBe(65);

      // Carburant 360 € -> électricité HC ~106 €
      expect(res.electricityCost).toBeLessThan(115);
      expect(res.liberatedCash).toBeGreaterThan(310);
    });

    it('peut autofinancer une berline routière moderne (MG4 64 kWh ou Tesla Model 3)', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');
      // Pour un Taxi/VSL, le segment berline est privilégié pour le confort des patients
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct', 'berline');

      // Le modèle économique recommandé est une vraie berline moderne (ID.3 58 kWh, MG4 64 kWh...)
      expect(rec.recommended.model).toMatch(/Volkswagen ID\.3|MG4|Tesla/);
      expect(rec.recommended.bodyType).toBe('berline');
      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(350);
      
      // Au barème socle historique (1.74 €/L), le reste à charge pour une berline est de seulement ~38 €/mois (>90% autofinancée)
      const gapSocle = rec.recommended.monthlyFinancing5Years - sim.carLeaseBudget;
      expect(gapSocle).toBeLessThanOrEqual(40);

      // Avec les prix OpenData temps réel (2,27 €/L, soit 470 € de budget), la berline est 100% autofinancée (+107 € net/mois)
      const simLive = calculateSimulation(470, housing, dailyKm, { ...DEFAULT_PRICES, fuelPrice: 2.27 }, 'HC');
      const recLive = getTieredEVRecommendations(dailyKm, simLive.carLeaseBudget, housing, 'eco_1pct', 'berline');
      expect(recLive.recommended.monthlyFinancing5Years).toBeLessThanOrEqual(simLive.carLeaseBudget);

      // L'option confort supérieure est une grande berline routière (Tesla Model 3)
      expect(rec.economy.model).toContain('Tesla');
      expect(rec.economy.bodyType).toBe('berline');
      expect(rec.economy.realRangeKm).toBeGreaterThanOrEqual(430);
    });

    it('vérifie le besoin de recharge nocturne avec Wallbox 7.4 kW', () => {
      // 180 km = 27.36 kWh nécessaires par jour
      const kwhNeeded = (dailyKm / 100) * 15.2;
      const wallbox7kW8h = 7.4 * 8; // 59.2 kWh disponibles en 8h creuses
      expect(kwhNeeded).toBeLessThan(wallbox7kW8h);
    });
  });

  // =========================================================================
  // PERSONA 6 : Élodie — Navetteuse en appartement périurbain (50 km/j, borne publique)
  // =========================================================================
  describe('Persona 6 : Élodie (Navetteuse en appartement périurbain, 50 km/j, borne publique)', () => {
    const fuelBudget = 110;
    const housing = 'appartement';
    const dailyKm = 50;

    it('reste rentable même avec le surcoût de la recharge sur bornes publiques', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES);

      expect(res.monthlyKm).toBe(1200);
      expect(res.loss5Years).toBe(6600);

      // Tarif public (0.38 €/kWh + 12 € abonnement)
      expect(res.electricityCost).toBeGreaterThan(50);
      expect(res.electricityCost).toBeLessThan(110);

      // Malgré le prix supérieur de la recharge publique, le bilan reste positif
      expect(res.liberatedCash).toBeGreaterThan(30);
      expect(res.maintenanceSavings).toBe(20);
    });

    it('filtre les véhicules pour exiger une autonomie permettant d\'espacer les recharges publiques', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES);
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct');

      // En appartement, la règle carCoversDailyNeed exige au moins 140 km pour ne pas recharger tous les jours
      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(140);
      expect(carCoversDailyNeed(rec.recommended.realRangeKm, dailyKm, 'appartement')).toBe(true);
    });
  });

  // =========================================================================
  // PERSONA 7 : Gérard — Grand Rouleur Pendulaire Interurbain (160 km/j, maison)
  // =========================================================================
  describe('Persona 7 : Gérard (Grand rouleur pendulaire, 160 km/j, maison)', () => {
    const fuelBudget = 290;
    const housing = 'maison';
    const dailyKm = 160;

    it('réalise la plus forte économie brute en neutralisant ses trajets autoroutiers', () => {
      const res = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');

      expect(res.monthlyKm).toBe(3840);
      expect(res.loss5Years).toBe(17400);

      // Entretien économisé : ~60 € / mois
      expect(res.maintenanceSavings).toBe(60);

      // Cash libéré supérieur à 250 €/mois
      expect(res.liberatedCash).toBeGreaterThan(250);
      expect(res.savingsPer100Km).toBeGreaterThan(5);
    });

    it('recommande des véhicules à forte autonomie (MG4 64 kWh, Zoé 52 kWh ou Tesla)', () => {
      const sim = calculateSimulation(fuelBudget, housing, dailyKm, DEFAULT_PRICES, 'HC');
      const rec = getTieredEVRecommendations(dailyKm, sim.carLeaseBudget, housing, 'eco_1pct');

      // Pour 160 km/j, le modèle confort dans la catégorie supérieure (SUV Peugeot e-2008 ou Kona) couvre le besoin
      expect(rec.economy.realRangeKm).toBeGreaterThanOrEqual(250);
      expect(rec.recommended.realRangeKm).toBeGreaterThanOrEqual(160);
      // Pour 160 km/j, la recommandation confortable écarte les citadines pures (Zoé/Spring)
      expect(rec.recommended.bodyType).not.toBe('citadine');
    });

    it('à 200 km/jour, priorise formellement une Tesla Model 3 ou véhicule routier confortable et écarte toute citadine (Zoé/Spring)', () => {
      // Cas utilisateur explicite : "c'est mieux de faire 200km en tesla que en Zoe tous les jours"
      const daily200 = 200;
      const budget200 = 450;
      const sim200 = calculateSimulation(budget200, 'maison', daily200, DEFAULT_PRICES, 'HC');
      const rec200 = getTieredEVRecommendations(daily200, sim200.carLeaseBudget, 'maison', 'eco_1pct');

      // Pour 200 km/j, le modèle recommandé est une routière/SUV endurant (Tesla, Kona, MG4, ID.3, Kia e-Niro)
      expect(rec200.recommended.model).toMatch(/Tesla|MG4|Volkswagen ID\.3|Hyundai Kona|Kia/);
      expect(rec200.recommended.model).not.toContain('Zoé');
      expect(rec200.recommended.model).not.toContain('Spring');
      expect(rec200.recommended.bodyType).not.toBe('citadine');
      expect(rec200.recommended.realRangeKm).toBeGreaterThanOrEqual(350);

      // Le modèle confort est une routière/SUV haut de gamme (Kia e-Niro, Tesla Model 3, Scénic)
      expect(rec200.economy.model).toMatch(/Tesla|Kia e-Niro|MG4|Scénic/);
      expect(rec200.economy.realRangeKm).toBeGreaterThanOrEqual(400);

      // Si l'utilisateur choisit le segment berline pour 200 km/j, c'est directement une Tesla ou berline routière
      const rec200Berline = getTieredEVRecommendations(daily200, sim200.carLeaseBudget, 'maison', 'eco_1pct', 'berline');
      expect(rec200Berline.recommended.model).toMatch(/Tesla|MG4|Volkswagen ID\.3/);
      expect(rec200Berline.economy.model).toContain('Tesla');
    });

    it('à 235 km/jour (620 €/mois de carburant), recommande impérativement une grande routière digne de ce nom (Tesla Model 3) et écarte formellement toute citadine (Zoé/Spring)', () => {
      const daily235 = 235;
      const budget620 = 620;
      const sim235 = calculateSimulation(budget620, 'maison', daily235, DEFAULT_PRICES, 'HC');
      const rec235 = getTieredEVRecommendations(daily235, sim235.carLeaseBudget, 'maison', 'eco_1pct');

      // Recommandation principale : Tesla Model 3 / Grande routière
      expect(rec235.recommended.model).toMatch(/Tesla|Volkswagen ID\.3|MG4|Hyundai Kona|Kia/);
      expect(rec235.recommended.model).not.toContain('Zoé');
      expect(rec235.recommended.model).not.toContain('Spring');
      expect(rec235.recommended.bodyType).not.toBe('citadine');
      expect(rec235.recommended.realRangeKm).toBeGreaterThanOrEqual(350);

      // Recommandation confort/autonomie : Tesla Model 3 Long Range ou Scénic EV87
      expect(rec235.economy.model).toMatch(/Tesla|Scénic|Kia EV6|BMW i4|Enyaq/);
      expect(rec235.economy.realRangeKm).toBeGreaterThanOrEqual(400);

      // Le cash libéré mensuel est largement positif
      expect(sim235.carLeaseBudget - rec235.recommended.monthlyFinancing5Years).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // ANALYSES COMPARATIVES & TESTS TRANSVERSAUX
  // =========================================================================
  describe('Analyses comparatives multi-personnas & Cohérence globale', () => {
    it('démontre que le passage en Heures Creuses augmente le cash libéré pour tous les profils en maison', () => {
      const personas = [
        { name: 'Julien', budget: 130, km: 70 },
        { name: 'Sandrine', budget: 185, km: 90 },
        { name: 'Nathalie', budget: 250, km: 130 },
        { name: 'Marc', budget: 240, km: 110 },
        { name: 'Karim', budget: 360, km: 180 },
        { name: 'Gérard', budget: 290, km: 160 },
      ];

      for (const p of personas) {
        const hpRes = calculateSimulation(p.budget, 'maison', p.km, DEFAULT_PRICES, 'HP');
        const hcRes = calculateSimulation(p.budget, 'maison', p.km, DEFAULT_PRICES, 'HC');

        expect(hcRes.electricityCost).toBeLessThan(hpRes.electricityCost);
        expect(hcRes.liberatedCash).toBeGreaterThan(hpRes.liberatedCash);
      }
    });

    it('confirme que le Prêt Éco-Mobilité 1% abaisse significativement la mensualité par rapport au prêt classique', () => {
      for (const car of EV_CATALOG) {
        const ecoFin = calculateEVFinancing(car.estimatedMarketPrice, 'eco_1pct', 60);
        const stdFin = calculateEVFinancing(car.estimatedMarketPrice, 'standard_4_9pct', 60);

        expect(ecoFin.monthly).toBeLessThanOrEqual(stdFin.monthly);
        expect(ecoFin.totalInterest).toBeLessThan(stdFin.totalInterest);
      }
    });

    it('prouve que la perte cumulée sur 5 ans dépasse 10 000 € pour la majorité des profils périurbains/ruraux', () => {
      const budgets = [185, 250, 240, 360, 290]; // Sandrine, Nathalie, Marc, Karim, Gérard
      for (const budget of budgets) {
        const loss = budget * 60;
        expect(loss).toBeGreaterThanOrEqual(10000);
      }
    });

    it('calcule la recharge avec la consommation électrique réelle variable selon le modèle de VE', () => {
      const dailyKm = 90;
      const fuelBudget = 185;

      // Véhicule sobre : Dacia Spring (13.5 kWh / 100 km)
      const springConso = 13.5;
      const simSpring = calculateSimulation(fuelBudget, 'maison', dailyKm, DEFAULT_PRICES, 'HC', springConso);

      // Véhicule standard : Renault Zoé R90 (15.4 kWh / 100 km)
      const zoeConso = 15.4;
      const simZoe = calculateSimulation(fuelBudget, 'maison', dailyKm, DEFAULT_PRICES, 'HC', zoeConso);

      // Véhicule routier/SUV : MG4 Luxury (16.0 kWh / 100 km)
      const mg4Conso = 16.0;
      const simMg4 = calculateSimulation(fuelBudget, 'maison', dailyKm, DEFAULT_PRICES, 'HC', mg4Conso);

      // La consommation spécifique doit impacter directement le coût aux 100 km et la facture mensuelle
      expect(simSpring.electricCostPer100KmHC).toBeLessThan(simZoe.electricCostPer100KmHC);
      expect(simZoe.electricCostPer100KmHC).toBeLessThan(simMg4.electricCostPer100KmHC);

      expect(simSpring.electricityCost).toBeLessThan(simZoe.electricityCost);
      expect(simZoe.electricityCost).toBeLessThan(simMg4.electricityCost);

      // Le véhicule le plus sobre dégage plus de cash libéré
      expect(simSpring.liberatedCash).toBeGreaterThanOrEqual(simZoe.liberatedCash);
      expect(simZoe.liberatedCash).toBeGreaterThanOrEqual(simMg4.liberatedCash);
    });

    it('intègre les prix OpenData temps réel du gouvernement et démontre une rentabilité accrue face à l\'inflation', async () => {
      const { fetchLiveEnergyPrices } = await import('../src/services/energyPrices');
      const livePrices = await fetchLiveEnergyPrices();

      expect(livePrices.fuelPrice).toBeGreaterThan(0);

      // Pour chaque persona en maison, la simulation avec prix en direct confirme la rentabilité
      const simJulienLive = calculateSimulation(150, 'maison', 70, livePrices, 'HC', 15.4);
      expect(simJulienLive.liberatedCash).toBeGreaterThan(100);
      expect(simJulienLive.electricityCost).toBeLessThan(simJulienLive.fuelBudget);
    });
  });
});
