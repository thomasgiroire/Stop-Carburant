import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EVModelSelectorModal } from '../src/components/EVModelSelectorModal';
import { EVDatabaseService } from '../src/services/evDatabaseService';

describe('EVModelSelectorModal - Filtre des véhicules rentables', () => {
  const allModels = EVDatabaseService.getAllModels();

  it('ne s\'affiche pas si isOpen est false', () => {
    const { container } = render(
      <EVModelSelectorModal
        isOpen={false}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={300}
        dailyKm={50}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('affiche le catalogue et le toggle avec la reformulation claire', () => {
    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={300}
        dailyKm={50}
      />
    );

    // Titre et en-tête
    expect(screen.getByText(/Catalogue de Véhicules Électriques/i)).toBeInTheDocument();

    // Toggle reformulé
    const toggleBtn = screen.getByRole('switch', { name: /Modèles rentables uniquement/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');

    // Badge mentionnant l'autofinancement et le nombre de modèles rentables
    expect(screen.getByText(/100% autofinancés/i)).toBeInTheDocument();
  });

  it('filtre uniquement les modèles rentables (100% autofinancés) lors de l\'activation du toggle', () => {
    const budget = 300;
    const dailyKm = 50;

    const profitableModels = allModels.filter((car) => {
      const fin = EVDatabaseService.calculateFinancials(car, budget, dailyKm, 'eco_1pct');
      return fin.is100PctAutofinanced;
    });

    expect(profitableModels.length).toBeGreaterThan(0);

    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={budget}
        dailyKm={dailyKm}
      />
    );

    // Initialement le toggle est inactif : tous les modèles sont présents
    const toggleBtn = screen.getByRole('switch', { name: /Modèles rentables uniquement/i });
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');

    // Activation du toggle
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');

    // Le nombre affiché de modèles correspond exactement aux modèles rentables
    expect(screen.getByTestId('models-count')).toHaveTextContent(String(profitableModels.length));

    // Chaque carte visible doit avoir le badge "100% autofinancée par vos économies"
    const autofinancedBadges = screen.getAllByText(/100% autofinancée par vos économies/i);
    expect(autofinancedBadges.length).toBe(profitableModels.length);
    expect(screen.queryByText(/Reste à charge mensuel/i)).not.toBeInTheDocument();
  });

  it('désactive le filtre de rentabilité au second clic et rétablit la liste complète', () => {
    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={150}
        dailyKm={40}
      />
    );

    const toggleBtn = screen.getByRole('switch', { name: /Modèles rentables uniquement/i });

    // Activer
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');

    // Désactiver
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');

    // Liste complète rétablie (37 modèles)
    expect(screen.getByTestId('models-count')).toHaveTextContent(String(allModels.length));
  });

  it('affiche un message d\'absence de résultat adapté et réinitialise le filtre au clic sur réinitialiser', () => {
    // Avec un budget extrêmement faible (10 €/mois), aucun modèle ne peut être autofinancé
    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={10}
        dailyKm={30}
      />
    );

    const toggleBtn = screen.getByRole('switch', { name: /Modèles rentables uniquement/i });
    fireEvent.click(toggleBtn);

    // Message d'information
    expect(screen.getByText(/Aucun modèle n'est 100% autofinancé avec vos critères et votre budget actuel/i)).toBeInTheDocument();

    // Clic sur réinitialiser
    const resetBtn = screen.getByRole('button', { name: /Réinitialiser les filtres/i });
    fireEvent.click(resetBtn);

    // Le toggle est réinitialisé et les modèles réapparaissent
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('models-count')).toHaveTextContent(String(allModels.length));
  });

  it('permet de sélectionner un modèle rentable et ferme la modale', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={handleClose}
        onSelectModel={handleSelect}
        userFuelBudget={300}
        dailyKm={50}
      />
    );

    // Filtrer par modèles rentables
    const toggleBtn = screen.getByRole('switch', { name: /Modèles rentables uniquement/i });
    fireEvent.click(toggleBtn);

    // Sélectionner le premier modèle rentable disponible
    const selectButtons = screen.getAllByRole('button', { name: /Choisir ce modèle pour la simulation/i });
    expect(selectButtons.length).toBeGreaterThan(0);
    fireEvent.click(selectButtons[0]);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('affiche les 3 tuiles de valeurs réalistes transparentes (Option C) sans bandeaux superflus', () => {
    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={300}
        dailyKm={50}
      />
    );

    // Vérifier les 3 tuiles réalistes
    expect(screen.getAllByText(/Autonomie réelle/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Conso réelle/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Batterie utile/i).length).toBeGreaterThan(0);

    // Vérifier l'absence de bandeau technique lourd ou de jargon WLTP
    expect(screen.queryByText(/Données réelles certifiées d'occasion/i)).toBeNull();
    expect(screen.queryByText(/vs WLTP/i)).toBeNull();
  });

  it('affiche la transparence d\'usure de batterie réaliste sur les fiches de véhicules', () => {
    render(
      <EVModelSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectModel={vi.fn()}
        userFuelBudget={300}
        dailyKm={50}
      />
    );

    // Vérifier la mention de l'usure déduite sur l'autonomie et la batterie utile
    const wearBadges = screen.getAllByText(/Usure déduite/i);
    expect(wearBadges.length).toBeGreaterThanOrEqual(2);

    // Vérifier l'affichage de la consommation réelle aux 100 km
    expect(screen.getAllByText(/aux 100 km/i).length).toBeGreaterThan(0);
  });
});
