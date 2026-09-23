import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Fuel,
  Calculator,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Check,
  Wrench,
  Flame,
  TrendingDown,
  Landmark,
  Tag,
  Database,
  Car,
  Info
} from 'lucide-react';
import { HousingType, ElecTarifMode, ActiveSimulationContext } from '../types';
import { calculateSimulation, formatCurrency, formatNumber, SMIC_NET_MENSUEL, getSurplusEquivalent } from '../utils/calculator';
import { getTieredEVRecommendations, getDailyUsageAdvice, getVehicleRealConso, EVTier, UsedEVRecommendation } from '../utils/evRecommendations';
import { EnergyPrices, DEFAULT_PRICES } from '../services/energyPrices';
import { LoanRateMode, calculateEVFinancing, calculateBreakEvenDownPayment } from '../utils/loanCalculations';
import {
  ChargingEquipmentType,
  CHARGING_EQUIPMENT_OPTIONS,
  getRecommendedChargingEquipment,
} from '../utils/chargingCalculations';
import { EVDatabaseService, OpenDataEVModel } from '../services/evDatabaseService';
import { getVehicleCorrectionBadge } from '../utils/consumptionCorrection';
import { EVModelSelectorModal } from './EVModelSelectorModal';
import { VictoryCelebration } from './VictoryCelebration';
import { motion, AnimatePresence } from 'motion/react';

interface Step4RevelationProps {
  fuelBudget: number;
  housing: HousingType;
  dailyKm: number;
  prices?: EnergyPrices;
  isFaqVisible?: boolean;
  onToggleFaq?: () => void;
  onScrollToFaq?: () => void;
  onModifyParams: () => void;
  onActiveContextChange?: (context: ActiveSimulationContext) => void;
}

export const Step4Revelation: React.FC<Step4RevelationProps> = ({
  fuelBudget,
  housing,
  dailyKm,
  prices = DEFAULT_PRICES,
  isFaqVisible = false,
  onToggleFaq,
  onScrollToFaq,
  onModifyParams,
  onActiveContextChange,
}) => {
  const [isTransformed, setIsTransformed] = useState<boolean>(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);
  const [tier, setTier] = useState<EVTier>('recommended');
  const [loanMode, setLoanMode] = useState<LoanRateMode>('eco_1pct');
  const [downPayment, setDownPayment] = useState<number>(0);
  const [userForcedTarif, setUserForcedTarif] = useState<ElecTarifMode | null>(null);
  const [customSelectedEV, setCustomSelectedEV] = useState<UsedEVRecommendation | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState<boolean>(false);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<ChargingEquipmentType | null>(null);
  const [userEquipmentChoice, setUserEquipmentChoice] = useState<boolean | null>(null);
  const [isMaintenanceDetailOpen, setIsMaintenanceDetailOpen] = useState<boolean>(false);

  // 1. Déterminer les véhicules recommandés selon le budget carburant libéré
  const baseSimHP = calculateSimulation(fuelBudget, housing, dailyKm, prices, 'HP');
  const baseSimHC = calculateSimulation(fuelBudget, housing, dailyKm, prices, 'HC');
  const availableBudgetForCars = Math.max(baseSimHP.carLeaseBudget, baseSimHC.carLeaseBudget);
  const tieredEVs = getTieredEVRecommendations(dailyKm, availableBudgetForCars, housing, loanMode);
  const currentEV = customSelectedEV || tieredEVs[tier];

  const handleSelectOpenDataModel = (car: OpenDataEVModel) => {
    const carClampedDownPayment = Math.min(downPayment, car.estimatedMarketPrice);
    const monthly = calculateEVFinancing(car.estimatedMarketPrice, loanMode, 60, carClampedDownPayment).monthly;
    const surplus = availableBudgetForCars - monthly;
    const isProfitable = surplus > 0;

    const rec: UsedEVRecommendation = {
      model: car.fullName,
      yearRange: car.yearRange,
      bodyType: car.bodyType,
      realRangeKm: car.realRangeKm,
      nominalRealRangeKm: car.nominalRealRangeKm,
      nominalHighwayRangeKm: car.nominalHighwayRangeKm,
      estimatedSoHPct: car.estimatedSoHPct,
      usableBatteryKwh: car.usableBatteryKwh,
      realConsoKwh100: car.realConsoKwh100,
      wltpRangeKm: car.wltpRangeKm,
      highwayRangeKm: car.highwayRangeKm,
      highwayConsoKwh100: car.highwayConsoKwh100,
      rangeDiscountPct: car.rangeDiscountPct,
      hasDirectIRLTest: car.hasDirectIRLTest,
      correctionBadge: getVehicleCorrectionBadge(car),
      monthlyFinancing5Years: monthly,
      estimatedMarketPrice: car.estimatedMarketPrice,
      leboncoinSampleText: car.leboncoinSampleText,
      strategyBadge: isProfitable
        ? `Modèle personnalisé • 100% autofinancé (+${Math.round(surplus)} €/m)`
        : `Modèle personnalisé (${car.realRangeKm} km • ~${monthly} €/m)`,
      description: car.description,
      chargeTimeNote: car.chargeTimeNote,
      dailyAdvice: getDailyUsageAdvice(dailyKm, car.realRangeKm, housing, car.fullName),
    };
    setCustomSelectedEV(rec);
  };

  // 2. Utiliser la consommation électrique RÉELLE du véhicule (mesure La Chaîne EV)
  const vehicleRealConso = currentEV.realConsoKwh100 ?? getVehicleRealConso(currentEV.model);

  // Recalculer les coûts énergétiques réels à domicile (HP et HC) avec la vraie conso de la voiture
  const simHP = calculateSimulation(fuelBudget, housing, dailyKm, prices, 'HP', vehicleRealConso);
  const simHC = calculateSimulation(fuelBudget, housing, dailyKm, prices, 'HC', vehicleRealConso);
  // Équipement de recharge recommandé et simulation physique avec pertes AC réalistes
  const chargingRec = useMemo(() => {
    return getRecommendedChargingEquipment(
      dailyKm,
      currentEV.realRangeKm,
      vehicleRealConso,
      housing
    );
  }, [dailyKm, currentEV.realRangeKm, vehicleRealConso, housing]);

  const activeEquipmentType: ChargingEquipmentType = selectedEquipmentType ?? chargingRec.recommendedType;
  const activeEquipment = CHARGING_EQUIPMENT_OPTIONS[activeEquipmentType];
  const activeSimulation = chargingRec.simulations[activeEquipmentType];

  const dailyAdvice = useMemo(() => {
    return getDailyUsageAdvice(
      dailyKm,
      currentEV.realRangeKm,
      housing,
      currentEV.model,
      activeEquipmentType
    );
  }, [dailyKm, currentEV.realRangeKm, housing, currentEV.model, activeEquipmentType]);

  // Prix d'achat de référence issu du catalogue officiel pour tous les calculs de financement
  const effectiveMarketPrice = currentEV.estimatedMarketPrice;
  const financingWithoutEquip = calculateEVFinancing(effectiveMarketPrice, loanMode, 60, Math.min(downPayment, effectiveMarketPrice), 0);

  // Estimation du surcoût de l'équipement dans le prêt
  const sampleEquipFinancing = calculateEVFinancing(effectiveMarketPrice, loanMode, 60, Math.min(downPayment, effectiveMarketPrice), activeEquipment.netCost);
  const estimatedEquipMonthly = Math.max(0, sampleEquipFinancing.monthly - financingWithoutEquip.monthly);

  // "Si le budget le permet" : vérifier si le budget disponible absorbe la mensualité totale sans effort d'épargne
  const maxAvailableBudget = Math.max(simHP.carLeaseBudget, simHC.carLeaseBudget);
  const budgetAllowsEquipment = (maxAvailableBudget - financingWithoutEquip.monthly) >= estimatedEquipMonthly;

  // L'utilisateur peut forcer l'inclusion ou l'exclusion, sinon règle automatique "si le budget le permet"
  const isEquipmentIncludedInLoan = userEquipmentChoice !== null ? userEquipmentChoice : budgetAllowsEquipment;

  // Montant net de l'équipement à financer dans le prêt (si maison et activé)
  const equipmentNetCostToFinance = (housing === 'maison' && isEquipmentIncludedInLoan) ? activeEquipment.netCost : 0;

  const totalAmountToFinance = effectiveMarketPrice + equipmentNetCostToFinance;
  const clampedDownPayment = Math.min(downPayment, totalAmountToFinance);
  const financing = calculateEVFinancing(effectiveMarketPrice, loanMode, 60, clampedDownPayment, equipmentNetCostToFinance);
  const equipmentMonthly = Math.max(0, financing.monthly - financingWithoutEquip.monthly);
  const financingStandard = calculateEVFinancing(effectiveMarketPrice, 'standard_4_9pct', 60, clampedDownPayment, equipmentNetCostToFinance);
  const recommendedMarketPrice = tieredEVs.recommended.estimatedMarketPrice;
  const recommendedFinancing = calculateEVFinancing(recommendedMarketPrice, loanMode, 60, Math.min(downPayment, recommendedMarketPrice));
  const economyMarketPrice = tieredEVs.economy ? tieredEVs.economy.estimatedMarketPrice : 0;
  const economyFinancing = tieredEVs.economy
    ? calculateEVFinancing(economyMarketPrice, loanMode, 60, Math.min(downPayment, economyMarketPrice))
    : null;

  const carMonthly = financing.monthly;
  const totalCreditCost = financing.totalCost;
  const totalCreditInterest = financing.totalInterest;

  // 2. Tester la rentabilité avec le tarif Heures Pleines (HP) :
  const availableBudgetHP = simHP.carLeaseBudget;
  const remainingGapHP = Math.max(0, carMonthly - availableBudgetHP);
  const surplusCashHP = Math.max(0, availableBudgetHP - carMonthly);
  const isProfitableHP = remainingGapHP <= 0 && surplusCashHP > 0;

  // 3. Calcul avec le tarif Heures Creuses (HC) :
  const availableBudgetHC = simHC.carLeaseBudget;
  const remainingGapHC = Math.max(0, carMonthly - availableBudgetHC);
  const surplusCashHC = Math.max(0, availableBudgetHC - carMonthly);

  // Règle :
  // "test la rentabilité avec le tarif heure pleine , si c'est déjà rentable on affiche le résultat en heure pleine
  // sinon, on utilise la tarif heures creuse"
  // (L'utilisateur peut aussi forcer manuellement son choix via le toggle)
  const autoTarif: ElecTarifMode = isProfitableHP ? 'HP' : 'HC';
  const activeTarif: ElecTarifMode = userForcedTarif ?? autoTarif;

  // Simulation et budget actifs selon le tarif retenu
  const sim = activeTarif === 'HC' ? simHC : simHP;
  const availableBudget = activeTarif === 'HC' ? availableBudgetHC : availableBudgetHP;
  const remainingGap = Math.max(0, carMonthly - availableBudget);
  const surplusCash = Math.max(0, availableBudget - carMonthly);
  const isFullyCovered = remainingGap <= 0;

  // Apport nécessaire (reprise véhicule) pour annuler le reste à charge
  const breakEvenDownPayment = useMemo(() => {
    if (availableBudget <= 0) return 0;
    return calculateBreakEvenDownPayment(effectiveMarketPrice, availableBudget, loanMode, 60, 100, equipmentNetCostToFinance);
  }, [availableBudget, effectiveMarketPrice, loanMode, equipmentNetCostToFinance]);

  // Synchronisation du contexte actif vers App (modale & footer)
  useEffect(() => {
    onActiveContextChange?.({
      vehicleModel: currentEV.model,
      consoElec: vehicleRealConso,
      activeTarif,
      loanMode,
      downPayment: clampedDownPayment,
    });
  }, [currentEV.model, vehicleRealConso, activeTarif, loanMode, clampedDownPayment, onActiveContextChange]);

  // Indique si le passage aux Heures Creuses est ce qui a éliminé le reste à charge
  const isProfitabilityUnlockedByHC = housing === 'maison' && !isProfitableHP && remainingGapHC <= 0;

  // Tranche d'économies potentielles d'entretien (pessimiste ~0,015 €/km vs optimiste ~0,035 €/km)
  const maintPessimiste = Math.max(15, Math.round((sim.monthlyKm * 0.015) / 5) * 5);
  const maintOptimiste = Math.max(35, Math.round((sim.monthlyKm * 0.035) / 5) * 5);

  // Perte cumulée sur 5 ans (60 mois) et équivalent en mois de salaire net par an (sur base SMIC net ~1 426 €/mois)
  const fiveYearsLoss = sim.fuelBudget * 60;
  const annualFuelSpend = sim.fuelBudget * 12;
  const smicPerYear = annualFuelSpend / SMIC_NET_MENSUEL;
  const smicDisplay = smicPerYear >= 1 ? smicPerYear.toFixed(1).replace('.', ',') : smicPerYear.toFixed(2).replace('.', ',');

  // Équivalent concret du quotidien ou en mois de salaire net par an du gain net direct récupéré (surplusCash)
  const surplusEquivalent = useMemo(() => getSurplusEquivalent(surplusCash), [surplusCash]);

  const creditMonths = 60;

  // Nom court des modèles pour affichage compact sur mobile vertical
  const recommendedShortModel = tieredEVs.recommended?.model.includes('Dacia')
    ? 'Dacia Spring'
    : tieredEVs.recommended?.model.includes('41 kWh')
      ? 'Zoé 41 kWh'
      : tieredEVs.recommended?.model.includes('52 kWh')
        ? 'Zoé 52 kWh'
        : tieredEVs.recommended?.model.includes('Zoé')
          ? 'Renault Zoé'
          : tieredEVs.recommended?.model.includes('Tesla')
            ? 'Tesla Model 3'
            : tieredEVs.recommended?.model.includes('MG4')
              ? 'MG4'
              : (tieredEVs.recommended?.model.split(' ')[0] || 'Modèle économique');

  const economyShortModel = tieredEVs.economy?.model.includes('Model Y')
    ? 'Tesla Model Y'
    : tieredEVs.economy?.model.includes('Tesla')
      ? 'Tesla Model 3'
      : tieredEVs.economy?.model.includes('MG4')
        ? 'MG4 Luxury'
        : tieredEVs.economy?.model.includes('Leaf')
          ? 'Nissan Leaf'
          : tieredEVs.economy?.model.includes('ë-C4') || tieredEVs.economy?.model.includes('e-C4')
            ? 'Citroën ë-C4'
            : tieredEVs.economy?.model.includes('Kona')
              ? 'Hyundai Kona'
              : tieredEVs.economy?.model.includes('2008')
                ? 'Peugeot e-2008'
                : tieredEVs.economy?.model.includes('208')
                  ? 'Peugeot e-208'
                  : tieredEVs.economy?.model.includes('52 kWh')
                    ? 'Zoé Intens 52 kWh'
                    : tieredEVs.economy?.model.includes('41 kWh')
                      ? 'Zoé 41 kWh'
                      : tieredEVs.economy?.model.includes('Dacia')
                        ? 'Dacia Spring'
                        : tieredEVs.economy?.model.includes('Zoé')
                          ? 'Renault Zoé'
                          : (tieredEVs.economy?.model.split(' ')[0] || 'Alternative confort');

  const isComfortMoreRange = (tieredEVs.economy?.realRangeKm ?? 0) > (tieredEVs.recommended?.realRangeKm ?? 0);
  const comfortTierLabel = isComfortMoreRange ? 'Option confort & plus grande autonomie' : 'Option confort (catégorie supérieure)';

  // Calcul du gain net direct pour l'option confort (face à la proposition économique)
  const economyMonthly = economyFinancing?.monthly ?? tieredEVs.economy?.monthlyFinancing5Years ?? 0;
  const comfortSurplusCash = Math.max(0, availableBudget - economyMonthly);
  const isComfortProfitable = comfortSurplusCash > 0;

  // Phrase d'action concrète d'achat du modèle recommandé (ex: "Achetez une Renault Zoé R90 maintenant !")
  const currentPurchaseAction = useMemo(() => {
    if (!currentEV?.model) return 'Achetez un véhicule électrique maintenant !';
    const cleanName = currentEV.model.replace(/\s*\([^)]*\)/g, '').trim();
    return `Achetez une ${cleanName} maintenant !`;
  }, [currentEV?.model]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-10"
    >
      {/* Carte centrale animée de transformation */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 mb-6 sm:mb-8 shadow-2xl relative overflow-hidden">
        <div className="relative min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!isTransformed ? (
              /* ÉTAT 1 : Provocateur sans être irrespectueux - Faire naître la colère */
              <motion.div
                key="before-transformation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.35 }}
                className="w-full text-center space-y-3.5 py-1"
              >
                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-b from-rose-950/40 via-neutral-950 to-neutral-950 border-2 border-rose-500/70 shadow-2xl shadow-rose-950/60 w-full max-w-lg mx-auto space-y-3">
                  <div className="text-[11px] sm:text-xs uppercase tracking-wider text-neutral-300 font-bold">
                    Rien que pour vos déplacements du quotidien, vous brûlez :
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
                    <div className="p-3 rounded-xl sm:rounded-2xl bg-rose-500/20 text-rose-400 shrink-0">
                      <Fuel className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-tight">
                        {smicDisplay} mois de salaire
                        <span className="text-sm sm:text-xl text-neutral-400 font-normal"> / an</span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-neutral-400 font-medium mt-0.5">
                        (avec un SMIC net à {formatCurrency(SMIC_NET_MENSUEL)})
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      <strong className="text-rose-400 font-black">{formatCurrency(fiveYearsLoss)}</strong> (sur 5 ans) qui enrichissent les compagnies pétrolières sur le dos de vos trajets quotidiens.
                    </p>
                  </div>
                </div>

                {/* Bouton manuel pour déclencher la révélation */}
                <div className="pt-1">
                  <button
                    onClick={() => setIsTransformed(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-rose-950/70 transition-all cursor-pointer group"
                  >
                    <span>Voir où devrait plutôt aller cet argent</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform shrink-0" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ÉTAT 2 : Phrase clickbait avec les éléments calculés + sous-phrase exemple d'occasion */
              <motion.div
                key="after-transformation"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45 }}
                className="w-full text-center space-y-3 sm:space-y-4"
              >
                {/* CADRE VERT : Focus direct sur l'argent gagné avec animation de victoire */}
                <div className={`relative overflow-hidden p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-b border-2 shadow-2xl w-full max-w-xl mx-auto text-center flex flex-col items-center justify-center transition-all ${surplusCash > 0 || isFullyCovered
                  ? 'from-emerald-950/60 via-neutral-950 to-neutral-950 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30'
                  : 'from-amber-950/50 to-neutral-950 border-amber-500 shadow-amber-950/50'
                  }`}>
                  {/* Animation de victoire (confettis, étincelles et onde lumineuse) */}
                  {(surplusCash > 0 || isFullyCovered) && <VictoryCelebration />}

                  {surplusCash > 0 ? (
                    <div className="py-2 sm:py-3 relative z-10 space-y-1 sm:space-y-1.5">
                      <motion.h2
                        initial={{ scale: 0.92, y: 8 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 180 }}
                        className="text-2xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-tight"
                      >
                        Récupérez{' '}
                        <span className="text-emerald-400 font-black inline-block drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                          {formatCurrency(surplusCash)}
                        </span>{' '}
                        chaque mois dans votre poche !
                      </motion.h2>
                      <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-medium">
                        {surplusEquivalent.prefix}{' '}
                        <strong className="text-white font-bold">{surplusEquivalent.highlight}</strong>
                        {surplusEquivalent.suffix}
                      </p>
                    </div>
                  ) : isFullyCovered ? (
                    <div className="py-2 sm:py-3 relative z-10 space-y-1 sm:space-y-1.5">
                      <motion.h2
                        initial={{ scale: 0.92, y: 8 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 180 }}
                        className="text-2xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-tight"
                      >
                        Roulez en électrique sans débourser{' '}
                        <span className="text-emerald-400 font-black">1 € de votre poche</span> !
                      </motion.h2>
                      <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-medium">
                        {smicPerYear >= 1 ? (
                          <>
                            Soit <strong className="text-white font-bold">{smicDisplay} mois de salaire par an</strong> qui financent 100% de votre voiture !
                          </>
                        ) : (
                          <>
                            Soit <strong className="text-white font-bold">100% de vos économies de carburant</strong> qui financent votre voiture !
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 sm:py-3 relative z-10 space-y-1 sm:space-y-1.5">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight leading-tight">
                        Plus que{' '}
                        <span className="text-amber-400 font-mono">+{formatCurrency(remainingGap)} / mois</span>{' '}
                        de votre poche !
                      </h2>
                      <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-medium">
                        {breakEvenDownPayment > 0 && breakEvenDownPayment < effectiveMarketPrice ? (
                          <>
                            Avec un apport de{' '}
                            <button
                              type="button"
                              onClick={() => setDownPayment(breakEvenDownPayment)}
                              className="text-amber-400 hover:text-amber-300 underline decoration-dotted font-bold cursor-pointer transition-colors"
                              title={`Simuler un apport de reprise de ${formatCurrency(breakEvenDownPayment)}`}
                            >
                              {formatCurrency(breakEvenDownPayment)} (reprise véhicule)
                            </button>
                            , vous vous mettez à l'abri des futures augmentations.
                          </>
                        ) : (
                          'Vos économies de carburant financent déjà la majorité de votre voiture électrique.'
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* EN DESSOUS : L'exemple concret de véhicule d'occasion */}
                <div className="w-full max-w-xl mx-auto p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left space-y-3 shadow-xl">
                  {/* Titre d'action concret demandé par l'utilisateur */}
                  <h3 className="text-base sm:text-lg md:text-xl font-black font-display text-white tracking-tight flex items-center gap-2">
                    <Car className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{currentPurchaseAction}</span>
                  </h3>

                  {/* Au quotidien : explication courte, directe et rassurante qui réutilise les données calculées */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-start gap-2.5 text-left">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-neutral-200 text-xs sm:text-sm leading-relaxed">
                      {dailyAdvice.text}
                    </p>
                  </div>

                  {/* Bouton pour basculer vers l'alternative confort ou revenir au modèle le plus économique */}
                  {customSelectedEV ? (
                    <div className="pt-2.5 border-t border-neutral-800">
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 text-[11px] sm:text-xs text-emerald-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">
                            Modèle sélectionné : <strong className="text-white">{currentEV.model}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomSelectedEV(null)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline decoration-dotted shrink-0 cursor-pointer"
                        >
                          Rétablir recommandations
                        </button>
                      </div>
                    </div>
                  ) : (
                    tieredEVs.economy && tieredEVs.economy.model !== tieredEVs.recommended.model && (
                      <div className="pt-2.5 border-t border-neutral-800">
                        {tier === 'recommended' ? (
                          <button
                            type="button"
                            id="btn-tier-economy"
                            onClick={() => setTier('economy')}
                            className="w-full py-2.5 px-3 rounded-xl border border-neutral-800 bg-neutral-950/80 hover:bg-neutral-900/90 hover:border-amber-500/50 text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 group"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 text-[11px] sm:text-xs text-neutral-300">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">
                                {comfortTierLabel} : <strong className="text-white group-hover:text-amber-300 transition-colors">{economyShortModel}</strong>{' '}
                                <span className="text-amber-400 font-bold font-display">({tieredEVs.economy.realRangeKm} km • ~{economyMonthly} €/m)</span>
                                {isComfortProfitable && (
                                  <span className="ml-1 text-emerald-400 font-bold font-mono">
                                    • +{formatCurrency(comfortSurplusCash)}/m net en poche !
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                              <span>Découvrir</span>
                              <span aria-hidden="true">→</span>
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            id="btn-tier-recommended"
                            onClick={() => setTier('recommended')}
                            className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-950/70 text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 group"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 text-[11px] sm:text-xs text-emerald-300">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">
                                {comfortTierLabel} ({economyShortModel} • {tieredEVs.economy.realRangeKm} km)
                              </span>
                            </div>
                            <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-emerald-300 shrink-0 flex items-center gap-1 underline decoration-dotted transition-colors">
                              <span aria-hidden="true">←</span>
                              <span>Retour à la proposition économique ({recommendedShortModel})</span>
                            </span>
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Accès aux détails des calculs et à la FAQ uniquement après la révélation du résultat */}
      <AnimatePresence>
        {isTransformed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Accès au détail des calculs */}
            <div>
              <button
                onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                className="w-full p-3 sm:p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-[11px] sm:text-xs text-neutral-300 font-bold uppercase tracking-wider cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Voir le détail des calculs financiers</span>
                </span>
                {showCalculationDetails ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </button>

              <AnimatePresence>
                {showCalculationDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-neutral-300 space-y-4 shadow-2xl"
                  >
                    {/* Bouton d'accès au Référentiel Open Data complet */}
                    <button
                      type="button"
                      id="btn-open-ev-catalog"
                      onClick={() => setIsModelSelectorOpen(true)}
                      className="w-full py-3 px-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group text-left"
                    >
                      <span className="font-semibold text-neutral-200">
                        Explorer le référentiel Open Data ({EVDatabaseService.getAllModels().length} véhicules certifiés)
                      </span>
                      <span className="text-amber-400 font-bold text-xs shrink-0 group-hover:translate-x-0.5 transition-transform">
                        Changer de modèle →
                      </span>
                    </button>

                    {/* Comparatif coût aux 100 km Thermique vs Électrique */}
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="text-xs font-bold text-white">
                        Coût aux 100 km ({dailyKm} km/jour • ~{sim.monthlyKm} km/mois) :
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                          <div className="text-xs font-bold text-rose-400">Thermique actuelle</div>
                          <div className="text-xl sm:text-2xl font-black font-display text-white">
                            {sim.userCostPer100Km.toFixed(2)} € <span className="text-xs text-neutral-400 font-normal">/ 100 km</span>
                          </div>
                          <div className="text-xs text-neutral-400">
                            ~{sim.userConsumptionLiters.toFixed(1)} L / 100 km
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                          <div className="text-xs font-bold text-emerald-400">Électrique ({currentEV.model.split(' ')[0]})</div>
                          <div className="text-xl sm:text-2xl font-black font-display text-emerald-400">
                            {sim.electricCostPer100Km.toFixed(2)} € <span className="text-xs text-neutral-400 font-normal">/ 100 km</span>
                          </div>
                          <div className="text-xs text-neutral-400">
                            {sim.consoElec} kWh / 100 km
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Décomposition financière mensuelle - Reçu épuré */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-left">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs sm:text-sm">
                        <span className="font-bold text-white">Décomposition financière mensuelle :</span>
                        <span className="font-mono text-amber-400 font-semibold text-xs">{currentEV.model}</span>
                      </div>

                      <div className="space-y-2.5 text-xs sm:text-sm py-1">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Votre budget carburant :</span>
                          <span className="font-mono font-bold text-amber-400">+{formatCurrency(sim.fuelBudget)} / mois</span>
                        </div>

                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Économies d'entretien (fourchette basse) :</span>
                          <span className="font-mono font-bold text-emerald-400">+{formatCurrency(sim.maintenanceSavings)} / mois</span>
                        </div>

                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Coût de recharge ({housing === 'maison' ? 'domicile' : 'bornes'}) :</span>
                          <span className="font-mono font-bold text-cyan-400">- {formatCurrency(sim.electricityCost)} / mois</span>
                        </div>

                        {housing === 'maison' && (
                          <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                            <button
                              type="button"
                              id="btn-tarif-hp"
                              onClick={() => setUserForcedTarif('HP')}
                              className={`py-2 px-3 rounded-xl text-center text-xs font-semibold cursor-pointer transition-all ${
                                activeTarif === 'HP'
                                  ? 'bg-neutral-800 text-white border border-neutral-600 font-bold'
                                  : 'bg-neutral-900/60 text-neutral-400 border border-neutral-800 hover:text-white'
                              }`}
                            >
                              Tarif fixe (~0,20 € : {formatCurrency(simHP.electricityCost)}/mois)
                            </button>
                            <button
                              type="button"
                              id="btn-tarif-hc"
                              onClick={() => setUserForcedTarif('HC')}
                              className={`py-2 px-3 rounded-xl text-center text-xs font-semibold cursor-pointer transition-all ${
                                activeTarif === 'HC'
                                  ? 'bg-neutral-800 text-cyan-300 border border-cyan-500/60 font-bold'
                                  : 'bg-neutral-900/60 text-neutral-400 border border-neutral-800 hover:text-white'
                              }`}
                            >
                              Heures Creuses (~0,16 € : {formatCurrency(simHC.electricityCost)}/mois)
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-neutral-300">
                          <span>Mensualité voiture ({currentEV.model.split(' ')[0]}) :</span>
                          <span className="font-mono font-bold text-white">- {formatCurrency(carMonthly)} / mois</span>
                        </div>
                      </div>

                      {/* Résultat net */}
                      <div className="pt-2 border-t border-neutral-800">
                        <div className="p-3.5 rounded-xl bg-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          {surplusCash > 0 ? (
                            <>
                              <span className="text-emerald-400 font-bold text-xs sm:text-sm">Reste net dans votre poche chaque mois :</span>
                              <span className="font-mono font-black text-emerald-400 text-base sm:text-lg">+{formatCurrency(surplusCash)} / mois</span>
                            </>
                          ) : isFullyCovered ? (
                            <>
                              <span className="text-emerald-400 font-bold text-xs sm:text-sm">Effort financier supplémentaire :</span>
                              <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">0 € / mois (100% financé)</span>
                            </>
                          ) : (
                            <>
                              <span className="text-amber-400 font-bold text-xs sm:text-sm">Effort d'épargne restant :</span>
                              <span className="font-mono font-black text-amber-400 text-sm sm:text-base">+{formatCurrency(remainingGap)} / mois</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-neutral-400 pt-1">
                        💡 Au bout de 5 ans, c'est <strong className="text-emerald-300 font-mono font-bold">+{formatCurrency(availableBudget)}</strong> chaque mois dans votre budget en plus.
                      </div>
                    </div>

                    {/* Bloc Financement & Crédit épuré */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5 text-left">
                      <div className="font-bold text-white pb-2 border-b border-neutral-800 text-xs sm:text-sm">
                        Financement d'occasion pour {currentEV.model.split('(')[0].trim()}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          id="btn-loan-eco"
                          onClick={() => setLoanMode('eco_1pct')}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            loanMode === 'eco_1pct'
                              ? 'bg-neutral-800 border-emerald-500 text-emerald-400 font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">Prêt Éco-Mobilité (1,00% TAEG)</div>
                        </button>

                        <button
                          type="button"
                          id="btn-loan-standard"
                          onClick={() => setLoanMode('standard_4_9pct')}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            loanMode === 'standard_4_9pct'
                              ? 'bg-neutral-800 border-neutral-500 text-white font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">Crédit auto standard (4,90% TAEG)</div>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs pt-1 text-neutral-300">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Véhicule & autonomie :</span>
                          <div className="text-right">
                            <span className="font-semibold text-white">{currentEV.model} ({currentEV.realRangeKm} km réels)</span>
                            {currentEV.correctionBadge && (
                              <div className="text-[10px] text-emerald-400/90 font-medium">
                                {currentEV.correctionBadge}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Prix d'occasion constaté :</span>
                          <span className="font-mono font-bold text-white">{formatCurrency(effectiveMarketPrice)}</span>
                        </div>

                        {equipmentNetCostToFinance > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400">Équipement de recharge ({activeEquipment.shortName}) :</span>
                            <span className="font-mono text-emerald-400 font-semibold">+{formatCurrency(equipmentNetCostToFinance)} net</span>
                          </div>
                        )}

                        {/* Apport perso */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
                          <label htmlFor="input-down-payment" className="text-neutral-300 font-medium cursor-pointer">
                            Apport perso (reprise véhicule actuel) :
                          </label>
                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <input
                              id="input-down-payment"
                              type="number"
                              min={0}
                              max={totalAmountToFinance}
                              step={500}
                              value={downPayment === 0 ? '' : downPayment}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                                setDownPayment(Math.min(val, totalAmountToFinance));
                              }}
                              placeholder="0"
                              className="w-24 py-1 px-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-right font-mono font-bold text-white text-xs outline-none"
                            />
                            <span className="text-neutral-400 text-xs">€</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pb-1">
                          {[1000, 2000, 3000].filter((p) => p < totalAmountToFinance).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setDownPayment(preset)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all ${
                                clampedDownPayment === preset
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                              }`}
                            >
                              {preset >= 1000 ? `${preset / 1000}k€` : `${preset}€`}
                            </button>
                          ))}
                          {downPayment > 0 && (
                            <button
                              type="button"
                              onClick={() => setDownPayment(0)}
                              className="px-2 py-0.5 rounded text-[11px] font-mono text-rose-400 hover:text-rose-300 bg-neutral-900 border border-neutral-800 cursor-pointer"
                              title="Remettre l'apport à 0 €"
                            >
                              0 €
                            </button>
                          )}
                        </div>

                        {clampedDownPayment > 0 && (
                          <div className="flex items-center justify-between text-neutral-400">
                            <span>Montant emprunté (après apport) :</span>
                            <span className="font-mono font-semibold text-neutral-200">
                              ~{formatCurrency(financing.capital)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">
                            {clampedDownPayment > 0 ? 'Mensualité avec apport (5 ans) :' : 'Mensualité sans apport (5 ans) :'}
                          </span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400 text-sm">~{carMonthly} € / mois</span>
                            {equipmentMonthly > 0 && (
                              <div className="text-[10px] text-neutral-400">
                                dont ~{equipmentMonthly} €/mois pour la recharge
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                          <span>Barème appliqué :</span>
                          <span className="text-neutral-200">
                            60 mois • {formatCurrency(clampedDownPayment)} apport • <strong className="text-emerald-400">{financing.taegDisplay}</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-neutral-400 text-[11px] pt-1.5 border-t border-neutral-800">
                          <span>Total remboursé sur 5 ans :</span>
                          <span className="font-mono text-neutral-300">
                            {formatCurrency(totalCreditCost)} <span className="text-neutral-500">(dont ~{formatCurrency(totalCreditInterest)} d'intérêts)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloc Équipement de recharge */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5 text-left">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white">Équipement de recharge</span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                          {activeEquipment.badge}
                        </span>
                      </div>

                      {housing === 'maison' ? (
                        <>
                          {/* Sélecteur des 3 solutions de recharge */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {(['standard_plug', 'reinforced_plug', 'wallbox_7kw'] as ChargingEquipmentType[]).map((type) => {
                              const opt = CHARGING_EQUIPMENT_OPTIONS[type];
                              const isSelected = activeEquipmentType === type;
                              const isRec = chargingRec.recommendedType === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setSelectedEquipmentType(type)}
                                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                                    isSelected
                                      ? 'bg-neutral-800 border-emerald-500 text-white shadow-lg'
                                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                                  }`}
                                >
                                  {isRec && (
                                    <span className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black shadow">
                                      Conseillé
                                    </span>
                                  )}
                                  <div className="text-xs font-bold text-white leading-tight">
                                    {opt.shortName}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                                    {opt.powerKw} kW • {opt.netCost === 0 ? '0 €' : `~${formatCurrency(opt.netCost)}`}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Diagnostic Vendredi soir & Rendement physique */}
                          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            activeSimulation.isComfortSufficient
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                              : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                          }`}>
                            <div className="flex items-center justify-between font-semibold">
                              <span>État de la batterie le vendredi soir :</span>
                              <span className="font-mono font-bold text-sm">
                                ~{activeSimulation.fridayEveningPct}% ({activeSimulation.fridayEveningKm} km)
                              </span>
                            </div>
                            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-300">
                              <span>Récupération nocturne (8h) :</span>
                              <span className="font-mono font-semibold">
                                ~{activeSimulation.nightlyRecoveredKm} km / nuit <span className="text-neutral-400 font-normal">(rendement {Math.round(activeEquipment.efficiency * 100)}% avec pertes AC déduites)</span>
                              </span>
                            </div>
                          </div>

                          {/* Détail financier matériel + pose & Crédit d'impôt */}
                          <div className="space-y-1.5 text-xs text-neutral-300 pt-0.5">
                            {activeEquipment.grossCost > 0 ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-400">Matériel & pose (fourchette haute) :</span>
                                  <span className="font-mono text-neutral-200">{formatCurrency(activeEquipment.grossCost)}</span>
                                </div>
                                {activeEquipment.taxCredit > 0 && (
                                  <div className="flex items-center justify-between text-emerald-400">
                                    <span>Crédit d'impôt officiel déduit :</span>
                                    <span className="font-mono font-bold">- {formatCurrency(activeEquipment.taxCredit)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between font-semibold text-white">
                                  <span>Reste à charge net :</span>
                                  <span className="font-mono text-emerald-400 font-bold">{formatCurrency(activeEquipment.netCost)}</span>
                                </div>

                                {/* Option d'intégration au prêt */}
                                <div className="pt-2">
                                  <label
                                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2 cursor-pointer hover:border-neutral-700 transition-all text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isEquipmentIncludedInLoan}
                                        onChange={(e) => setUserEquipmentChoice(e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer bg-neutral-800 border-neutral-700"
                                      />
                                      <span className="text-neutral-200 font-medium">
                                        Intégrer l'équipement au prêt du véhicule
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-400 shrink-0">
                                      +{equipmentMonthly} € / mois
                                    </span>
                                  </label>
                                  <div className="text-[11px] text-neutral-400 pt-1 pl-1">
                                    Permet d'étaler l'installation sur 60 mois sans sortir d'épargne.
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between text-neutral-400 text-xs">
                                <span>Coût d'installation :</span>
                                <span className="font-mono font-semibold text-emerald-400">0 € (prise standard existante)</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Cas Appartement */
                        <div className="space-y-2 text-xs text-neutral-300">
                          <p className="text-neutral-400 leading-relaxed">
                            En appartement, aucune installation n'est obligatoire : vous profitez des 150 000+ bornes publiques et des recharges pendant vos courses.
                          </p>
                          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1 text-[11px]">
                            <div className="font-semibold text-white">💡 Bon à savoir : Le Droit à la prise en copropriété</div>
                            <div className="text-neutral-400">
                              Si vous avez une place attitrée, la loi vous garantit d'installer une borne avec <strong>50% d'aide ADVENIR</strong> et <strong>500 € de crédit d'impôt</strong>.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Économies d'entretien */}
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs text-neutral-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">Économies d'entretien intégrées au calcul :</span>
                          <button
                            type="button"
                            onClick={() => setIsMaintenanceDetailOpen(!isMaintenanceDetailOpen)}
                            className="text-neutral-400 hover:text-emerald-400 p-0.5 rounded cursor-pointer transition-colors"
                            title="Comprendre le calcul des économies d'entretien"
                          >
                            <Info className="w-3.5 h-3.5 text-neutral-400 hover:text-emerald-400" />
                          </button>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">+{sim.maintenanceSavings} € / mois</span>
                      </div>

                      {/* Accordéon explicatif interactif */}
                      <AnimatePresence>
                        {isMaintenanceDetailOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-2 overflow-hidden"
                          >
                            <p className="leading-relaxed">
                              <strong className="text-neutral-200">Base du calcul :</strong> Barème conservateur fourchette basse de <strong className="text-emerald-400">0,015 € / km</strong> (~1,50 € / 100 km) issu des rapports de l'ADEME et des données des loueurs longue durée.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-neutral-300">
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400">✓</span> 0 vidange moteur, 0 huile, 0 filtres
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400">✓</span> 0 courroie de distribution ni bougies
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400">✓</span> 0 boîte de vitesses complexe ni embrayage
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400">✓</span> Usure des freins divisée par 3 (régénération)
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA final : TROP BEAU POUR ÊTRE VRAI ? VOYEZ CE QUE LES PÉTROLIERS VOUS CACHENT */}
            <div className="flex justify-center pt-1">
              <button
                id="btn-scroll-proofs"
                onClick={onToggleFaq || onScrollToFaq}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3.5 sm:py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-display font-bold text-xs sm:text-sm tracking-wide rounded-xl border border-neutral-700 hover:border-amber-500/50 transition-all cursor-pointer shadow-xl uppercase group"
              >
                <span>
                  {isFaqVisible
                    ? 'Masquer les preuves et vérités chiffrées'
                    : 'Trop beau pour être vrai ? Voyez ce que les pétroliers vous cachent'}
                </span>
                {isFaqVisible ? (
                  <ChevronUp className="w-4 h-4 text-amber-400 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce group-hover:translate-y-0.5 transition-transform shrink-0" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale d'exploration et de sélection du Référentiel Open Data */}
      <EVModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        onSelectModel={handleSelectOpenDataModel}
        currentSelectedModelName={currentEV.model}
        userFuelBudget={fuelBudget}
        dailyKm={dailyKm}
        loanMode={loanMode}
      />
    </motion.div>
  );
};
