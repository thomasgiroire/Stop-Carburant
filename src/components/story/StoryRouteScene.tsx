import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HousingType, StoryStage } from '../../types';

interface StoryRouteSceneProps {
  stage: StoryStage;
  housing: HousingType;
  dailyKm: number;
  fuelBudget: number;
  fuelPrice: number;
  isTransformed: boolean;
  onSelectHousing?: (housing: HousingType) => void;
}

export const StoryRouteScene: React.FC<StoryRouteSceneProps> = ({
  stage,
  housing,
  dailyKm,
  fuelBudget,
  fuelPrice,
  isTransformed,
  onSelectHousing,
}) => {
  // Calcul de la position X de la voiture selon l'étape et le logement
  const targetX = useMemo(() => {
    switch (stage) {
      case 'departure':
        return housing === 'maison' ? 75 : 185;
      case 'commute':
        return 430;
      case 'gas_station':
        return 710;
      case 'revelation':
        return 885;
      default:
        return 75;
    }
  }, [stage, housing]);

  return (
    <div className="w-full relative select-none overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl mb-4 sm:mb-6">
      {/* Ciel nocturne profond avec étoiles subtiles */}
      <svg
        viewBox="0 0 1000 230"
        className="w-full h-auto max-h-[220px] block"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Animation du trajet narratif en voiture de profil"
      >
        <defs>
          {/* Dégradés d'ambiance */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#090d16" />
            <stop offset="85%" stopColor="#111827" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="10%" stopColor="#292524" />
            <stop offset="100%" stopColor="#141414" />
          </linearGradient>

          <linearGradient id="officeGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>

          <linearGradient id="electricCanopyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Halo vert émeraude pour la métamorphose */}
          <filter id="electricGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Halo d'alarme pour la pompe à essence */}
          <filter id="gasAlertGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ciel */}
        <rect x="0" y="0" width="1000" height="230" fill="url(#skyGrad)" />

        {/* Étoiles vectorielles fixes discrètes */}
        <circle cx="80" cy="30" r="1" fill="#94a3b8" opacity="0.6" />
        <circle cx="210" cy="20" r="1.5" fill="#f8fafc" opacity="0.8" />
        <circle cx="340" cy="40" r="1" fill="#94a3b8" opacity="0.5" />
        <circle cx="510" cy="25" r="1.2" fill="#cbd5e1" opacity="0.7" />
        <circle cx="670" cy="35" r="1" fill="#94a3b8" opacity="0.6" />
        <circle cx="820" cy="22" r="1.5" fill="#f8fafc" opacity="0.7" />
        <circle cx="940" cy="30" r="1" fill="#94a3b8" opacity="0.5" />

        {/* Horizon lointain silhouette de collines/ville en arrière plan */}
        <path
          d="M0,175 Q150,165 300,172 T600,168 T900,174 L1000,175 L1000,180 L0,180 Z"
          fill="#0f172a"
          opacity="0.7"
        />

        {/* ================================================================= */}
        {/* JALON 1 : DÉPART (Maison & Immeuble)                              */}
        {/* ================================================================= */}
        <g id="scene-departure" className="transition-opacity duration-300">
          {/* MAISON */}
          <g
            onClick={() => onSelectHousing && onSelectHousing('maison')}
            className={`cursor-pointer transition-transform duration-200 ${
              housing === 'maison' ? 'opacity-100' : 'opacity-65 hover:opacity-90'
            }`}
          >
            {/* Allée de garage */}
            <path d="M50,175 L110,175 L100,180 L40,180 Z" fill="#292524" />

            {/* Corps de la maison */}
            <rect x="45" y="105" width="65" height="70" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            
            {/* Toit en pente */}
            <polygon points="40,107 77,75 115,107" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            {/* Cheminée */}
            <rect x="92" y="80" width="8" height="18" fill="#475569" />

            {/* Garage */}
            <rect x="52" y="132" width="28" height="43" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <line x1="52" y1="142" x2="80" y2="142" stroke="#334155" strokeWidth="1" />
            <line x1="52" y1="152" x2="80" y2="152" stroke="#334155" strokeWidth="1" />
            <line x1="52" y1="162" x2="80" y2="162" stroke="#334155" strokeWidth="1" />

            {/* Fenêtre avec lueur chaleureuse */}
            <rect
              x="87"
              y="120"
              width="16"
              height="20"
              rx="2"
              fill={housing === 'maison' ? '#fbbf24' : '#64748b'}
              opacity={housing === 'maison' ? 0.9 : 0.4}
            />
            {/* Porte d'entrée */}
            <rect x="88" y="148" width="14" height="27" rx="1" fill="#0f172a" stroke="#334155" strokeWidth="1" />

            {/* Badge de sélection Maison */}
            {housing === 'maison' && (
              <g>
                <circle cx="77" cy="62" r="9" fill="#f59e0b" />
                <path d="M74,62 L76,64 L81,59" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            )}
            <text x="77" y="195" textAnchor="middle" fill={housing === 'maison' ? '#fbbf24' : '#94a3b8'} fontSize="10" fontWeight="bold">
              Maison
            </text>
          </g>

          {/* IMMEUBLE */}
          <g
            onClick={() => onSelectHousing && onSelectHousing('appartement')}
            className={`cursor-pointer transition-transform duration-200 ${
              housing === 'appartement' ? 'opacity-100' : 'opacity-65 hover:opacity-90'
            }`}
          >
            {/* Corps de l'immeuble */}
            <rect x="155" y="65" width="60" height="110" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            
            {/* Fenêtres en grille */}
            {[78, 100, 122, 144].map((rowY) => (
              <g key={rowY}>
                <rect
                  x="164"
                  y={rowY}
                  width="11"
                  height="12"
                  rx="1"
                  fill={housing === 'appartement' ? '#38bdf8' : '#64748b'}
                  opacity={housing === 'appartement' ? 0.8 : 0.3}
                />
                <rect
                  x="182"
                  y={rowY}
                  width="11"
                  height="12"
                  rx="1"
                  fill={housing === 'appartement' ? '#fbbf24' : '#64748b'}
                  opacity={housing === 'appartement' ? 0.75 : 0.3}
                />
                <rect
                  x="200"
                  y={rowY}
                  width="11"
                  height="12"
                  rx="1"
                  fill={housing === 'appartement' ? '#38bdf8' : '#64748b'}
                  opacity={housing === 'appartement' ? 0.6 : 0.3}
                />
              </g>
            ))}

            {/* Porte hall d'immeuble vitrée */}
            <rect x="175" y="160" width="20" height="15" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />

            {/* Badge de sélection Appartement */}
            {housing === 'appartement' && (
              <g>
                <circle cx="185" cy="52" r="9" fill="#38bdf8" />
                <path d="M182,52 L184,54 L189,49" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            )}
            <text x="185" y="195" textAnchor="middle" fill={housing === 'appartement' ? '#38bdf8' : '#94a3b8'} fontSize="10" fontWeight="bold">
              Immeuble
            </text>
          </g>
        </g>

        {/* ================================================================= */}
        {/* JALON 2 : TRAVAIL (Bureaux & Pôle d'activité)                      */}
        {/* ================================================================= */}
        <g id="scene-commute" opacity={stage === 'commute' ? 1 : 0.75}>
          {/* Bâtiment de bureaux moderne */}
          <rect x="400" y="55" width="85" height="120" rx="4" fill="url(#officeGlassGrad)" stroke="#475569" strokeWidth="1.5" />
          
          {/* Étage supérieur / attique vitré */}
          <rect x="410" y="42" width="65" height="14" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
          <line x1="442" y1="26" x2="442" y2="42" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="442" cy="24" r="2.5" fill="#f43f5e" />

          {/* Façade vitrée contemporaine */}
          {[66, 88, 110, 132].map((winY) => (
            <g key={winY}>
              <rect x="410" y={winY} width="28" height="13" rx="1" fill="#38bdf8" opacity="0.7" />
              <rect x="447" y={winY} width="28" height="13" rx="1" fill="#38bdf8" opacity="0.5" />
            </g>
          ))}

          {/* Porte d'entrée rotative */}
          <rect x="430" y="156" width="25" height="19" rx="2" fill="#0284c7" opacity="0.3" stroke="#38bdf8" strokeWidth="1" />

          {/* Panneau indicatif Travail */}
          <rect x="396" y="183" width="93" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="442" y="196" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" letterSpacing="0.05em">
            TRAVAIL • {dailyKm} KM/J
          </text>
        </g>

        {/* ================================================================= */}
        {/* JALON 3 : STATION-SERVICE (La Pompe & Le Totem de Prix)            */}
        {/* ================================================================= */}
        <g id="scene-gas-station" opacity={stage === 'gas_station' || isTransformed ? 1 : 0.75}>
          {/* Totem de prix du carburant */}
          <g>
            <rect x="635" y="55" width="40" height="120" rx="4" fill="#0f172a" stroke={isTransformed ? '#10b981' : '#f43f5e'} strokeWidth="1.5" />
            {/* Logo station */}
            <rect x="639" y="60" width="32" height="18" rx="2" fill={isTransformed ? '#059669' : '#e11d48'} />
            <text x="655" y="73" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="black">
              {isTransformed ? 'ECO' : 'PRIX'}
            </text>

            {/* Affichage digital du prix au litre */}
            <rect x="639" y="84" width="32" height="18" rx="2" fill="#000000" stroke="#334155" strokeWidth="1" />
            <text
              x="655"
              y="97"
              textAnchor="middle"
              fill={isTransformed ? '#34d399' : '#f43f5e'}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              filter={isTransformed ? 'url(#electricGlow)' : 'url(#gasAlertGlow)'}
            >
              {isTransformed ? '0.21€' : `${fuelPrice.toFixed(2)}€`}
            </text>

            {/* Total mensuel */}
            <rect x="639" y="108" width="32" height="18" rx="2" fill="#000000" stroke="#334155" strokeWidth="1" />
            <text
              x="655"
              y="121"
              textAnchor="middle"
              fill={isTransformed ? '#10b981' : '#fbbf24'}
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {fuelBudget}€/m
            </text>

            {/* Pied du totem */}
            <rect x="651" y="165" width="8" height="10" fill="#334155" />
          </g>

          {/* Auvent de la station-service */}
          <rect
            x="685"
            y="75"
            width="90"
            height="10"
            rx="2"
            fill={isTransformed ? 'url(#electricCanopyGrad)' : 'url(#canopyGrad)'}
            stroke="#ffffff"
            strokeWidth="0.5"
          />
          {/* Piliers de l'auvent */}
          <line x1="695" y1="85" x2="695" y2="175" stroke="#64748b" strokeWidth="3" />
          <line x1="765" y1="85" x2="765" y2="175" stroke="#64748b" strokeWidth="3" />

          {/* Pompe à carburant */}
          <rect x="722" y="130" width="18" height="45" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="725" y="135" width="12" height="12" rx="1" fill="#000000" />
          <text x="731" y="144" textAnchor="middle" fill="#f43f5e" fontSize="7" fontFamily="monospace">
            {stage === 'gas_station' ? '$$$' : 'SP'}
          </text>
          {/* Tuyau et pistolet */}
          <path d="M722,148 Q712,155 715,165" stroke={isTransformed ? '#10b981' : '#f43f5e'} strokeWidth="1.5" fill="none" />
        </g>

        {/* ================================================================= */}
        {/* JALON 4 : BORNE ÉLECTRIQUE / DESTINATION FUTURE                   */}
        {/* ================================================================= */}
        <g id="scene-revelation" opacity={stage === 'revelation' || isTransformed ? 1 : 0.45}>
          {/* Borne de recharge ultra-rapide futuriste */}
          <rect x="880" y="115" width="22" height="60" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="891" cy="130" r="5" fill="#10b981" filter="url(#electricGlow)" />
          {/* Éclair d'énergie */}
          <path d="M891,127 L889,131 L892,131 L890,134" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Câble branché vert émeraude */}
          <path d="M885,150 Q872,160 865,166" stroke="#34d399" strokeWidth="2" fill="none" />

          {/* Voûte solaire / Canopée éco */}
          <polygon points="870,105 915,100 910,95 865,100" fill="#059669" opacity="0.8" />
        </g>

        {/* ================================================================= */}
        {/* ROUTE ASPHALTE & MARQUAGE AU SOL                                 */}
        {/* ================================================================= */}
        <rect x="0" y="175" width="1000" height="55" fill="url(#roadGrad)" />
        {/* Ligne de bordure de trottoir */}
        <line x1="0" y1="175" x2="1000" y2="175" stroke="#44403c" strokeWidth="1.5" />

        {/* Ligne médiane pointillée animée */}
        <line
          x1="0"
          y1="202"
          x2="1000"
          y2="202"
          stroke="#e7e5e4"
          strokeWidth="2.5"
          strokeDasharray="18 14"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* ================================================================= */}
        {/* LA VOITURE ANIMÉE (Side-scroller)                                 */}
        {/* ================================================================= */}
        <motion.g
          animate={{ x: targetX }}
          transition={{ type: 'spring', stiffness: 55, damping: 14 }}
          style={{ willChange: 'transform' }}
        >
          {/* Effet d'échappement thermique (fume uniquement si non transformée) */}
          <AnimatePresence>
            {!isTransformed && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.7, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              >
                <circle cx="-6" cy="168" r="3" fill="#94a3b8" />
                <circle cx="-14" cy="165" r="4.5" fill="#64748b" opacity="0.6" />
                <circle cx="-23" cy="162" r="6" fill="#475569" opacity="0.3" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Halo d'aura électrique si transformée */}
          {isTransformed && (
            <motion.ellipse
              cx="38"
              cy="165"
              rx="46"
              ry="18"
              fill="#10b981"
              opacity="0.25"
              filter="url(#electricGlow)"
              animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.98, 1.04, 0.98] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Corps de la voiture (Profil épuré 76px x 32px) */}
          <g transform="translate(0, 148)">
            {/* Ombre portée sur le bitume */}
            <ellipse cx="38" cy="27" rx="36" ry="3.5" fill="#000000" opacity="0.5" />

            {/* Carrosserie principale */}
            <path
              d="M4,20 L8,13 Q16,8 26,8 L48,8 Q58,8 65,15 L72,17 Q76,19 76,22 L74,24 L2,24 Z"
              fill={isTransformed ? '#059669' : '#334155'}
              stroke={isTransformed ? '#34d399' : '#64748b'}
              strokeWidth="1.5"
              className="transition-colors duration-500"
            />

            {/* Vitrage latéral */}
            <path
              d="M24,10 L46,10 Q53,10 58,15 L24,15 Z"
              fill={isTransformed ? '#a7f3d0' : '#38bdf8'}
              opacity="0.85"
            />
            <path
              d="M14,15 L21,11 L21,15 Z"
              fill={isTransformed ? '#a7f3d0' : '#38bdf8'}
              opacity="0.75"
            />

            {/* Phares avant */}
            <polygon
              points="73,18 76,18 75,22 72,21"
              fill={isTransformed ? '#6ee7b7' : '#fef08a'}
            />
            {/* Faisceau lumineux */}
            <polygon
              points="76,18 105,14 105,25 76,21"
              fill={isTransformed ? '#10b981' : '#fef08a'}
              opacity={isTransformed ? 0.3 : 0.2}
            />

            {/* Feu arrière */}
            <rect x="2" y="19" width="3" height="3" rx="0.5" fill="#f43f5e" />

            {/* Roue Arrière */}
            <g transform="translate(16, 23)">
              <circle cx="0" cy="0" r="6.5" fill="#09090b" stroke="#52525b" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3" fill="#a1a1aa" />
              <line x1="-3" y1="0" x2="3" y2="0" stroke="#18181b" strokeWidth="1" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#18181b" strokeWidth="1" />
            </g>

            {/* Roue Avant */}
            <g transform="translate(60, 23)">
              <circle cx="0" cy="0" r="6.5" fill="#09090b" stroke="#52525b" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3" fill="#a1a1aa" />
              <line x1="-3" y1="0" x2="3" y2="0" stroke="#18181b" strokeWidth="1" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#18181b" strokeWidth="1" />
            </g>

            {/* Pot d'échappement (uniquement thermique) */}
            {!isTransformed && (
              <rect x="0" y="22" width="3" height="2" fill="#71717a" rx="0.5" />
            )}

            {/* Badge électrique sur la portière si transformée */}
            {isTransformed && (
              <g transform="translate(34, 15)">
                <circle cx="4" cy="4" r="3.5" fill="#10b981" />
                <path d="M4,2 L2.5,4.5 L4.5,4.5 L3.5,6.5" stroke="#ffffff" strokeWidth="0.8" fill="none" />
              </g>
            )}
          </g>
        </motion.g>
      </svg>
    </div>
  );
};
