# ArcherAI Expert

## Description
Subagent spécialisé pour le projet ArcherAI — application web PWA de scoring tir à l'arc par IA (Claude Vision). À invoquer automatiquement dès que le contexte concerne ce projet (fichiers index.html, app.js, api/analyze.js, sw.js, ou mention d'ArcherAI).

## Vérifications obligatoires en début de session

**À faire avant toute lecture ou action** (multi-PC + doublon) :

```bash
# 1. État des lieux environnement
pwd
git branch --show-current
git status
git pull origin dev

# 2. Vérification du doublon analyze.js
diff api/analyze.js analyze.js && echo "IDENTIQUES" || echo "DIVERGENTS"
cat vercel.json 2>/dev/null
ls -la api/
```

⚠️ Sur Vercel, c'est `api/analyze.js` qui est servi comme fonction serverless.
Le `analyze.js` racine est probablement une copie. Si divergents : identifier lequel
est à jour et signaler à Raphaël AVANT toute modif du prompt — risque : "j'ai changé
le prompt mais rien ne bouge".

> **TODO (chantier propre) :** confirmer si `analyze.js` racine est mort (jamais
> servi par Vercel), puis le supprimer pour éliminer le piège définitivement.

## Contexte du projet

**Repo GitHub :** `braphanel-sys/Myarcherie`
**Hébergement :** Vercel Pro — auto-deploy sur push GitHub
**Vercel project ID :** `prj_GCysKmS3Xg2RxXSuUEBrGi97qAW9` / team `team_QMCo4yvciZKyPaOhT6QqukWn`
**Version actuelle :** ArcherAI V4.5.8 (juin 2026)

## Stack technique

- **Frontend :** HTML / CSS / JavaScript vanilla (zéro framework)
- **Fonts :** Bebas Neue (titres) + DM Sans (corps)
- **Palette :** `--dark #0D0D0D`, `--gold #C9A84C`, `--red #C0392B`, `--text #E8E0D0`, `--text-muted #8A8070`
- **API :** POST `/api/analyze` avec `{ imageBase64, prompt }` — compression canvas avant envoi (max 1200px, JPEG 0.82)
- **Backend :** Vercel serverless function `api/analyze.js` — proxy Anthropic Claude Vision
- **Persistance :** localStorage uniquement (pas de base de données)
- **PWA :** Service Worker `sw.js` + `manifest.json`

## Structure des fichiers

```
~/Documents/MyArcherie/
├── index.html          — app principale (~817 lignes, HTML+CSS uniquement)
├── app.js              — tout le JavaScript (~1186 lignes, fichier externe obligatoire)
├── analyze.js          — Doublon à clarifier — statut non confirmé (voir TODO)
├── api/analyze.js      — fonction serverless Vercel (proxy Anthropic)
├── sw.js               — Service Worker (cache archerAI-vX.X)
├── manifest.json       — config PWA
├── guide-scoring.html  — guide utilisateur scoring
├── CHANGELOG.md        — historique des versions
├── CLAUDE.md           — documentation vivante du projet
├── RETOURS_TERRAIN.md  — retours terrain club
└── SCORING_GEOMETRIQUE.md — Document de conception scoring géométrique
```

## Clés localStorage

| Clé | Contenu |
|-----|---------|
| `archerAI_profile` | `{ prenom, nom, arcTypes[], plumeColors{}, encocheColor }` |
| `archerAI_session_draft` | Session en cours (auto-save après chaque volée) |
| `archerAI_sessions` | Historique sessions terminées (30 max, antéchronologique) |
| `archerAI_duo_archers` | `[{name, colors{}}]` (2 archers mode duo) |
| `archerAI_beursault_archers` | `[{name, colors{}}]` (1-5 archers mode Beursault) |
| `archerAI_queue` | File d'attente offline (images base64) |
| `archerAI_tri_draft` | Outil tri de flèches en cours |

## Modes de scoring

1. **Solo** — 1 archer, scoring WA/Vegas/Beursault auto-détecté
2. **Duo** — 2 archers fixes, attribution par couleur de plumes
3. **Beursault** — 1 à 5 archers dynamiques, 1 flèche chacun, score 1/2/3

## Barèmes cibles

| Type | Scoring |
|------|---------|
| WA | jaune=X/10/9, rouge=8/7, bleu=6/5, noir=4/3, blanc=2/1, hors cible=M |
| Vegas | jaune=X/10/9, rouge=8/7, bleu=6, hors blason=M |
| Beursault/GEF | centre=3, milieu=2, extérieur=1, hors cible=M |

## Session persistence

Deux niveaux de restauration :
- **< 4h** → silencieuse
- **≥ 4h** → toast 6s

## Règles immuables — À NE JAMAIS VIOLER

### 1. Vérification avant push
Avant chaque push, comparer le nombre de lignes :
```bash
wc -l index.html app.js
git show HEAD:index.html | wc -l
git show HEAD:app.js | wc -l
git diff --stat
```
Signaler toute divergence avant d'agir.

> **Incident référence :** un index.html de 1137 lignes a failli écraser la version committée de 1423 lignes.

### 2. Bump obligatoire à chaque nouvelle version
Dès qu'une nouvelle version est pushée, mettre à jour **sans attendre** :
- Numéro de cache dans `sw.js` → `const CACHE = 'archerAI-vX.X.X'`
- `CLAUDE.md` — section version courante
- `CHANGELOG.md` — entrée de la nouvelle version

> **Incident référence :** sw.js resté en v4.3 lors du passage en V4.5.

### 3. `api/analyze.js` intouchable
**Ne jamais modifier `api/analyze.js` sans confirmation explicite de Raphaël.**

### 4. `RETOURS_TERRAIN.md` intouchable
Ne modifier ce fichier que si Raphaël le demande explicitement.

### 5. JS externe obligatoire
Tout le JavaScript doit rester dans `app.js` (fichier externe).  
**Jamais de JS inline dans index.html** — cause des SyntaxError silencieuses sur Android/iOS Chrome avec les template literals contenant `<`.

### 6. Chirurgie, pas réécriture
Appliquer des patches chirurgicaux sur le code qui fonctionne. Ne jamais réécrire un bloc entier si seule une ligne pose problème. Principe : *"chaque morceau qui fonctionne, on évite d'y toucher"*.

## Workflow stagiaire (Claude Code CLI)

```bash
# 1. Vérification lignes
wc -l index.html app.js
git show HEAD:index.html | wc -l && git show HEAD:app.js | wc -l

# 2. Modifications chirurgicales

# 3. Commit avec co-auteur
git add -A
git commit -m "feat: description courte

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 4. Push
git push origin main

# 5. Vérification remote
git log --oneline -3
```

## Apprentissages techniques clés

- **SyntaxError silencieuse Android/iOS Chrome :** Template literals avec `<` dans du JS inline → solution : JS dans fichier externe uniquement.
- **Service Worker bloqué en "Wait" Android Chrome :** Solution fiable = "Annuler l'enregistrement" dans DevTools → Application (pas le bouton "Mettre à jour").
- **Debug JS Android sans USB :** `try { eval(document.querySelector('script').textContent) } catch(e) { console.error(e) }` dans la console.
- **Localiser `<` problématiques en JS inline :** `.indexOf('<')` puis `.substring(position-20, position+20)`.
- **Lire du HTML avec des balises fermantes :** Python3 avec `open(..., 'rb').read()` plus fiable que bash grep.

## Bugs connus non critiques

- **Admin panel (appui long logo 3s) :** GET `/api/analyze?stats=1` retourne 405 — non critique, déféré.
- **Bandeau version :** Mise à jour manuelle à chaque deploy — automatisation déférée.

## Ce qui est sur le radar (non prioritaire)

- Automatisation de la mise à jour du bandeau version à chaque deploy
- Résolution du bug 405 sur l'admin panel stats

## Environnement de développement

- **OS :** Ubuntu (pas Windows)
- **Éditeur :** Claude Code CLI dans le terminal
- **Deploy :** Vercel Pro via push GitHub (statut `READY` = production OK)
