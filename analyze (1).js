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

Identifie chaque flèche et estime sa zone d'impact selon le système de scoring standard :
- Zone jaune (or) centre : 10 (X si très centré) ou 9
- Zone rouge : 8 ou 7
- Zone bleue : 6 ou 5
- Zone noire : 4 ou 3
- Zone blanche : 2 ou 1
- Raté (hors cible) : M

Réponds UNIQUEMENT en JSON, sans aucun texte avant ou après, avec ce format exact :
{
  "arrows": [8, 10, 7, 9, 6, "M"],
  "total": 40,
  "count": 6,
  "analysis": "Une courte phrase d'analyse en français sur la dispersion ou la qualité du groupe de flèches"
}

Si l'image ne montre pas une cible de tir à l'arc avec des flèches, réponds :
{"error": "Pas de cible détectée"}`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    
    // Log for debugging
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
