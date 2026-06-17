# Scoring géométrique — Document de conception

> Document vivant. Capture les décisions de conception du système de scoring
> géométrique d'ArcherAI. À mettre à jour au fil des chantiers.
>
> Dernière mise à jour : 2026-06-16 (soirée de conception)

---

## 1. Pourquoi ce chantier

### Le problème observé
Le scoring visuel actuel (l'IA estime directement la zone/score de chaque flèche)
souffre de deux faiblesses, mesurées sur cible réelle usagée :

- **Sur-comptage des flèches** — l'IA compte d'anciens impacts comme des flèches.
  → Réglé en V4.6.9-dev (prompt renforcé : "tige + empennage visibles", `apv` transmis).
- **Imprécision du scoring fin** — l'IA situe mal chaque flèche dans son anneau,
  surtout sur cible délavée où les couleurs sont ambiguës.
  → **C'est l'objet de ce chantier.**

### Exemple chiffré (session V4.6.8, cible 60cm à 50m, très usagée)
| Flèche | Réel | IA | Écart |
|--------|------|-----|-------|
| 1 | 10 | 9 | -1 |
| 2 | 8 | 7 | -1 |
| 3 | 8 | 6 | -2 |
| 4 | 8 | 5 | -3 |
| **Total** | **34** | **27** | **-7** |

L'IA confond le rouge délavé avec le bleu et sous-cote systématiquement.

### Le principe de la solution
Plutôt que demander à l'IA d'interpréter les couleurs/zones (fragile), on lui
demande de faire de la **géométrie pure** : localiser chaque impact dans le plan.
Le **client** calcule ensuite le score à partir des proportions WA normalisées.

L'IA fait ce qu'elle sait faire (repérer des positions dans une image).
Le code fait ce qu'il sait faire (un calcul déterministe).

---

## 2. Décisions de conception actées

### Décision 1 — Référentiel : photo de référence + photo de volée
On envoie **deux images** à l'IA dans le même appel :
1. La **photo de référence** (cible vide, capturée en début de session depuis V4.6.5-dev)
2. La **photo de volée** (avec les flèches plantées)

L'IA cale le centre et le rayon sur la référence (anneaux nets, centre visible),
puis positionne les flèches sur la photo de volée par rapport à ce référentiel.

**Pourquoi :**
- Réutilise une feature déjà construite (photo de référence)
- Compense la faiblesse principale du "tout sur une image" : le centre peut être
  caché par des flèches plantées dedans
- Sur la référence vide, les anciens impacts sont vus dans leur état passif →
  aide l'IA à les distinguer des vraies flèches
- Aucune friction terrain : la photo de référence se prend pendant l'installation
  de la cible, avant de tirer

### Décision 2 — Format de réponse : cartésien normalisé `{x, y}`
L'IA renvoie pour chaque flèche des **coordonnées cartésiennes normalisées** :
- Origine `(0, 0)` = centre de la cible
- Rayon nominal = `1` (= bord externe de la zone 1, dernier anneau scorable)

```json
{
  "type": "WA",
  "arrows": [
    { "x": 0.05, "y": -0.08 },
    { "x": 0.12, "y": 0.03 }
  ]
}
```

**Pourquoi cartésien et pas "rayon seul" :**
- Le rayon seul (`{r}`) suffit pour le score MAIS jette l'information angulaire.
- Deux flèches à r=0.3 en haut et en bas ont le même r mais sont à l'opposé →
  impossible de reconstruire la dispersion 2D.
- **Données en format rayon-seul = inexploitables pour la progression/dispersion.**
  Le jour où on veut ces features, il faut tout recollecter.
- Le cartésien sert à la fois le scoring (`r = √(x²+y²)`) ET toutes les features
  futures (progression, analyse de dispersion fishtailing/marsouinage).
- Format naturel pour l'IA (elle repère des positions x/y dans une image).

> Note : polaire `(r, θ)` serait aussi exploitable (conversion réversible vers
> cartésien), mais cartésien est plus direct pour l'IA et pour le calcul client.

### Décision 3 — Perspective : on assume circulaire (V1)
On suppose que la cible apparaît **circulaire** (photo prise de face).
Pas de redressement d'ellipse / correction de perspective dans la V1.

**Pourquoi c'est acceptable :**
- La correction de perspective côté IA est complexe et source d'erreurs.
- On déplace le problème en amont : si l'archer prend la photo de face,
  il n'y a plus de perspective à corriger (voir Décision 4).
- À valider sur le dataset : si l'erreur résiduelle est rédhibitoire, on
  réévaluera une correction d'ellipse via la photo de référence.

### Décision 4 — Prise de vue guidée par l'archer
L'humain fait la part facile (se positionner de face), l'IA fait la part
difficile (localiser les impacts).

- **Immédiat (zéro code)** : consigne mentale — se placer face à la cible,
  à hauteur du centre, blason cadré entier.
- **À terme** : un **cadre de visée** affiché sur le flux caméra. L'archer aligne
  le rond de la cible sur le cadre → garantit une prise de vue de face.

#### Spécifications du cadre de visée
- **Forme : un CERCLE** (pas un carré). L'archer aligne le rond de la cible sur
  le rond du cadre. Un cadre rond force le cadrage de face ; un carré laisserait
  passer des prises de biais.
- **Taille : UNIQUE et normalisée**, indépendante de la taille de cible.
  - Le cadre contraint l'ANGLE de prise de vue, pas la mesure de la cible.
  - Que le blason fasse 40/60/80/122 cm, l'archer recule/avance jusqu'à ce que
    le blason remplisse le cadre.
  - Cohérent avec le scoring homothétique (% du rayon, indépendant du diamètre).
  - **Ne PAS** faire un cadre par format : aucun gain de précision, complexité inutile,
    et ça supposerait une distance archer-cible fixe (faux).
- Les dimensions réelles du blason connues par la session ne servent PAS au cadrage.
  Elles serviront plus tard, en post-traitement, pour convertir un écart en cm réels
  (ex : "groupement de 12 cm") dans l'analyse de dispersion.

---

## 3. Calcul du score côté client (WA)

Une fois les coordonnées `{x, y}` reçues, le score est déterministe et trivial.

### Géométrie WA normalisée
Sur une cible WA à 10 zones, chaque anneau fait 1/10 du rayon total.
Le rayon nominal = 1 correspond au bord externe de la zone 1.

| Zone (score) | Rayon depuis le centre |
|--------------|------------------------|
| 10 | 0.00 → 0.10 |
| 9 | 0.10 → 0.20 |
| 8 | 0.20 → 0.30 |
| 7 | 0.30 → 0.40 |
| 6 | 0.40 → 0.50 |
| 5 | 0.50 → 0.60 |
| 4 | 0.60 → 0.70 |
| 3 | 0.70 → 0.80 |
| 2 | 0.80 → 0.90 |
| 1 | 0.90 → 1.00 |
| M (raté) | > 1.00 |

### Pseudo-code
```js
function scoreFromXY(x, y) {
  const r = Math.sqrt(x * x + y * y);
  if (r > 1.0) return 'M';
  // zone = 10 pour r dans [0, 0.1[, 9 pour [0.1, 0.2[, etc.
  const score = 10 - Math.floor(r * 10);
  return Math.max(1, Math.min(10, score));
}
```

> À confirmer : gestion du "X" (10 intérieur) si pertinent pour les formats
> qui le distinguent. Probablement r < 0.05.

> Autres formats (Vegas, Beursault) : adapter les seuils. Le principe homothétique
> reste le même, seul le nombre de zones et leur barème changent.

---

## 4. Méthode de validation (banc de test)

### Le dataset
`tests/cibles_reelles/` sur la branche `dev` contient :
- ~10 photos de cibles réelles (usagées, conditions variées)
- `annotations.json` : pour chaque photo, le format + les scores réels connus

Format d'une annotation :
```json
{ "photo": "1781431057959.jpg", "format": "WA", "scores_reels": [5, 5, 5, 5] }
```

### Protocole avant tout déploiement
1. **Baseline** : faire tourner l'approche ACTUELLE (V4.6.9) sur les N photos →
   mesurer l'écart moyen par flèche, le taux de sur-comptage.
2. Développer le scoring géométrique.
3. Faire tourner la NOUVELLE approche sur les **mêmes** photos.
4. Comparer : la nouvelle méthode doit faire **mieux** que la baseline pour
   justifier la bascule en prod. Pas de pari à l'aveugle, des chiffres.

### Banc de test permanent
Une fois en place, ces photos servent de **non-régression** : à chaque modif
de prompt ou d'algo, re-vérifier qu'aucune photo ne régresse.

> Idée future (chantier séparé) : bouton "Tester le dataset" dans le panneau admin
> (appui long logo) qui itère sur les photos et affiche un tableau récap d'erreur.

---

## 5. Chantiers à venir (ordre indicatif)

Chaque chantier est développé sur `dev`, testé, validé sur le dataset, puis
backporté sur `main`. Petits pas, chemins de rollback clairs.

1. **Cadre de visée circulaire** — overlay caméra, cercle unique normalisé.
   Chantier autonome, testé sur dev avant le terrain suivant.
2. **Nouveau prompt géométrique** — l'IA renvoie `{x, y}` au lieu de scores.
   Envoi de la photo de référence + photo de volée. Modifie `api/analyze.js`
   (⚠️ confirmation explicite de Raphaël requise).
3. **Calcul du score côté client** — fonction `scoreFromXY`, intégration WA
   puis autres formats. Stocker les coordonnées `impacts` dans les structures
   de données (session, volées).
4. **Validation comparée sur le dataset** — baseline vs géométrique.
5. **Bascule prod** si et seulement si la géométrie bat la baseline.

### Plus loin (déjà dans la roadmap projet)
- Records personnels par format
- Graphique de progression (depuis localStorage)
- Analyse de dispersion (fishtailing / marsouinage) — mobiliser le Guide FFTA
  des réglages d'arc présent dans le repo

---

## 6. Garde-fous & règles projet à respecter

- **Ne jamais modifier `api/analyze.js` sans confirmation explicite de Raphaël.**
- Bumper `sw.js` (cache name) + `CLAUDE.md` + `CHANGELOG.md` à chaque version.
- Bandeau version `ArcherAI vX.X.X` en bas de l'accueil (`#version-banner`).
- Vérif avant push : `wc -l` local vs `git show HEAD:fichier | wc -l` + `git diff --stat`.
- Toujours vérifier `git branch` + `pwd` en début de session (multi-PC).
- Stocker le nouveau champ `impacts` (coordonnées) sans casser l'ancien format
  de scoring : rétro-compatibilité pendant la transition.
