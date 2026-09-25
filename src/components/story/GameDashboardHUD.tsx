import React from 'react';
import { ArrowRight, ChevronLeft, Home, Building2, Flame, Gauge, Sparkles } from 'lucide-react';
import { HousingType, StoryStage } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface GameDashboardHUDProps {
  stage: StoryStage;
  housing: HousingType;
  dailyKm: number;
  fuelBudget: number;
  onChangeHousing: (housing: HousingType) => void;
  onChangeDailyKm: (km: number) => void;
  onSelectBudget: (budget: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const KM_PRESETS = [25, 45, 70, 110, 160];
const BUDGET_PRESETS = [100, 200, 300, 400, 600];

export const GameDashboardHUD: React.FC<GameDashboardHUDProps> = ({
  stage,
  housing,
  dailyKm,
  fuelBudget,
  onChangeHousing,
  onChangeDailyKm,
  onSelectBudget,
  onNext,
  onBack,
}) => {
  const estimatedMonthlyKm = Math.round(dailyKm * 30.5);
  const fiveYearsLoss = fuelBudget * 60;

  return (
    <div className="w-full max-w-lg mx-auto z-20">
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl">
        <AnimatePresence mode="wait">
          {/* ============================================================= */}
          {/* HUD ÉTAPE 1 : DÉPART (Maison vs Immeuble)                     */}
          {/* ============================================================= */}
          {stage === 'departure' && (
            <motion.div
              key="hud-departure"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5 text-center"
            >
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  D’où part votre voiture chaque matin ?
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Touchez votre habitat sur la route ou choisissez ci-dessous :
                </p>
              </div>

              {/* Sélection Maison vs Appartement */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-housing-maison"
                  aria-pressed={housing === 'maison'}
                  onClick={() => onChangeHousing('maison')}
                  className={`p-3 rounded-2xl border text-center flex items-center justify-center gap-2.5 transition-all cursor-pointer min-h-[50px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    housing === 'maison'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 ring-1 ring-amber-400/40 shadow-md shadow-amber-500/10'
                      : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <Home className="w-5 h-5 shrink-0" />
                  <span className="font-display font-bold text-sm sm:text-base">Maison</span>
                </button>

                <button
                  type="button"
                  id="btn-housing-appartement"
                  aria-pressed={housing === 'appartement'}
                  onClick={() => onChangeHousing('appartement')}
                  className={`p-3 rounded-2xl border text-center flex items-center justify-center gap-2.5 transition-all cursor-pointer min-h-[50px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    housing === 'appartement'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-400 ring-1 ring-sky-400/40 shadow-md shadow-sky-500/10'
                      : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 shrink-0" />
                  <span className="font-display font-bold text-sm sm:text-base">Appartement</span>
                </button>
              </div>

              {/* Bouton de progression */}
              <button
                id="btn-start-commute"
                type="button"
                onClick={onNext}
                className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <span>Prendre la route</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </motion.div>
          )}

          {/* ============================================================= */}
          {/* HUD ÉTAPE 2 : COMMUTE (Kilomètres Quotidiens)                  */}
          {/* ============================================================= */}
          {stage === 'commute' && (
            <motion.div
              key="hud-commute"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 text-center"
            >
              <div className="flex justify-between items-center text-left">
                <div>
                  <h2 className="text-base sm:text-lg font-black font-display text-white tracking-tight">
                    Combien de kilomètres faites-vous par jour ?
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Soit ~<strong className="text-neutral-200">{estimatedMonthlyKm.toLocaleString('fr-FR')} km</strong> chaque mois
                  </p>
                </div>
                <span className="text-2xl sm:text-3xl font-black font-display text-sky-400 font-mono shrink-0 ml-2">
                  {dailyKm} km
                </span>
              </div>

              {/* Slider tactile */}
              <div className="px-1 pt-1">
                <input
                  id="input-daily-km"
                  aria-label="Kilomètres par jour"
                  type="range"
                  min="10"
                  max="400"
                  step="5"
                  value={dailyKm}
                  onChange={(e) => onChangeDailyKm(Number(e.target.value))}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                />
              </div>

              {/* Raccourcis rapides */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                {KM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeDailyKm(preset)}
                    className={`flex-1 py-1.5 min-h-[38px] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                      dailyKm === preset
                        ? 'bg-sky-500 text-black font-extrabold shadow-sm'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {preset} km
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-back-departure"
                  type="button"
                  onClick={onBack}
                  className="px-3.5 py-3 text-neutral-400 hover:text-white bg-neutral-800/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer min-h-[46px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Départ</span>
                </button>

                <button
                  id="btn-continue-commute"
                  type="button"
                  onClick={onNext}
                  className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-xs sm:text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <span>Rouler vers la station</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================= */}
          {/* HUD ÉTAPE 3 : STATION-SERVICE (Budget Carburant & Choc)        */}
          {/* ============================================================= */}
          {stage === 'gas_station' && (
            <motion.div
              key="hud-gas-station"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 text-center"
            >
              <div className="flex justify-between items-center text-left">
                <div>
                  <h2 className="text-base sm:text-lg font-black font-display text-white tracking-tight">
                    Combien s’évapore à la pompe chaque mois ?
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold mt-0.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Perte 5 ans : <strong className="font-mono">{fiveYearsLoss.toLocaleString('fr-FR')} €</strong></span>
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-black font-display text-amber-400 font-mono shrink-0 ml-2">
                  {fuelBudget} €
                </span>
              </div>

              {/* Slider budget */}
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
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                />
              </div>

              {/* Raccourcis rapides */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSelectBudget(preset)}
                    className={`flex-1 py-1.5 min-h-[38px] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                      fuelBudget === preset
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {preset} €
                  </button>
                ))}
              </div>

              {/* Navigation & Climax de transformation */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-back-commute"
                  type="button"
                  onClick={onBack}
                  className="px-3.5 py-3 text-neutral-400 hover:text-white bg-neutral-800/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer min-h-[48px] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Km</span>
                </button>

                <button
                  id="btn-see-result"
                  type="button"
                  onClick={onNext}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 hover:from-rose-400 hover:to-emerald-300 text-black font-display font-black text-xs sm:text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <span>TRANSFORMER MA DÉPENSE</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
