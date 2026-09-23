import { FAQItem } from './types';

// Constantes officielles définies dans le CDC
export const CONSTANTS = {
  P_CARB: 1.74, // €/L (Prix moyen carburant pondéré du parc français)
  C_THERM: 6.5, // L/100 km (Consommation moyenne de référence du parc thermique français)
  C_ELEC: 15.2, // kWh/100 km (Consommation électrique réelle moyenne de référence La Chaîne EV)
  P_DOM: 0.2001, // €/kWh (Tarif réglementé EDF Option Base / tarif fixe 6 kVA ~0,20 €)
  P_DOM_HP: 0.2001, // €/kWh (Tarif réglementé EDF fixe de référence ~0,20 €)
  P_DOM_HC: 0.1612, // €/kWh (Tarif réglementé EDF Option Heures Creuses nuit)
  P_PUB: 0.38,  // €/kWh (Prix moyen recharge publique / rapide avec abonnement)
  G_ENT_PER_KM: 0.015, // €/km (Gain d'entretien fourchette basse : ~1,50 € / 100 km)
  MIN_MAINTENANCE_SAVINGS: 15, // €/mois (Gain d'entretien minimal garanti)
  RECUP_NUIT: 100, // km récupérés chaque nuit sur prise domestique classique
  WORKING_DAYS_PER_MONTH: 24, // Jours d'utilisation équivalents par mois (base ~5,5 jours/semaine incluant travail, courses, école et week-ends)
  DRIVING_DAYS_PER_MONTH: 24, // Base ~5,5 jours/semaine incluant trajets travail, courses, école et déplacements du quotidien
  MIN_CONSUMPTION_L: 4.0, // L/100 km (Plancher physique réaliste : véhicule très sobre / hybride)
  MAX_CONSUMPTION_L: 12.0, // L/100 km (Plafond réaliste : gros SUV essence / utilitaire en circulation dense)
};

export const PRESET_BUDGETS = [50, 100, 150, 200, 250];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'prix-achat',
    myth: '« Les voitures électriques sont trop chères ! »',
    verdict: 'FAUX EN OCCASION & ÉCART MINIME EN NEUF',
    explanation: 'En occasion, une citadine démarre entre 5 et 6 000 € (exemple Renault Zoé dès ~5 850 €). En neuf, les citadines débutent dès 18 900 € (Dacia Spring) et avec les primes à l\'achat, le prix peut descendre sous les 15 000 €.',
    sourceName: 'Observatoire Marché Leboncoin, Données Constructeurs & Dispositif CEE',
    sourceUrl: 'https://www.leboncoin.fr',
    badge: 'Prix Marché & Primes CEE',
  },
  {
    id: 'batteries',
    myth: '« Les batteries sont mortes au bout de 10 ans, il faut repayer 15 000 € ! »',
    verdict: 'FAUX',
    explanation: 'Les données réelles télémétriques (Geotab sur 6 000+ véhicules, certificats Aviloo) démontrent une perte moyenne de seulement ~1,4 % à 1,8 % par an. Stop-Carburant intègre d\'ailleurs automatiquement cette décote (SoH moyen de 85 % à 96 % selon le millésime) dans tous ses calculs d\'autonomie d\'occasion. De plus, les constructeurs garantissent la batterie pendant 8 ans ou 160 000 km (seuil mini de 70-75 % de capacité), et un certificat SoH officiel est remis lors de l\'achat d\'occasion.',
    sourceName: 'Geotab — Analyse de la santé des batteries sur 10 000 VE en circulation & Aviloo',
    sourceUrl: 'https://www.geotab.com/blog/ev-battery-health/',
    badge: 'Données Télémétriques & SoH',
  },
  {
    id: 'incendies',
    myth: '« C\'est super dangereux, les voitures électriques prennent feu sans arrêt ! »',
    verdict: 'FAUX',
    explanation: 'Les statistiques officielles des pompiers et organismes de sécurité civile prouvent l\'exact inverse. Un véhicule thermique (qui transporte en permanence 40 à 60 litres de carburant hautement inflammable sous pression) présente statistiquement 20 fois plus de risques d\'incendie par million de kilomètres qu\'un véhicule électrique.',
    sourceName: 'MSB (Agence suédoise de protection civile) & National Fire Data',
    sourceUrl: 'https://www.msb.se',
    badge: 'Statistiques Pompiers',
  },
  {
    id: 'usage',
    myth: '« C\'est beaucoup trop compliqué à utiliser au quotidien ! »',
    verdict: 'FAUX',
    explanation: 'C\'est l\'équivalent d\'un smartphone sur roues : zéro passage de vitesse, couple instantané, silence total. Vous la branchez le soir en rentrant chez vous comme votre téléphone. Pour les longs départs en vacances, le planificateur GPS intégré calcule automatiquement les arrêts de 15 à 20 minutes calés sur vos pauses café physiologiques.',
    sourceName: 'Avere-France — Baromètre d\'usage et satisfaction conducteurs',
    sourceUrl: 'https://www.avere-france.org',
    badge: 'Enquête Mobilité',
  },
  {
    id: 'pollution-fabrication',
    myth: '« Oui mais la fabrication de la batterie pollue plus que le diesel ! »',
    verdict: 'FAUX SUR CYCLE DE VIE',
    explanation: 'S\'il est vrai que l\'extraction et l\'assemblage initial requièrent de l\'énergie, une voiture électrique en France (grâce à notre électricité décarbonée à +92% d\'origine nucléaire et renouvelable) rembourse l\'intégralité de sa « dette carbone » de fabrication en moins de 30 000 km, soit environ 2 ans d\'utilisation normale.',
    sourceName: 'ADEME — Rapport d\'Analyse du Cycle de Vie des Véhicules',
    sourceUrl: 'https://www.ademe.fr',
    badge: 'Rapport Officiel ADEME',
  },
  {
    id: 'reseau',
    myth: '« Le réseau électrique va s\'effondrer si tout le monde passe à l\'électrique ! »',
    verdict: 'FAUX',
    explanation: 'Le réseau national français de transport électrique est dimensionné pour les pointes de consommation hivernales de 19h. Les véhicules se rechargent majoritairement la nuit en heures creuses. Même 15 millions de véhicules électriques ne représenteraient que 10 % de la production annuelle globale d\'électricité en France.',
    sourceName: 'RTE (Réseau de Transport d\'Électricité) — Bilan Prévisionnel Horizon 2035',
    sourceUrl: 'https://www.rte-france.com',
    badge: 'Rapport Stratégique RTE',
  },
  {
    id: 'terres-rares',
    myth: '« On va manquer de terres rares pour fabriquer les moteurs ! »',
    verdict: 'FAUX',
    explanation: 'Les batteries lithium-ion (LFP, NMC) ne contiennent STRICTEMENT AUCUNE terre rare. Elles utilisent du lithium, fer, phosphate ou nickel. En réalité, ce sont les pots catalytiques des moteurs thermiques essence et diesel qui nécessitent des métaux précieux et terres rares comme le platine, le palladium et le rhodium.',
    sourceName: 'AIE (Agence Internationale de l\'Énergie) — Global EV Outlook',
    sourceUrl: 'https://www.iea.org/reports/global-ev-outlook-2024',
    badge: 'Agence Internationale de l\'Énergie',
  },
  {
    id: 'taxation-arrive',
    myth: '« La taxation arrive : l\'État va surtaxer l\'électrique pour compenser les taxes sur les carburants ! »',
    verdict: 'LARGEMENT GAGNANT DANS TOUS LES SCÉNARIOS',
    explanation: 'Si l\'État réfléchira inévitablement à compenser la baisse des recettes de la TICPE à long terme, les chiffres démontrent que l\'électrique reste ultra-rentable. Pour 15 000 km/an, un véhicule thermique coûte ~2 000 € de carburant contre ~450 à 540 € en recharge à domicile. Même avec une taxe kilométrique (comme celle prévue au Royaume-Uni pour 2028 à ~2,2 cts/km, soit ~330 €/an) ou une hypothétique taxe annuelle de 500 €, l\'économie nette reste de 800 à plus de 1 000 € chaque année en faveur de l\'électrique. De plus, chaque année passée en électrique représente des économies réelles immédiatement acquises qu\'aucune taxe future n\'effacera.',
    sourceName: 'Automobile Propre — Voitures électriques : la taxe de trop ?',
    sourceUrl: 'https://www.automobile-propre.com/articles/voitures-electriques-la-taxe-de-trop/?utm_source=reseaux-sociaux&utm_medium=instagram&utm_campaign=headliner',
    badge: 'Fiscalité & Analyse',
  },
  {
    id: 'recharge-appartement',
    myth: '« C\'est bien pour ceux qui peuvent charger à domicile... Je fais quoi moi, je tire une rallonge de mon balcon ? »',
    verdict: 'FAUX : DROIT À LA PRISE ET 150 000+ BORNES PUBLIQUES',
    explanation: 'Rallonge inutile ! Avec 300 à 450 km d\'autonomie et un trajet moyen de 35 km par jour, une seule charge tous les 7 à 10 jours suffit. Trois solutions simples existent : 1. En copropriété, la loi garantit le "droit à la prise" à tout résident avec place de parking (le syndic ne peut s\'y opposer sans motif sérieux, avec 50 % d\'aide ADVENIR et 500 € de crédit d\'impôt). 2. Au quotidien, profitez des 150 000 bornes publiques pour recharger pendant vos courses (Lidl, Carrefour, Leclerc...) ou sur votre lieu de travail. 3. Même à 100 % sur borne publique (~0,38 €/kWh), rouler 100 km coûte ~5,80 € contre 11 à 13 € en thermique : votre budget carburant reste divisé par deux.',
    sourceName: 'Service-Public.fr & Avere-France — Guide du droit à la prise en copropriété',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F35320',
    badge: 'Logement & Recharge',
  },
  {
    id: 'fiabilite-electronique',
    myth: '« Il y a plein d\'électronique, ça va tomber en panne ! Ma bonne vieille R5 tourne comme un charme sans tout ça... »',
    verdict: 'FAUX : MÉCANIQUE 10× PLUS SIMPLE ET MOINS DE PANNES',
    explanation: 'Si une vieille mécanique paraît familière, un moteur thermique moderne compte plus de 2 000 pièces en mouvement soumises à de fortes contraintes (boîte de vitesses, embrayage, turbo, distribution, injecteurs, vanne EGR, FAP...). En comparaison, un moteur électrique ne possède qu\'une seule pièce mobile (le rotor) : pas de vidange, pas de bougies, pas d\'embrayage, et des freins préservés par la régénération. Quant à la fiabilité générale, le baromètre annuel de dépannage de l\'ADAC (l\'automobile-club européen de référence) confirme que les voitures électriques subissent nettement moins de pannes immobilisantes que leurs équivalents thermiques.',
    sourceName: 'ADAC — Bilan officiel des pannes et fiabilité (Pannenstatistik)',
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/unfall-schaden-panne/adac-pannenstatistik/',
    badge: 'Fiabilité & Statistiques ADAC',
  },
];
