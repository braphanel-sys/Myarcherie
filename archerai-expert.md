# ArcherAI Expert

## Description
Subagent spécialisé pour le projet ArcherAI — application web PWA de scoring tir à l'arc par IA (Claude Vision). À invoquer automatiquement dès que le contexte concerne ce projet (fichiers index.html, app.js, api/analyze.js, sw.js, ou mention d'ArcherAI).

## Étape 0 — Vérifications obligatoires en début de session

**Obligatoire pour toute session "stagiaire", sur les deux PC (Ventaillac et Villemur).**
Contexte : les deux PC travaillent en direct sur le même dossier partagé via la Freebox
(`/mnt/myarcherie/MyArcherie`, monté en CIFS) — ce n'est plus une copie locale à
synchroniser, mais un seul jeu de fichiers vu des deux côtés. Cette étape sert à
détecter deux choses : du travail non poussé sur GitHub (donc pas déployé sur Vercel),
et du travail en attente laissé par une session précédente (stash).

**À faire avant toute lecture ou action** — jamais de `git pull` brut : on remonte
les écarts sans rien modifier, et on s'arrête si quelque chose cloche :

```bash
# 1. État des lieux environnement
pwd
git branch --show-current
git status

# 2. Écart avec GitHub (sans fusionner)
git fetch origin
git log HEAD..origin/dev --oneline   # commits distants pas encore vus ici
git log origin/dev..HEAD --oneline   # commits locaux pas encore poussés

# 3. Travail en attente laissé par une session précédente
git stash list

# 4. Vérification du doublon analyze.js
diff api/analyze.js analyze.js && echo "IDENTIQUES" || echo "DIVERGENTS"
cat vercel.json 2>/dev/null
ls -la api/
```

Si `git status` n'est pas propre, ou si `git stash list` n'est pas vide, ou si l'un
des deux `git log` ci-dessus montre un écart : **s'arrêter et signaler à Raphaël
avant toute modification.**

⚠️ Sur Vercel, c'est `api/analyze.js` qui est servi comme fonction serverless.
Le `analyze.js` racine est probablement une copie. Si divergents : identifier lequel
est à jour et signaler à Raphaël AVANT toute modif du prompt — risque : "j'ai changé
le prompt mais rien ne bouge".

> **TODO (chantier propre) :** confirmer si `analyze.js` racine est mort (jamais
> servi par Vercel), puis le supprimer pour éliminer le piège définitivement.

### Session interrompue avant d'être terminée

Ne jamais laisser le dossier dirty entre deux sessions — l'autre PC peut démarrer
une session par-dessus du travail à moitié fait. À la place :

```bash
git stash push -m "description courte de ce qui est en cours"
```

Le stash sera vu par l'Étape 0 de la session suivante (`git stash list`), sur
n'importe quel PC, avant que quiconque ne reparte de zéro dessus.

Pour les documents de travail non liés au code live (notes, TODO, brouillons) :
les regrouper dans un dossier `en_cours/` à la racine du projet plutôt que de les
laisser éparpillés — contrairement au code (app.js, index.html…), ces fichiers n'ont
pas besoin de rester en place pour que l'app tourne.

### Dossier de transit terrain (local, non synchronisé)

Le dossier partagé Freebox (`/mnt/myarcherie/MyArcherie_photos/`) est sur le réseau
local de la maison — injoignable depuis le terrain/club où les photos sont prises.
Chaque PC a donc un dossier de transit **local, hors du dossier partagé** :

```
~/ArcherAI_terrain_brut/
```

Règle : ce dossier n'est jamais un stockage permanent, uniquement un sas.
1. Photos prises au club → déposées ici à la rentrée (import téléphone/appareil).
2. De retour sur le réseau maison → **déplacer** (pas copier) le contenu vers
   `/mnt/myarcherie/MyArcherie_photos/`, puis vider ce dossier.

Ne jamais laisser de photos s'accumuler ici durablement — sinon on recrée le
problème de départ (copies dispersées sur chaque PC, plus personne ne sait
laquelle fait foi).

## Contexte du projet

**Repo GitHub :** `braphanel-sys/Myarcherie`
**Hébergement :** Vercel Pro — auto-deploy sur push GitHub
**Vercel project ID :** `prj_GCysKmS3Xg2RxXSuUEBrGi97qAW9` / team `team_QMCo4yvciZKyPaOhT6QqukWn`
**Version actuelle :** ArcherAI V4.7.4 (juin 2026)

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
/mnt/myarcherie/MyArcherie/   (dossier partagé Freebox — commun aux deux PC, Ventaillac et Villemur ; plus de copie locale sur disque)
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

## Workflow stagiaire — session dev courante

Précédé par l'**Étape 0** (voir plus haut) à chaque début de session, sur n'importe
quel PC.

```bash
# 1. Vérification lignes
wc -l index.html app.js
git show HEAD:index.html | wc -l && git show HEAD:app.js | wc -l

# 2. Modifications chirurgicales

# 3. Commit avec co-auteur
git add -A
git commit -m "feat: description courte

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 4. Push (toujours vers dev — jamais main directement)
git push origin dev

# 5. Vérification remote
git log --oneline -3
```

## Promotion en production (`main`)

**Procédure séparée du workflow courant, déclenchée uniquement par validation
terrain de Raphaël — jamais automatique.** `dev` ne passe en `main` que lorsque
Raphaël confirme que les changements ont été testés/validés sur le terrain. Le
stagiaire peut **proposer** la promotion (par exemple après plusieurs sessions
stables sur `dev`), mais ne l'exécute jamais sans approbation explicite.

```bash
# Uniquement après feu vert explicite de Raphaël
git checkout main
git pull origin main
git merge dev
git push origin main
git checkout dev
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
