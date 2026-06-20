// validate.js — ArcherAI : banc de test de la section 4 (SCORING_GEOMETRIQUE.md)
// -----------------------------------------------------------------------------
// Compare des PRÉDICTIONS à la vérité terrain (annotations.json) et sort les
// métriques d'écart. Sert pour la baseline (scores IA actuels) ET pour
// l'approche géométrique (impacts {x,y} -> scoreVolley).
//
// Usage :
//   node validate.js <annotations.json> <predictions.json> [arrowRadius]
//
// Format predictions.json : tableau aligné par "photo".
//   - mode scores  : { "photo": "...", "scores": [9, 8, 7] }
//   - mode impacts : { "photo": "...", "format": "WA", "impacts": [{x,y}, ...] }
//
// Les flèches d'une volée n'étant pas ordonnées, on compare les multisets de
// scores triés (descendant) pour ne pas pénaliser un simple ordre différent.
// -----------------------------------------------------------------------------

const fs = require('fs');
const { scoreVolley } = require('./geo-scoring.js');

const numeric = (s) => (typeof s === 'number' ? s : 0); // 'M' -> 0

function predictedScores(entry, opts) {
  if (Array.isArray(entry.scores)) return entry.scores.slice();
  if (Array.isArray(entry.impacts)) {
    return scoreVolley(entry.impacts, entry.format || 'WA', opts).arrows;
  }
  return [];
}

function comparePhoto(real, pred) {
  const r = [...real].sort((a, b) => numeric(b) - numeric(a));
  const p = [...pred].sort((a, b) => numeric(b) - numeric(a));
  const matched = Math.min(r.length, p.length);

  let sumAbs = 0;
  const perArrow = [];
  for (let i = 0; i < matched; i++) {
    const e = Math.abs(numeric(r[i]) - numeric(p[i]));
    sumAbs += e;
    perArrow.push({ reel: r[i], predit: p[i], ecart: numeric(p[i]) - numeric(r[i]) });
  }

  return {
    countReel: r.length,
    countPredit: p.length,
    deltaCount: p.length - r.length,        // >0 = sur-comptage
    totalReel: r.reduce((s, v) => s + numeric(v), 0),
    totalPredit: p.reduce((s, v) => s + numeric(v), 0),
    matched,
    sumAbs,
    meanAbs: matched ? sumAbs / matched : 0,
    perArrow,
  };
}

function runValidation(annotations, predictions, opts = {}) {
  const predByPhoto = new Map(predictions.map((e) => [e.photo, e]));
  const rows = [];
  let pooledAbs = 0, pooledMatched = 0, overCount = 0, underCount = 0, missingPred = 0;

  for (const ann of annotations) {
    const predEntry = predByPhoto.get(ann.photo);
    if (!predEntry) { missingPred++; rows.push({ photo: ann.photo, missing: true }); continue; }

    const pred = predictedScores({ ...predEntry, format: predEntry.format || ann.format }, opts);
    const c = comparePhoto(ann.scores_reels, pred);
    pooledAbs += c.sumAbs;
    pooledMatched += c.matched;
    if (c.deltaCount > 0) overCount += c.deltaCount;
    if (c.deltaCount < 0) underCount += -c.deltaCount;
    rows.push({ photo: ann.photo, ...c });
  }

  return {
    rows,
    summary: {
      photos: annotations.length,
      sansPrediction: missingPred,
      ecartMoyenParFleche: pooledMatched ? pooledAbs / pooledMatched : 0,
      surComptage: overCount,
      sousComptage: underCount,
      flechesComparees: pooledMatched,
    },
  };
}

function printReport(report, label = '') {
  console.log(`\n=== Banc de test${label ? ' — ' + label : ''} ===`);
  for (const row of report.rows) {
    if (row.missing) { console.log(`${row.photo}  — pas de prédiction`); continue; }
    const tag = row.deltaCount > 0 ? ` (+${row.deltaCount} flèche)` : row.deltaCount < 0 ? ` (${row.deltaCount} flèche)` : '';
    console.log(
      `${row.photo}  réel ${row.totalReel} / prédit ${row.totalPredit}` +
      `  | écart moy ${row.meanAbs.toFixed(2)}/flèche${tag}`
    );
  }
  const s = report.summary;
  console.log('\n--- Synthèse ---');
  console.log(`Photos                 : ${s.photos} (${s.sansPrediction} sans prédiction)`);
  console.log(`Flèches comparées      : ${s.flechesComparees}`);
  console.log(`Écart moyen / flèche   : ${s.ecartMoyenParFleche.toFixed(3)}`);
  console.log(`Sur-comptage (total)   : ${s.surComptage}`);
  console.log(`Sous-comptage (total)  : ${s.sousComptage}`);
}

module.exports = { predictedScores, comparePhoto, runValidation, printReport };

// -----------------------------------------------------------------------------
// DÉMO (données synthétiques) : `node validate.js`
// Montre le format de sortie. NE PAS confondre avec de vrais résultats.
// -----------------------------------------------------------------------------
if (require.main === module) {
  const annPath = process.argv[2] || './annotations.json';
  const predPath = process.argv[3];
  const arrowRadius = process.argv[4] ? parseFloat(process.argv[4]) : 0;

  const annotations = JSON.parse(fs.readFileSync(annPath, 'utf8'));

  let predictions, label;
  if (predPath) {
    predictions = JSON.parse(fs.readFileSync(predPath, 'utf8'));
    label = predPath;
  } else {
    // Démo : un "prédicteur" bruité dérivé de la vérité, juste pour la forme.
    label = 'DÉMO synthétique (à ignorer)';
    predictions = annotations.map((a, i) => ({
      photo: a.photo,
      scores: a.scores_reels.map((v, j) => Math.max(0, v - ((i + j) % 3 === 0 ? 1 : 0))),
    }));
  }

  printReport(runValidation(annotations, predictions, { arrowRadius }), label);
}
