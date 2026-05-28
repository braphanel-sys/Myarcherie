# ArcherAI — Changelog

> Application web/mobile de scoring tir à l'arc par intelligence artificielle  
> Club de Tir à l'Arc — Développé avec Claude (Anthropic)  
> Hébergement : [myarcherie.vercel.app](https://myarcherie.vercel.app)

---

## V4.3 — Fiabilité & outils archer *(Mai 2026 — actuelle)*

### Ajouté
- **Correction manuelle des scores** : tap sur un badge de flèche pour modifier la valeur — total de la volée et score de session recalculés immédiatement. Fonctionne en Solo et Duo
- **Compteur d'analyses** : panneau admin accessible par appui long (3s) sur le logo — affiche le total des analyses depuis le début (Upstash Redis)
- **Vercel Analytics** activé — suivi des visites et appareils
- **Formats FFTA restructurés** : sections Salle / Extérieur / Autres, triés par distance croissante, types d'arc en français (Arc classique / Arc à poulies / Arc nu)
- **Formats enrichis** : 50m/122cm pour Arc classique, 50m Compound séparé, 20m U13

### Amélioré
- **Prompt IA v2** : règle absolue de ne détecter que les fûts physiquement plantés — les impacts vides, trous et déchirures sont ignorés
- **Proxy API** : accepte un prompt custom depuis le frontend (utilisé en mode Duo pour la description précise des plumes)

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

*Document mis à jour le 28 mai 2026*
