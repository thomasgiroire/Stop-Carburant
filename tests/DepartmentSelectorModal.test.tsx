import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DepartmentSelectorModal } from '../src/components/DepartmentSelectorModal';

describe('DepartmentSelectorModal (Stop-Carburant)', () => {
  const mockPricesMap = {
    '33': {
      code: '33',
      name: 'Gironde',
      fuelPrice: 2.15,
      dieselPrice: 2.20,
      essencePrice: 2.10,
      e85Price: 0.88,
    },
    '75': {
      code: '75',
      name: 'Paris',
      fuelPrice: 2.28,
      dieselPrice: 2.30,
      essencePrice: 2.25,
      e85Price: 0.95,
    },
  };

  it('ne s\'affiche pas si isOpen est false', () => {
    const { container } = render(
      <DepartmentSelectorModal
        isOpen={false}
        onClose={vi.fn()}
        onSelectDepartment={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('affiche la modale, le champ de recherche et les prix personnalisés', () => {
    render(
      <DepartmentSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectDepartment={vi.fn()}
        departmentPricesMap={mockPricesMap}
        nationalFuelPrice={1.74}
      />
    );

    expect(screen.getByText(/Localiser le prix du carburant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Numéro ou nom du département/i)).toBeInTheDocument();
    expect(screen.getByText('2.15 €/L')).toBeInTheDocument();
    expect(screen.getByText('2.28 €/L')).toBeInTheDocument();
  });

  it('filtre les départements lors de la saisie dans le champ de recherche', () => {
    render(
      <DepartmentSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectDepartment={vi.fn()}
        departmentPricesMap={mockPricesMap}
      />
    );

    const input = screen.getByPlaceholderText(/Numéro ou nom du département/i);
    fireEvent.change(input, { target: { value: 'Paris' } });

    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.queryByText('Gironde')).not.toBeInTheDocument();
  });

  it('appelle onSelectDepartment avec le code au clic sur un département', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DepartmentSelectorModal
        isOpen={true}
        onClose={handleClose}
        onSelectDepartment={handleSelect}
        departmentPricesMap={mockPricesMap}
      />
    );

    const input = screen.getByPlaceholderText(/Numéro ou nom du département/i);
    fireEvent.change(input, { target: { value: '33' } });

    const girondeBtn = screen.getByText('Gironde').closest('button');
    expect(girondeBtn).toBeInTheDocument();
    fireEvent.click(girondeBtn!);

    expect(handleSelect).toHaveBeenCalledWith('33', 'all');
    expect(handleClose).toHaveBeenCalled();
  });

  it('appelle onSelectDepartment(null) au clic sur Moyenne nationale France', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DepartmentSelectorModal
        isOpen={true}
        onClose={handleClose}
        onSelectDepartment={handleSelect}
        selectedDepartmentCode="33"
      />
    );

    const nationalBtn = screen.getByText(/Moyenne nationale France/i).closest('button');
    expect(nationalBtn).toBeInTheDocument();
    fireEvent.click(nationalBtn!);

    expect(handleSelect).toHaveBeenCalledWith(null, 'all');
    expect(handleClose).toHaveBeenCalled();
  });

  it('permet de filtrer sur le carburant (Gazole, SP95, E85) et actualise les prix affichés', () => {
    const handleFuelChange = vi.fn();

    render(
      <DepartmentSelectorModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectDepartment={vi.fn()}
        onChangeFuelType={handleFuelChange}
        departmentPricesMap={mockPricesMap}
        nationalFuelPrice={1.74}
        nationalDieselPrice={1.73}
        nationalE85Price={0.85}
      />
    );

    // Initialement en mode "Tous (Moyenne)"
    expect(screen.getByText('2.15 €/L')).toBeInTheDocument(); // Gironde fuelPrice

    // Clic sur Gazole
    const dieselBtn = screen.getByRole('button', { name: /gazole \/ diesel/i });
    fireEvent.click(dieselBtn);
    expect(handleFuelChange).toHaveBeenCalledWith('diesel');
    expect(screen.getByText('2.20 €/L')).toBeInTheDocument(); // Gironde dieselPrice

    // Clic sur E85
    const e85Btn = screen.getByRole('button', { name: /e85/i });
    fireEvent.click(e85Btn);
    expect(handleFuelChange).toHaveBeenCalledWith('e85');
    expect(screen.getByText('0.88 €/L')).toBeInTheDocument(); // Gironde e85Price
  });

  it('permet de sélectionner un département via le dropdown direct', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DepartmentSelectorModal
        isOpen={true}
        onClose={handleClose}
        onSelectDepartment={handleSelect}
        departmentPricesMap={mockPricesMap}
      />
    );

    const selectEl = screen.getByLabelText(/sélection directe du département/i);
    expect(selectEl).toBeInTheDocument();

    fireEvent.change(selectEl, { target: { value: '33' } });
    expect(handleSelect).toHaveBeenCalledWith('33', 'all');
    expect(handleClose).toHaveBeenCalled();
  });
});
