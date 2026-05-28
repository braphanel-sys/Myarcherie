# ArcherAI — Changelog

> Application web/mobile de scoring tir à l'arc par intelligence artificielle  
> Club de Tir à l'Arc — Développé avec Claude (Anthropic)  
> Hébergement : [myarcherie.vercel.app](https://myarcherie.vercel.app)

---

## V4.2 — Profil flèche complet, formats réorganisés & correction de scores *(Mai 2026 — en cours)*

### Ajouté
- **Correction de flèches** : cliquer sur un badge de score (Solo ou Duo) ouvre une invite pour corriger la valeur — le total de la volée et le score de session sont recalculés à la volée
- Configuration complète de la flèche dans le profil : plume coq, latérale gauche, latérale droite, encoche — chacune avec sélecteur de couleur indépendant
- Les deux latérales peuvent être identiques ou de couleurs différentes
- Archer 1 en mode Duo pré-rempli automatiquement depuis le profil
- Prompt IA enrichi en mode Duo : description précise des 3 plumes + encoche pour une attribution fiable des flèches
- Nouveau format FFTA : **Extérieur 20m** (80cm · 12×6 = 72 flèches) pour Arc classique

### Modifié
- **Types d'arc renommés en français** : Recurve → Arc classique, Compound → Arc à poulies, Barebow → Arc nu (Longbow et Classique supprimés)
- **Grille des formats FFTA reorganisée par sections** : Salle / Extérieur / Autres — les formats recommandés selon le profil sont mis en avant dans chaque section
- Style des étiquettes de section : couleur dorée (`--gold`), meilleure lisibilité

### Corrigé
- Double déclaration `let` qui bloquait tout le JavaScript au démarrage
- Accolade surnuméraire causant une erreur de syntaxe fatale
- Callbacks sérialisés avec `.toString()` remplacés par une fonction globale nommée `selectFlecheColor` — fiable sur tous les navigateurs mobiles

### Verrouillé ✅
- Analyse photo + scoring IA
- Mode Solo / Duo + reconnaissance plumes
- Profil archer
- Sessions + formats FFTA
- Historique local
- Objectif + barre de progression
- File d'attente hors ligne
- Bouton Guide

---

## V4.1 — Profil archer & formats intelligents *(Mai 2026)*

### Ajouté
- **Écran Profil** accessible depuis l'accueil : prénom, type d'arc, couleurs de plumes
- **Formats FFTA filtrés** selon le type d'arc du profil — les épreuves correspondantes apparaissent en premier avec badge ⭐, les autres restent accessibles
- Type d'arc affiché comme étiquette informative sur les sessions sauvegardées
- Archer 1 en mode Duo pré-rempli depuis le profil (nom + couleurs)
- Carte profil toujours visible sur l'accueil avec aperçu des couleurs de plumes

### Technique
- Structure localStorage : `archerProfil` (profil) + `archerAI_sessions` (historique) + `archer2Fleche` (profil duo)
- Clés stables — aucune perte de données entre versions futures

---

## V4.0 — Sessions personnalisées & Historique local *(Mai 2026)*

### Ajouté
- **Écran d'accueil** avec résumé de la dernière session
- **Configuration de session** avant chaque entraînement :
  - 9 formats FFTA pré-chargés (salle 18m/40cm, Vegas, 18m/60cm U13-U15, extérieur 70/60/50/40/30m, Beursault)
  - Format libre entièrement personnalisable (distance, blason, nb volées, flèches/volée)
- **Objectif de score** avec date butée optionnelle
- **Barre de progression** en temps réel pendant la session — verte si dans le rythme, rouge si en retard
- **Écran Historique** : toutes les sessions sauvegardées en localStorage, filtrables par format
- Comparaison avec la dernière session **du même format** (et non toutes sessions confondues)
- Bouton "Rejouer" pour relancer immédiatement le même format
- Feedback objectif atteint / manqué à la fin de session
- Barre de progression par session dans l'historique
- Suppression individuelle de sessions

### Formats FFTA intégrés
| Format | Distance | Blason | Volées | Flèches | Score max |
|--------|----------|--------|--------|---------|-----------|
| Salle 18m | 18m | 40cm | 20 | 3 | 600 |
| Salle Vegas | 18m | Trispot | 20 | 3 | 600 |
| Salle U13/U15 | 18m | 60cm | 20 | 3 | 600 |
| Extérieur 70m | 70m | 122cm | 12 | 6 | 720 |
| Extérieur 60m | 60m | 122cm | 12 | 6 | 720 |
| Extérieur 50m (Compound) | 50m | 80cm | 12 | 6 | 720 |
| Extérieur 50m (Barebow) | 50m | 122cm | 12 | 6 | 720 |
| Extérieur 40m | 40m | 80cm | 12 | 6 | 720 |
| Extérieur 30m | 30m | 80cm | 12 | 6 | 720 |
| Beursault | variable | Beursault | 12 | 6 | — |

---

## V3 — Mode Duo & reconnaissance par couleur de plumes *(Mars–Avril 2026)*

### Ajouté
- **Mode Solo / Duo** sélectionnable avant l'analyse
- Configuration des couleurs de plumes par archer (1 à 3 couleurs)
- Reconnaissance automatique des flèches par couleur sur la photo
- Score séparé par archer en mode Duo
- Profils Duo sauvegardés en localStorage (nom + couleurs)
- Résultat Duo avec carte par archer + couleurs identifiantes

### Technique
- Prompt IA adaptatif selon le mode (solo ou duo)
- Parsing JSON robuste avec fallback regex

---

## V1 — Prototype fonctionnel *(Mars 2026)*

### Ajouté
- Interface web mobile (Android et iOS via navigateur)
- Prise de photo ou import depuis la galerie
- **Analyse automatique par IA** — détection des flèches et calcul des points
- Reconnaissance automatique du type de cible : WA (40/60/80/122cm), Vegas trispot, Beursault, GEF débutants
- Barèmes :
  - WA : jaune = X/10/9, rouge = 8/7, bleu = 6/5, noir = 4/3, blanc = 2/1, hors cible = M
  - Vegas : jaune = X/10/9, rouge = 8/7, bleu = 6, hors blason = M
  - Beursault/GEF : centre = 3, milieu = 2, extérieur = 1, hors cible = M
- Feuille de score par session (volées enregistrées)
- Comparaison avec la session précédente (+/- points)
- Ajout à l'écran d'accueil — fonctionne comme une vraie app (PWA)
- **File d'attente hors ligne** : photos stockées localement si pas de réseau, analysées automatiquement au retour de la connexion
- Page guide-scoring.html : explication des zones, conseils photo, aperçu de l'interface
- Bouton "? Guide" dans le header

### Technique
- Frontend : HTML / CSS / JavaScript (sans framework)
- Backend : Vercel serverless function (`api/analyze.js`) — proxy vers l'API Anthropic
- Modèle IA : `claude-sonnet-4-20250514`
- Hébergement : Vercel Pro (auto-deploy sur push GitHub)
- Source : [github.com/braphanel-sys/Myarcherie](https://github.com/braphanel-sys/Myarcherie)

### Bugs résolus en V1
- CORS → proxy Vercel serverless
- 404 case-sensitive (`Index.html` → `index.html`)
- Import galerie Android → suppression `capture="environment"`

---

## Roadmap

### V2 — Gestion des membres & Classements *(Planifié — reporté)*
- Connexion par numéro de licence FFTA
- Profil personnel + historique multi-sessions
- Classements par catégorie, discipline, type d'arc, période
- Interface administrateur
- Base de données : Supabase (PostgreSQL)

### À venir (en discussion)
- Distances par catégorie d'âge FFTA (tableau officiel intégré)
- Catégorie d'âge dans le profil → formats recommandés encore plus précis

---

*Document mis à jour le 28 mai 2026 — V4.2*
