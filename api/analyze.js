export default async function handler(req, res) {
  // CORS restreint au domaine de l'app
  const ALLOWED_ORIGIN = 'https://myarcherie.vercel.app';
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mode, a1, a2, desc1, desc2, apv } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Le prompt est construit côté serveur — le client n'envoie que des données
    const sanitize = (v, max) => String(v || '').replace(/[^\p{L}\p{N} '\-+]/gu, '').substring(0, max);
    const name1 = sanitize(a1, 30) || 'Archer 1';
    const name2 = sanitize(a2, 30) || 'Archer 2';
    const d1 = sanitize(desc1, 120) || 'inconnue';
    const d2 = sanitize(desc2, 120) || 'inconnue';

    const BAREMES = `Barèmes: WA: jaune=X/10/9,rouge=8/7,bleu=6/5,noir=4/3,blanc=2/1,hors=M | VEGAS: jaune=X/10/9,rouge=8/7,bleu=6,hors=M | BEURSAULT/GEF: centre=3,milieu=2,ext=1,hors=M`;

    const apvBlock = apv ? `
⚠️ NOMBRE DE FLÈCHES ATTENDU : exactement ${apv} flèche${apv > 1 ? 's' : ''} dans cette volée.
- Si tu en identifies plus que ${apv} → tu confonds très probablement avec d'anciens impacts visibles sur la cible. RECOMPTE en t'appuyant uniquement sur les tiges + empennages visibles.
- Si tu en identifies moins → certaines flèches ont raté la cible (noter "M").
` : '';

    const rulesBlock = `
⚠️ RÈGLES STRICTES — Cette cible contient de NOMBREUX impacts d'anciens tirs. IGNORE-LES TOUS.

PROTOCOLE DE COMPTAGE — 3 étapes obligatoires :
1. REPÈRE les tiges : cherche uniquement des barres allongées en RELIEF dépassant de la surface.
   → Un trou vu de face (forme ronde ou ovale sombre) = ancien impact = INTERDIT de compter.
2. CONFIRME l'empennage : chaque tige doit avoir des plumes ou un plastique coloré à son extrémité.
3. COMPTE : note ce chiffre. C'est le seul nombre de flèches autorisé dans ta réponse.

PIÈGES À ÉVITER :
- Trou d'ancien impact avec halo coloré → ressemble à une flèche vue de face → IGNORER
- Ombre d'une flèche → n'est pas une deuxième flèche → IGNORER
- Flèche partiellement cachée derrière une autre → ne compter qu'une fois
- En cas de doute sur un objet → ne pas le compter
${apvBlock}`;

    const prompt = mode === 'duo'
      ? `Tu es un expert en tir à l'arc. Analyse cette cible, 2 archers.
${rulesBlock}
${name1} : ${d1}.
${name2} : ${d2}.
Identifie le type (WA/VEGAS/BEURSAULT/GEF), attribue chaque flèche selon description et score. Ne compte que les fûts physiquement plantés, ignore les impacts vides.
${BAREMES}
Réponds UNIQUEMENT JSON:
{"type":"WA","archer1":{"name":"${name1}","arrows":[9,8,7],"total":24,"count":3,"analysis":"..."},"archer2":{"name":"${name2}","arrows":[10,9,8],"total":27,"count":3,"analysis":"..."}}
Si pas de cible: {"error":"Pas de cible détectée"}`
      : `Tu es un expert en tir à l'arc. Analyse cette cible.
${rulesBlock}
Identifie le type (WA/VEGAS/BEURSAULT/GEF) et applique le barème. Ne compte que les fûts physiquement plantés, ignore les impacts vides.
${BAREMES}
Réponds UNIQUEMENT JSON:
{"type":"WA","arrows":[9,8,7],"total":24,"count":3,"analysis":"..."}
Si pas de cible: {"error":"Pas de cible détectée"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();

    console.log('API status:', response.status);
    console.log('API data:', JSON.stringify(data).substring(0, 300));

    if (!data || !data.content || !Array.isArray(data.content)) {
      return res.status(500).json({ error: 'Réponse API invalide: ' + JSON.stringify(data).substring(0, 200) });
    }

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch(e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else return res.status(500).json({ error: 'Parse error: ' + clean.substring(0, 200) });
    }

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
}
