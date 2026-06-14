# ArcherAI — Changelog

> Application web/mobile de scoring tir à l'arc par intelligence artificielle  
> Club de Tir à l'Arc — Développé avec Claude (Anthropic)  
> Hébergement : [myarcherie.vercel.app](https://myarcherie.vercel.app)

---

## V4.6.3 — Historique : détail des volées au tap *(Juin 2026 — actuelle)*

### Ajouté
- **Détail des volées au tap** : taper sur une session dans l'historique déploie le détail volée par volée avec badges scores colorés (or/rouge/blanc selon valeur)
- **Chevron indicateur** : `▼` dans le titre de la carte, passe à `▲` quand le détail est ouvert
- **Bouton 🗑 indépendant** : `event.stopPropagation()` sur le bouton suppression — le tap sur la carte ne déclenche plus accidentellement la suppression

### Technique
- `hasVolleys` : guard — n'affiche le chevron et le toggle que si `s.volleys[0].arrows` existe
- `toggleHistoryDetail(i)` : toggle `display:none/block` sur `#volleys-{i}`, met à jour `#chev-{i}`
- Nouvelles classes CSS : `.session-card-expandable`, `.history-chevron`, `.history-volley-row`, `.history-volley-label`, `.history-volley-arrows`, `.history-volley-total`

---

## V4.6.2 — Timer : mode boucle (relance auto à chaque volée) *(Juin 2026)*

### Ajouté
- **Timer compétition** : chrono intégré dans l'écran Home avec 3 durées (1 min / 2 min / 4 min) + phase de préparation 10s avec bip sonore
- **Mode boucle 🔁** : toggle qui relance automatiquement le timer à la fin de chaque volée analysée — idéal en compétition ou entraînement cadencé
- **Feedback sonore** : bip de départ (préparation), bip de début de tir, buzzer 3 tons à la fin
- **Export/Import données** : bouton dans les réglages pour exporter/importer profil + sessions en JSON

### Technique
- `timerState.loop` : flag boucle ; `timerState.lastDuration` : mémorise la durée pour relance
- Relance via `callAPI()` : `setTimeout(() => startTimer(lastDuration), 1500)` si `loop` actif
- `cancelTimer()` appelé dans `endSession()` pour arrêt propre en fin de session

---

## V4.6.0 — Correctifs audit complet *(Juin 2026)*

### Corrigé
- **Modal restauration >4h** : le modal ne bloquait plus la navigation — corrigé
- **Photos strippées de l'historique** : les données base64 sont retirées des sessions sauvegardées pour ne pas saturer le localStorage
- **callAPI sans session active** : guard ajouté pour éviter l'appel si aucune session n'est en cours
- **archer2Name persistant** : le nom du 2e archer en mode duo est désormais correctement sauvegardé

### Sécurité
- **API sécurisée — prompts côté serveur** : `api/analyze.js` ne reçoit plus un `prompt` libre du client mais des données structurées (`mode`, `a1`, `a2`, `desc1`, `desc2`) — le prompt est construit et contrôlé entièrement côté serveur
- **CORS restreint** : `Access-Control-Allow-Origin` limité à `https://myarcherie.vercel.app` (plus de `*`)
- **Sanitisation des entrées** : noms et descriptions archers nettoyés (regex Unicode, longueur max)

### Amélioré
- **SW update fiabilisé** : détection et activation du nouveau Service Worker rendue plus robuste
- **manifest.json restauré** : fichier manifest corrigé/restauré
- **Bandeau version** : affiche désormais `v4.6.0`

---

## V4.5.9 — Fix restauration tri de flèches *(Juin 2026)*

### Corrigé
- **Tri de flèches** : la page de saisie ne remonte plus au démarrage après fermeture de l'app — `clearTriDraft()` n'était pas appelé via `endTri()` quand des données étaient présentes

---

## V4.5.8 — Tri de flèches : saisie libre *(Juin 2026)*

### Modifié
- **Tri de flèches — saisie libre** : les chips prédéfinis (6/8/10/12 flèches, 3/6/10/12 volées, 3/6/8/10 à conserver) remplacés par des `<input type="number">` libres (min 1, max 99)
- Auto-correction : si "à conserver" > "nb flèches", la valeur est ramenée au nombre de flèches et l'input mis à jour

---

## V4.5.7 — Stockage photos + export ZIP *(Juin 2026)*

### Ajouté
- **Stockage photo par volée** : chaque volée analysée conserve l'image compressée (`photo: base64`) dans `currentSession.volleys[]`
- **Export ZIP** : bouton "📥 Télécharger les photos" apparaît dans le modal de fin de session si au moins une photo est disponible ; génère un ZIP `ArcherAI_YYYY-MM-DD.zip` via JSZip (CDN), chaque fichier nommé `volee-N_Xpts.jpg`
- **JSZip 3.10.1** chargé via CDN (cloudflare) dans `index.html`, avant `app.js`

---

## V4.5.6 — Fix comptage flèches/volée *(Juin 2026)*

### Corrigé
- **arrowCount basé sur `format.apv`** : le nombre de flèches par volée est désormais tiré du format de tir configuré (`format.apv`) et non de `result.count` retourné par l'IA — évite la sur-détection (ex. trous dans la cible comptés comme flèches)
- Solo : `apv || result.count` (fallback si format libre sans apv)
- Duo : `apv * 2 || result.archer1.count + result.archer2.count`
- `const apv` factorisé avant le `if/else` — couvre les deux modes

---

## V4.5.5 — Restauration session lastActivityAt *(Juin 2026)*

### Modifié
- **Restauration session** : l'âge du brouillon est désormais calculé depuis `lastActivityAt` (dernière volée enregistrée) et non plus depuis `startDate` — évite les fausses alertes sur les longues sessions
- **Seuil unique 4h** : suppression du seuil modal à 12h ; au-delà de 4h d'inactivité, un simple toast s'affiche pendant 6s, la session est toujours restaurée automatiquement
- **Toast 6s** : durée portée de 4s à 6s pour laisser le temps de lire

---

## V4.5.4 — Extraction JS dans app.js *(Juin 2026)*

### Modifié
- **Refacto critique** : tout le JS extrait de `index.html` dans un fichier externe `app.js` — résout définitivement le SyntaxError sur Android Chrome et parsers iOS
- `index.html` allégé à ~817 lignes (CSS + HTML uniquement), `app.js` contient les ~1186 lignes de logique
- `app.js` ajouté au précache du Service Worker

---

## V4.5.3 — Fix SyntaxError Android *(Juin 2026)*

### Corrigé
- **Fix critique Android Chrome** : caractères Unicode `═` (U+2550) dans les commentaires JS remplacés par `=` simples — corrige le SyntaxError qui cassait l'app sur Android

---

## V4.5.2 — Bandeau version accueil *(Juin 2026)*

### Ajouté
- **Bandeau version** : affichage "ArcherAI v4.5.1" en bas de l'écran d'accueil pour faciliter le debug

---

## V4.5.1 — Fix modal restauration *(Juin 2026)*

### Corrigé
- **Modal restauration session** : `pointer-events:none` par défaut sur l'overlay — le modal invisible ne bloquait plus les clics et la navigation (profil inaccessible)

---

## V4.5 — Tri de flèches + compression image *(Juin 2026)*

### Ajouté
- **Tri de flèches** : nouvel outil accessible depuis l'accueil — config (nb flèches, nb volées, nb à conserver), saisie des impacts sur cible WA interactive (SVG, zoom/pinch tactile), classement par dispersion, mini-cibles par flèche, résumé visuel garder ✅ / écarter ❌
- **Auto-save du tri** : état du tri en cours sauvegardé dans `archerAI_tri_draft`, restauré automatiquement au démarrage si interrompu

### Amélioré
- **Compression image avant envoi IA** : redimensionnement canvas (max 1200px) + JPEG 0.82 — réduit la taille des requêtes sans perte visible de précision
- **Session draft refactorisée** : clé renommée `archerAI_session_draft`, fonctions clarifiées (`autoSaveSession`, `confirmRestoreSession`, `confirmDiscardSession`), restauration qui recharge aussi le format et l'objectif

---

## V4.4 — Persistance & restauration de session *(Juin 2026)*

### Ajouté
- **Sauvegarde automatique de session** : la session en cours est écrite dans localStorage (`archerAI_currentSession`) après chaque volée et à la fin de session
- **Restauration intelligente au démarrage** : si une session interrompue est détectée, comportement adapté selon l'ancienneté — silencieux < 4h, toast discret entre 4h et 12h, modal de choix au-delà
- **Modal "Session retrouvée"** : affiche le résumé (nb volées, pts, durée) avec boutons Reprendre / Nouvelle session

---

## V4.3 — Fiabilité & outils archer *(Mai 2026)*

### Ajouté
- **Correction manuelle des scores** : tap sur un badge de flèche pour modifier la valeur — total de la volée et score de session recalculés immédiatement. Fonctionne en Solo et Duo
- **Compteur d'analyses** : panneau admin accessible par appui long (3s) sur le logo — affiche le total des analyses depuis le début (Upstash Redis)
- **Vercel Analytics** activé — suivi des visites et appareils
- **Formats FFTA restructurés** : sections Salle / Extérieur / Autres, triés par distance croissante, types d'arc en français (Arc classique / Arc à poulies / Arc nu)
- **Formats enrichis** : 50m/122cm pour Arc classique, 50m Compound séparé, 20m U13

### Amélioré
- **Prompt IA v2** : règle absolue de ne détecter que les fûts physiquement plantés — les impacts vides, trous et déchirures sont ignorés
- **Proxy API** : accepte un prompt custom depuis le frontend (utilisé en mode Duo pour la description précise des plumes)
- **Bandeau "Mise à jour disponible"** : détection automatique d'un nouveau Service Worker installé — bouton "Actualiser" déclenche `skipWaiting` et recharge la page sans intervention manuelle
- **Service Worker simplifié** : cache `archerAI-v4.3`, préchargement de `/`, `/index.html`, `/guide-scoring.html` à l'installation ; stale-while-revalidate allégé, bypass total pour `/api/`

### Verrouillé ✅
- Analyse photo + scoring IA
- Mode Solo / Duo + reconnaissance plumes (coq / lat. gauche / lat. droite / encoche)
- Profil archer complet
- Sessions personnalisées + formats FFTA
- Historique local + objectif + barre de progression
- File d'attente hors ligne
- Correction manuelle des scores
- Compteur admin secret

---

## V4.2 — Profil flèche complet *(Mai 2026)*

### Ajouté
- Configuration complète de la flèche dans le profil : plume coq, latérale gauche, latérale droite, encoche — chacune avec sélecteur de couleur indépendant
- Les deux latérales peuvent être identiques ou de couleurs différentes
- Archer 1 en mode Duo pré-rempli automatiquement depuis le profil

### Corrigé
- Double déclaration `let` bloquant tout le JavaScript au démarrage
- Callbacks sérialisés remplacés par une fonction globale nommée `selectFlecheColor`

---

## V4.1 — Profil archer & formats intelligents *(Mai 2026)*

### Ajouté
- Écran Profil accessible depuis l'accueil : prénom, type d'arc, plumes
- Formats FFTA filtrés selon le type d'arc — recommandés en premier avec badge ⭐
- Carte profil toujours visible sur l'accueil
- Archer 1 en mode Duo pré-rempli depuis le profil

---

## V4.0 — Sessions personnalisées & Historique local *(Mai 2026)*

### Ajouté
- Écran d'accueil avec résumé de la dernière session
- Configuration de session : 10 formats FFTA pré-chargés + format libre
- Objectif de score avec date butée optionnelle
- Barre de progression en temps réel (verte si dans le rythme, rouge si en retard)
- Historique local : toutes sessions filtrables par format, suppression individuelle
- Comparaison avec la dernière session du même format
- Bouton "Rejouer"

---

## V3 — Mode Duo & reconnaissance par couleur de plumes *(Mars–Avril 2026)*

### Ajouté
- Mode Solo / Duo sélectionnable avant l'analyse
- Reconnaissance automatique des flèches par couleur des plumes
- Score séparé par archer en mode Duo

---

## V1 — Prototype fonctionnel *(Mars 2026)*

### Ajouté
- Interface web mobile (Android et iOS via navigateur)
- Analyse automatique par IA : détection des flèches + calcul des points
- Reconnaissance du type de cible : WA, Vegas, Beursault, GEF
- Feuille de score par session + comparaison session précédente
- PWA : ajout à l'écran d'accueil
- File d'attente hors ligne
- Guide de bonne pratique (guide-scoring.html)

### Technique
- Frontend : HTML / CSS / JavaScript (sans framework)
- Backend : Vercel serverless (`api/analyze.js`) — proxy Anthropic API
- Modèle IA : `claude-sonnet-4-20250514`
- Hébergement : Vercel Pro — auto-deploy sur push GitHub
- Source : [github.com/braphanel-sys/Myarcherie](https://github.com/braphanel-sys/Myarcherie)

---

*Document mis à jour le 10 juin 2026 — V4.5.9*
