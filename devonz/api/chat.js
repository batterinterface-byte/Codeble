export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, provider, model } = body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      opencode: process.env.OPENCODE_API_KEY,
    };

    const key = apiKeys[provider];
    if (!key) {
      return res.status(400).json({ error: `No API key configured for ${provider}` });
    }

    const providerConfigs = {
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: { model: model || 'gpt-4', messages: [{ role: 'user', content: message }], stream: false },
      },
      anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: { model: model || 'claude-3-haiku-20240307', messages: [{ role: 'user', content: message }], max_tokens: 1024 },
      },
      google: {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${key}`,
        headers: { 'Content-Type': 'application/json' },
        body: { contents: [{ parts: [{ text: message }] }] },
      },
      opencode: {
        url: 'https://api.opencode.ai/v1/chat/completions',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: { model: model || 'opencode-default', messages: [{ role: 'user', content: message }], stream: false },
      },
    };

    const config = providerConfigs[provider] || providerConfigs.openai;
    const response = await fetch(config.url, { method: 'POST', headers: config.headers, body: JSON.stringify(config.body) });
    const data = await response.json();

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: err.message });
  }
}
