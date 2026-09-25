import React from 'react';
import { ArrowRight, ChevronLeft, MapPin, Gauge } from 'lucide-react';
import { motion } from 'motion/react';

interface StoryStepCommuteProps {
  dailyKm: number;
  onChangeDailyKm: (km: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const KM_PRESETS = [25, 45, 70, 110, 160];

export const StoryStepCommute: React.FC<StoryStepCommuteProps> = ({
  dailyKm,
  onChangeDailyKm,
  onNext,
  onBack,
}) => {
  const estimatedMonthlyKm = Math.round(dailyKm * 30.5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-lg mx-auto px-2 sm:px-4 py-2 sm:py-4 text-center"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-snug mb-3 sm:mb-4">
        Combien de kilomètres faites-vous par jour ?
      </h1>
      <p className="text-sm sm:text-base text-neutral-400 mb-6">
        Aller-retour travail, activités, tournées ou trajets du quotidien.
      </p>

      {/* Cadre de réglage kilométrique */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-7 mb-6 shadow-2xl space-y-5">
        <div>
          <div className="text-5xl sm:text-6xl font-black font-display text-sky-400 tracking-tight my-2">
            {dailyKm} <span className="text-xl sm:text-2xl text-neutral-400 font-normal">km / jour</span>
          </div>
          <div className="text-xs sm:text-sm text-neutral-400 font-mono flex items-center justify-center gap-1.5 mt-1">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span>Soit environ <strong className="text-neutral-200">{estimatedMonthlyKm.toLocaleString('fr-FR')} km</strong> chaque mois</span>
          </div>

          {/* Slider tactile */}
          <div className="px-1 pt-5">
            <input
              id="input-daily-km"
              aria-label="Kilomètres par jour"
              type="range"
              min="10"
              max="400"
              step="5"
              value={dailyKm}
              onChange={(e) => onChangeDailyKm(Number(e.target.value))}
              className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            />
          </div>

          {/* Raccourcis rapides au pouce */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {KM_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeDailyKm(preset)}
                className={`px-3.5 py-2.5 min-h-[44px] min-w-[58px] rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                  dailyKm === preset
                    ? 'bg-sky-500 text-black font-extrabold shadow-md shadow-sky-500/30'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {preset} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation ergonomique au pouce */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
        <button
          id="btn-back-departure"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3.5 text-neutral-400 hover:text-white bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Départ</span>
        </button>

        <button
          id="btn-continue-commute"
          onClick={onNext}
          className="w-full sm:w-auto min-w-[260px] min-h-[52px] inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-base tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-101 active:scale-98 cursor-pointer uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          <span>Rouler vers la station</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
