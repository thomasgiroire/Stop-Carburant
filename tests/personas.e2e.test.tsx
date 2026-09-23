import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mocks des services asynchrones pour des tests E2E déterministes et instantanés
vi.mock('../src/services/energyPrices', async () => {
  const actual = await vi.importActual('../src/services/energyPrices');
  return {
    ...actual,
    fetchLiveEnergyPrices: vi.fn().mockResolvedValue(actual.DEFAULT_PRICES),
  };
});

vi.mock('../src/services/geoService', async () => {
  const actual = await vi.importActual('../src/services/geoService');
  return {
    ...actual,
    detectUserDepartmentFromIP: vi.fn().mockResolvedValue(null),
    getSavedDepartmentCode: vi.fn().mockReturnValue(null),
    getSavedFuelType: vi.fn().mockReturnValue('all'),
  };
});

/**
 * Fonction utilitaire d'automatisation E2E du parcours utilisateur complet :
 * Étape 1 (Sliders budget et km) -> Étape 2 (Logement) -> Étape 3 (Déclenchement révélation)
 */
async function runPersonaE2EJourney(options: {
  fuelBudget: number;
  dailyKm: number;
  housing: 'maison' | 'appartement';
}) {
  const renderResult = render(<App />);

  // --- ÉTAPE 1 : Saisie des paramètres initiaux ---
  const budgetSlider = renderResult.container.querySelector<HTMLInputElement>('#input-budget-slider');
  expect(budgetSlider).toBeInTheDocument();
  fireEvent.change(budgetSlider!, { target: { value: options.fuelBudget.toString() } });

  const kmSlider = renderResult.container.querySelector<HTMLInputElement>('#input-daily-km');
  expect(kmSlider).toBeInTheDocument();
  fireEvent.change(kmSlider!, { target: { value: options.dailyKm.toString() } });

  const continueBtnStep1 = screen.getByRole('button', { name: /continuer/i });
  fireEvent.click(continueBtnStep1);

  // --- ÉTAPE 2 : Mode de stationnement / logement ---
  expect(await screen.findByText(/Où dort votre voiture le soir/i)).toBeInTheDocument();

  if (options.housing === 'appartement') {
    const aptBtn = screen.getByRole('button', { name: /appartement/i });
    fireEvent.click(aptBtn);
  } else {
    const maisonBtn = screen.getByRole('button', { name: /maison/i });
    fireEvent.click(maisonBtn);
  }

  const seeResultBtn = screen.getByRole('button', { name: /voir mon résultat/i });
  fireEvent.click(seeResultBtn);

  // --- ÉTAPE 3 : Révélation financière & Choc pétrolier ---
  const revealBtn = await screen.findByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
  expect(revealBtn).toBeInTheDocument();

  // Déclencher la transformation vers le véhicule électrique
  fireEvent.click(revealBtn);

  // Attendre la disparition du bouton initial
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /voir où devrait plutôt aller cet argent/i })).not.toBeInTheDocument();
  });

  return renderResult;
}

describe('Tests E2E — Parcours Utilisateurs réels par Persona (Stop-Carburant)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // PERSONA 1 : Julien — Navetteur périurbain (70 km/j, 150 €/m, maison)
  // =========================================================================
  it('E2E Persona 1 (Julien - 70 km/j, 150 €/m, maison) : parcours complet avec gain net direct et option confort', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 150,
      dailyKm: 70,
      housing: 'maison',
    });

    // 1. Victoire financière avec gain net affiché
    expect(await screen.findByRole('heading', { level: 2, name: /chaque mois dans votre poche/i })).toBeInTheDocument();

    // 2. Recommandation d'achat direct d'un véhicule économique adapté
    expect(screen.getByText(/Achetez une Renault Zoé R90 maintenant !/i)).toBeInTheDocument();

    // 3. Conseils de recharge nocturne sur prise standard
    expect(screen.getByText(/Sur une simple prise chez vous.*nuit de sommeil recharge vos 70 km/i)).toBeInTheDocument();

    // 4. Découverte de l'option confort supérieure (Nissan Leaf II)
    const comfortBtn = screen.getByRole('button', { name: /Option confort.*Nissan Leaf/i });
    expect(comfortBtn).toBeInTheDocument();
    fireEvent.click(comfortBtn);

    // Le titre d'achat bascule sur la Nissan Leaf
    expect(await screen.findByText(/Achetez une Nissan Leaf II maintenant !/i)).toBeInTheDocument();

    // Revenir au modèle économique
    const revertBtn = screen.getByRole('button', { name: /Retour à la proposition économique/i });
    fireEvent.click(revertBtn);
    expect(await screen.findByText(/Achetez une Renault Zoé R90 maintenant !/i)).toBeInTheDocument();

    // 5. Consultation de la décomposition financière
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    expect(await screen.findByText(/Coût aux 100 km/i)).toBeInTheDocument();
    expect(screen.getByText(/Prêt Éco-Mobilité \(1,00% TAEG\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Économies d'entretien intégrées au calcul :/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+25\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // PERSONA 2 : Sandrine — Ouvrière rurale en 3x8 (90 km/j, 185 €/m, maison)
  // =========================================================================
  it('E2E Persona 2 (Sandrine - 90 km/j, 185 €/m, maison) : valide l\'autofinancement et le passage Heures Creuses', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 185,
      dailyKm: 90,
      housing: 'maison',
    });

    // Victoire financière : récupération nette de cash
    expect(await screen.findByRole('heading', { level: 2, name: /chaque mois dans votre poche/i })).toBeInTheDocument();

    // Recommandation d'un modèle économique adapté
    expect(screen.getByText(/Achetez une Renault Zoé R90 maintenant !/i)).toBeInTheDocument();

    // Déplier le détail financier pour tester les Heures Creuses (adaptées aux horaires décalés de 3x8)
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    const hcTarifBtn = screen.getByRole('button', { name: /Heures Creuses/i });
    expect(hcTarifBtn).toBeInTheDocument();
    fireEvent.click(hcTarifBtn);

    // Les économies d'entretien pour 90 km/j sont de +30 €/mois
    expect(screen.getAllByText(/\+30\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // PERSONA 3 : Nathalie — IDEL en tournée rurale (130 km/j, 250 €/m, maison)
  // =========================================================================
  it('E2E Persona 3 (Nathalie IDEL - 130 km/j, 250 €/m, maison) : garantit l\'autonomie pour 130 km de tournée', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 250,
      dailyKm: 130,
      housing: 'maison',
    });

    // Récupération de cash mensuel net
    expect(await screen.findByRole('heading', { level: 2, name: /chaque mois dans votre poche/i })).toBeInTheDocument();

    // Le modèle recommandé couvre largement les 130 km quotidiens
    expect(screen.getByText(/Achetez une Renault Zoé R90 maintenant !/i)).toBeInTheDocument();

    // Le conseil d'utilisation rassure sur le démarrage sur simple prise + installation équipement
    expect(screen.getByText(/Démarrez dès le premier jour sur une simple prise standard chez vous sans la moindre crainte/i)).toBeInTheDocument();
    expect(screen.getByText(/borne 7,4 kW|prise renforcée/i)).toBeInTheDocument();

    // Option confort présente
    const comfortBtn = screen.getByRole('button', { name: /Option confort/i });
    expect(comfortBtn).toBeInTheDocument();

    // Vérifier les économies d'entretien substantielles de l'IDEL (+45 €/mois)
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);
    expect(screen.getAllByText(/\+45\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // PERSONA 4 : Marc — Artisan électricien itinérant (110 km/j, 240 €/m, maison)
  // =========================================================================
  it('E2E Persona 4 (Marc artisan - 110 km/j, 240 €/m, maison) : vérifie la baisse des charges professionnelles', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 240,
      dailyKm: 110,
      housing: 'maison',
    });

    expect(await screen.findByRole('heading', { level: 2, name: /chaque mois dans votre poche/i })).toBeInTheDocument();

    // Déplier le détail financier
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    // Vérifier le comparatif thermique vs électrique aux 100 km
    expect(await screen.findByText(/Thermique actuelle/i)).toBeInTheDocument();
    expect(screen.getByText(/Électrique \(Renault\)/i)).toBeInTheDocument();

    // Économies d'entretien (+40 €/mois)
    expect(screen.getAllByText(/\+40\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // PERSONA 5 : Karim — Taxi conventionné / Chauffeur VSL (180 km/j, 360 €/m, maison)
  // =========================================================================
  it('E2E Persona 5 (Karim VSL - 180 km/j, 360 €/m, maison) : applique la règle de confort et écarte impérativement les citadines', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 360,
      dailyKm: 180,
      housing: 'maison',
    });

    // À 180 km/jour, la règle de confort isCarComfortableForDailyKm écarte formellement Zoé et Spring !
    // On doit avoir une berline/SUV routière (MG4, VW ID.3, Kona ou Tesla)
    const purchaseTitle = screen.getByRole('heading', { level: 3 });
    expect(purchaseTitle.textContent).toMatch(/Volkswagen ID\.3|MG4|Tesla|Hyundai Kona/i);
    expect(purchaseTitle.textContent).not.toContain('Zoé');
    expect(purchaseTitle.textContent).not.toContain('Spring');

    // Les économies d'entretien pour un taxi de 180 km/j s'élèvent à 65 €/mois
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);
    expect(screen.getAllByText(/\+65\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);

    // Le véhicule roule ~4320 km/mois
    expect(screen.getByText(/180 km\/jour • ~4320 km\/mois/i)).toBeInTheDocument();
  });

  // =========================================================================
  // PERSONA 6 : Élodie — Navetteuse en appartement (50 km/j, 110 €/m, bornes)
  // =========================================================================
  it('E2E Persona 6 (Élodie - 50 km/j, 110 €/m, appartement) : intègre le tarif borne publique et espace les recharges', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 110,
      dailyKm: 50,
      housing: 'appartement',
    });

    // Recommandation d'une voiture économique
    expect(await screen.findByText(/Achetez une Renault Zoé R90 maintenant !/i)).toBeInTheDocument();

    // Le conseil d'utilisation en appartement préconise d'espacer les recharges sur bornes publiques/travail
    expect(screen.getByText(/Même sans prise chez vous, la batterie de \d+ km absorbe 4 jours de trajets/i)).toBeInTheDocument();
    expect(screen.getByText(/Une pause recharge de 20 min tous les 4 jours/i)).toBeInTheDocument();

    // Vérifier dans le détail que le libellé indique bien la recharge sur bornes publiques
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    expect(screen.getByText(/Coût de recharge \(bornes\) :/i)).toBeInTheDocument();

    // Les boutons de toggle HP/HC domicile ne doivent PAS être présents en appartement
    expect(screen.queryByRole('button', { name: /Tarif fixe \(~0,20 €/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Heures Creuses \(~0,16 €/i })).not.toBeInTheDocument();
  });

  it('E2E Persona Grand Rouleur en appartement (180 km/j, 400 €/m, appartement) : impose une grande routière à forte autonomie (ID.3 / MG4 / Kona / Tesla) et refuse les citadines', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 400,
      dailyKm: 180,
      housing: 'appartement',
    });

    // À 180 km/jour en appartement, la recommandation doit impérativement être une routière à grande batterie (>= 320 km)
    const purchaseTitle = screen.getByRole('heading', { level: 3 });
    expect(purchaseTitle.textContent).toMatch(/Volkswagen ID\.3|MG4|Hyundai Kona|Kia e-Niro|Tesla/i);
    expect(purchaseTitle.textContent).not.toContain('Zoé');
    expect(purchaseTitle.textContent).not.toContain('Spring');
    expect(purchaseTitle.textContent).not.toContain('ë-C4');

    // Vérifier dans le détail financier
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    expect(screen.getByText(/Coût de recharge \(bornes\) :/i)).toBeInTheDocument();
  });

  // =========================================================================
  // PERSONA 7 : Gérard — Grand Rouleur Interurbain (160 km/j, 290 €/m, maison)
  // =========================================================================
  it('E2E Persona 7 (Gérard - 160 km/j, 290 €/m, maison) : filtre les citadines pour une grande routière', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 290,
      dailyKm: 160,
      housing: 'maison',
    });

    // À 160 km/j, exclusion stricte des citadines (Zoé, Spring, e-208)
    const purchaseTitle = screen.getByRole('heading', { level: 3 });
    expect(purchaseTitle.textContent).toMatch(/Volkswagen ID\.3|MG4|Hyundai Kona|Nissan Leaf|Citroën ë-C4/i);
    expect(purchaseTitle.textContent).not.toContain('Zoé');
    expect(purchaseTitle.textContent).not.toContain('Spring');

    // Les économies d'entretien s'élèvent à 60 €/mois pour 160 km/j (~3840 km/mois)
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);
    expect(screen.getAllByText(/\+60\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // PERSONA SPÉCIAL : Grand Rouleur 200 km/jour (200 km/j, 450 €/m, maison)
  // Cas utilisateur : "c'est mieux de faire 200km en tesla que en Zoe tous les jours"
  // =========================================================================
  it('E2E Persona Grand Rouleur (200 km/j, 450 €/m, maison) : priorise une grande routière confortable (Tesla / MG4 / ID.3)', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 450,
      dailyKm: 200,
      housing: 'maison',
    });

    // À 200 km/jour, la recommandation doit impérativement être une routière de grand confort
    const purchaseTitle = screen.getByRole('heading', { level: 3 });
    expect(purchaseTitle.textContent).toMatch(/Tesla|Volkswagen ID\.3|MG4|Hyundai Kona|Kia/i);
    expect(purchaseTitle.textContent).not.toContain('Zoé');
    expect(purchaseTitle.textContent).not.toContain('Spring');

    // Dégage un excédent net colossal
    expect(await screen.findByRole('heading', { level: 2, name: /chaque mois dans votre poche/i })).toBeInTheDocument();

    // Déplier le détail financier
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    // Kilométrage mensuel de 4800 km
    expect(screen.getByText(/200 km\/jour • ~4800 km\/mois/i)).toBeInTheDocument();
    // Économies d'entretien à 70 €/mois
    expect(screen.getAllByText(/\+70\s*€\s*\/ mois/i).length).toBeGreaterThanOrEqual(1);
  });

  it('E2E Persona Grand Rouleur Intensif (235 km/j, 620 €/m, maison) : priorise impérativement une Tesla / routière et refuse formellement la Zoé', async () => {
    await runPersonaE2EJourney({
      fuelBudget: 620,
      dailyKm: 235,
      housing: 'maison',
    });

    // À 235 km/jour, la recommandation doit impérativement être une Tesla Model 3 ou routière
    const purchaseTitle = screen.getByRole('heading', { level: 3 });
    expect(purchaseTitle.textContent).toMatch(/Tesla|Volkswagen ID\.3|MG4|Hyundai Kona|Scénic/i);
    expect(purchaseTitle.textContent).not.toContain('Zoé');
    expect(purchaseTitle.textContent).not.toContain('Spring');

    // Dégage un excédent net colossal
    expect(await screen.findByRole('heading', { level: 2, name: /chaque mois dans votre poche/i })).toBeInTheDocument();

    // Vérification du badge stratégie : jamais une étiquette citadine
    expect(purchaseTitle.textContent).not.toContain('Citadine');
  });

  // =========================================================================
  // PARCOURS INTERACTIF & INTERACTIONS UTILISATEUR COMPLÈTES
  // =========================================================================
  describe('Interactions avancées et modifications des paramètres dans le flux E2E', () => {
    it('permet à un utilisateur de saisir un apport de reprise (ex: 2 000 €) et actualise la mensualité', async () => {
      await runPersonaE2EJourney({
        fuelBudget: 200,
        dailyKm: 60,
        housing: 'maison',
      });

      // Déplier le détail financier
      const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
      fireEvent.click(detailsBtn);

      const downPaymentInput = screen.getByLabelText(/Apport perso \(reprise véhicule actuel\) :/i) as HTMLInputElement;
      expect(downPaymentInput).toBeInTheDocument();

      // Saisir un apport de reprise de 2 000 €
      fireEvent.change(downPaymentInput, { target: { value: '2000' } });

      // Vérifier l'apparition de la ligne de montant emprunté après reprise
      expect(await screen.findByText(/Montant emprunté \(après apport\) :/i)).toBeInTheDocument();
      expect(screen.getByText(/Mensualité avec apport \(5 ans\) :/i)).toBeInTheDocument();
    });

    it('permet de basculer du Prêt Éco-Mobilité 1% au Crédit classique 4.9%', async () => {
      await runPersonaE2EJourney({
        fuelBudget: 200,
        dailyKm: 60,
        housing: 'maison',
      });

      const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
      fireEvent.click(detailsBtn);

      // Basculer vers crédit standard
      const standardLoanBtn = screen.getByRole('button', { name: /Crédit auto standard \(4,90% TAEG\)/i });
      fireEvent.click(standardLoanBtn);

      expect(screen.getByText(/4,90% TAEG fixe/i)).toBeInTheDocument();

      // Revenir au prêt éco
      const ecoLoanBtn = screen.getByRole('button', { name: /Prêt Éco-Mobilité \(1,00% TAEG\)/i });
      fireEvent.click(ecoLoanBtn);

      expect(screen.getByText(/1,00% TAEG fixe/i)).toBeInTheDocument();
    });

    it('permet d\'ouvrir le catalogue Open Data complet et de sélectionner un véhicule personnalisé', async () => {
      await runPersonaE2EJourney({
        fuelBudget: 250,
        dailyKm: 60,
        housing: 'maison',
      });

      const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
      fireEvent.click(detailsBtn);

      // Ouvrir la modale du référentiel Open Data
      const catalogBtn = screen.getByRole('button', { name: /explorer le référentiel open data/i });
      fireEvent.click(catalogBtn);

      expect(await screen.findByText(/Référentiel Open Data Certifié/i)).toBeInTheDocument();

      // Sélectionner un modèle dans le catalogue (Choisir ce modèle pour la simulation)
      const selectBtn = screen.getAllByRole('button', { name: /choisir ce modèle pour la simulation/i })[0];
      fireEvent.click(selectBtn);

      // La modale se referme et le modèle personnalisé est appliqué
      expect(await screen.findByText(/Modèle sélectionné :/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rétablir recommandations/i })).toBeInTheDocument();
    });

    it('permet de revenir à l\'étape 1 en cliquant sur "Recommencer" dans le footer', async () => {
      await runPersonaE2EJourney({
        fuelBudget: 200,
        dailyKm: 60,
        housing: 'maison',
      });

      // Cliquer sur le bouton Recommencer dans le footer
      const restartBtn = screen.getByRole('button', { name: /recommencer/i });
      fireEvent.click(restartBtn);

      // L'utilisateur est de retour à l'Étape 1
      expect(await screen.findByRole('button', { name: /continuer/i })).toBeInTheDocument();
      expect(screen.getByText(/Budget carburant par mois/i)).toBeInTheDocument();
    });
  });
});
