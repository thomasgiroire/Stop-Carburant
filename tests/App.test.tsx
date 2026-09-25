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

describe('Parcours utilisateur App (Stop-Carburant - Storytelling)', () => {
  it('affiche le Header, la scène vectorielle animée et l\'étape 1 (Départ) au chargement initial', () => {
    render(<App />);

    // Header présent
    const titles = screen.getAllByText(/STOP CARBURANT/i);
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(titles[0]).toBeInTheDocument();

    // Théâtre scénique vectoriel présent
    expect(screen.getByRole('img', { name: /animation du trajet narratif en voiture de profil/i })).toBeInTheDocument();

    // Bouton pour lancer la route présent
    const nextBtn = screen.getByRole('button', { name: /prendre la route/i });
    expect(nextBtn).toBeInTheDocument();
  });

  it('permet de naviguer de l\'étape 1 (Départ) à l\'étape 2 (Trajet travail)', async () => {
    render(<App />);

    const nextBtn = screen.getByRole('button', { name: /prendre la route/i });
    fireEvent.click(nextBtn);

    // En étape 2, on demande les kilomètres du trajet quotidien
    expect(await screen.findByText(/Combien de kilomètres faites-vous par jour/i)).toBeInTheDocument();
    // Aucune mention de prise, borne ou véhicule électrique avant la révélation finale (Règle du Cheval de Troie)
    expect(screen.queryByText(/prise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/borne/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/électrique/i)).not.toBeInTheDocument();
  });

  it('navigue à travers tout le récit jusqu\'à la révélation finale et affiche le lien Open Source dans le footer', async () => {
    render(<App />);

    // Étape 1 (Départ) -> Étape 2 (Trajet)
    fireEvent.click(screen.getByRole('button', { name: /prendre la route/i }));

    // Étape 2 (Trajet) -> Étape 3 (Station-service)
    fireEvent.click(await screen.findByRole('button', { name: /rouler vers la station/i }));

    // Étape 3 (Station-service) -> Étape 4 (Révélation & métamorphose)
    fireEvent.click(await screen.findByRole('button', { name: /transformer ma dépense/i }));

    // Le lien footer "Méthodologie & Code Open Source" doit être visible avec lien GitHub officiel
    const openSourceLink = await screen.findByRole('link', { name: /méthodologie & code open source/i }, { timeout: 3000 });
    expect(openSourceLink).toBeInTheDocument();
    expect(openSourceLink).toHaveAttribute('href', 'https://github.com/thomasgiroire/Stop-Carburant');
    expect(openSourceLink).toHaveAttribute('target', '_blank');

    // Le détail financier est consultable sans modale superflue
    const detailsBtn = await screen.findByRole('button', { name: /voir le détail des calculs financiers/i }, { timeout: 3000 });
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
