import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Step1HookProps {
  fuelBudget: number;
  dailyKm: number;
  onSelectBudget: (budget: number) => void;
  onChangeDailyKm: (km: number) => void;
  onNext: () => void;
}

const BUDGET_PRESETS = [100, 200, 300, 400, 600];

export const Step1Hook: React.FC<Step1HookProps> = ({
  fuelBudget,
  dailyKm,
  onSelectBudget,
  onChangeDailyKm,
  onNext,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-lg mx-auto px-3 sm:px-4 py-3 sm:py-6 text-center"
    >
      {/* Question centrale épurée */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-snug mb-5 sm:mb-8">
        Combien s’évapore chaque mois{' '}
        <span className="text-amber-400">
          rien que pour vos déplacements du quotidien ?
        </span>
      </h1>

      {/* Cadre ultra épuré */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-8 mb-6 shadow-2xl space-y-6">
        {/* Paramètre 1 : Budget carburant */}
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold block mb-1">
            Budget carburant par mois
          </span>
          <div className="text-5xl sm:text-6xl font-black font-display text-amber-400 tracking-tight my-2">
            {fuelBudget} <span className="text-xl sm:text-2xl text-neutral-400 font-normal">€ / mois</span>
          </div>

          <div className="px-1 pt-1">
            <input
              id="input-budget-slider"
              aria-label="Budget carburant par mois"
              type="range"
              min="30"
              max="1200"
              step="10"
              value={fuelBudget}
              onChange={(e) => onSelectBudget(Number(e.target.value))}
              className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Raccourcis rapides directs */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectBudget(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  fuelBudget === preset
                    ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {preset} €
              </button>
            ))}
          </div>
        </div>

        {/* Paramètre 2 : Kilomètres par jour */}
        <div className="pt-6 border-t border-neutral-800/80 text-left">
          <div className="flex justify-between items-center mb-3 gap-2">
            <label htmlFor="input-daily-km" className="text-xs uppercase tracking-wider font-bold text-neutral-300">
              Kilomètres par jour
            </label>
            <span className="text-base sm:text-lg font-black font-display text-amber-400 bg-neutral-800 px-3 py-1 rounded-xl border border-neutral-700 font-mono">
              {dailyKm} km
            </span>
          </div>

          <input
            id="input-daily-km"
            type="range"
            min="10"
            max="400"
            step="5"
            value={dailyKm}
            onChange={(e) => onChangeDailyKm(Number(e.target.value))}
            className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* CTA ergonomique */}
      <button
        id="btn-continue-step1"
        onClick={onNext}
        className="w-full sm:w-auto min-w-[280px] min-h-[54px] inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display font-black text-base tracking-wide rounded-2xl shadow-xl shadow-amber-500/25 transition-all cursor-pointer uppercase"
      >
        <span>CONTINUER</span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </motion.div>
  );
};
