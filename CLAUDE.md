# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

ArcherAI is a single-page archery scoring app powered by Claude Vision. It has two distinct parts:

- **`index.html`** (~817 lines) — CSS + HTML uniquement. Le JS est dans `app.js`.
- **`app.js`** (~1194 lines) — tout le JavaScript de l'app (anciennement inline dans index.html).
- **`api/analyze.js`** — a Vercel serverless function that proxies requests to the Anthropic API. Reads `ANTHROPIC_API_KEY` from the environment.

The root `analyze.js` is kept in sync with `api/analyze.js` and reflects the current prompt logic. `analyze (1).js`, `analyze (2).js`, `analyze (3).js` are old iterations (deleted from repo); the live endpoint is `api/analyze.js`.

## Running locally

Open `index.html` directly in a browser for UI work (no server needed). To test the full AI analysis flow, you need a local server that serves `POST /api/analyze` — for example via Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

The `ANTHROPIC_API_KEY` environment variable must be set (via `.env.local` for `vercel dev`).

## Frontend structure (`index.html`)

The JS is organized into clearly labeled sections (search for `// ──`):

| Section | What it does |
|---|---|
| `CONSTANTES` | `COLORS` array, `ARC_TYPES`, localStorage keys |
| `COULEURS : helpers` | `totalColors()`, `colorsToString()`, `migrateColors()`, `counterRowHtml()` |
| `STATE` | All mutable state (`mode`, `session`, `duoArchers`, `beursaultArchers`, `userProfile`) |
| `PROFIL` | Load/save profile from localStorage |
| `WELCOME / PROFIL OVERLAY` | Welcome screen (first visit) reused as "Mon profil" modal |
| `ARCHERS DUO / BEURSAULT` | Render and manage per-mode archer lists |
| `COLOR COUNTER PER ARCHER` | `incArcherColor()`, `decArcherColor()`, `renderArcherColorGrid()` |
| `MODE` | `setMode()` — switches between solo/duo/beursault, shows/hides archer config |
| `BUILD PROMPT` | Constructs the French prompt for Claude based on mode and archer data |
| `CALL API` | Sends image + prompt, parses response, updates session — `arrowCount` basé sur `format.apv` ; stocke `photo:base64` dans chaque volée |
| `DISPLAY SOLO / DUO / BEURSAULT` | Renders scoring results; `arrowsHtml(arrows, prefix, gridId)` — badges cliquables via `editArrow()` |
| `SESSION BAR / HISTORY` | Running score bar and volley history list |
| `FIN DE SESSION` | End session, clear state |
| `PERSISTANCE SESSION` | `autoSaveSession()` (sauvegarde + met à jour `lastActivityAt`), `clearSessionDraft()`, `restoreSessionIfExists()` — seuil unique 4h basé sur `lastActivityAt` : silent < 4h, toast 6s ≥ 4h |
| `TRI DE FLÈCHES` | `startTri()`, `validateTriImpact()`, `showTriResults()` — saisie SVG interactive, zoom/pinch, classement par dispersion ; config via inputs libres (nb flèches, volées, à conserver) |
| `SERVICE WORKER & AUTO-UPDATE` | SW registration, silent reload vs toast logic |

## Design system

CSS variables are in `:root` at the top of `<style>`:

```css
--gold: #C9A84C   /* primary accent */
--red:  #C0392B   /* beursault accent, arrows */
--dark: #0D0D0D   /* background */
--text: #E8E0D0
--text-muted: #8A8070
```

- Headings and numbers: `font-family: 'Bebas Neue'`
- Body text: `font-family: 'DM Sans'`

Any new UI element must use these variables — never hardcode colors.

## Three scoring modes

| Mode | Archers | Arrows | Scoring |
|---|---|---|---|
| Solo | 1 (current user profile) | 3–6 | WA / Vegas / Beursault auto-detected |
| Duo | 2 fixed | 3–6 each | WA / Vegas, attributed by feather color |
| Beursault | 1–5 dynamic | **1 per archer** | 1 / 2 / 3 pts, score capped in `callAPI()` |

## State and persistence

All state lives in `localStorage` — no backend database.

| Key | Content |
|---|---|
| `archerAI_profile` | `{ prenom, nom, arcTypes[], plumeColors{}, encocheColor }` |
| `archerAI_session` | `{ volleys[], totalScore, arrowCount }` — saved on `visibilitychange` / `pagehide` |
| `archerAI_session_draft` | session en cours — sauvegardée après chaque volée (`autoSaveSession`) avec `photo:base64` par volée, supprimée à la fin ; restaurée au démarrage (toast 6s si > 4h) |
| `archerAI_tri_draft` | tri de flèches en cours — sauvegardé après chaque impact, restauré au démarrage si session interrompue |
| `archerAI_sessions` | historique des sessions terminées (tableau, ordre antéchronologique) |
| `archerAI_duo_archers` | `[{name, colors{}}, {name, colors{}}]` |
| `archerAI_beursault_archers` | `[{name, colors{}}, ...]` (1–5 items) |
| `archerAI_queue` | offline queue of base64 images |

## Feather color data format

Colors are stored as `{ [colorName]: count }` objects (e.g. `{ 'Noir': 2, 'Jaune': 1 }`), max total 3. Old data was stored as `string[]` — always pass through `migrateColors()` on load.

## PWA

- `sw.js` — cache `archerAI-v4.5.9`, précache `app.js` ; install précharge `/`, `/index.html`, `/guide-scoring.html` ; fetch : cache-first pour les GET, bypass total pour `/api/` ; écoute le message `'skipWaiting'` envoyé par le bandeau de mise à jour.
- `manifest.json` — standard PWA manifest, `theme_color: #C9A84C`.
- Pour déployer une nouvelle version : mettre à jour le nom du cache dans `sw.js` (ex. `archerAI-v4.4`).
- **Bandeau mise à jour** (`#update-banner`) : affiché par `showUpdateBanner()` quand le SW détecte un nouveau worker installé. Bouton "Actualiser" envoie `'skipWaiting'` au SW puis recharge la page.

## Project files

| File | Description |
|---|---|
| `index.html` | CSS + HTML uniquement (~817 lignes) |
| `app.js` | Tout le JavaScript de l'app (~1194 lignes) |
| `api/analyze.js` | Live Vercel serverless function (Anthropic proxy) |
| `analyze.js` | Mirror of `api/analyze.js` — kept in sync, use as reference |
| `sw.js` | Service Worker — stale-while-revalidate, offline queue |
| `manifest.json` | PWA manifest |
| `icon.svg` | Gold target + red arrow icon |
| `guide-scoring.html` | Photo best-practices guide (linked from app header) |
| `CHANGELOG.md` | Version history |
| `RETOURS_TERRAIN.md` | Live field feedback tracker — problems reported by club members + solutions |

---

## Score correction

Arrow badges rendered by `arrowsHtml()` carry the `.editable` CSS class and an `onclick` calling `editArrow(gridId, idx, currentVal)`. The function:

1. Prompts the user for a new value (`X`, `10`–`1`, or `M`)
2. Patches `currentSession.volleys[last].arrows[idx]` (or `archer1`/`archer2` in Duo)
3. Recalculates `volley.total` and `currentSession.totalScore` in place
4. Re-renders only the affected grid via `innerHTML`

`gridId` values: `'arrows-grid'` (Solo), `'arrows-grid-1'` / `'arrows-grid-2'` (Duo).

## Prompt IA (`analyze.js` / `api/analyze.js`)

Le prompt par défaut (v2, mai 2026) impose à l'IA :
1. Ne compter que les **fûts physiquement plantés** dans la cible — ignorer trous, impacts vides et déchirures
2. Identifier le type de cible (WA, Vegas, Beursault, GEF) avant de scorer
3. Répondre en JSON strict avec `type`, `arrows`, `total`, `count`, `analysis`

Le frontend peut envoyer un `prompt` custom dans le body POST (ex. mode Duo avec description des plumes) ; le serveur utilise ce prompt en priorité et tombe sur le prompt par défaut si absent.

## Règles

- **Au démarrage de chaque session sur ce projet**, lire et charger `~/.claude/agents/archerai-expert.md` avant toute action.
- Ne jamais modifier `api/analyze.js` sans confirmation explicite de l'utilisateur.
- Mettre à jour ce fichier à chaque modification du projet — il sert d'historique.
