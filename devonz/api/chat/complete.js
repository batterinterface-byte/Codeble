export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, language, provider, model } = body;

    if (!code) return res.status(400).json({ error: 'Code is required' });

    const key = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      opencode: process.env.OPENCODE_API_KEY,
    }[provider || 'openai'];

    if (!key) return res.status(400).json({ error: `No API key for ${provider}` });

    const systemPrompt = `You are an AI code completion assistant. Given the following ${language || 'code'}, provide a helpful completion or suggestion in JSON format with a "completion" field.`;
    const prompt = `Code:\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nProvide a concise code completion suggestion:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Upstream error: ${errText}` });
    }

    const data = await response.json();
    const completion = data.choices?.[0]?.message?.content || '';

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ completion });
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: err.message });
  }
}
