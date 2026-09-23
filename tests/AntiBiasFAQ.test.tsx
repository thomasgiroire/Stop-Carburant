import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AntiBiasFAQ } from '../src/components/AntiBiasFAQ';
import { FAQ_ITEMS } from '../src/constants';

describe('Composant AntiBiasFAQ', () => {
  it('affiche le titre avec le nombre exact de questions et la liste des mythes', () => {
    render(<AntiBiasFAQ />);

    // Titre dynamique avec le compte exact
    expect(screen.getByText(new RegExp(`Les ${FAQ_ITEMS.length} vérités chiffrées`, 'i'))).toBeInTheDocument();

    // Vérifie que la question sur les prix est présente
    expect(screen.getByText(/Les voitures électriques sont trop chères/i)).toBeInTheDocument();
  });

  it('affiche par défaut la réponse concise sans aucun badge "verdict" ou "faux"', () => {
    render(<AntiBiasFAQ />);

    // Aucun badge de verdict / FAUX ne doit être affiché
    expect(screen.queryByText(/Verdict/i)).not.toBeInTheDocument();

    // Mention exacte occasion
    expect(screen.getByText(/En occasion, une citadine démarre entre 5 et 6 000 € \(exemple Renault Zoé dès ~5 850 €\)/i)).toBeInTheDocument();

    // Mention exacte neuf avec primes
    expect(screen.getByText(/En neuf, les citadines débutent dès 18 900 € \(Dacia Spring\) et avec les primes à l'achat, le prix peut descendre sous les 15 000 €/i)).toBeInTheDocument();

    // Aucune mention d'amortissement
    expect(screen.queryByText(/amorti/i)).not.toBeInTheDocument();
  });

  it('permet de replier et déplier les questions au clic', async () => {
    render(<AntiBiasFAQ />);

    const priceBtn = screen.getByRole('button', { name: /Les voitures électriques sont trop chères/i });
    
    // Au départ ouvert : le texte de réponse est présent
    expect(screen.getByText(/En occasion, une citadine démarre entre 5 et 6 000 €/i)).toBeInTheDocument();

    // Clic pour fermer
    fireEvent.click(priceBtn);
    await waitFor(() => {
      expect(screen.queryByText(/En occasion, une citadine démarre entre 5 et 6 000 €/i)).not.toBeInTheDocument();
    });

    // Clic pour ré-ouvrir
    fireEvent.click(priceBtn);
    await waitFor(() => {
      expect(screen.getByText(/En occasion, une citadine démarre entre 5 et 6 000 €/i)).toBeInTheDocument();
    });
  });

  it('affiche la question sur la taxation et permet de consulter les explications et la source Automobile Propre', async () => {
    render(<AntiBiasFAQ />);

    // La question sur la taxation est bien présente
    const taxationBtn = screen.getByRole('button', { name: /La taxation arrive/i });
    expect(taxationBtn).toBeInTheDocument();

    // Au départ fermée
    expect(screen.queryByText(/Si l'État réfléchira inévitablement à compenser la baisse des recettes de la TICPE/i)).not.toBeInTheDocument();

    // Clic pour ouvrir
    fireEvent.click(taxationBtn);

    await waitFor(() => {
      expect(screen.getByText(/Si l'État réfléchira inévitablement à compenser la baisse des recettes de la TICPE/i)).toBeInTheDocument();
    });

    // Vérifie la présence du lien et de la source Automobile Propre
    const sourceLink = screen.getByRole('link', { name: /Automobile Propre/i });
    expect(sourceLink).toBeInTheDocument();
    expect(sourceLink).toHaveAttribute('href', expect.stringContaining('automobile-propre.com/articles/voitures-electriques-la-taxe-de-trop'));
  });

  it('affiche la question sur la recharge en appartement / balcon et permet de consulter le droit à la prise', async () => {
    render(<AntiBiasFAQ />);

    // La question sur la recharge en appartement / rallonge du balcon est bien présente
    const apartmentBtn = screen.getByRole('button', { name: /rallonge de mon balcon/i });
    expect(apartmentBtn).toBeInTheDocument();

    // Au départ fermée
    expect(screen.queryByText(/Rallonge inutile/i)).not.toBeInTheDocument();

    // Clic pour ouvrir
    fireEvent.click(apartmentBtn);

    await waitFor(() => {
      expect(screen.getByText(/Rallonge inutile/i)).toBeInTheDocument();
    });

    // Vérifie les mentions clés : droit à la prise, bornes publiques et aides
    expect(screen.getAllByText(/droit à la prise/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/ADVENIR/i)).toBeInTheDocument();

    // Vérifie la présence du lien source Service-Public.fr / Avere-France
    const servicePublicLink = screen.getByRole('link', { name: /Service-Public\.fr/i });
    expect(servicePublicLink).toBeInTheDocument();
    expect(servicePublicLink).toHaveAttribute('href', expect.stringContaining('service-public.fr'));
  });
});
