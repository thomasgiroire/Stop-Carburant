import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HousingType, StoryStage } from '../../types';

export type DeparturePhase = 'idle' | 'merging' | 'station_leaving' | 'transformed' | 'zooming';

interface GameRoadCanvasProps {
  stage: StoryStage;
  housing: HousingType;
  dailyKm: number;
  fuelBudget: number;
  fuelPrice: number;
  isTransformed: boolean;
  isDeparting?: boolean;
  departurePhase?: DeparturePhase;
  onSelectHousing?: (housing: HousingType) => void;
}

export const GameRoadCanvas: React.FC<GameRoadCanvasProps> = ({
  stage,
  housing,
  dailyKm,
  fuelBudget,
  fuelPrice,
  isTransformed,
  isDeparting = false,
  departurePhase = 'idle',
  onSelectHousing,
}) => {
  // Calcul de la position et de l'orientation de la voiture selon la phase de la séquence
  const activeCarPos = useMemo(() => {
    if (departurePhase === 'zooming') {
      // Phase 4 : Départ éclair vers le haut de l'écran
      return { x: 200, y: -280, rotate: 0 };
    }

    if (
      departurePhase === 'merging' ||
      departurePhase === 'station_leaving' ||
      departurePhase === 'transformed'
    ) {
      // Phases 1, 2, 3 : Voiture replacée bien au milieu de la route roulant droit devant
      return { x: 200, y: 250, rotate: 0 };
    }

    switch (stage) {
      case 'departure':
        // Au départ en bas de l'écran : orientée sur l'allée vers la route
        return housing === 'maison'
          ? { x: 88, y: 340, rotate: 34 }
          : { x: 312, y: 340, rotate: -34 };
      case 'commute':
        // En trajet travail, la voiture est centrée sur la voie, roulant à pleine allure vers le haut
        return { x: 200, y: 250, rotate: 0 };
      case 'gas_station':
        // Arrêtée sous l'auvent de la station-service devant la pompe
        return { x: 268, y: 232, rotate: 8 };
      case 'revelation':
        return { x: 200, y: -280, rotate: 0 };
      default:
        return { x: 200, y: 250, rotate: 0 };
    }
  }, [stage, housing, departurePhase]);

  // La route défile dès que la voiture roule (étape 2 ou phases de reprise de la route)
  const isCarMoving =
    stage === 'commute' ||
    departurePhase === 'merging' ||
    departurePhase === 'station_leaving' ||
    departurePhase === 'transformed' ||
    departurePhase === 'zooming';

  // Activation temporelle Retour vers le futur : les traces d'éclairs s'activent
  // lors de la phase 'transformed' et de l'accélération supersonique 'zooming' (88 mph)
  const isCarElectric =
    departurePhase === 'transformed' ||
    departurePhase === 'zooming' ||
    (isTransformed && departurePhase === 'idle');

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-neutral-950">
      <svg
        viewBox="0 0 400 580"
        className="w-full h-full object-cover block"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Animation du trajet narratif en voiture (vue du dessus)"
      >
        <defs>
          {/* Asphalte de la route bitumée */}
          <linearGradient id="roadAsphalt" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#121212" />
            <stop offset="5%" stopColor="#22201e" />
            <stop offset="95%" stopColor="#22201e" />
            <stop offset="100%" stopColor="#121212" />
          </linearGradient>

          {/* Gazon nocturne des bas-côtés */}
          <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#08140c" />
            <stop offset="100%" stopColor="#0c1f13" />
          </linearGradient>

          {/* Faisceau lumineux des phares actifs (halogène chaud -> xénon bleu intense temporel) */}
          <radialGradient id="headlightBeamActive" cx="50%" cy="100%" r="90%">
            <stop
              offset="0%"
              stopColor={isCarElectric ? 'rgba(56, 189, 248, 0.75)' : 'rgba(254, 240, 138, 0.55)'}
            />
            <stop
              offset="65%"
              stopColor={isCarElectric ? 'rgba(14, 165, 233, 0.25)' : 'rgba(253, 224, 71, 0.15)'}
            />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Dégradé acier inoxydable brossé pour la DeLorean */}
          <linearGradient id="deloreanBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="20%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Dégradé relief capot DeLorean */}
          <linearGradient id="deloreanHoodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Lueur électrique temporelle Retour vers le futur */}
          <filter id="lightningGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur1" />
            <feGaussianBlur stdDeviation="7" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Bas-côtés (Nature nocturne) */}
        <rect x="0" y="0" width="400" height="580" fill="url(#grassGrad)" />

        {/* Végétation bordant la route (animée lors du trajet pour sensation de vitesse vers le haut) */}
        <motion.g
          animate={isCarMoving ? { y: [0, 120] } : { y: 0 }}
          transition={
            isCarMoving
              ? {
                  repeat: Infinity,
                  duration: departurePhase === 'zooming' ? 0.3 : 0.6,
                  ease: 'linear',
                }
              : { duration: 0.3 }
          }
        >
          <circle cx="45" cy="40" r="16" fill="#051009" opacity="0.85" />
          <circle cx="50" cy="160" r="20" fill="#051009" opacity="0.85" />
          <circle cx="45" cy="480" r="22" fill="#051009" opacity="0.85" />

          <circle cx="355" cy="50" r="18" fill="#051009" opacity="0.85" />
          <circle cx="360" cy="480" r="20" fill="#051009" opacity="0.85" />
        </motion.g>

        {/* 2. Route bitumée centrale */}
        <rect x="110" y="0" width="180" height="580" fill="url(#roadAsphalt)" />

        {/* Lignes de rive blanches continues */}
        <line x1="112" y1="0" x2="112" y2="580" stroke="#78716c" strokeWidth="2.5" opacity="0.6" />
        <line x1="288" y1="0" x2="288" y2="580" stroke="#78716c" strokeWidth="2.5" opacity="0.6" />

        {/* Ligne médiane discontinue avec effet de défilement rapide vers le haut */}
        <motion.line
          x1="200"
          y1="-60"
          x2="200"
          y2="640"
          stroke="#f5f5f4"
          strokeWidth="3.5"
          strokeDasharray="28 24"
          strokeLinecap="round"
          opacity="0.8"
          initial={{ strokeDashoffset: 0 }}
          animate={{
            strokeDashoffset: isCarMoving ? [-52, 0] : [0, 0],
          }}
          transition={
            isCarMoving
              ? {
                  repeat: Infinity,
                  duration: departurePhase === 'zooming' ? 0.22 : 0.42,
                  ease: 'linear',
                }
              : { duration: 0.3 }
          }
        />

        {/* Traces de pneus brûlées résiduelles sur l'asphalte laissées lors de l'accélération temporelle (88 mph) */}
        <AnimatePresence>
          {departurePhase === 'zooming' && (
            <motion.g
              id="road-temporal-burn-tracks"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.95] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Trace pneu gauche sur l'asphalte */}
              <line x1="181" y1="260" x2="181" y2="480" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" opacity="0.6" filter="url(#lightningGlow)" />
              <line x1="181" y1="260" x2="181" y2="480" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <line x1="181" y1="260" x2="181" y2="480" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

              {/* Trace pneu droit sur l'asphalte */}
              <line x1="219" y1="260" x2="219" y2="480" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" opacity="0.6" filter="url(#lightningGlow)" />
              <line x1="219" y1="260" x2="219" y2="480" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <line x1="219" y1="260" x2="219" y2="480" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* ÉTAPE 1 : DÉCOR DE DÉPART EN BAS DE L'ÉCRAN                         */}
        {/* =================================================================== */}
        <AnimatePresence>
          {stage === 'departure' && (
            <motion.g
              id="decor-departure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.35 }}
            >
              {/* MAISON À GAUCHE EN BAS */}
              <g
                id="housing-option-maison"
                onClick={() => onSelectHousing?.('maison')}
                className="cursor-pointer group"
              >
                {/* Allée de garage pavée montant vers le haut pour rejoindre la route */}
                <path
                  d="M 45,375 L 112,305 L 112,335 L 45,405 Z"
                  fill="#262322"
                  stroke={housing === 'maison' ? '#f59e0b' : '#383432'}
                  strokeWidth={housing === 'maison' ? '1.5' : '0.8'}
                  className="transition-colors"
                />

                {/* Bâtiment de la Maison vue du dessus */}
                <rect
                  x="18"
                  y="340"
                  width="68"
                  height="70"
                  rx="4"
                  fill="#1e293b"
                  stroke={housing === 'maison' ? '#f59e0b' : '#334155'}
                  strokeWidth={housing === 'maison' ? '2.5' : '1.5'}
                  className="transition-all"
                />
                <polygon points="18,340 52,365 18,410" fill="#334155" opacity="0.6" />
                <polygon points="86,340 52,365 86,410" fill="#0f172a" opacity="0.6" />
                <line x1="52" y1="340" x2="52" y2="410" stroke="#475569" strokeWidth="2" />

                {/* Panneaux solaires sur le toit */}
                <rect
                  x="24"
                  y="350"
                  width="20"
                  height="16"
                  rx="1"
                  fill="#0284c7"
                  opacity="0.85"
                  stroke="#38bdf8"
                  strokeWidth="0.5"
                />

                {/* Badge de sélection Maison (au-dessus du toit) */}
                <circle
                  cx="52"
                  cy="324"
                  r="12"
                  fill={housing === 'maison' ? '#f59e0b' : '#1e293b'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="52"
                  y="328"
                  textAnchor="middle"
                  fill={housing === 'maison' ? '#000000' : '#94a3b8'}
                  fontSize="11"
                  fontWeight="bold"
                >
                  🏠
                </text>
                <text
                  x="52"
                  y="428"
                  textAnchor="middle"
                  fill={housing === 'maison' ? '#fbbf24' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="bold"
                >
                  Maison
                </text>
              </g>

              {/* IMMEUBLE À DROITE EN BAS */}
              <g
                id="housing-option-appartement"
                onClick={() => onSelectHousing?.('appartement')}
                className="cursor-pointer group"
              >
                {/* Parking montant vers le haut pour rejoindre la route */}
                <path
                  d="M 288,305 L 355,375 L 355,405 L 288,335 Z"
                  fill="#262322"
                  stroke={housing === 'appartement' ? '#38bdf8' : '#383432'}
                  strokeWidth={housing === 'appartement' ? '1.5' : '0.8'}
                  className="transition-colors"
                />

                {/* Immeuble moderne vue du dessus */}
                <rect
                  x="314"
                  y="332"
                  width="70"
                  height="82"
                  rx="4"
                  fill="#1e293b"
                  stroke={housing === 'appartement' ? '#38bdf8' : '#334155'}
                  strokeWidth={housing === 'appartement' ? '2.5' : '1.5'}
                  className="transition-all"
                />
                <rect
                  x="322"
                  y="340"
                  width="54"
                  height="66"
                  rx="2"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <rect x="328" y="348" width="14" height="12" rx="1" fill="#38bdf8" opacity="0.6" />
                <rect x="348" y="348" width="14" height="12" rx="1" fill="#fbbf24" opacity="0.6" />
                <rect
                  x="332"
                  y="372"
                  width="32"
                  height="22"
                  rx="1"
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="0.8"
                />

                {/* Badge de sélection Immeuble (au-dessus du toit) */}
                <circle
                  cx="349"
                  cy="316"
                  r="12"
                  fill={housing === 'appartement' ? '#38bdf8' : '#1e293b'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="349"
                  y="320"
                  textAnchor="middle"
                  fill={housing === 'appartement' ? '#000000' : '#94a3b8'}
                  fontSize="11"
                  fontWeight="bold"
                >
                  🏢
                </text>
                <text
                  x="349"
                  y="432"
                  textAnchor="middle"
                  fill={housing === 'appartement' ? '#38bdf8' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="bold"
                >
                  Immeuble
                </text>
              </g>

              {/* DEUXIÈME VOITURE GARÉE (Non-choisie, à l'arrêt, phares éteints) */}
              {housing === 'maison' ? (
                /* Voiture stationnée devant l'immeuble */
                <g
                  id="car-parked-appartement"
                  onClick={() => onSelectHousing?.('appartement')}
                  className="cursor-pointer"
                  opacity="0.5"
                  transform="translate(312, 340) rotate(-34)"
                >
                  <rect x="-19" y="-34" width="38" height="68" rx="3" fill="#000000" opacity="0.45" />
                  <rect x="-22" y="-27" width="5.5" height="13" rx="1.5" fill="#18181b" />
                  <rect x="16.5" y="-27" width="5.5" height="13" rx="1.5" fill="#18181b" />
                  <rect x="-22.5" y="12" width="6.5" height="15" rx="1.5" fill="#18181b" />
                  <rect x="16" y="12" width="6.5" height="15" rx="1.5" fill="#18181b" />
                  <path d="M -16,-33 L 16,-33 L 17.5,-12 L 18,31 L -18,31 L -17.5,-12 Z" fill="#64748b" stroke="#475569" strokeWidth="1" />
                  <rect x="-14" y="-29.5" width="28" height="17" rx="0.5" fill="#475569" />
                  <polygon points="-13,-12 13,-12 11,-1 -11,-1" fill="#0f172a" />
                  <rect x="-11" y="-1" width="22" height="12" fill="#64748b" />
                  <polygon points="-12,11.5 12,11.5 13.5,23.5 -13.5,23.5" fill="#0a0a0a" />
                  <line x1="-12" y1="16" x2="12" y2="16" stroke="#27272a" strokeWidth="1.2" />
                  <line x1="-12.5" y1="20" x2="12.5" y2="20" stroke="#27272a" strokeWidth="1.2" />
                  <circle cx="-10" cy="-32" r="1.5" fill="#64748b" />
                  <circle cx="10" cy="-32" r="1.5" fill="#64748b" />
                </g>
              ) : (
                /* Voiture stationnée devant la maison */
                <g
                  id="car-parked-maison"
                  onClick={() => onSelectHousing?.('maison')}
                  className="cursor-pointer"
                  opacity="0.5"
                  transform="translate(88, 340) rotate(34)"
                >
                  <rect x="-19" y="-34" width="38" height="68" rx="3" fill="#000000" opacity="0.45" />
                  <rect x="-22" y="-27" width="5.5" height="13" rx="1.5" fill="#18181b" />
                  <rect x="16.5" y="-27" width="5.5" height="13" rx="1.5" fill="#18181b" />
                  <rect x="-22.5" y="12" width="6.5" height="15" rx="1.5" fill="#18181b" />
                  <rect x="16" y="12" width="6.5" height="15" rx="1.5" fill="#18181b" />
                  <path d="M -16,-33 L 16,-33 L 17.5,-12 L 18,31 L -18,31 L -17.5,-12 Z" fill="#64748b" stroke="#475569" strokeWidth="1" />
                  <rect x="-14" y="-29.5" width="28" height="17" rx="0.5" fill="#475569" />
                  <polygon points="-13,-12 13,-12 11,-1 -11,-1" fill="#0f172a" />
                  <rect x="-11" y="-1" width="22" height="12" fill="#64748b" />
                  <polygon points="-12,11.5 12,11.5 13.5,23.5 -13.5,23.5" fill="#0a0a0a" />
                  <line x1="-12" y1="16" x2="12" y2="16" stroke="#27272a" strokeWidth="1.2" />
                  <line x1="-12.5" y1="20" x2="12.5" y2="20" stroke="#27272a" strokeWidth="1.2" />
                  <circle cx="-10" cy="-32" r="1.5" fill="#64748b" />
                  <circle cx="10" cy="-32" r="1.5" fill="#64748b" />
                </g>
              )}
            </motion.g>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* ÉTAPE 3 : DÉCOR DE LA STATION-SERVICE (Reste STRICTEMENT essence)   */}
        {/* Disparaît vers le bas une fois que la voiture reprend la route !    */}
        {/* =================================================================== */}
        <AnimatePresence>
          {stage === 'gas_station' &&
            departurePhase !== 'transformed' &&
            departurePhase !== 'zooming' && (
              <motion.g
                id="decor-gas-station"
                initial={{ opacity: 0, x: 50 }}
                animate={
                  departurePhase === 'station_leaving'
                    ? { y: 380, opacity: 0 }
                    : { y: 0, opacity: 1, x: 0 }
                }
                exit={{ opacity: 0, y: 380 }}
                transition={{
                  duration: departurePhase === 'station_leaving' ? 0.65 : 0.4,
                  ease: 'easeInOut',
                }}
              >
                {/* Entrée de station pavée menant depuis la route */}
                <path d="M288,192 L315,177 L385,177 L385,307 L288,307 Z" fill="#1e1c1b" opacity="0.9" />

                {/* Auvent de la station-service - Reste STRICTEMENT une station carburant */}
                <rect
                  x="292"
                  y="182"
                  width="95"
                  height="115"
                  rx="4"
                  fill="#1e1b4b"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                />

                {/* Enseigne Station Essence */}
                <rect
                  x="298"
                  y="188"
                  width="83"
                  height="18"
                  rx="2"
                  fill="#e11d48"
                />
                <text
                  x="340"
                  y="201"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="black"
                  letterSpacing="0.05em"
                >
                  ⛽ CARBURANT
                </text>

                {/* Îlot et Borne / Pompe à essence */}
                <rect
                  x="305"
                  y="222"
                  width="24"
                  height="45"
                  rx="3"
                  fill="#0f172a"
                  stroke="#64748b"
                  strokeWidth="1"
                />
                {/* Témoin de plein en cours (clignotant rouge) */}
                <motion.circle
                  cx="317"
                  cy="235"
                  r="4"
                  fill="#f43f5e"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <line x1="311" y1="249" x2="323" y2="249" stroke="#64748b" strokeWidth="2" />

                {/* Totem des prix du carburant en direct (reste en €/L) */}
                <rect
                  x="305"
                  y="277"
                  width="70"
                  height="22"
                  rx="3"
                  fill="#000000"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x="340"
                  y="292"
                  textAnchor="middle"
                  fill="#f43f5e"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {`${fuelPrice.toFixed(2)} €/L`}
                </text>
              </motion.g>
            )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* LA VOITURE PRINCIPALE : Reprise de route ➔ Disparition Station      */}
        {/* ➔ Métamorphose Majorette Vert Électrique ➔ Transition vers le haut  */}
        {/* =================================================================== */}
        <motion.g
          id="main-active-car"
          animate={{
            x: activeCarPos.x,
            y: activeCarPos.y,
            rotate: activeCarPos.rotate,
          }}
          transition={
            departurePhase === 'zooming'
              ? { duration: 0.55, ease: [0.32, 0, 0.67, 0] }
              : departurePhase === 'merging'
              ? { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }
              : { type: 'spring', stiffness: 80, damping: 14 }
          }
          style={{ willChange: 'transform' }}
        >
          {/* Faisceau lumineux projeté par les phares avant */}
          <polygon
            points="-18,-35 -38,-150 38,-150 18,-35"
            fill="url(#headlightBeamActive)"
          />

          {/* =================================================================== */}
          {/* TRACES DE PNEUS AVEC ÉCLAIRS (FAÇON RETOUR VERS LE FUTUR)          */}
          {/* Jaillissent derrière les deux roues arrière lors de l'accélération */}
          {/* =================================================================== */}
          <AnimatePresence>
            {isCarElectric && (
              <motion.g
                id="bttf-lightning-tracks"
                initial={{ opacity: 0, scaleY: 0.3 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* --- TRACE ROUE ARRIÈRE GAUCHE (x ≈ -19.25) --- */}
                {/* 1. Halo d'ionisation / sillage néon bleu électrique */}
                <motion.line
                  x1="-19"
                  y1="26"
                  x2="-19"
                  y2={departurePhase === 'zooming' ? "190" : "120"}
                  stroke="#38bdf8"
                  strokeWidth="11"
                  strokeLinecap="round"
                  filter="url(#lightningGlow)"
                  animate={{ opacity: [0.65, 1, 0.7, 0.95, 0.65] }}
                  transition={{ repeat: Infinity, duration: 0.15, ease: 'linear' }}
                />
                {/* 2. Cœur d'énergie intense blanc / cyan */}
                <motion.line
                  x1="-19"
                  y1="26"
                  x2="-19"
                  y2={departurePhase === 'zooming' ? "190" : "120"}
                  stroke="#e0f2fe"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0.8, 1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 0.1, ease: 'linear' }}
                />
                {/* 3. Éclair principal en zigzag (Arc électrique 1) */}
                <motion.path
                  d={departurePhase === 'zooming'
                    ? "M -19,26 L -23,45 L -15,70 L -24,100 L -16,130 L -22,160 L -19,190"
                    : "M -19,26 L -23,42 L -16,60 L -22,80 L -17,98 L -19,120"}
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lightningGlow)"
                  animate={{
                    opacity: [1, 0.25, 0.95, 0.15, 1],
                    strokeWidth: [2.2, 3.4, 1.8, 3.6, 2.2],
                  }}
                  transition={{ repeat: Infinity, duration: 0.12, ease: 'linear' }}
                />
                {/* 4. Éclair secondaire en zigzag alterné (Arc électrique 2) */}
                <motion.path
                  d={departurePhase === 'zooming'
                    ? "M -19,26 L -15,40 L -23,65 L -16,92 L -23,122 L -15,155 L -19,188"
                    : "M -19,26 L -16,38 L -23,55 L -15,75 L -22,92 L -18,118"}
                  stroke="#67e8f9"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    opacity: [0.2, 1, 0.35, 0.9, 0.15],
                    strokeWidth: [1.8, 2.8, 1.5, 2.6, 1.7],
                  }}
                  transition={{ repeat: Infinity, duration: 0.14, ease: 'linear' }}
                />
                {/* 5. Arcs transversaux jaillissant sur les côtés */}
                <motion.path
                  d="M -19,42 L -28,48 M -19,65 L -10,70 M -19,88 L -27,95"
                  stroke="#bae6fd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0, 1, 0.2, 0.9, 0] }}
                  transition={{ repeat: Infinity, duration: 0.16, ease: 'linear' }}
                />

                {/* --- TRACE ROUE ARRIÈRE DROITE (x ≈ +19.25) --- */}
                {/* 1. Halo d'ionisation / sillage néon bleu électrique */}
                <motion.line
                  x1="19"
                  y1="26"
                  x2="19"
                  y2={departurePhase === 'zooming' ? "190" : "120"}
                  stroke="#38bdf8"
                  strokeWidth="11"
                  strokeLinecap="round"
                  filter="url(#lightningGlow)"
                  animate={{ opacity: [0.7, 1, 0.55, 0.9, 0.7] }}
                  transition={{ repeat: Infinity, duration: 0.15, ease: 'linear' }}
                />
                {/* 2. Cœur d'énergie intense blanc / cyan */}
                <motion.line
                  x1="19"
                  y1="26"
                  x2="19"
                  y2={departurePhase === 'zooming' ? "190" : "120"}
                  stroke="#e0f2fe"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  animate={{ opacity: [1, 0.75, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.1, ease: 'linear' }}
                />
                {/* 3. Éclair principal en zigzag (Arc électrique 1) */}
                <motion.path
                  d={departurePhase === 'zooming'
                    ? "M 19,26 L 23,45 L 15,70 L 24,100 L 16,130 L 22,160 L 19,190"
                    : "M 19,26 L 23,42 L 16,60 L 22,80 L 17,98 L 19,120"}
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lightningGlow)"
                  animate={{
                    opacity: [0.25, 1, 0.2, 0.95, 1],
                    strokeWidth: [2, 3.4, 1.8, 3.2, 2.2],
                  }}
                  transition={{ repeat: Infinity, duration: 0.13, ease: 'linear' }}
                />
                {/* 4. Éclair secondaire en zigzag alterné (Arc électrique 2) */}
                <motion.path
                  d={departurePhase === 'zooming'
                    ? "M 19,26 L 15,40 L 23,65 L 16,92 L 23,122 L 15,155 L 19,188"
                    : "M 19,26 L 15,38 L 23,55 L 15,75 L 22,92 L 18,118"}
                  stroke="#67e8f9"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    opacity: [1, 0.2, 0.95, 0.3, 0.8],
                    strokeWidth: [1.6, 2.6, 1.8, 2.9, 1.7],
                  }}
                  transition={{ repeat: Infinity, duration: 0.15, ease: 'linear' }}
                />
                {/* 5. Arcs transversaux jaillissant sur les côtés */}
                <motion.path
                  d="M 19,42 L 28,48 M 19,65 L 10,70 M 19,88 L 27,95"
                  stroke="#bae6fd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0.2, 0.9, 0, 1, 0.1] }}
                  transition={{ repeat: Infinity, duration: 0.17, ease: 'linear' }}
                />

                {/* Étincelles de plasma temporel propulsées vers l'arrière */}
                <motion.circle
                  cx="-19"
                  cy="32"
                  r="2"
                  fill="#ffffff"
                  animate={{ y: [0, 30, 60], opacity: [1, 0.8, 0], scale: [1, 1.4, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.22, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="19"
                  cy="32"
                  r="2"
                  fill="#ffffff"
                  animate={{ y: [0, 30, 60], opacity: [1, 0.8, 0], scale: [1, 1.4, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.2, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="-21"
                  cy="45"
                  r="1.6"
                  fill="#67e8f9"
                  animate={{ y: [0, 35], x: [0, -8], opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.28, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="21"
                  cy="45"
                  r="1.6"
                  fill="#67e8f9"
                  animate={{ y: [0, 35], x: [0, 8], opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.26, ease: 'easeOut' }}
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Fumée d'échappement arrière (active tant que la DeLorean roule en thermique) */}
          <AnimatePresence>
            {!isCarElectric && isCarMoving && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.75, 0], y: [0, 24, 40], scale: [0.8, 1.5, 2.2] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeOut' }}
              >
                <circle cx="-10" cy="42" r="4.5" fill="#71717a" opacity="0.65" />
                <circle cx="8" cy="46" r="5.5" fill="#a1a1aa" opacity="0.45" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* =================================================================== */}
          {/* CARROSSERIE DELOREAN DMC-12 VUE DU DESSUS                           */}
          {/* Acier inoxydable brossé, lignes anguleuses et persiennes arrière     */}
          {/* =================================================================== */}
          <g id="delorean-car-body">
            {/* Ombre portée sur la route */}
            <rect x="-19" y="-34" width="38" height="68" rx="4" fill="#000000" opacity="0.7" />

            {/* 4 Pneus noirs sportifs avec jantes turbine argent */}
            {/* Roue avant gauche */}
            <rect x="-22" y="-27" width="5.5" height="13" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            <line x1="-19.25" y1="-24" x2="-19.25" y2="-17" stroke="#94a3b8" strokeWidth="1" />
            {/* Roue avant droite */}
            <rect x="16.5" y="-27" width="5.5" height="13" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            <line x1="19.25" y1="-24" x2="19.25" y2="-17" stroke="#94a3b8" strokeWidth="1" />
            {/* Roue arrière gauche (plus large) */}
            <rect x="-22.5" y="12" width="6.5" height="15" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            <line x1="-19.25" y1="15" x2="-19.25" y2="24" stroke="#94a3b8" strokeWidth="1.2" />
            {/* Roue arrière droite (plus large) */}
            <rect x="16" y="12" width="6.5" height="15" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            <line x1="19.25" y1="15" x2="19.25" y2="24" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Carrosserie principale en acier inoxydable brossé (silhouette rectangulaire DeLorean) */}
            <path
              d="M -16,-33 L 16,-33 L 17.5,-12 L 18,31 L -18,31 L -17.5,-12 Z"
              fill="url(#deloreanBodyGrad)"
              stroke={isCarElectric ? '#7dd3fc' : '#475569'}
              strokeWidth="1.2"
            />

            {/* Pare-chocs avant noir biseauté avec grille */}
            <rect x="-16" y="-33.5" width="32" height="3.5" rx="1" fill="#09090b" stroke="#334155" strokeWidth="0.5" />

            {/* 4 Feux avant rectangulaires (Quad headlights DeLorean) */}
            <rect x="-13" y="-33" width="3.5" height="2" rx="0.3" fill={isCarElectric ? "#e0f2fe" : "#fef08a"} />
            <rect x="-8.5" y="-33" width="3.5" height="2" rx="0.3" fill={isCarElectric ? "#e0f2fe" : "#fef08a"} />
            <rect x="5" y="-33" width="3.5" height="2" rx="0.3" fill={isCarElectric ? "#e0f2fe" : "#fef08a"} />
            <rect x="9.5" y="-33" width="3.5" height="2" rx="0.3" fill={isCarElectric ? "#e0f2fe" : "#fef08a"} />
            {/* Clignotants ambrés latéraux */}
            <rect x="-15.5" y="-33" width="1.8" height="2" rx="0.3" fill="#f59e0b" />
            <rect x="13.7" y="-33" width="1.8" height="2" rx="0.3" fill="#f59e0b" />

            {/* Rétroviseurs extérieurs anguleux */}
            <rect x="-17" y="-11" width="2.2" height="4" rx="0.5" fill="#475569" stroke="#334155" strokeWidth="0.4" />
            <rect x="14.8" y="-11" width="2.2" height="4" rx="0.5" fill="#475569" stroke="#334155" strokeWidth="0.4" />

            {/* Capot plat avec les rainures jumelles emblématiques de la DeLorean */}
            <rect x="-14" y="-29.5" width="28" height="17" rx="0.5" fill="url(#deloreanHoodGrad)" stroke="#64748b" strokeWidth="0.6" />
            {/* Rainures centrales du capot DMC */}
            <line x1="-5.5" y1="-29.5" x2="-5.5" y2="-13" stroke="#475569" strokeWidth="0.8" />
            <line x1="5.5" y1="-29.5" x2="5.5" y2="-13" stroke="#475569" strokeWidth="0.8" />
            {/* Logo / Badge calandre argent */}
            <rect x="-2" y="-31.5" width="4" height="1" rx="0.2" fill="#cbd5e1" />

            {/* Pare-brise avant plat et teinté */}
            <polygon
              points="-13,-12 13,-12 11,-1 -11,-1"
              fill="#09090b"
              stroke="#334155"
              strokeWidth="0.8"
            />
            <polygon
              points="-11,-11.2 -1,-11.2 -3,-1.8 -9,-1.8"
              fill={isCarElectric ? "#38bdf8" : "#94a3b8"}
              opacity="0.3"
            />

            {/* Toit en acier inoxydable avec découpe des portières papillon (Gull-wing doors) */}
            <rect x="-11" y="-1" width="22" height="12" rx="0.5" fill="url(#deloreanBodyGrad)" stroke="#475569" strokeWidth="0.8" />
            {/* Lignes de découpe supérieures des portes papillon */}
            <line x1="-11" y1="5" x2="-2.5" y2="5" stroke="#334155" strokeWidth="0.8" />
            <line x1="2.5" y1="5" x2="11" y2="5" stroke="#334155" strokeWidth="0.8" />
            <line x1="-2.5" y1="-1" x2="-2.5" y2="11" stroke="#334155" strokeWidth="0.8" />
            <line x1="2.5" y1="-1" x2="2.5" y2="11" stroke="#334155" strokeWidth="0.8" />

            {/* Vitres latérales avec petites sous-fenêtres caractéristiques */}
            <rect x="-14.5" y="-1" width="2.5" height="12" fill="#09090b" opacity="0.9" />
            <rect x="12" y="-1" width="2.5" height="12" fill="#09090b" opacity="0.9" />

            {/* Persiennes arrière noires légendaires (Louvers sur lunette arrière) */}
            <polygon
              points="-12,11.5 12,11.5 13.5,23.5 -13.5,23.5"
              fill="#050505"
              stroke="#1e293b"
              strokeWidth="0.6"
            />
            {/* Lamelles horizontales noires biseautées */}
            <line x1="-11.8" y1="13.5" x2="11.8" y2="13.5" stroke="#27272a" strokeWidth="1.3" />
            <line x1="-12.2" y1="16" x2="12.2" y2="16" stroke="#27272a" strokeWidth="1.3" />
            <line x1="-12.6" y1="18.5" x2="12.6" y2="18.5" stroke="#27272a" strokeWidth="1.3" />
            <line x1="-13" y1="21" x2="13" y2="21" stroke="#27272a" strokeWidth="1.3" />

            {/* Évents et Réacteurs Temporels Doc Brown à l'arrière */}
            <rect x="-15.5" y="24" width="31" height="5.5" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
            {/* Réacteur temporel gauche */}
            <rect
              x="-13.5"
              y="24.5"
              width="7.5"
              height="6"
              rx="1"
              fill="#18181b"
              stroke={isCarElectric ? "#38bdf8" : "#64748b"}
              strokeWidth="0.9"
            />
            <line x1="-13.5" y1="27.5" x2="-6" y2="27.5" stroke={isCarElectric ? "#7dd3fc" : "#475569"} strokeWidth="0.7" />
            {/* Réacteur temporel droit */}
            <rect
              x="6"
              y="24.5"
              width="7.5"
              height="6"
              rx="1"
              fill="#18181b"
              stroke={isCarElectric ? "#38bdf8" : "#64748b"}
              strokeWidth="0.9"
            />
            <line x1="6" y1="27.5" x2="13.5" y2="27.5" stroke={isCarElectric ? "#7dd3fc" : "#475569"} strokeWidth="0.7" />
            {/* Convecteur temporel / Mr. Fusion central */}
            <circle
              cx="0"
              cy="27.2"
              r="2.2"
              fill={isCarElectric ? "#e0f2fe" : "#e2e8f0"}
              stroke={isCarElectric ? "#38bdf8" : "#09090b"}
              strokeWidth="0.6"
            />

            {/* Pare-chocs arrière et bandeau de feux segmentés DeLorean */}
            <rect x="-17" y="30" width="34" height="2.8" rx="0.5" fill="#09090b" />
            {/* Feux arrière segmentés : rouge / ambre */}
            <rect x="-16" y="30.3" width="4.5" height="1.6" rx="0.2" fill="#ef4444" />
            <rect x="-11" y="30.3" width="3" height="1.6" rx="0.2" fill="#f59e0b" />
            <rect x="-7.5" y="30.3" width="15" height="1.6" rx="0.2" fill="#18181b" />
            <rect x="8" y="30.3" width="3" height="1.6" rx="0.2" fill="#f59e0b" />
            <rect x="11.5" y="30.3" width="4.5" height="1.6" rx="0.2" fill="#ef4444" />

            {/* Étincelles temporelles subtiles sur la carrosserie en métal lors de l'accélération */}
            {isCarElectric && (
              <motion.path
                d="M -15,-8 L -12,-5 L -9,-7 M 15,-8 L 12,-5 L 9,-7"
                stroke="#7dd3fc"
                strokeWidth="0.9"
                strokeLinecap="round"
                animate={{ opacity: [0, 1, 0.2, 0.9, 0] }}
                transition={{ repeat: Infinity, duration: 0.18, ease: 'linear' }}
              />
            )}
          </g>
        </motion.g>
      </svg>
    </div>
  );
};
