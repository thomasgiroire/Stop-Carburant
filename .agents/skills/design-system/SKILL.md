---
name: design-system
description: >-
  Directives et normes de conception UI/UX pour Stop-Carburant : Mobile-First, design ultra-épuré,
  ergonomie au pouce, respect absolu du principe du Cheval de Troie (zéro mention VE avant la révélation),
  tokens Tailwind/CSS et patterns réutilisables. Utiliser pour toute création, fix ou évolution d'interface.
---

# Design System & Normes UI/UX — Stop Carburant

Ce skill définit les standards graphiques, ergonomiques et architecturaux à respecter impérativement lors de toute modification ou ajout de fonctionnalité sur **Stop Carburant**.

---

## 1. Les 4 Piliers Invariants

### 🏛️ Pilier 1 : Mobile-First & Absence de vide vertical
- **Hauteur de conteneur :** Toujours utiliser `min-h-[100dvh]` (et non `h-screen` ou `min-h-screen`) pour neutraliser les sauts de barre d'URL sur Safari et Chrome mobile.
- **Alignement vertical :** Utiliser `justify-start sm:justify-center` avec un padding fluide (`px-3 sm:px-4 py-4 sm:py-8`). Ne jamais forcer un centrage vertical rigide qui créerait des bandes vides noires massives en haut et en bas sur smartphone.
- **Zones tactiles (Touch Targets) :** Minimum 44px de hauteur sur les boutons. Sliders avec curseur 28px (`touch-action: pan-y`).
- **Ergonomie au pouce :** Boutons d'action placés au bas du flux de lecture naturel, pleine largeur sur mobile (`w-full sm:w-auto`).

### 🐴 Pilier 2 : Principe du Cheval de Troie (Zero Leakage)
- **Règle absolue :** La finalité (l'arbitrage vers un véhicule électrique d'occasion) ne doit **JAMAIS** être dévoilée ni suggérée avant l'étape finale de révélation (après clic sur *"Voir où devrait plutôt aller cet argent"*).
- **Mots strictement interdits dans les étapes 1 et 2 :**
  - ❌ *électrique*, *VE*, *batterie*, *kWh*, *prise*, *borne*, *recharge*, *autonomie électrique*, *watts*.
- **Cadrage des étapes initiales :**
  - Uniquement orienté sur l'arbitrage financier de l'automobiliste : *"Combien dépensez-vous en carburant ?"*, *"Combien de kilomètres faites-vous par jour ?"*, *"Où garez-vous votre voiture la nuit (Maison / Appartement) ?"*.

### 🧘 Pilier 3 : Charge Cognitive Minimale (Ultra-simple & Épuré)
- **Zéro fioriture :** Pas de badges multicolores superflus, pas de puces de texte répétitives, pas de pavés de texte denses.
- **Présélections rapides au pouce :** Boutons d'accès rapide (pills) au-dessus ou en-dessous des curseurs pour éviter les manipulations de précision (`100 €`, `200 €`, `300 €`, etc.).
- **Un seul objectif par écran :** Chaque étape a une question claire et un seul CTA principal.

### 🧾 Pilier 4 : Format « Ticket de Caisse » (Pas de poupées russes)
- Ne jamais imbriquer des cartes dans des cartes sur 4 ou 5 niveaux.
- Présenter les calculs financiers complexes sous forme de facture claire, ligne à ligne (`border border-neutral-800 divide-y divide-neutral-800/60`).
- Éviter les abréviations ambiguës (écrire `/ mois` et non `/ m`).

---

## 2. Tokens Graphiques & Palette Sémantique

| Rôle Sémantique | Classes Tailwind Recommandées | Usage |
| :--- | :--- | :--- |
| **Fond général** | `bg-neutral-950 text-neutral-100` | Fond de page sombre immersif |
| **Surface carte** | `bg-neutral-900/90 border border-neutral-800 rounded-2xl sm:rounded-3xl` | Cartes principales du funnel |
| **Perte / Hémorragie** | `from-rose-950/40 via-neutral-950 border-rose-500/70 text-rose-400` | Budget carburant brûlé, alerte perte |
| **Gain / Victoire** | `from-emerald-950/60 via-neutral-950 border-emerald-500 text-emerald-400` | Cash mensuel récupéré, succès financier |
| **Action / CTA** | `bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500` | Bouton principal de déblocage / étape |
| **Avertissement / Reste**| `text-amber-400 border-amber-500/40` | Reste à charge éventuel, badges neutres |
| **Typographie Titres** | `font-display font-black tracking-tight` | Chiffres chocs et questions provocatrices |
| **Typographie Données** | `font-mono font-bold` | Montants en euros, distances en km |

---

## 3. Checklist de Validation pour toute PR / Modification

Avant de finaliser toute modification UI ou logique :
1. [ ] **Test Responsive :** Vérifier sur viewport mobile (375x667 et 390x844). Est-ce qu'il y a du vide inutile ? Les boutons sont-ils atteignables au pouce ?
2. [ ] **Audit Cheval de Troie :** Y a-t-il le moindre mot trahissant l'électrique dans l'étape 1 ou 2 ? Si oui, le supprimer immédiatement.
3. [ ] **Audit de Densité :** Y a-t-il des badges redondants ou des cartes imbriquées ? Si oui, aplatir en liste simple.
4. [ ] **Tests unitaires :** Exécuter `npx vitest run`. Les 94 tests doivent être au vert.
5. [ ] **Build de production :** Exécuter `npm run build`. Aucune erreur TypeScript autorisée.
