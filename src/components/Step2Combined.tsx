import React from 'react';
import { ArrowRight, ChevronLeft, Home, Building2, ShieldCheck } from 'lucide-react';
import { HousingType } from '../types';
import { motion } from 'motion/react';

interface Step2CombinedProps {
  fuelBudget: number;
  housing: HousingType;
  onChangeHousing: (housing: HousingType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Combined: React.FC<Step2CombinedProps> = ({
  housing,
  onChangeHousing,
  onNext,
  onBack,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-lg mx-auto px-3 sm:px-4 py-3 sm:py-6 text-center"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-snug mb-5 sm:mb-8">
        Où dort votre voiture le soir ?
      </h1>

      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-8 mb-6 shadow-2xl">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            aria-pressed={housing === 'maison'}
            id="btn-housing-maison"
            onClick={() => onChangeHousing('maison')}
            className={`p-5 sm:p-7 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
              housing === 'maison'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <div className={`p-3.5 rounded-2xl ${housing === 'maison' ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-900 text-neutral-400'}`}>
              <Home className="w-8 h-8" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl">Maison</span>
          </button>

          <button
            type="button"
            aria-pressed={housing === 'appartement'}
            id="btn-housing-appartement"
            onClick={() => onChangeHousing('appartement')}
            className={`p-5 sm:p-7 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
              housing === 'appartement'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <div className={`p-3.5 rounded-2xl ${housing === 'appartement' ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-900 text-neutral-400'}`}>
              <Building2 className="w-8 h-8" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl">Appartement</span>
          </button>
        </div>
      </div>

      {/* Actions ergonomiques pour mobile */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
        <button
          id="btn-back-step-1"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3.5 text-neutral-400 hover:text-white bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <button
          id="btn-see-result"
          onClick={onNext}
          className="w-full sm:w-auto min-w-[260px] min-h-[52px] inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-base tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-101 active:scale-98 cursor-pointer uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <span>VOIR MON RÉSULTAT</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
