import React from 'react';
import { ArrowRight, Home, Building2, Sparkles } from 'lucide-react';
import { HousingType } from '../../types';
import { motion } from 'motion/react';

interface StoryStepDepartureProps {
  housing: HousingType;
  onChangeHousing: (housing: HousingType) => void;
  onNext: () => void;
}

export const StoryStepDeparture: React.FC<StoryStepDepartureProps> = ({
  housing,
  onChangeHousing,
  onNext,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-lg mx-auto px-2 sm:px-4 py-2 sm:py-4 text-center"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-snug mb-3 sm:mb-4">
        D’où part votre voiture chaque matin ?
      </h1>
      <p className="text-sm sm:text-base text-neutral-400 mb-6">
        Sélectionnez votre type de logement pour lancer la simulation.
      </p>

      {/* Cartes de sélection Maison vs Appartement */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <button
          type="button"
          id="btn-housing-maison"
          aria-pressed={housing === 'maison'}
          onClick={() => onChangeHousing('maison')}
          className={`p-4 sm:p-6 rounded-2xl border text-center flex flex-col items-center justify-between gap-3 transition-all cursor-pointer min-h-[140px] sm:min-h-[160px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
            housing === 'maison'
              ? 'bg-amber-500/15 border-amber-500 text-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
              : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
          }`}
        >
          <div
            className={`p-3.5 rounded-2xl ${
              housing === 'maison' ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Home className="w-8 h-8" />
          </div>
          <div>
            <span className="font-display font-black text-lg sm:text-xl block">Maison</span>
            <span className="text-[11px] sm:text-xs text-neutral-400 block mt-1">
              Garage ou cour privée
            </span>
          </div>
        </button>

        <button
          type="button"
          id="btn-housing-appartement"
          aria-pressed={housing === 'appartement'}
          onClick={() => onChangeHousing('appartement')}
          className={`p-4 sm:p-6 rounded-2xl border text-center flex flex-col items-center justify-between gap-3 transition-all cursor-pointer min-h-[140px] sm:min-h-[160px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
            housing === 'appartement'
              ? 'bg-sky-500/15 border-sky-400 text-sky-400 ring-2 ring-sky-400/30 shadow-lg shadow-sky-500/10'
              : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
          }`}
        >
          <div
            className={`p-3.5 rounded-2xl ${
              housing === 'appartement' ? 'bg-sky-500/20 text-sky-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <span className="font-display font-black text-lg sm:text-xl block">Appartement</span>
            <span className="text-[11px] sm:text-xs text-neutral-400 block mt-1">
              Parking collectif ou rue
            </span>
          </div>
        </button>
      </div>

      {/* Bouton pour démarrer la route */}
      <button
        id="btn-start-commute"
        onClick={onNext}
        className="w-full sm:w-auto min-w-[260px] min-h-[52px] inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-base tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-101 active:scale-98 cursor-pointer uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        <span>Prendre la route</span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </motion.div>
  );
};
