import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, Flame, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface StoryStepGasStationProps {
  fuelBudget: number;
  fuelPrice: number;
  onSelectBudget: (budget: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const BUDGET_PRESETS = [100, 200, 300, 400, 600];

export const StoryStepGasStation: React.FC<StoryStepGasStationProps> = ({
  fuelBudget,
  fuelPrice,
  onSelectBudget,
  onNext,
  onBack,
}) => {
  const yearlyLoss = fuelBudget * 12;
  const fiveYearsLoss = fuelBudget * 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-lg mx-auto px-2 sm:px-4 py-2 sm:py-4 text-center"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-snug mb-3 sm:mb-4">
        Combien s’évapore à la pompe chaque mois ?
      </h1>
      <p className="text-sm sm:text-base text-neutral-400 mb-6">
        Gazole, sans-plomb ou GPL : indiquez votre facture mensuelle de carburant.
      </p>

      {/* Cadre Budget Carburant */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-7 mb-6 shadow-2xl space-y-6">
        <div>
          <label htmlFor="input-budget-slider" className="text-xs uppercase tracking-wider text-neutral-400 font-bold block mb-1">
            Budget carburant par mois
          </label>
          <div className="text-5xl sm:text-6xl font-black font-display text-amber-400 tracking-tight my-2">
            {fuelBudget} <span className="text-xl sm:text-2xl text-neutral-400 font-normal">€ / mois</span>
          </div>

          {/* Slider tactile */}
          <div className="px-1 pt-2">
            <input
              id="input-budget-slider"
              aria-label="Budget carburant par mois"
              type="range"
              min="30"
              max="1200"
              step="10"
              value={fuelBudget}
              onChange={(e) => onSelectBudget(Number(e.target.value))}
              className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            />
          </div>

          {/* Raccourcis rapides au pouce */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectBudget(preset)}
                className={`px-3.5 py-2.5 min-h-[44px] min-w-[58px] rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                  fuelBudget === preset
                    ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/30'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {preset} €
              </button>
            ))}
          </div>
        </div>

        {/* L'Électrochoc à la pompe (Le Choc Pétrolier) */}
        <div className="pt-5 border-t border-neutral-800/80 text-left bg-neutral-950/60 rounded-2xl p-4 border border-rose-900/30">
          <div className="flex items-center gap-2 text-rose-400 font-display font-bold text-xs uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Votre argent qui part en fumée</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:text-left">
            <div>
              <span className="text-[11px] text-neutral-400 block">Sur 1 an</span>
              <span className="text-lg sm:text-xl font-mono font-bold text-rose-400">
                {yearlyLoss.toLocaleString('fr-FR')} €
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Sur 5 ans</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-400">
                {fiveYearsLoss.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            En 5 ans, cette somme perdue correspond déjà à l’achat intégral d'une voiture.
          </p>
        </div>
      </div>

      {/* Navigation ergonomique au pouce */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
        <button
          id="btn-back-commute"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3.5 text-neutral-400 hover:text-white bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kilomètres</span>
        </button>

        <button
          id="btn-see-result"
          onClick={onNext}
          className="w-full sm:w-auto min-w-[280px] min-h-[52px] inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 hover:from-rose-400 hover:to-emerald-300 text-black font-display font-black text-base tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-101 active:scale-98 cursor-pointer uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <span>TRANSFORMER MA DÉPENSE</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
