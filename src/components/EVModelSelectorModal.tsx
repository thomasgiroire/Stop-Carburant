import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Zap,
  BatteryCharging,
  Gauge,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
  Car
} from 'lucide-react';
import { EVDatabaseService, OpenDataEVModel } from '../services/evDatabaseService';
import { LoanRateMode } from '../utils/loanCalculations';
import { formatCurrency } from '../utils/calculator';

interface EVModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: OpenDataEVModel) => void;
  currentSelectedModelName?: string;
  userFuelBudget: number;
  dailyKm: number;
  loanMode?: LoanRateMode;
}

export const EVModelSelectorModal: React.FC<EVModelSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  currentSelectedModelName,
  userFuelBudget,
  dailyKm,
  loanMode = 'eco_1pct',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('all');
  const [minRange, setMinRange] = useState<number>(0);
  const [onlyProfitable, setOnlyProfitable] = useState<boolean>(false);

  const allModels = useMemo(() => EVDatabaseService.getAllModels(), []);

  const profitableCount = useMemo(() => {
    return allModels.filter((car) => {
      const fin = EVDatabaseService.calculateFinancials(
        car,
        userFuelBudget,
        dailyKm,
        loanMode
      );
      return fin.is100PctAutofinanced;
    }).length;
  }, [allModels, userFuelBudget, dailyKm, loanMode]);

  const filteredModels = useMemo(() => {
    return allModels.filter((car) => {
      if (selectedBodyType !== 'all' && car.bodyType !== selectedBodyType) {
        return false;
      }
      if (minRange > 0 && car.realRangeKm < minRange) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const fullText = `${car.make} ${car.model} ${car.trim} ${car.fullName}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }
      if (onlyProfitable) {
        const fin = EVDatabaseService.calculateFinancials(
          car,
          userFuelBudget,
          dailyKm,
          loanMode
        );
        if (!fin.is100PctAutofinanced) {
          return false;
        }
      }
      return true;
    });
  }, [allModels, selectedBodyType, minRange, searchQuery, onlyProfitable, userFuelBudget, dailyKm, loanMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* En-tête de la modale */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 bg-neutral-950/80 sticky top-0 z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                Référentiel Open Data Certifié
              </span>
              <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                OpenEV Data v1.24 & ADEME
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Catalogue de Véhicules Électriques
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Choisissez n'importe quel modèle pour comparer instantanément vos économies réelles de carburant.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de filtres et recherche */}
        <div className="p-4 sm:p-5 bg-neutral-900/90 border-b border-neutral-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Champ de recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Rechercher par marque, modèle (ex: e-208, Zoé, Tesla, Kona...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Filtre par carrosserie */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'citadine', label: 'Citadines' },
                { id: 'compacte', label: 'Compactes' },
                { id: 'berline', label: 'Berlines' },
                { id: 'break', label: 'Breaks' },
                { id: 'suv', label: 'SUV' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedBodyType(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBodyType === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ligne toggle rentabilité & indicateurs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              id="filter-only-profitable"
              data-testid="filter-only-profitable"
              role="switch"
              aria-checked={onlyProfitable}
              onClick={() => setOnlyProfitable(!onlyProfitable)}
              className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer w-fit ${
                onlyProfitable
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-md shadow-emerald-950/40'
                  : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {/* Switch UI */}
              <div
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  onlyProfitable ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition duration-200 ${
                    onlyProfitable ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </div>

              <span>Modèles rentables uniquement</span>

              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  onlyProfitable
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                100% autofinancés ({profitableCount})
              </span>
            </button>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-neutral-400">
              <span>
                <strong className="text-white" data-testid="models-count">{filteredModels.length}</strong>{' '}
                {filteredModels.length > 1 ? 'modèles disponibles' : 'modèle disponible'}
                {onlyProfitable && ` (sur ${allModels.length})`}
              </span>
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Calculs actualisés avec votre budget</span>
                <span>({formatCurrency(userFuelBudget)}/m)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Grille de modèles */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredModels.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Car className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">
                {onlyProfitable
                  ? `Aucun modèle n'est 100% autofinancé avec vos critères et votre budget actuel (${formatCurrency(userFuelBudget)}/m).`
                  : 'Aucun modèle ne correspond à vos critères de recherche.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBodyType('all');
                  setMinRange(0);
                  setOnlyProfitable(false);
                }}
                className="text-xs text-emerald-400 underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredModels.map((car) => {
                const isSelected =
                  currentSelectedModelName &&
                  (car.fullName.toLowerCase() === currentSelectedModelName.toLowerCase() ||
                    currentSelectedModelName.toLowerCase().includes(car.fullName.toLowerCase()));

                const fin = EVDatabaseService.calculateFinancials(
                  car,
                  userFuelBudget,
                  dailyKm,
                  loanMode
                );

                return (
                  <div
                    key={car.id}
                    className={`relative p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/80 ring-1 ring-emerald-500/60 shadow-xl'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
                    }`}
                  >
                    <div>
                      {/* En-tête de la carte */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {car.make} • {car.bodyType}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                            {car.fullName}
                          </h3>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {car.yearRange} • Constaté dès {formatCurrency(car.estimatedMarketPrice)} d'occasion
                          </div>
                        </div>

                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-neutral-950 shrink-0">
                            <Check className="w-3 h-3" /> Modèle actif
                          </span>
                        )}
                      </div>

                      {/* Tuiles de spécifications réelles (valeurs réalistes & transparentes) */}
                      <div className="grid grid-cols-3 gap-2 mt-3 mb-3 text-center">
                        <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between">
                          <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                            <Gauge className="w-3 h-3 text-blue-400" /> Autonomie réelle
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-white my-0.5">
                            {car.realRangeKm} km
                          </div>
                          <div className="text-[9px] text-emerald-400/90 font-medium">
                            {car.estimatedSoHPct && car.estimatedSoHPct < 99
                              ? 'Usure déduite'
                              : 'Usage réel'}
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between">
                          <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" /> Conso réelle
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-white my-0.5">
                            {car.realConsoKwh100} <span className="text-[10px] font-normal text-neutral-400">kWh</span>
                          </div>
                          <div className="text-[9px] text-neutral-500 font-normal">
                            aux 100 km
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between">
                          <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                            <BatteryCharging className="w-3 h-3 text-emerald-400" /> Batterie utile
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-white my-0.5">
                            {car.usableBatteryKwh ? `${car.usableBatteryKwh}` : `${car.batteryNetKwh}`} <span className="text-[10px] font-normal text-neutral-400">kWh</span>
                          </div>
                          <div className="text-[9px] text-emerald-400/90 font-medium">
                            {car.estimatedSoHPct && car.estimatedSoHPct < 99
                              ? 'Usure déduite'
                              : 'Capacité d\'origine'}
                          </div>
                        </div>
                      </div>

                      {/* Description courte */}
                      <p className="text-xs text-neutral-300 line-clamp-2 mb-2.5">
                        {car.description}
                      </p>

                    </div>

                    {/* Bloc Bilan Financier & Action */}
                    <div className="pt-3 border-t border-neutral-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Mensualité estimée (60 mois) :</span>
                        <span className="font-bold text-white font-mono">
                          ~{formatCurrency(fin.monthlyLoan)}/mois
                        </span>
                      </div>

                      {/* Indicateur d'autofinancement */}
                      <div
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          fin.is100PctAutofinanced
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                        }`}
                      >
                        <span className="font-semibold">
                          {fin.is100PctAutofinanced
                            ? '100% autofinancée par vos économies'
                            : 'Reste à charge mensuel'}
                        </span>
                        <span className="font-bold font-mono">
                          {fin.is100PctAutofinanced
                            ? `+${formatCurrency(fin.netLiberatedCashHC)}/m`
                            : `${formatCurrency(Math.abs(fin.netLiberatedCashHC))}/m`}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onSelectModel(car);
                          onClose();
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-950/40'
                        }`}
                      >
                        {isSelected ? 'Conserver ce modèle' : 'Choisir ce modèle pour la simulation'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de page Open Data */}
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span>
              Données issues d'<strong>OpenEV Data (licence CDLA-Permissive-2.0)</strong>, <strong>ADEME Car Labelling</strong> et tests <strong>La Chaîne EV</strong>.
            </span>
          </div>
          <span className="text-neutral-500 text-[10px]">
            {allModels.length} modèles étalonnés intégrés nativement
          </span>
        </div>
      </motion.div>
    </div>
  );
};
