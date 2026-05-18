const PROVIDER_CONFIGS = {
  openai: {
    url: (model) => `https://api.openai.com/v1/chat/completions`,
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: (messages, model) => ({ model: model || 'gpt-4', messages, stream: true }),
  },
  opencode: {
    url: (model) => `https://api.opencode.ai/v1/chat/completions`,
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: (messages, model) => ({ model: model || 'opencode-default', messages, stream: true }),
  },
};

function getApiKey(provider) {
  const keys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    opencode: process.env.OPENCODE_API_KEY,
  };
  return keys[provider];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages, provider, model } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const providerName = provider || 'openai';
    const key = getApiKey(providerName);
    if (!key) return res.status(400).json({ error: `No API key for ${providerName}` });

    const config = PROVIDER_CONFIGS[providerName] || PROVIDER_CONFIGS.openai;
    const upstream = await fetch(config.url(model), {
      method: 'POST',
      headers: config.headers(key),
      body: JSON.stringify(config.body(messages, model)),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: `Upstream error: ${errText}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: {"type":"agent_phase","phase":"planning"}\n\n`);
    res.write(`data: {"type":"agent_phase","phase":"executing"}\n\n`);

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') { res.write('data: {"type":"done"}\n\n'); continue; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              res.write(`data: {"type":"text","content":${JSON.stringify(content)}}\n\n`);
            }
          } catch {}
        }
      }
    }

    res.write('data: {"type":"done"}\n\n');
    res.end();
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: err.message });
  }
}
