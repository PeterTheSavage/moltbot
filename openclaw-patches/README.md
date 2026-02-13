# OpenClaw Gateway Patches

Custom patches for the OpenClaw gateway control UI, adding:

## Features
- **Providers UI** (`control-ui/assets/providers.js`) — Custom providers tab with API key management, model auto-discovery for Chutes AI, Bandlayer, Kilo Code, and other OpenAI-compatible providers.
- **UI Bundle Patch** (`control-ui/assets/index-BeKTXH1m.js`) — Patched compiled UI to show discovered provider models in `/chat` and `/agents` dropdowns, and use `config.patch` for saves.
- **CORS Discovery Proxy** (`control-ui/discover-proxy.js`) — Lightweight Node.js proxy server (port 18791) that bypasses CORS restrictions for model discovery API calls. Follows redirects.
- **Systemd Service** (`systemd/openclaw-discover-proxy.service`) — Auto-starts the CORS proxy.

## Installation

```bash
# Copy UI patches
cp openclaw-patches/control-ui/assets/providers.js /usr/lib/node_modules/openclaw/dist/control-ui/assets/
cp openclaw-patches/control-ui/assets/index-BeKTXH1m.js /usr/lib/node_modules/openclaw/dist/control-ui/assets/
cp openclaw-patches/control-ui/discover-proxy.js /usr/lib/node_modules/openclaw/dist/control-ui/

# Install systemd service for CORS proxy
mkdir -p ~/.config/systemd/user
cp openclaw-patches/systemd/openclaw-discover-proxy.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now openclaw-discover-proxy.service

# Restart gateway
openclaw gateway restart --force
```

## Supported Providers
- Chutes AI (`https://llm.chutes.ai/v1`)
- Bandlayer AI (`https://api.bandlayer.com/v1`)
- Kilo Code (`https://kilocode.ai/api/openrouter`)
- OpenRouter, xAI, MiniMax, Moonshot, and more

## Notes
- API keys are stored in `~/.openclaw/openclaw.json` under `models.providers.<id>.apiKey`
- The CORS proxy runs on port 18791 and is only used for model discovery (not chat)
- The UI bundle patch is version-specific to OpenClaw 2026.2.9
