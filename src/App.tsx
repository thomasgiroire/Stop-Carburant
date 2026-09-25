import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Step1Hook } from './components/Step1Hook';
import { Step2Combined } from './components/Step2Combined';
import { Step4Revelation } from './components/Step4Revelation';
import { AntiBiasFAQ } from './components/AntiBiasFAQ';
import { HousingType, ActiveSimulationContext } from './types';
import { Code2 } from 'lucide-react';
import {
  EnergyPrices,
  DEFAULT_PRICES,
  FuelType,
  fetchLiveEnergyPrices,
  getPricesForDepartment,
  resetPricesToNational,
} from './services/energyPrices';
import {
  detectUserDepartmentFromIP,
  saveUserDepartmentCode,
  getSavedDepartmentCode,
  getSavedFuelType,
  saveUserFuelType,
} from './services/geoService';
import { DepartmentSelectorModal } from './components/DepartmentSelectorModal';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fuelBudget, setFuelBudget] = useState<number>(200);
  const [housing, setHousing] = useState<HousingType>('maison');
  const [dailyKm, setDailyKm] = useState<number>(45);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState<string | null>(getSavedDepartmentCode());
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>(getSavedFuelType());
  const [activeContext, setActiveContext] = useState<ActiveSimulationContext>({});
  const [isFaqVisible, setIsFaqVisible] = useState<boolean>(false);
  const [prices, setPrices] = useState<EnergyPrices>(DEFAULT_PRICES);

  // Récupération dynamique et silencieuse de la localisation IP et des prix en direct
  useEffect(() => {
    let isMounted = true;

    async function initLocationAndPrices() {
      const initialFuel = getSavedFuelType();
      setSelectedFuelType(initialFuel);

      let initialDept = getSavedDepartmentCode();
      if (!initialDept) {
        initialDept = await detectUserDepartmentFromIP();
      }

      if (isMounted && initialDept) {
        setSelectedDepartmentCode(initialDept);
      }

      const livePrices = await fetchLiveEnergyPrices(initialDept || undefined, initialFuel);
      if (isMounted && livePrices) {
        setPrices(livePrices);
      }
    }

    initLocationAndPrices();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectDepartment = (deptCode: string | null, fuelType?: FuelType) => {
    const effectiveFuel = fuelType ?? selectedFuelType;
    setSelectedDepartmentCode(deptCode);
    if (fuelType) {
      setSelectedFuelType(fuelType);
      saveUserFuelType(fuelType);
    }

    if (deptCode) {
      saveUserDepartmentCode(deptCode);
      setPrices((prev) => getPricesForDepartment(prev, deptCode, effectiveFuel));
    } else {
      saveUserDepartmentCode('');
      setPrices((prev) => resetPricesToNational(prev, effectiveFuel));
    }
  };

  const handleChangeFuelType = (newFuelType: FuelType) => {
    setSelectedFuelType(newFuelType);
    saveUserFuelType(newFuelType);
    setPrices((prev) => {
      if (selectedDepartmentCode) {
        return getPricesForDepartment(prev, selectedDepartmentCode, newFuelType);
      }
      return resetPricesToNational(prev, newFuelType);
    });
  };

  const handleSelectBudget = (amount: number) => {
    setFuelBudget(amount);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsFaqVisible(false);
    setActiveContext({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFaq = () => {
    setIsFaqVisible((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          const faqElement = document.getElementById('faq-preuves');
          if (faqElement) {
            faqElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
      return next;
    });
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100 flex flex-col relative overflow-x-hidden">
      {/* Halos lumineux d'ambiance pour l'identité "La Faille Carburant" */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[350px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full" />

      {/* Header épuré avec 3 étapes */}
      <Header
        currentStep={currentStep}
        totalSteps={3}
        onReset={handleReset}
        prices={prices}
        onOpenDepartmentSelector={() => setIsDeptModalOpen(true)}
      />

      {/* Parcours percutant en 3 clics - Mobile first sans vides inutiles */}
      <main className="flex-1 flex flex-col justify-start sm:justify-center relative px-3 sm:px-4 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {/* Étape 1 : Budget carburant & Kilomètres par jour */}
          {currentStep === 1 && (
            <Step1Hook
              key="step-1"
              fuelBudget={fuelBudget}
              dailyKm={dailyKm}
              onSelectBudget={handleSelectBudget}
              onChangeDailyKm={setDailyKm}
              onNext={() => {
                setCurrentStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* Étape 2 : Où dort la voiture */}
          {currentStep === 2 && (
            <Step2Combined
              key="step-2"
              fuelBudget={fuelBudget}
              housing={housing}
              onChangeHousing={setHousing}
              onNext={() => {
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBack={() => {
                setCurrentStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* Étape 3 : Révélation (Actuellement vous dépensez XX -> Voiture Électrique d'occasion) */}
          {currentStep === 3 && (
            <div key="step-3">
              <Step4Revelation
                fuelBudget={fuelBudget}
                housing={housing}
                dailyKm={dailyKm}
                prices={prices}
                isFaqVisible={isFaqVisible}
                onToggleFaq={handleToggleFaq}
                onActiveContextChange={setActiveContext}
                onModifyParams={() => {
                  setCurrentStep(1);
                  setIsFaqVisible(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* FAQ Dévoilée au clic */}
              <AnimatePresence>
                {isFaqVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AntiBiasFAQ />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Modale de sélection / changement de département pour localisation du carburant */}
      <DepartmentSelectorModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        selectedDepartmentCode={selectedDepartmentCode || undefined}
        selectedFuelType={selectedFuelType}
        onSelectDepartment={handleSelectDepartment}
        onChangeFuelType={handleChangeFuelType}
        departmentPricesMap={prices.departmentPricesMap}
        nationalFuelPrice={prices.nationalFuelPrice ?? prices.fuelPrice}
        nationalDieselPrice={prices.nationalDieselPrice}
        nationalEssencePrice={prices.nationalEssencePrice}
        nationalE85Price={prices.nationalE85Price}
      />

      {/* Footer minimaliste */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 px-4 text-center text-xs text-neutral-400">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Stop Carburant — Zéro bla-bla • StopCarburant.fr</span>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://github.com/thomasgiroire/Stop-Carburant"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-200 transition-colors flex items-center gap-1 text-neutral-400 underline decoration-dotted focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
              title="Code source ouvert, algorithmes et calculs vérifiables sur GitHub (ouvre un nouvel onglet)"
              aria-label="Méthodologie & Code Open Source sur GitHub (ouvre un nouvel onglet)"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Méthodologie & Code Open Source</span>
            </a>
            <button
              onClick={handleReset}
              className="hover:text-amber-400 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-1.5 py-0.5"
            >
              Recommencer
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
