import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GameRoadCanvas, DeparturePhase } from './components/story/GameRoadCanvas';
import { GameDashboardHUD } from './components/story/GameDashboardHUD';
import { Step4Revelation } from './components/Step4Revelation';
import { AntiBiasFAQ } from './components/AntiBiasFAQ';
import { HousingType, StoryStage, ActiveSimulationContext } from './types';
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
  const [isTransformed, setIsTransformed] = useState<boolean>(false);
  const [isDeparting, setIsDeparting] = useState<boolean>(false);
  const [departurePhase, setDeparturePhase] = useState<DeparturePhase>('idle');
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
    setIsTransformed(false);
    setIsDeparting(false);
    setDeparturePhase('idle');
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

  const currentStage: StoryStage =
    currentStep === 1
      ? 'departure'
      : currentStep === 2
      ? 'commute'
      : currentStep === 3
      ? 'gas_station'
      : 'revelation';

  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (isTestEnv) {
        setIsDeparting(true);
        setIsTransformed(true);
        setTimeout(() => {
          setCurrentStep(4);
          setIsDeparting(false);
          setDeparturePhase('idle');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 120);
        return;
      }

      // Séquence cinématographique immersive :
      // 1. La voiture bleue reprend la route, se met au milieu, TOUJOURS en mode thermique bleu
      setIsDeparting(true);
      setDeparturePhase('merging');

      // 2. La station-essence disparaît vers le bas (dépassée par la voiture qui roule)
      setTimeout(() => {
        setDeparturePhase('station_leaving');
      }, 750);

      // 3. Une fois la station-essence disparue, la voiture se transforme en vert électrique
      setTimeout(() => {
        setDeparturePhase('transformed');
        setIsTransformed(true);
      }, 1500);

      // 4. La voiture transformée accélère à fond vers le haut
      setTimeout(() => {
        setDeparturePhase('zooming');
      }, 2350);

      // 5. Transition vers le haut et affichage du résultat final
      setTimeout(() => {
        setCurrentStep(4);
        setIsDeparting(false);
        setDeparturePhase('idle');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2950);
    }
  };

  return (
    <div
      className={`${
        currentStep <= 3 ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh] overflow-x-hidden'
      } bg-neutral-950 text-neutral-100 flex flex-col relative select-none`}
    >
      {/* Halos lumineux d'ambiance pour l'identité "La Faille Carburant" */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[350px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full" />

      {/* Header épuré avec 4 étapes narratives */}
      <Header
        currentStep={currentStep}
        totalSteps={4}
        onReset={handleReset}
        prices={prices}
        onOpenDepartmentSelector={() => setIsDeptModalOpen(true)}
        onNavigateStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* =================================================================== */}
      {/* MODE JEU VIDÉO MOBILE (100dvh sans scroll pour les étapes 1 à 3)    */}
      {/* =================================================================== */}
      {currentStep <= 3 ? (
        <main className="flex-1 relative w-full h-full overflow-hidden flex flex-col justify-between">
          {/* Scène de la route verticale en vue du dessus */}
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-neutral-950">
            <div className="w-full h-full max-w-xl mx-auto relative overflow-hidden">
              <GameRoadCanvas
                stage={currentStage}
                housing={housing}
                dailyKm={dailyKm}
                fuelBudget={fuelBudget}
                fuelPrice={prices.fuelPrice || 1.74}
                isTransformed={isTransformed}
                isDeparting={isDeparting}
                departurePhase={departurePhase}
                onSelectHousing={setHousing}
              />
            </div>
          </div>

          {/* Espace visuel supérieur pour voir la voiture rouler et les décors */}
          <div className="w-full flex-1 pointer-events-none" />

          {/* Tableau de bord interactif (HUD) incrusté au pouce */}
          <div className="relative z-20 px-3 pb-3 sm:pb-6 w-full max-w-xl mx-auto">
            <GameDashboardHUD
              stage={currentStage}
              housing={housing}
              dailyKm={dailyKm}
              fuelBudget={fuelBudget}
              onChangeHousing={setHousing}
              onChangeDailyKm={setDailyKm}
              onSelectBudget={handleSelectBudget}
              onNext={handleNextStep}
              onBack={() => {
                if (currentStep === 2) setCurrentStep(1);
                if (currentStep === 3) setCurrentStep(2);
              }}
            />
          </div>
        </main>
      ) : (
        /* =================================================================== */
        /* MODE RÉVÉLATION & HUB FINANCIER (Étape 4 avec scroll complet)       */
        /* =================================================================== */
        <motion.main
          key="revelation-stage-view"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex-1 flex flex-col justify-start relative px-3 sm:px-4 py-3 sm:py-6 max-w-4xl mx-auto w-full"
        >
          <Step4Revelation
            fuelBudget={fuelBudget}
            housing={housing}
            dailyKm={dailyKm}
            prices={prices}
            isFaqVisible={isFaqVisible}
            initialTransformed={true}
            onTransformChange={setIsTransformed}
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
        </motion.main>
      )}

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
