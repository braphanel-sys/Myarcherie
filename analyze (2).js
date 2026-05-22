export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

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
              text: `Tu es un expert en tir à l'arc. Analyse cette photo d'une cible de tir à l'arc avec des flèches plantées dedans.

ÉTAPE 1 — Identifie le type de cible :

- "WA" : cible ronde colorée (jaune/rouge/bleu/noir/blanc), score de 1 à 10. Utilisée en extérieur (50m, 70m) ou en salle. Peut être une face complète 122cm ou 80cm.
- "VEGAS" : cible trispot (3 blasons ronds colorés sur une feuille verticale), chaque blason a jaune/rouge/bleu uniquement, score 6 à 10, 1 flèche par blason.
- "BEURSAULT" : cible carrée blanche avec cercles noirs concentriques, score de 1 à 3.
- "GEF" : cible carrée blanche avec cercles noirs et chiffres 1-2-3, utilisée pour débutants à 10m.

ÉTAPE 2 — Applique le bon barème :

Pour WA : jaune centre = X ou 10, jaune = 9, rouge = 8 ou 7, bleu = 6 ou 5, noir = 4 ou 3, blanc = 2 ou 1, hors cible = M
Pour VEGAS trispot : analyse 1 flèche par blason, jaune = X/10/9, rouge = 8/7, bleu = 6, hors blason = M
Pour BEURSAULT et GEF : centre noir = 3, anneau intermédiaire = 2, anneau extérieur = 1, hors cible = M

ÉTAPE 3 — Réponds UNIQUEMENT en JSON :
{
  "type": "WA",
  "arrows": [9, 8, 7, 10, 6, "M"],
  "total": 40,
  "count": 6,
  "analysis": "Courte phrase d'analyse en français sur la qualité du groupe"
}

Si pas de cible détectée : {"error": "Pas de cible détectée"}`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    console.log('API response status:', response.status);
    console.log('API data:', JSON.stringify(data).substring(0, 500));

    if (!data || !data.content || !Array.isArray(data.content)) {
      return res.status(500).json({
        error: 'Réponse API invalide: ' + JSON.stringify(data).substring(0, 200)
      });
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
