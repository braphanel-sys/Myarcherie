export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, prompt } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const defaultPrompt = `Tu es un expert en tir à l'arc. Analyse cette photo d'une cible de tir à l'arc.

RÈGLE ABSOLUE : Ne compte QUE les flèches physiquement plantées dans la cible en ce moment — c'est-à-dire les objets avec un fût (tige cylindrique) clairement visible qui dépasse de la cible. Ignore totalement les impacts vides, trous, déchirures ou marques laissés par des tirs précédents.

ÉTAPE 1 — Identifie le type de cible (WA, VEGAS, BEURSAULT, GEF).
ÉTAPE 2 — Compte uniquement les fûts de flèches visibles et plantés actuellement.
ÉTAPE 3 — Pour chaque flèche détectée, estime sa zone d'impact et applique le bon barème.

Barèmes :
- WA : jaune = X/10/9, rouge = 8/7, bleu = 6/5, noir = 4/3, blanc = 2/1, hors cible = M
- VEGAS : jaune = X/10/9, rouge = 8/7, bleu = 6, hors blason = M
- BEURSAULT/GEF : centre = 3, milieu = 2, extérieur = 1, hors cible = M

Réponds UNIQUEMENT en JSON, sans aucun texte avant ou après :
{"type":"WA","arrows":[9,8,7],"total":24,"count":3,"analysis":"Courte analyse en français sur la qualité du groupe"}

Si l'image ne montre pas une cible avec des flèches plantées : {"error": "Pas de cible détectée"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64
              }
            },
            {
              type: "text",
              text: prompt || defaultPrompt
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch(e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else throw new Error('Parse error');
    }

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
}
