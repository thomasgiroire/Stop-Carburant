import React from 'react';
import { EnergyPrices } from '../services/energyPrices';

interface HeaderProps {
  currentStep: number;
  totalSteps?: number;
  onReset?: () => void;
  prices?: EnergyPrices;
  onOpenDepartmentSelector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  totalSteps = 3,
  onReset,
  prices,
  onOpenDepartmentSelector,
}) => {
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          onClick={onReset}
          className="flex items-center gap-2 cursor-pointer group"
          title="Recommencer la simulation"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white tracking-wider font-display uppercase group-hover:text-amber-400 transition-colors">
            STOP CARBURANT
          </span>
          <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            StopCarburant.fr
          </span>
        </div>

        {/* Badge OpenData en direct des stations */}
        {prices && (
          <button
            type="button"
            onClick={onOpenDepartmentSelector}
            className="hidden md:inline-flex items-center gap-2 text-xs bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 px-3 py-1 rounded-full text-neutral-300 shadow-inner transition-colors cursor-pointer"
            title="Cliquer pour changer de département ou de carburant"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-400 text-[11px]">
              En direct{' '}
              {prices.departmentCode
                ? `(${prices.departmentCode}${prices.selectedFuelType && prices.selectedFuelType !== 'all' ? ` • ${prices.selectedFuelType === 'diesel' ? 'Gazole' : prices.selectedFuelType === 'essence' ? 'SP95' : 'E85'}` : ''})`
                : prices.selectedFuelType && prices.selectedFuelType !== 'all'
                ? `(${prices.selectedFuelType === 'diesel' ? 'Gazole' : prices.selectedFuelType === 'essence' ? 'SP95' : 'E85'})`
                : 'stations'}{' '}
              :
            </span>
            <span className="font-bold text-emerald-400 font-mono text-xs">
              {(prices.fuelPrice || 1.74).toFixed(2)} €/L
            </span>
            <span className="text-[10px] text-neutral-500 hover:text-neutral-300">▾</span>
          </button>
        )}

        {/* Progression en 3 étapes */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'w-6 bg-amber-500'
                  : step < currentStep
                  ? 'w-2.5 bg-emerald-500'
                  : 'w-2 bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  );
};
