---
name: Stop-Carburant
description: Directives et standards de conception UI/UX pour le simulateur Stop-Carburant
colors:
  bg-root: "#0a0a0a"
  text-primary: "#f5f5f5"
  text-muted: "#a3a3a3"
  surface-card: "#171717"
  border-subtle: "#262626"
  loss-primary: "#f43f5e"
  loss-text: "#fb7185"
  loss-surface: "rgba(76, 5, 25, 0.4)"
  gain-primary: "#10b981"
  gain-text: "#34d399"
  gain-surface: "rgba(6, 78, 59, 0.4)"
  accent-amber: "#f59e0b"
  cta-from: "#e11d48"
  cta-to: "#d97706"
  white: "#ffffff"
typography:
  display:
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  touch-target: "44px"
  container-px: "16px"
  container-py: "16px"
components:
  button-primary:
    backgroundColor: "{colors.cta-from}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    height: "52px"
    padding: "14px 28px"
  button-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    height: "{spacing.touch-target}"
    padding: "8px 16px"
  card-funnel:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System — Stop-Carburant

Ce document constitue la référence de vérité visuelle, ergonomique et architecturale pour l'interface de **Stop-Carburant**.

---

## 1. Overview

Stop-Carburant est une application web monopage (SPA) mobile-first conçue pour créer un électrochoc financier instantané.  
L'expérience visuelle est sombre, contrastée, percutante et sans fioritures. Chaque écran est conçu comme une réponse immédiate à une question provocatrice orientée sur la perte d'argent à la pompe.

L'objectif principal est de guider l'utilisateur en 3 clics et moins de 10 secondes jusqu'à la révélation de la solution financière, tout en garantissant une ergonomie au pouce irréprochable sur smartphone.

---

## 2. Colors

La palette repose sur un fond sombre profond (`neutral-950`), ponctué d'accents sémantiques forts pour créer un contraste immédiat entre perte financière et gain de pouvoir d'achat.

| Rôle Sémantique | Token / Code | Utilisation |
| :--- | :--- | :--- |
| **Fond général** | `#0a0a0a` (`neutral-950`) | Fond d'écran immersif |
| **Texte principal** | `#f5f5f5` (`neutral-100`) | Titres, montants clés |
| **Texte secondaire** | `#a3a3a3` (`neutral-400`) | Explications de contexte, labels |
| **Perte / Hémorragie** | `#f43f5e` (`rose-500`) | Budget carburant gaspillé, perte sèche sur 5 ans |
| **Gain / Victoire** | `#10b981` (`emerald-500`) | Cash mensuel libéré, mensualité récupérée |
| **Alerte / Reste** | `#f59e0b` (`amber-500`) | Curseurs actifs, reste à charge éventuel, badges |
| **Action principale** | Dégradé `rose-600` vers `amber-600` | Bouton principal de déblocage / étape suivante |

> **Règle de contraste :** Ne jamais superposer de texte gris (`neutral-400/500`) sur un aplat coloré (ambre, émeraude, rose). Utiliser du texte noir pur `#000000` ou blanc pur `#ffffff` pour garantir la lisibilité WCAG AA.

---

## 3. Typography

- **Police Titres & Chiffres Chocs (`font-display`) :** `Outfit`, complétée par `Plus Jakarta Sans`. Graisses 700/800 géométriques, nettes et aérées, pour une lisibilité parfaite sur smartphone et des chiffres d'impact équilibrés.
- **Police Courante (`font-sans`) :** `Plus Jakarta Sans`, lisible et nette sur écrans mobiles de toutes résolutions.
- **Police Données Financières (`font-mono`) :** Police monospace système pour l'alignement strict des tableaux comparatifs, factures et montants en euros.

---

## 4. Layout

L'interface est strictement pensée pour les terminaux mobiles tout en restant centrée et élégante sur grand écran.

- **Conteneur vertical :** Toujours employer `min-h-[100dvh]` pour éviter les sauts de hauteur causés par l'apparition/disparition des barres d'adresse sur Safari iOS et Chrome mobile.
- **Alignement :** `justify-start sm:justify-center` avec un padding fluide (`px-3 sm:px-4 py-4 sm:py-8`). Ne pas forcer un centrage rigide qui produirait d'immenses bandes noires vides sur petits écrans.
- **Ergonomie au pouce :** Les éléments d'interaction fréquents et le bouton CTA principal sont positionnés dans la zone naturelle d'atteinte du pouce, en bas d'écran sur mobile (`w-full sm:w-auto`).

---

## 5. Elevation & Depth

Le design privilégie la hiérarchie tonale plutôt que les ombres diffuses superflues.

- **Niveau 0 (Fond) :** Noir neutre `bg-neutral-950`.
- **Niveau 1 (Cartes de contenu) :** `bg-neutral-900/90` avec bordure fine `border-neutral-800`.
- **Accents lumineux :** Halos subtils (`glow`) sur les curseurs actifs et les chiffres clés (`box-shadow: 0 0 18px rgba(245, 158, 11, 0.7)`).
- **Profondeur d'état :** États actifs avec légère mise à l'échelle (`transform: scale(1.05)`) et transition fluide.

---

## 6. Shapes

- **Rayons de courbure :** 
  - Cartes principales : `rounded-2xl sm:rounded-3xl` (16px à 24px) pour adoucir les blocs d'information denses.
  - Boutons de présélection (Pills) : `rounded-full` (curseurs de présélection au pouce : 100 €, 200 €, 300 €).
  - Champs et contrôles : `rounded-xl` (12px).
- **Contrôles tactiles (Sliders) :** Curseur tactile élargi à 28px (`touch-action: pan-y`) avec anneau blanc pour une manipulation fluide sans blocage du défilement vertical.

---

## 7. Components

### 7.1. Cartes d'étape (Funnel Cards)
Conteneur unifié par étape. Chaque carte présente :
1. Une question provocatrice unique en titre.
2. Un contrôle interactif simple (pills de présélection + slider précis).
3. Un feedback mathématique instantané (ex: équivalent km/mois).
4. Un bouton d'action pleine largeur sur mobile.

### 7.2. Format « Ticket de Caisse »
Pour la comparaison financière de l'étape 4 :
- Décomposition ligne à ligne façon facture nette (`divide-y divide-neutral-800`).
- Suppression des cartes imbriquées sur plusieurs niveaux pour une lisibilité immédiate.
- Mention claire des unités (ex: `/ mois` au lieu de l'abréviation ambiguë `/ m`).

### 7.3. Double Mode Révélation (Vue Essentielle vs Détail Précis)
- **Sélecteur 100% exclusif :** Bascule claire entre deux modes sans actions redondantes :
  - *Vue Essentielle :* Les 3 chiffres chocs au pouce (Perte carburant, Coût électrique, Gain net direct) et le véhicule d'occasion recommandé, sans accordéon superflu en dessous.
  - *Détail des calculs :* Audit financier complet continu au format Ticket de Caisse (sans sous-onglets), surmonté d'un bandeau récapitulatif fixe (*sticky*) pour observer en temps réel l'impact de l'apport de reprise, du tarif électricité (HP/HC) et du prêt.

---

## 8. Do's and Don'ts

### 🏛️ Les 4 Piliers Invariants

1. **Mobile-First & Zéro vide vertical :**
   - ✅ DO : Employer `min-h-[100dvh]`, cibles tactiles >= 44px, disposition ergonomique au pouce.
   - ❌ DON'T : Ne jamais utiliser `h-screen` ou `min-h-screen` qui sautent sur smartphone.
2. **Principe du Cheval de Troie (Zero Leakage) :**
   - ✅ DO : Cadrer les étapes 1 et 2 exclusivement sur le budget et la perte financière personnelle.
   - ❌ DON'T : **Zéro mention** de VE, électrique, batterie, kWh, borne, prise ou autonomie avant l'étape 4 de révélation.
3. **Charge cognitive minimale :**
   - ✅ DO : Un seul objectif clair par écran, présélections au pouce (pills) pour éviter les micro-ajustements.
   - ❌ DON'T : Pas de badges multicolores redondants ni de blocs de texte indigestes.
4. **Format Ticket de Caisse :**
   - ✅ DO : Présenter les calculs sous forme de facture épurée ligne à ligne.
   - ❌ DON'T : Pas de cartes imbriquées dans des cartes sur 3 ou 4 niveaux.

### 🚫 Anti-Patterns Spécifiques & Qualité d'Exécution

- **Animations :** Proscrire les animations de rebond désuètes (`animate-bounce`). Utiliser des courbes d'atténuation naturelles (`ease-out`).
- **Contrastes de texte :** Aucun texte gris sur aplat coloré vif.
- **Tests & Robustesse :**
  - Exécuter la suite de tests : `npx vitest run` (tous les tests doivent passer).
  - Vérifier la compilation TypeScript : `npm run build`.
