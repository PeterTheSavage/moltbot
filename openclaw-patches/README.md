# OpenClaw Gateway Patches

Custom patches for the OpenClaw gateway control UI (v2026.2.12).

## Features

- **Providers UI** (`control-ui/assets/providers.js`) — Full providers management tab with API key handling, model auto-discovery, toast notifications, loading states, and inline key input.
- **UI Bundle Patch** (`control-ui/assets/index-B4LPvte9.js`) — Patched compiled UI: providers tab in sidebar, model selector in chat, provider models in dropdowns, diff-based `config.patch` saves.
- **CORS Discovery Proxy** (`control-ui/discover-proxy.js`) — Node.js proxy (port 18791) for model discovery API calls. Follows redirects, 10MB body limit, 20 req/10s rate limiting.
- **Systemd Service** (`systemd/openclaw-discover-proxy.service`) — Auto-starts the CORS proxy.

## Installation

```bash
# Copy UI patches
cp openclaw-patches/control-ui/assets/providers.js /usr/lib/node_modules/openclaw/dist/control-ui/assets/
cp openclaw-patches/control-ui/assets/index-B4LPvte9.js /usr/lib/node_modules/openclaw/dist/control-ui/assets/
cp openclaw-patches/control-ui/discover-proxy.js /usr/lib/node_modules/openclaw/dist/control-ui/

# Inject providers.js script tag into index.html (if not already present)
grep -q 'providers.js' /usr/lib/node_modules/openclaw/dist/control-ui/index.html || \
  sed -i 's|</body>|<script src="./assets/providers.js"></script>\n  </body>|' \
  /usr/lib/node_modules/openclaw/dist/control-ui/index.html

# Install systemd service for CORS proxy
mkdir -p ~/.config/systemd/user
cp openclaw-patches/systemd/openclaw-discover-proxy.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now openclaw-discover-proxy.service

# Restart gateway
openclaw gateway restart --force
```

## Supported Providers (22)

OpenAI, Anthropic, Google, xAI (Grok), OpenRouter, Bandlayer AI, Kilo Code, Chutes AI, MiniMax, Moonshot AI, Qwen, Z.AI, Qianfan, GitHub Copilot, Vercel AI Gateway, OpenCode Zen, Xiaomi, Synthetic, Together AI, Venice AI, Mistral, **Llama API** + custom providers.

## UI Bundle Patches (9)

1. `ap()` — Include provider models in all model dropdowns
2. Chat tab handler — Reload config on tab switch
3. `In()` (config save) — Diff-based `config.patch` instead of full `config.set`
4. `cu` array — Add "providers" to Settings nav group
5. `Wr` routes — Add `/providers` route
6. `ti()` labels — Add "Providers" label
7. `uu()` icons — Add "settings" icon for providers
8. Providers tab handler — Load config on tab activation
9. Chat model selector — Inline model dropdown in chat controls

## Notes

- API keys stored in `~/.openclaw/openclaw.json` under `models.providers.<id>.apiKey`
- CORS proxy (port 18791) is only used for model discovery, not chat streaming
- Bundle patch is version-specific to OpenClaw 2026.2.12 (`index-B4LPvte9.js`)
- All `alert()`/`prompt()` replaced with non-blocking toast notifications
- Config saves use `config.patch` (partial diff) to avoid schema validation errors
