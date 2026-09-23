import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step4Revelation } from '../src/components/Step4Revelation';
import { DEFAULT_PRICES } from '../src/services/energyPrices';
import { getSurplusEquivalent } from '../src/utils/calculator';

describe('Composant Step4Revelation', () => {
  it('se monte et affiche les résultats sans lever d\'erreur TypeError', async () => {
    const onModifyParams = vi.fn();

    render(
      <Step4Revelation
        fuelBudget={200}
        housing="maison"
        dailyKm={45}
        prices={DEFAULT_PRICES}
        onModifyParams={onModifyParams}
      />
    );

    // Vérifie le bouton de transformation initiale
    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    expect(revealBtn).toBeInTheDocument();
    fireEvent.click(revealBtn);

    // Vérifie la présence de la phrase de victoire épurée et percutante
    expect(await screen.findByText(/Récupérez/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText(/chaque mois dans votre poche !/i)).toBeInTheDocument();

    // Vérifie la présence du sous-titre avec équivalent concret (sortie ciné en famille pour 55 €/mois, pas de mois de salaire car < 1 mois SMIC)
    expect(await screen.findByText(/sortie ciné en famille chaque mois/i)).toBeInTheDocument();
    expect(screen.queryByText(/0,5 mois de salaire par an/i)).not.toBeInTheDocument();

    // Vérifie que les mentions rayées en rouge ont bien été retirées du résultat
    expect(screen.queryByText(/Gain net direct/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Argent gagné directement/i)).not.toBeInTheDocument();

    // Vérifie la présence de l'animation de victoire (confettis/étincelles)
    expect(screen.getByTestId('victory-celebration')).toBeInTheDocument();

    // Vérifie la phrase d'action du sous-résultat
    expect(await screen.findByText(/Achetez une Renault Zoé R90 maintenant !/i)).toBeInTheDocument();

    // Déplier le détail des calculs financiers
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);
    expect(await screen.findByText(/Coût aux 100 km/i)).toBeInTheDocument();
    expect(await screen.findByText(/Prix d'occasion constaté/i)).toBeInTheDocument();
  });

  it('affiche les statistiques de disponibilité marché constatées dans la fenêtre détail financier', async () => {
    render(
      <Step4Revelation
        fuelBudget={250}
        housing="maison"
        dailyKm={60}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    fireEvent.click(revealBtn);

    // Déplier la fenêtre de détail financier
    const detailsBtn = await screen.findByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    const priceElement = await screen.findByText(/Prix d'occasion constaté/i, {}, { timeout: 3000 });
    // Vérifie que le prix affiché dans la fenêtre de détail financier est bien le prix catalogue officiel (~7 450 € / 7 500 €)
    expect(priceElement.parentElement?.textContent).toMatch(/7\s*[45][05]0/);
    // Vérifie qu'on n'affiche plus la ligne de détail superflue
    expect(screen.queryByText(/Marché le plus disponible :/i)).not.toBeInTheDocument();
  });

  it('calcule correctement l\'équivalent en mois de salaire du gain net (ex: 2 mois de salaire pour ~242 €/mois de gain)', async () => {
    render(
      <Step4Revelation
        fuelBudget={380}
        housing="maison"
        dailyKm={130}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    fireEvent.click(revealBtn);

    // Vérifie que l'équivalent en mois de salaire correspond au gain réel
    const el = await screen.findByText((content, element) => {
      return element?.tagName.toLowerCase() === 'strong' && content.includes('mois de salaire par an');
    }, {}, { timeout: 3000 });
    expect(el).toBeInTheDocument();
    expect(el.textContent).toMatch(/mois de salaire par an/);
  });

  it('affiche la ligne apport perso et recalcule le crédit et la mensualité lors de la saisie d\'une reprise', async () => {
    render(
      <Step4Revelation
        fuelBudget={200}
        housing="maison"
        dailyKm={45}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    fireEvent.click(revealBtn);

    // Déplier le détail
    const detailsBtn = await screen.findByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    // Vérifier la présence du label et du champ de saisie apport perso
    expect(await screen.findByText(/Apport perso \(reprise véhicule actuel\) :/i)).toBeInTheDocument();
    const downPaymentInput = screen.getByLabelText(/Apport perso \(reprise véhicule actuel\) :/i) as HTMLInputElement;
    expect(downPaymentInput).toBeInTheDocument();
    expect(downPaymentInput.placeholder).toBe('0');

    // Initialement sans apport : mensualité sans apport
    expect(screen.getByText(/Mensualité sans apport \(5 ans\) :/i)).toBeInTheDocument();

    // Saisir un apport de 2 000 € (valeur de reprise de la voiture actuelle)
    fireEvent.change(downPaymentInput, { target: { value: '2000' } });

    // La ligne "Montant emprunté (après apport)" apparaît
    expect(await screen.findByText(/Montant emprunté \(après apport\) :/i)).toBeInTheDocument();
    // Le libellé bascule en "Mensualité avec apport"
    expect(screen.getByText(/Mensualité avec apport \(5 ans\) :/i)).toBeInTheDocument();
    expect(screen.getByText(/2.*000.*apport/i)).toBeInTheDocument();

    // Cliquer sur le bouton de réinitialisation "0 €"
    const resetBtn = screen.getByTitle(/Remettre l'apport à 0 €/i);
    fireEvent.click(resetBtn);
    expect(screen.getByText(/Mensualité sans apport \(5 ans\) :/i)).toBeInTheDocument();
  });

  it('affiche le bouton d\'exploration du catalogue Open Data dans le détail financier et ouvre la modale', async () => {
    render(
      <Step4Revelation
        fuelBudget={200}
        housing="maison"
        dailyKm={45}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    fireEvent.click(revealBtn);

    await screen.findByText(/Achetez une Renault Zoé R90 maintenant !/i);

    // Le bouton du catalogue ne doit PAS être visible avant le dépliage du détail financier
    expect(screen.queryByRole('button', { name: /explorer le référentiel open data/i })).not.toBeInTheDocument();

    // Déplier le détail des calculs financiers
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    fireEvent.click(detailsBtn);

    // Le bouton du catalogue est présent dans le détail financier
    const catalogBtn = await screen.findByRole('button', { name: /explorer le référentiel open data/i });
    expect(catalogBtn).toBeInTheDocument();

    // Cliquer sur le bouton ouvre la modale du catalogue Open Data
    fireEvent.click(catalogBtn);
    expect(await screen.findByText(/Référentiel Open Data Certifié/i)).toBeInTheDocument();
  });

  it('affiche le bouton d\'accroche anti-pétroliers et permet de basculer la visibilité de la FAQ', async () => {
    const handleToggleFaq = vi.fn();
    const { rerender } = render(
      <Step4Revelation
        fuelBudget={200}
        housing="maison"
        dailyKm={45}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
        isFaqVisible={false}
        onToggleFaq={handleToggleFaq}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    fireEvent.click(revealBtn);

    // Vérifie le texte de l'accroche anti-taxes & pétroliers
    const ctaBtn = await screen.findByRole('button', { name: /Voyez ce que les pétroliers vous cachent/i });
    expect(ctaBtn).toBeInTheDocument();

    // Clic sur le CTA
    fireEvent.click(ctaBtn);
    expect(handleToggleFaq).toHaveBeenCalledTimes(1);

    // Quand la FAQ est dépliée
    rerender(
      <Step4Revelation
        fuelBudget={200}
        housing="maison"
        dailyKm={45}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
        isFaqVisible={true}
        onToggleFaq={handleToggleFaq}
      />
    );

    expect(screen.getByRole('button', { name: /Masquer les preuves et vérités chiffrées/i })).toBeInTheDocument();
  });

  describe('Équivalents concrets du quotidien vs Mois de salaire', () => {
    it('remplace la notion de mois de salaire par le forfait mobile si gain < 25 €/mois', () => {
      const eq = getSurplusEquivalent(20);
      expect(eq.type).toBe('mobile');
      expect(eq.highlight).toBe('forfait mobile chaque mois');
      expect(eq.fullText).toBe("Soit l'équivalent de votre forfait mobile chaque mois !");
      expect(eq.fullText).not.toContain('mois de salaire');
    });

    it('remplace la notion de mois de salaire par la box internet si gain entre 25 et 49 €/mois', () => {
      const eq = getSurplusEquivalent(35);
      expect(eq.type).toBe('internet');
      expect(eq.highlight).toBe('box internet chaque mois');
      expect(eq.fullText).toBe("Soit l'équivalent de votre box internet chaque mois !");
      expect(eq.fullText).not.toContain('mois de salaire');
    });

    it('remplace la notion de mois de salaire par une sortie ciné en famille si gain entre 50 et 85 €/mois (ex: cas 55 €)', () => {
      const eq = getSurplusEquivalent(55);
      expect(eq.type).toBe('cinema');
      expect(eq.highlight).toBe('sortie ciné en famille chaque mois');
      expect(eq.fullText).toBe("Soit l'équivalent d'une sortie ciné en famille chaque mois !");
      expect(eq.fullText).not.toContain('mois de salaire');
    });

    it('remplace la notion de mois de salaire par un caddie de courses si gain entre 86 et 118 €/mois', () => {
      const eq = getSurplusEquivalent(95);
      expect(eq.type).toBe('groceries');
      expect(eq.highlight).toBe('caddie de courses chaque mois');
      expect(eq.fullText).toBe("Soit l'équivalent d'un caddie de courses chaque mois !");
      expect(eq.fullText).not.toContain('mois de salaire');
    });

    it('affiche le nombre de mois de salaire seulement dès lors qu\'on a au moins 1 mois complet (>= 119 €/mois)', () => {
      const eq1 = getSurplusEquivalent(120);
      expect(eq1.type).toBe('smic');
      expect(eq1.highlight).toMatch(/mois de salaire par an/);

      const eq2 = getSurplusEquivalent(242);
      expect(eq2.type).toBe('smic');
      expect(eq2.highlight).toBe('2 mois de salaire par an');
    });
  });

  it('affiche le message d\'apport de reprise pour annuler le reste à charge sur l\'option confort et permet de l\'appliquer au clic', async () => {
    // Scénario maison utilisateur : 300 € budget, 140 km/j, maison
    render(
      <Step4Revelation
        fuelBudget={300}
        housing="maison"
        dailyKm={140}
        prices={DEFAULT_PRICES}
        onModifyParams={vi.fn()}
      />
    );

    const revealBtn = screen.getByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    fireEvent.click(revealBtn);

    // Initialement sur la Nissan Leaf II (recommandation économique couverte)
    expect(await screen.findByText(/Achetez une Nissan Leaf II maintenant !/i)).toBeInTheDocument();

    // Basculer vers l'option confort (Peugeot e-2008)
    const comfortBtn = screen.getByRole('button', { name: /Option confort & plus grande autonomie/i });
    fireEvent.click(comfortBtn);

    // Vérifier l'affichage du reste à charge (+17 € / mois de votre poche !)
    expect(await screen.findByText(/Plus que/i)).toBeInTheDocument();
    expect(screen.getByText(/\+17/i)).toBeInTheDocument();

    // Vérifier la phrase demandée : "Avec un apport de 1 000 € (reprise véhicule), vous vous mettez à l'abri des futures augmentations."
    expect(screen.getByText(/Avec un apport de/i)).toBeInTheDocument();
    expect(screen.getByText(/vous vous mettez à l'abri des futures augmentations/i)).toBeInTheDocument();

    const applyApportBtn = screen.getByRole('button', { name: /1.*000.*\(reprise véhicule\)/i });
    expect(applyApportBtn).toBeInTheDocument();

    // Cliquer sur le bouton d'apport
    fireEvent.click(applyApportBtn);

    // L'opération devient nulle / autofinancée (plus de reste à charge, affichage du gain ou 0 € restant)
    expect(screen.queryByText(/Plus que/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/chaque mois dans votre poche !|sans débourser/i)).toBeInTheDocument();
  });
});


