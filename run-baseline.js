// run-baseline.js — ArcherAI : boucle de calibration "run + mesure"
// -----------------------------------------------------------------------------
// Itère sur les photos du dataset, appelle l'endpoint /api/analyze EXISTANT,
// collecte les scores prédits, écrit predictions.json, puis lance le banc de
// test (validate.js) vs scores_reels.
//
// ⚠️ N'appelle QUE l'endpoint. Ne modifie PAS api/analyze.js.
// ⚠️ Chaque photo = 1 appel IA = crédits API consommés.
//
// Usage :
//   node run-baseline.js <endpointURL> <photosDir> [annotations.json] [out.json] [prompt.txt]
//
// Exemple :
//   node run-baseline.js https://ton-app.vercel.app/api/analyze \
//        ./tests/cibles_reelles tests/cibles_reelles/annotations.json predictions.json
// -----------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { runValidation, printReport } = require('./validate.js');

const endpoint = process.argv[2];
const photosDir = process.argv[3];
const annPath = process.argv[4] || path.join(photosDir || '.', 'annotations.json');
const outPath = process.argv[5] || 'predictions.json';
const promptPath = process.argv[6];

if (!endpoint || !photosDir) {
  console.error('Usage : node run-baseline.js <endpointURL> <photosDir> [annotations.json] [out.json] [prompt.txt]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Extrait le tableau de scores d'une réponse IA (mode solo WA actuel).
function extractArrows(result) {
  if (!result || result.error) return null;
  if (Array.isArray(result.arrows)) return result.arrows;
  return null;
}

function extractAnalysis(result) {
  if (!result) return null;
  return result.analysis || null;
}

function extractDetections(result) {
  if (!result || !Array.isArray(result.detections)) return null;
  return result.detections;
}

async function analyzeOne(photoFile, prompt, apv) {
  const buf = fs.readFileSync(photoFile);
  const imageBase64 = buf.toString('base64');
  const body = prompt ? { imageBase64, prompt } : { imageBase64 };
  if (apv) body.apv = apv;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  const annotations = JSON.parse(fs.readFileSync(annPath, 'utf8'));
  const prompt = promptPath ? fs.readFileSync(promptPath, 'utf8') : null;

  const predictions = [];
  for (let i = 0; i < annotations.length; i++) {
    const ann = annotations[i];
    const file = path.join(photosDir, ann.photo);
    process.stdout.write(`[${i + 1}/${annotations.length}] ${ann.photo} ... `);
    try {
      const apv = ann.scores_reels ? ann.scores_reels.length : null;
      const result = await analyzeOne(file, prompt, apv);
      const arrows = extractArrows(result);
      const analysis = extractAnalysis(result);
      const detections = extractDetections(result);
      if (!arrows) { console.log('pas de flèches détectées'); predictions.push({ photo: ann.photo, scores: [], analysis: null, detections: null }); }
      else { console.log(`${arrows.length} flèche(s)`); predictions.push({ photo: ann.photo, scores: arrows, analysis, detections }); }
    } catch (err) {
      console.log('ERREUR ' + err.message);
      predictions.push({ photo: ann.photo, scores: [] });
    }
    await sleep(400); // on reste gentil avec l'endpoint
  }

  fs.writeFileSync(outPath, JSON.stringify(predictions, null, 2));
  console.log(`\nPrédictions écrites dans ${outPath}`);

  printReport(runValidation(annotations, predictions), 'BASELINE (IA actuelle)');
})();
