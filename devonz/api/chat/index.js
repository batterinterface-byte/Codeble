const PROVIDER_CONFIGS = {
  openai: {
    url: (model) => `https://api.openai.com/v1/chat/completions`,
    headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    body: (messages, model) => ({ model: model || 'gpt-4', messages, stream: true }),
  },
  anthropic: {
    url: (model) => 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }),
    body: (messages, model) => ({ model: model || 'claude-3-haiku-20240307', messages, max_tokens: 2048, stream: true }),
  },
  google: {
    url: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:streamGenerateContent?alt=sse`,
    headers: (key) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': key }),
    body: (messages, model) => ({ contents: messages.map(m => ({ parts: [{ text: m.content }], role: m.role === 'assistant' ? 'model' : 'user' })) }),
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages, provider, model } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const providerName = provider || 'openai';
    const key = getApiKey(providerName);
    if (!key) {
      return res.status(400).json({ error: `No API key configured for ${providerName}` });
    }

    const config = PROVIDER_CONFIGS[providerName] || PROVIDER_CONFIGS.openai;
    const apiUrl = config.url(model);

    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: config.headers(key),
      body: JSON.stringify(config.body(messages, model)),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: `Upstream API error: ${errText}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
          if (data === '[DONE]') {
            res.write('data: {"type":"done"}\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            let content = '';
            if (providerName === 'openai' || providerName === 'opencode') {
              content = parsed.choices?.[0]?.delta?.content || '';
            } else if (providerName === 'anthropic') {
              content = parsed.delta?.text || parsed.content?.[0]?.text || '';
            } else if (providerName === 'google') {
              content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
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
