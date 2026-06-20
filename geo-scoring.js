// geo-scoring.js — ArcherAI : scoring géométrique à partir de coordonnées normalisées
// -----------------------------------------------------------------------------
// MOULURE / brouillon — moitié "scoring" uniquement (aucun appel réseau).
// Source géométrie : règlement FFTA (mai 2026). À DIFFER contre SCORING_GEOMETRIQUE.md.
//
// Convention :
//   - origine (0,0) = centre du blason détecté par l'IA
//   - rayon nominal = 1 = bord extérieur de la zone scorée la plus basse
//   - un impact = { x, y } normalisés ; distance = hypot(x, y)
//
// Règle de ligne :
//   - "higher"  (WA / Vegas)  : flèche touchant une ligne => zone SUPÉRIEURE
//   - "lower"   (Beursault)   : flèche touchant une ligne => zone INFÉRIEURE
//   - appliquée seulement si opts.arrowRadius > 0 (rayon flèche normalisé)
// -----------------------------------------------------------------------------

// Tables d'anneaux par format. Du centre vers l'extérieur.
// xMax : rayon du cercle de départage X (compté comme la zone max).
const FORMATS = {
  WA: {
    label: 'WA — 10 zones',
    lineRule: 'higher',
    xMax: 0.05,
    rings: [
      { max: 0.10, score: 10 },
      { max: 0.20, score: 9 },
      { max: 0.30, score: 8 },
      { max: 0.40, score: 7 },
      { max: 0.50, score: 6 },
      { max: 0.60, score: 5 },
      { max: 0.70, score: 4 },
      { max: 0.80, score: 3 },
      { max: 0.90, score: 2 },
      { max: 1.00, score: 1 },
    ],
  },

  // Vegas / salle (face réduite 10..6). À VALIDER terrain — normalisation supposée
  // sur le bord extérieur de la zone 6 (5 anneaux égaux de 20%).
  VEGAS: {
    label: 'Vegas — 10..6',
    lineRule: 'higher',
    xMax: 0.10, // X = moitié de l'anneau 10
    rings: [
      { max: 0.20, score: 10 },
      { max: 0.40, score: 9 },
      { max: 0.60, score: 8 },
      { max: 0.80, score: 7 },
      { max: 1.00, score: 6 },
    ],
  },

  // Beursault — 3 zones, règle de ligne INVERSE.
  // PLACEHOLDER : 3 anneaux égaux (1/3). La géométrie réelle du carton Beursault
  // n'est PAS uniforme -> à recaler depuis le règlement FFTA avant prod.
  BEURSAULT: {
    label: 'Beursault — 3/2/1 (placeholder)',
    lineRule: 'lower',
    xMax: null,
    rings: [
      { max: 0.3333, score: 3 },
      { max: 0.6667, score: 2 },
      { max: 1.0000, score: 1 },
    ],
  },
};

// Score d'un impact unique.
// Retourne { score: number|'M', distance, isX }
function scoreImpact(x, y, format = 'WA', opts = {}) {
  const F = FORMATS[format];
  if (!F) throw new Error('Format de cible inconnu : ' + format);

  const d = Math.hypot(x, y);
  const arrowR = opts.arrowRadius || 0; // rayon flèche normalisé (diam_flèche/2 / diam_cible)

  // Bord intérieur / extérieur de la flèche selon la règle de ligne.
  const dInner = Math.max(0, d - arrowR);
  const dEff = F.lineRule === 'higher' ? dInner : d + arrowR;

  const outer = F.rings[F.rings.length - 1].max;
  if (dEff > outer) return { score: 'M', distance: d, isX: false };

  // Départage X (toujours évalué sur le bord intérieur de la flèche).
  if (F.xMax != null && dInner <= F.xMax) {
    return { score: F.rings[0].score, distance: d, isX: true };
  }

  for (const ring of F.rings) {
    if (dEff <= ring.max) return { score: ring.score, distance: d, isX: false };
  }
  return { score: 'M', distance: d, isX: false };
}

// Score d'une volée complète à partir d'un tableau d'impacts [{x, y}, ...].
// Retourne { arrows:[scores], details:[...], total, count, xCount }.
function scoreVolley(impacts, format = 'WA', opts = {}) {
  const details = (impacts || []).map((p) => scoreImpact(p.x, p.y, format, opts));
  const arrows = details.map((r) => r.score);
  const total = details.reduce((s, r) => s + (typeof r.score === 'number' ? r.score : 0), 0);
  const xCount = details.filter((r) => r.isX).length;
  return { arrows, details, total, count: details.length, xCount };
}

// -----------------------------------------------------------------------------
// Auto-test minimal : `node geo-scoring.js`
// -----------------------------------------------------------------------------
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FORMATS, scoreImpact, scoreVolley };

  if (require.main === module) {
    const eq = (got, exp, label) => {
      const ok = JSON.stringify(got) === JSON.stringify(exp);
      console.log(`${ok ? 'OK ' : 'XX '} ${label}  ->  ${JSON.stringify(got)}${ok ? '' : '  (attendu ' + JSON.stringify(exp) + ')'}`);
      return ok;
    };

    let pass = true;
    const s = (x, y, f, o) => scoreImpact(x, y, f, o).score;

    // WA — centre & anneaux
    pass &= eq(scoreImpact(0, 0).isX, true, 'WA (0,0) => X');
    pass &= eq(s(0.04, 0), 10, 'WA d=0.04 => X(10)');
    pass &= eq(s(0.07, 0), 10, 'WA d=0.07 => 10');
    pass &= eq(s(0.15, 0), 9, 'WA d=0.15 => 9');
    pass &= eq(s(0.10, 0), 10, 'WA sur ligne 10/9 => 10 (higher)');
    pass &= eq(s(0.95, 0), 1, 'WA d=0.95 => 1');
    pass &= eq(s(1.05, 0), 'M', 'WA d=1.05 => M');

    // WA — règle de ligne avec rayon flèche
    pass &= eq(s(0.205, 0, 'WA', { arrowRadius: 0.01 }), 9, 'WA mord la ligne du 9 => 9');
    pass &= eq(s(0.205, 0, 'WA'), 8, 'WA même point sans rayon => 8');

    // Beursault — règle inverse
    pass &= eq(s(0.33, 0, 'BEURSAULT', { arrowRadius: 0.01 }), 2, 'Beursault mord la ligne => zone basse (2)');

    // Volée
    const v = scoreVolley([{x:0,y:0},{x:0.15,y:0},{x:1.2,y:0}], 'WA');
    pass &= eq(v.total, 19, 'Volée total X+9+M = 19');
    pass &= eq(v.xCount, 1, 'Volée xCount = 1');

    console.log('\n' + (pass ? 'TOUS LES TESTS PASSENT ✅' : 'ÉCHECS ❌'));
    process.exit(pass ? 0 : 1);
  }
}
