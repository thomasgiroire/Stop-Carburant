import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, MapPin, Check, Fuel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEPARTMENTS } from '../data/departments';
import { DepartmentFuelPrices, FuelType, FUEL_LABELS } from '../services/energyPrices';

interface DepartmentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDepartmentCode?: string;
  selectedFuelType?: FuelType;
  onSelectDepartment: (deptCode: string | null, fuelType?: FuelType) => void;
  onChangeFuelType?: (fuelType: FuelType) => void;
  departmentPricesMap?: Record<string, DepartmentFuelPrices>;
  nationalFuelPrice?: number;
  nationalDieselPrice?: number;
  nationalEssencePrice?: number;
  nationalE85Price?: number;
}

export const DepartmentSelectorModal: React.FC<DepartmentSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedDepartmentCode,
  selectedFuelType = 'all',
  onSelectDepartment,
  onChangeFuelType,
  departmentPricesMap,
  nationalFuelPrice = 1.74,
  nationalDieselPrice = 1.73,
  nationalEssencePrice = 1.82,
  nationalE85Price = 0.85,
}) => {
  const [search, setSearch] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>(selectedFuelType);

  useEffect(() => {
    setFuelType(selectedFuelType);
  }, [selectedFuelType]);

  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return DEPARTMENTS;
    const q = search.trim().toLowerCase();
    return DEPARTMENTS.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q)
    );
  }, [search]);

  const handleFuelTypeChange = (newType: FuelType) => {
    setFuelType(newType);
    if (onChangeFuelType) {
      onChangeFuelType(newType);
    }
  };

  const getDisplayedPrice = (deptData?: DepartmentFuelPrices): number | undefined => {
    if (!deptData) return undefined;
    if (fuelType === 'diesel') return deptData.dieselPrice;
    if (fuelType === 'essence') return deptData.essencePrice;
    if (fuelType === 'e85') return deptData.e85Price;
    return deptData.fuelPrice;
  };

  const getDisplayedNationalPrice = (): number => {
    if (fuelType === 'diesel') return nationalDieselPrice;
    if (fuelType === 'essence') return nationalEssencePrice;
    if (fuelType === 'e85') return nationalE85Price;
    return nationalFuelPrice;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative text-left overflow-hidden"
        >
          {/* Header de la modale */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Localiser le prix du carburant
                </h2>
                <p className="text-xs text-neutral-400">
                  Sélectionnez votre département et votre type de carburant
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filtre type de carburant (Gazole, SP95, E85, Tous) */}
          <div className="px-3 sm:px-4 py-3 border-b border-neutral-800 bg-neutral-950/70 shrink-0">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span>Quel carburant utilisez-vous ?</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'all', label: 'Tous (Moyenne)' },
                  { id: 'diesel', label: 'Gazole / Diesel' },
                  { id: 'essence', label: 'SP95 / E10' },
                  { id: 'e85', label: 'E85' },
                ] as const
              ).map((f) => {
                const isActive = fuelType === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFuelTypeChange(f.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate text-center ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recherche rapide du département */}
          <div className="p-3 sm:p-4 border-b border-neutral-800 shrink-0 bg-neutral-950/40">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                autoFocus
                placeholder="Numéro ou nom du département (ex: 33, Gironde, Paris...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Liste déroulante des départements */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-neutral-800/50 space-y-1">
            {/* Option Moyenne Nationale */}
            {!search.trim() && (
              <button
                onClick={() => {
                  onSelectDepartment(null, fuelType);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                  !selectedDepartmentCode
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                    FR
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      Moyenne nationale France
                      {!selectedDepartmentCode && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {FUEL_LABELS[fuelType]} • Toutes régions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {getDisplayedNationalPrice().toFixed(2)} €/L
                  </span>
                  {!selectedDepartmentCode && <Check className="w-4 h-4 text-amber-400" />}
                </div>
              </button>
            )}

            {filteredDepartments.map((dept) => {
              const isSelected = selectedDepartmentCode === dept.code;
              const deptData = departmentPricesMap?.[dept.code];
              const price = getDisplayedPrice(deptData);

              return (
                <button
                  key={dept.code}
                  onClick={() => {
                    onSelectDepartment(dept.code, fuelType);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center font-mono font-bold text-xs text-neutral-200 shrink-0">
                      {dept.code}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate flex items-center gap-2">
                        {dept.name}
                        {isSelected && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 truncate">{dept.region}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right ml-2">
                    {price ? (
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {price.toFixed(2)} €/L
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500 italic">OpenData</span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                </button>
              );
            })}

            {filteredDepartments.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-sm">
                Aucun département trouvé pour « {search} »
              </div>
            )}
          </div>

          {/* Footer d'information */}
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              Source : Ministère de l'Économie (OpenData gouv.fr)
            </span>
            <span className="text-neutral-500">Flux instantané officiel</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
