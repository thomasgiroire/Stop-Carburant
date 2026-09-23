# Cahier des Charges : Simulateur "La Faille Carburant"

## 1. Vision et Ligne Éditoriale

**Concept :** Un outil d'acquisition web fonctionnant sur le principe du "Cheval de Troie". L'interface reprend les codes des sites de "réinformation", d'optimisation financière et d'accroches virales ("clickbait").
**Le message apparent :** "Le carburant est un gouffre financier silencieux. Voici une faille mathématique pour stopper l'hémorragie et récupérer votre cash."
**La révélation (Le twist) :** Révélée uniquement à la toute fin du parcours. La "faille" est l'acquisition d'un Véhicule Électrique (VE) financé intégralement par le transfert du budget carburant.

**Ton et Vocabulaire (ZÉRO BLA-BLA) :** Direct, incisif, interrogatif. Chaque écran est une question provocatrice ("provoquestion") qui force le clic, orientée 100% sur la perte financière personnelle.

## 2. Le Flow Utilisateur (Tunnel de conversion en 4 étapes)

1. **L'Accroche :** Provoquestion sur l'hémorragie financière mensuelle. Zéro friction.

2. **L'Électrochoc :** Provoquestion sur la perte sèche à 5 ans.

3. **Le Cash Libéré :** Provoquestion sur le mode de vie pour "vérifier l'éligibilité" à l'argent bloqué.

4. **La Révélation :** Provoquestion finale qui dévoile l'astuce (autofinancement VE).

## 3. User Stories (Exigences fonctionnelles)

* **US1 :** En tant que visiteur, je veux pouvoir indiquer mon budget carburant en choisissant un montant avec l'affichage de l'équivalent kilométrique parcouru dès le premier écran.

* **US3 :** En tant que système, je dois calculer la perte financière de l'utilisateur sur 5 ans.

* **US4 :** En tant que visiteur, je veux voir le montant exact de *cash mensuel libéré*.

* **US4b :** En tant que visiteur, je dois renseigner mon type de logement et mon kilométrage quotidien réel à l'étape 3 pour vérifier mon "éligibilité" et débloquer la solution finale.

* **US5 :** En tant que visiteur, je veux qu'on m'explique clairement comment ce "cash" paie intégralement la mensualité d'une voiture électrique.

* **US6 :** En tant que système, je dois comparer le kilométrage quotidien avec la capacité de recharge. Si l'utilisateur est en maison, je calcule sur base d'une prise standard. S'il est en appartement, je propose le scénario de la recharge publique ou au supermarché.

* **US7 :** En tant que visiteur sceptique, je veux accéder à des sources neutres (GIEC, RTE, ADEME, statistiques d'assurances) en fin de parcours pour déconstruire les mythes.

## 4. Maquettes (Wireframes ASCII) - Version "Provoquestions"

### Écran 1 : L'Accroche (Landing Page)

```
+---------------------------------------------------------+
|                                                         |
|  Quel montant s'évapore de votre compte chaque mois     |
|  rien que pour avoir le droit d'aller travailler ?      |
|                                                         |
|  [ 50 € ]   [ 100 € ]   [ 150 € ]   [ 200 € ]   [ + ]   |
|                                                         |
|         [ VOIR LE GOUFFRE SUR 5 ANS > ]                 |
|                                                         |
+---------------------------------------------------------+

```

### Écran 2 : L'Électrochoc

```
+---------------------------------------------------------+
|                                                         |
|  Prêt à jeter 12 000 € par la fenêtre d'ici 5 ans ?     |
|                                                         |
|        [ NON, JE VEUX STOPPER L'HÉMORRAGIE > ]          |
|                                                         |
+---------------------------------------------------------+

```

### Écran 3 : Le Cash Libéré (La Qualification)

```
+---------------------------------------------------------+
|                                                         |
|  Plus que 2 informations pour calculer le montant       |
|  exact de votre cash à récupérer :                      |
|                                                         |
|  Où dort votre voiture le soir ?                        |
|                                                         |
|  [ Maison (avec prise) ]       [ Appartement (rue) ]    |
|                                                         |
|                                                         |
|  Combien de kilomètres faites-vous par jour ?           |
|                                                         |
|  <---------[   45 km   ]--------->                      |
|                                                         |
|         [ DÉVERROUILLER MON HACK FINANCIER > ]          |
|                                                         |
+---------------------------------------------------------+

```

### Écran 4 : La Révélation

```
+---------------------------------------------------------+
|                                                         |
|  Et si votre budget carburant payait DÉJÀ votre         |
|  prochaine voiture sans que vous le sachiez ?           |
|                                                         |
|  [ ANIMATION : Le budget "Essence" (ex: 200€) glisse ]  |
|  [ et se transforme en "Mensualité Voiture"          ]  |
|                                                         |
|  NOUVELLE VOITURE + RECHARGE : 200 € / MOIS             |
|                                                         |
|  >> NOUVELLE DÉPENSE : 0 € <<                           |
|                                                         |
|  [Si Maison :]                                          |
|  Une borne ? Pour quoi faire ? Votre prise classique    |
|  redonne 100km chaque nuit pour 2€. Point barre.        |
|                                                         |
|  [Si Appartement :]                                     |
|  Pas de prise ? Et alors ? 45 minutes branché pendant   |
|  vos courses couvrent votre semaine. Déjà calculé.      |
|                                                         |
|        [ VOUS Criez AU COMPLOT ? VOIR LES PREUVES v ]   |
|                                                         |
+---------------------------------------------------------+

```

## 5. Modèle de Calcul et Formules (Backend)

Variables d'entrée :

* $B_{mensuel}$ : Budget mensuel carburant (en €)

* $L_{type}$ : Type de logement (Maison = 1, Appartement = 2)

* $K_{jour}$ : Kilométrage quotidien saisi à l'étape 3.

Constantes :

* $P_{carb} = 2,00$ €/L | $C_{therm} = 6,5$ L/100 km

* $C_{elec} = 17$ kWh/100 km | $P_{dom} = 0,25$ € | $P_{pub} = 0,45$ €

* Gain entretien $G_{ent} = 30$ €/mois.

* Capacité nuit sur prise domestique $Recup_{nuit} = 100$ km.

**Calcul 1 : Kilométrage Mensuel Implicite (**$K_{mensuel}$**)**

$$
K_{mensuel} = \frac{B_{mensuel}}{P_{carb}} \times \frac{100}{C_{therm}}
$$

**Calcul 2 : Cash Libéré (** $B_{libere}$**)**

$$
E_{elec} = \frac{K_{mensuel}}{100} \times C_{elec} \times P_{dom} \text{ (ou } P_{pub} \text{ si appartement)}
$$

$$
B_{libere} = (B_{mensuel} - E_{elec}) + G_{ent}
$$

## 6. La FAQ "Anti-Biais" (Fin de Tunnel)

*(Les réponses doivent contenir des liens cliquables vers les sources institutionnelles).*

* **"Les batteries sont mortes au bout de 10 ans, il faut repayer 15 000 € !"**
  * *Réponse :* Faux. Les données réelles sur des milliers de véhicules montrent une perte de capacité de seulement 1,8 % par an. La batterie est garantie pour survivre au reste de la voiture (durée de vie estimée à plus de 20 ans).
  * *Source :* Analyse de la santé des batteries sur 10 000 VE en circulation (Geotab).

* **"C'est super dangereux, les voitures électriques prennent feu sans arrêt !"**
  * *Réponse :* Les statistiques officielles des pompiers prouvent l'inverse. Une voiture thermique (qui transporte des dizaines de litres de carburant inflammable) a 20 fois plus de risques de prendre feu qu'une électrique.
  * *Source :* Agence suédoise de protection civile (MSB) / Statistiques nationales d'incendie.

* **"C'est beaucoup trop compliqué à utiliser au quotidien !"**
  * *Réponse :* C'est l'inverse : c'est un smartphone sur roues. Il n'y a pas de vitesses à passer, vous la branchez le soir comme votre téléphone, et sur les longs trajets, le GPS planifie tout seul les arrêts recharge sans que vous ayez à réfléchir.
  * *Source :* Études d'usage et satisfaction des conducteurs (Avere-France).

* **"Oui mais la fabrication de la batterie pollue plus que le diesel !"**
  * *Réponse :* C'est faux sur la durée de vie du véhicule. En France, une électrique rembourse sa "dette carbone" de fabrication en 30 000 km.
  * *Source :* Rapport "L'empreinte carbone des véhicules" (ADEME).

* **"Le réseau électrique va s'effondrer si on s'y met tous !"**
  * *Réponse :* Le réseau est conçu pour les pics hivernaux de 19h. Les voitures chargent la nuit. 15 millions de VE = 10% de la capacité totale du réseau.
  * *Source :* Bilan prévisionnel (RTE).

* **"On va manquer de terres rares !"**
  * *Réponse :* Les batteries lithium-ion (la majorité) ne contiennent pas de terres rares, contrairement à la ligne d'échappement de votre voiture thermique actuelle.
  * *Source :* Agence Internationale de l'Énergie (AIE).