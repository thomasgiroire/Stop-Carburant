import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    expect(screen.getByRole('img', { name: /animation du trajet narratif en voiture/i })).toBeInTheDocument();

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

  it('fait disparaître immédiatement le panel de questions lors du clic sur transformer ma dépense', async () => {
    render(<App />);

    // Étape 1 -> Étape 2
    fireEvent.click(screen.getByRole('button', { name: /prendre la route/i }));

    // Étape 2 -> Étape 3
    fireEvent.click(await screen.findByRole('button', { name: /rouler vers la station/i }));

    // Étape 3 : le panel de questions est affiché
    const transformBtn = await screen.findByRole('button', { name: /transformer ma dépense/i });
    expect(transformBtn).toBeInTheDocument();
    expect(screen.getByText(/Combien s’évapore à la pompe chaque mois/i)).toBeInTheDocument();

    // Clic sur transformer ma dépense
    fireEvent.click(transformBtn);

    // Le panel de questions et son bouton disparaissent pendant le départ de la voiture
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /transformer ma dépense/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Combien s’évapore à la pompe chaque mois/i)).not.toBeInTheDocument();
    });
  });

  it('positionne automatiquement le curseur sur la moyenne et colore le slider sans afficher de détails superflus', async () => {
    render(<App />);

    // Étape 1 -> Étape 2
    fireEvent.click(screen.getByRole('button', { name: /prendre la route/i }));

    // Étape 2 : Définir 45 km/jour
    const kmSlider = await screen.findByLabelText(/kilomètres par jour/i);
    fireEvent.change(kmSlider, { target: { value: '45' } });

    // Étape 2 -> Étape 3 (Station-service)
    fireEvent.click(screen.getByRole('button', { name: /rouler vers la station/i }));

    // Étape 3 : Les détails textuels et encadrés ne doivent PAS être affichés
    expect(screen.queryByText(/Estimation pour vos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zone probable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /caler sur la moyenne/i })).not.toBeInTheDocument();

    // Vérifier que le slider a bien la couleur sur son trait (linear-gradient)
    const budgetSlider = await screen.findByLabelText(/budget carburant par mois/i);
    expect(budgetSlider).toBeInTheDocument();
    expect(budgetSlider.getAttribute('style')).toContain('linear-gradient');

    // Le curseur est automatiquement positionné sur la moyenne (120 € pour 45 km/j à 1.74 €/L)
    expect(budgetSlider).toHaveValue('120');
    expect(screen.getByText('120 €')).toBeInTheDocument();

    // L'utilisateur reste libre d'ajuster le montant au final
    fireEvent.change(budgetSlider, { target: { value: '180' } });
    expect(budgetSlider).toHaveValue('180');
    expect(screen.getByText('180 €')).toBeInTheDocument();
  });
});

