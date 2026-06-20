// run-direct.js — appel Anthropic direct (sans passer par Vercel)
// Usage : ANTHROPIC_API_KEY=sk-... node run-direct.js <photosDir> [annotations.json] [out.json]
// Reproduit exactement le prompt de api/analyze.js pour tester hors Vercel.

const fs = require('fs');
const path = require('path');
const { runValidation, printReport } = require('./validate.js');

const apiKey  = process.env.ANTHROPIC_API_KEY;
const photosDir = process.argv[2];
const annPath   = process.argv[3] || path.join(photosDir || '.', 'annotations_full.json');
const outPath   = process.argv[4] || 'predictions_direct.json';

if (!apiKey)    { console.error('ANTHROPIC_API_KEY manquante'); process.exit(1); }
if (!photosDir) { console.error('Usage : ANTHROPIC_API_KEY=sk-... node run-direct.js <photosDir> [annotations.json] [out.json]'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Reproduction exacte du prompt de api/analyze.js ──────────────────────────

const BAREMES = `Barèmes: WA: jaune=X/10/9,rouge=8/7,bleu=6/5,noir=4/3,blanc=2/1,hors=M | VEGAS: jaune=X/10/9,rouge=8/7,bleu=6,hors=M | BEURSAULT/GEF: centre=3,milieu=2,ext=1,hors=M`;

function buildPrompt(apv) {
  const apvBlock = apv ? `
⚠️ NOMBRE DE FLÈCHES ATTENDU : exactement ${apv} flèche${apv > 1 ? 's' : ''} dans cette volée.
- Si tu en identifies plus que ${apv} → tu confonds très probablement avec d'anciens impacts visibles sur la cible. RECOMPTE en t'appuyant uniquement sur les tiges + empennages visibles.
- Si tu en identifies moins → certaines flèches ont raté la cible (noter "M").
` : '';

  const rulesBlock = `
MÉTHODE D'ÉLIMINATION — Commence avec 0 flèche. N'ajoute que ce que tu peux prouver.

Pour chaque objet suspect sur la cible, pose-toi ces deux questions :
1. Est-ce une tige cylindrique qui DÉPASSE en 3D de la surface, avec une ombre portée visible ?
2. Est-ce que cette même tige a un empennage (plumes ou plastique) visible à son extrémité ?

→ Si OUI aux deux : flèche confirmée, ajoute-la.
→ Un seul NON ou un doute : objet éliminé, ne pas compter.

Cette cible contient de nombreux anciens impacts (trous, halos colorés) — ils ne passent pas le test ci-dessus car ils sont PLATS et ENFONCÉS dans la cible, sans tige ni empennage.
${apvBlock}`;

  return `Tu es un expert en tir à l'arc. Analyse cette cible.
${rulesBlock}
Identifie le type (WA/VEGAS/BEURSAULT/GEF) et applique le barème.
${BAREMES}

IMPORTANT — Procède dans cet ordre STRICT :
1. Pour chaque flèche que tu identifies, crée une entrée dans "detections" avec :
   - "position" : où elle se trouve sur la cible (ex: "haut-gauche", "centre", "bas-droite")
   - "empennage" : couleur et matière de l'empennage visible (ex: "bleu plastique", "blanc plume")
   - "score" : valeur selon le barème
   N'ajouter une entrée QUE si tu vois physiquement la tige ET l'empennage de cette flèche.
2. "arrows" doit contenir EXACTEMENT autant de valeurs que "detections" — ni plus, ni moins.
3. "count" = longueur de "detections".

Réponds UNIQUEMENT JSON:
{"type":"WA","detections":[{"id":1,"position":"haut-gauche","empennage":"bleu plastique","score":9},{"id":2,"position":"centre","empennage":"rouge plastique","score":8},{"id":3,"position":"bas-droite","empennage":"blanc plume","score":7}],"arrows":[9,8,7],"total":24,"count":3,"analysis":"Groupement serré dans le rouge/jaune."}
Si pas de cible: {"error":"Pas de cible détectée"}`;
}

const SYSTEM = "Tu es un compteur visuel minimaliste spécialisé en tir à l'arc. Ta règle absolue : en cas de doute entre compter ou ne pas compter un objet, tu ne le comptes PAS. Tu préfères systématiquement sous-compter que sur-compter. Un objet qui n'est pas clairement identifiable comme une tige dépassant en 3D avec un empennage visible n'existe pas pour toi.";

// ─────────────────────────────────────────────────────────────────────────────

async function analyzeOne(photoFile, apv) {
  const buf = fs.readFileSync(photoFile);
  const imageBase64 = buf.toString('base64');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: buildPrompt(apv) }
        ]
      }]
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.content?.[0]?.text) throw new Error('Réponse vide');

  const clean = data.content[0].text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); }
  catch { const m = clean.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('Parse error'); }
}

(async () => {
  const annotations = JSON.parse(fs.readFileSync(annPath, 'utf8'));
  const predictions = [];

  for (let i = 0; i < annotations.length; i++) {
    const ann = annotations[i];
    const file = path.join(photosDir, ann.photo);
    const apv  = ann.scores_reels?.length || null;
    process.stdout.write(`[${i + 1}/${annotations.length}] ${ann.photo} (apv=${apv}) ... `);
    try {
      const result = await analyzeOne(file, apv);
      const arrows = Array.isArray(result?.arrows) ? result.arrows : [];
      console.log(`${arrows.length} flèche(s)`);
      predictions.push({ photo: ann.photo, scores: arrows, analysis: result?.analysis || null, detections: result?.detections || null });
    } catch (err) {
      console.log('ERREUR ' + err.message);
      predictions.push({ photo: ann.photo, scores: [], analysis: null, detections: null });
    }
    await sleep(400);
  }

  fs.writeFileSync(outPath, JSON.stringify(predictions, null, 2));
  console.log(`\nPrédictions écrites dans ${outPath}`);
  printReport(runValidation(annotations, predictions), 'DIRECT V4.7.3 (system + élimination)');
})();
