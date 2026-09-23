import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

// Mock pour fetchLiveEnergyPrices afin d'éviter les appels réseau réels pendant les tests
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
  };
});

describe('Parcours utilisateur App (Stop-Carburant)', () => {
  it('affiche le Header et l\'étape 1 au chargement initial', () => {
    render(<App />);

    // Header présent
    const titles = screen.getAllByText(/STOP CARBURANT/i);
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(titles[0]).toBeInTheDocument();

    // Bouton pour passer à l'étape suivante présent
    const nextBtn = screen.getByRole('button', { name: /continuer/i });
    expect(nextBtn).toBeInTheDocument();
  });

  it('permet de naviguer de l\'étape 1 à l\'étape 2 au clic sur Continuer', async () => {
    render(<App />);

    const nextBtn = screen.getByRole('button', { name: /continuer/i });
    fireEvent.click(nextBtn);

    // En étape 2, on demande le mode de stationnement / logement
    expect(await screen.findByText(/Où dort votre voiture le soir/i)).toBeInTheDocument();
    // Aucune mention de prise, borne ou véhicule électrique avant la dernière étape
    expect(screen.queryByText(/prise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/borne/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/électrique/i)).not.toBeInTheDocument();
  });

  it('navigue jusqu\'à l\'étape 3 et affiche le lien Open Source dans le footer', async () => {
    render(<App />);

    // Étape 1 -> Étape 2
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }));
    // Étape 2 -> Étape 3
    fireEvent.click(await screen.findByRole('button', { name: /voir mon résultat/i }));

    // Bouton de révélation du résultat dans l'étape 3
    const revealBtn = await screen.findByRole('button', { name: /voir où devrait plutôt aller cet argent/i });
    expect(revealBtn).toBeInTheDocument();
    fireEvent.click(revealBtn);

    // Le lien footer "Méthodologie & Code Open Source" doit être visible avec lien GitHub officiel
    const openSourceLink = await screen.findByRole('link', { name: /méthodologie & code open source/i });
    expect(openSourceLink).toBeInTheDocument();
    expect(openSourceLink).toHaveAttribute('href', 'https://github.com/thomasgiroire/Stop-Carburant');
    expect(openSourceLink).toHaveAttribute('target', '_blank');

    // Le détail financier est consultable sans modale superflue
    const detailsBtn = screen.getByRole('button', { name: /voir le détail des calculs financiers/i });
    expect(detailsBtn).toBeInTheDocument();
    fireEvent.click(detailsBtn);
    expect(await screen.findByText(/Coût aux 100 km/i)).toBeInTheDocument();
  });

  it('ouvre la modale de sélection de département et permet de choisir un département', async () => {
    render(<App />);

    // Le badge du Header est cliquable
    const badgeBtn = screen.getByTitle(/cliquer pour changer de département/i);
    expect(badgeBtn).toBeInTheDocument();
    fireEvent.click(badgeBtn);

    // La modale doit s'ouvrir
    expect(await screen.findByText(/Localiser le prix du carburant/i)).toBeInTheDocument();

    // Le département 33 - Gironde doit être présent dans la liste
    const girondeBtn = await screen.findByRole('button', { name: /33.*Gironde/i });
    expect(girondeBtn).toBeInTheDocument();
    fireEvent.click(girondeBtn);

    // La modale se ferme et le header reflète le département sélectionné (33)
    expect(await screen.findByText(/En direct \(33\) :/i)).toBeInTheDocument();
  });
});
