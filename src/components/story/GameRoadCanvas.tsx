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

  // Règle formelle : la voiture reste THERMIQUE BLEUE tant que la station n'a pas disparu !
  // La métamorphose électrique ne s'active QUE lors de la phase 'transformed' ou 'zooming'
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

          {/* Faisceau lumineux des phares actifs */}
          <radialGradient id="headlightBeamActive" cx="50%" cy="100%" r="90%">
            <stop
              offset="0%"
              stopColor={isCarElectric ? 'rgba(52, 211, 153, 0.6)' : 'rgba(254, 240, 138, 0.5)'}
            />
            <stop
              offset="65%"
              stopColor={isCarElectric ? 'rgba(16, 185, 129, 0.2)' : 'rgba(253, 224, 71, 0.15)'}
            />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Néon vert sous châssis électrique */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
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
                  opacity="0.45"
                  transform="translate(312, 340) rotate(-34)"
                >
                  <rect x="-17" y="-30" width="34" height="60" rx="8" fill="#000000" opacity="0.4" />
                  <rect x="-15" y="-28" width="30" height="56" rx="7" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                  <rect x="-10" y="-3" width="20" height="18" rx="2" fill="#0f172a" />
                  <circle cx="-10" cy="-27" r="2" fill="#64748b" />
                  <circle cx="10" cy="-27" r="2" fill="#64748b" />
                </g>
              ) : (
                /* Voiture stationnée devant la maison */
                <g
                  id="car-parked-maison"
                  onClick={() => onSelectHousing?.('maison')}
                  className="cursor-pointer"
                  opacity="0.45"
                  transform="translate(88, 340) rotate(34)"
                >
                  <rect x="-17" y="-30" width="34" height="60" rx="8" fill="#000000" opacity="0.4" />
                  <rect x="-15" y="-28" width="30" height="56" rx="7" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                  <rect x="-10" y="-3" width="20" height="18" rx="2" fill="#0f172a" />
                  <circle cx="-10" cy="-27" r="2" fill="#64748b" />
                  <circle cx="10" cy="-27" r="2" fill="#64748b" />
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

          {/* Halo néon vert sous châssis (s'active UNIQUEMENT quand la station a disparu) */}
          <motion.ellipse
            cx="0"
            cy="0"
            rx="28"
            ry="45"
            fill="#10b981"
            filter="url(#neonGlow)"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isCarElectric ? [0, 0.4, 0.7] : 0,
              scale: isCarElectric ? [0.9, 1.05] : 0.8,
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {/* Fumée d'échappement arrière (active tant que la voiture est thermique) */}
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

          {/* Carrosserie vue du dessus (Top-Down Racing Car) */}
          <g>
            {/* Ombre portée sur la route */}
            <rect x="-19" y="-34" width="38" height="68" rx="10" fill="#000000" opacity="0.65" />

            {/* 4 Pneus noirs */}
            <rect x="-22" y="-28" width="6" height="14" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />
            <rect x="16" y="-28" width="6" height="14" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />
            <rect x="-22" y="14" width="6" height="14" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />
            <rect x="16" y="14" width="6" height="14" rx="2" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />

            {/* Carrosserie : Reste BLEU THERMIQUE jusqu'à disparition de la station, puis vert électrique */}
            <motion.rect
              x="-17"
              y="-32"
              width="34"
              height="64"
              rx="9"
              animate={{
                fill: isCarElectric
                  ? ['#1e3a8a', '#0284c7', '#0d9488', '#059669']
                  : '#1e3a8a',
                stroke: isCarElectric
                  ? ['#3b82f6', '#38bdf8', '#2dd4bf', '#34d399']
                  : '#3b82f6',
              }}
              transition={{
                duration: 0.75,
                ease: 'easeInOut',
              }}
              strokeWidth="1.5"
            />

            {/* Pare-brise avant teinté */}
            <motion.path
              d="M-12,-12 Q0,-16 12,-12 L10,-3 Q0,-5 -10,-3 Z"
              animate={{
                fill: isCarElectric ? ['#38bdf8', '#5eead4', '#a7f3d0'] : '#38bdf8',
              }}
              transition={{ duration: 0.7 }}
              opacity="0.95"
            />

            {/* Toit (Devient toit panoramique lors de la métamorphose) */}
            <motion.rect
              x="-11"
              y="-1"
              width="22"
              height="20"
              rx="3"
              animate={{
                fill: isCarElectric ? ['#0f172a', '#083344', '#064e3b'] : '#0f172a',
                stroke: isCarElectric ? ['#3b82f6', '#2dd4bf', '#10b981'] : '#1e293b',
              }}
              transition={{ duration: 0.7 }}
              strokeWidth="0.8"
            />
            {isCarElectric && (
              <motion.line
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ duration: 0.4 }}
                x1="0"
                y1="-1"
                x2="0"
                y2="19"
                stroke="#34d399"
                strokeWidth="0.8"
              />
            )}

            {/* Lunette arrière */}
            <motion.path
              d="M-10,21 Q0,23 10,21 L11,26 Q0,28 -11,26 Z"
              animate={{
                fill: isCarElectric ? ['#38bdf8', '#5eead4', '#a7f3d0'] : '#38bdf8',
              }}
              transition={{ duration: 0.7 }}
              opacity="0.85"
            />

            {/* Phares avant LED */}
            <motion.circle
              cx="-12"
              cy="-31"
              r="2.5"
              animate={{
                fill: isCarElectric ? ['#fef08a', '#6ee7b7'] : '#fef08a',
              }}
              transition={{ duration: 0.5 }}
            />
            <motion.circle
              cx="12"
              cy="-31"
              r="2.5"
              animate={{
                fill: isCarElectric ? ['#fef08a', '#6ee7b7'] : '#fef08a',
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Feux arrière rouges */}
            <rect x="-14" y="30" width="5" height="2" rx="0.5" fill="#f43f5e" />
            <rect x="9" y="30" width="5" height="2" rx="0.5" fill="#f43f5e" />

            {/* Éclair d'énergie électrique apparaissant sur le toit */}
            {isCarElectric && (
              <motion.path
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                d="M1,4 L-2,10 L2,10 L-1,16"
                stroke="#ffffff"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        </motion.g>
      </svg>
    </div>
  );
};
