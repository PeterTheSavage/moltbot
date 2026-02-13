(function () {
  "use strict";
  var POLL = 300, active = false, cfgCache = null, editProv = null, showAdd = false, expandedModels = {};
  var addSel = "", addKey = "", addOauth = false, addCustom = { id: "", baseUrl: "", api: "openai-completions", modelId: "", modelName: "", ctx: "131072", max: "8192" };
  var configLoaded = false;

  var BP = [
    {
      id: "openai", label: "OpenAI", hint: "Codex OAuth + API key", url: "https://api.openai.com/v1", api: "openai-completions", auth: ["oauth", "api_key"], env: "OPENAI_API_KEY",
      m: [{ id: "o4-mini", n: "o4 Mini", r: 1, c: 200000 }, { id: "o3", n: "o3", r: 1, c: 200000 }, { id: "gpt-4.1", n: "GPT-4.1", r: 0, c: 1048576 }, { id: "gpt-4.1-mini", n: "GPT-4.1 Mini", r: 0, c: 1048576 }, { id: "gpt-4.1-nano", n: "GPT-4.1 Nano", r: 0, c: 1048576 }, { id: "gpt-4o", n: "GPT-4o", r: 0, c: 128000 }, { id: "gpt-4o-mini", n: "GPT-4o Mini", r: 0, c: 128000 }]
    },
    {
      id: "anthropic", label: "Anthropic", hint: "Setup-token + API key", url: "https://api.anthropic.com", api: "anthropic-messages", auth: ["token", "api_key"], env: "ANTHROPIC_API_KEY",
      m: [{ id: "claude-opus-4", n: "Claude Opus 4", r: 0, c: 200000 }, { id: "claude-sonnet-4", n: "Claude Sonnet 4", r: 0, c: 200000 }, { id: "claude-haiku-3.5", n: "Claude Haiku 3.5", r: 0, c: 200000 }]
    },
    {
      id: "google", label: "Google", hint: "Gemini API key + OAuth", url: "https://generativelanguage.googleapis.com/v1beta", api: "gemini", auth: ["api_key", "oauth"], env: "GEMINI_API_KEY",
      provKeys: ["google", "google-antigravity", "google-gemini-cli"],
      m: [{ id: "gemini-2.5-pro", n: "Gemini 2.5 Pro", r: 1, c: 1048576 }, { id: "gemini-2.5-flash", n: "Gemini 2.5 Flash", r: 1, c: 1048576 }, { id: "gemini-3-pro-preview", n: "Gemini 3 Pro", r: 0, c: 1048576 }, { id: "gemini-3-flash-preview", n: "Gemini 3 Flash", r: 0, c: 1048576 }]
    },
    {
      id: "xai", label: "xAI (Grok)", hint: "API key", url: "https://api.x.ai/v1", api: "openai-completions", auth: ["api_key"], env: "XAI_API_KEY",
      m: [{ id: "grok-4", n: "Grok 4", r: 1, c: 131072 }, { id: "grok-3", n: "Grok 3", r: 0, c: 131072 }, { id: "grok-3-mini", n: "Grok 3 Mini", r: 1, c: 131072 }]
    },
    {
      id: "openrouter", label: "OpenRouter", hint: "API key \u2014 100+ models", url: "https://openrouter.ai/api/v1", api: "openai-completions", auth: ["api_key"], env: "OPENROUTER_API_KEY",
      m: [{ id: "anthropic/claude-sonnet-4", n: "Claude Sonnet 4", r: 0, c: 200000 }, { id: "openai/o4-mini", n: "o4 Mini", r: 1, c: 200000 }, { id: "google/gemini-2.5-flash", n: "Gemini 2.5 Flash", r: 1, c: 1048576 }, { id: "deepseek/deepseek-r1", n: "DeepSeek R1", r: 1, c: 131072 }]
    },
    {
      id: "bandlayer", label: "Bandlayer AI", hint: "API key \u2014 AI Router", url: "https://api.bandlayer.com/v1", api: "openai-completions", auth: ["api_key"],
      m: [{ id: "gpt-4", n: "GPT-4", r: 0, c: 128000 }, { id: "claude-sonnet-4", n: "Claude Sonnet 4", r: 0, c: 200000 }, { id: "gemini-2.5-flash", n: "Gemini 2.5 Flash", r: 1, c: 1048576 }]
    },
    {
      id: "kilocode", label: "Kilo Code", hint: "API key \u2014 OpenRouter proxy", url: "https://kilocode.ai/api/openrouter", api: "openai-completions", auth: ["api_key"],
      m: [{ id: "google/gemini-2.5-flash", n: "Gemini 2.5 Flash", r: 1, c: 1048576 }, { id: "deepseek/deepseek-chat", n: "DeepSeek Chat", r: 0, c: 131072 }]
    },
    {
      id: "chutes", label: "Chutes AI", hint: "API key + OAuth", url: "https://llm.chutes.ai/v1", api: "openai-completions", auth: ["api_key", "oauth"],
      m: [{ id: "deepseek-ai/DeepSeek-V3-0324", n: "DeepSeek V3", r: 0, c: 131072 }, { id: "deepseek-ai/DeepSeek-R1", n: "DeepSeek R1", r: 1, c: 131072 }, { id: "Qwen/Qwen3-235B-A22B-Instruct", n: "Qwen3 235B", r: 0, c: 131072 }]
    },
    {
      id: "minimax", label: "MiniMax", hint: "M2.1 \u2014 API key + OAuth", url: "https://api.minimax.chat/v1", api: "openai-completions", auth: ["api_key", "oauth"], env: "MINIMAX_API_KEY",
      provKeys: ["minimax", "minimax-portal"],
      m: [{ id: "MiniMax-M2.1", n: "MiniMax M2.1", r: 0, c: 200000 }, { id: "MiniMax-VL-01", n: "MiniMax VL 01", r: 0, c: 200000 }]
    },
    {
      id: "moonshot", label: "Moonshot AI", hint: "Kimi K2.5", url: "https://api.moonshot.ai/v1", api: "openai-completions", auth: ["api_key"], env: "MOONSHOT_API_KEY",
      provKeys: ["moonshot", "kimi-coding"],
      m: [{ id: "kimi-k2.5", n: "Kimi K2.5", r: 0, c: 256000 }]
    },
    {
      id: "qwen-portal", label: "Qwen", hint: "OAuth", url: "https://portal.qwen.ai/v1", api: "openai-completions", auth: ["oauth"],
      m: [{ id: "coder-model", n: "Qwen Coder", r: 0, c: 128000 }, { id: "vision-model", n: "Qwen Vision", r: 0, c: 128000 }]
    },
    {
      id: "zai", label: "Z.AI (GLM 4.7)", hint: "API key", url: "https://open.bigmodel.cn/api/paas/v4", api: "openai-completions", auth: ["api_key"], env: "ZAI_API_KEY",
      m: [{ id: "glm-4.7", n: "GLM 4.7", r: 0, c: 198000 }]
    },
    {
      id: "qianfan", label: "Qianfan", hint: "API key", url: "https://qianfan.baidubce.com/v2", api: "openai-completions", auth: ["api_key"], env: "QIANFAN_API_KEY",
      m: [{ id: "deepseek-v3.2", n: "DeepSeek V3.2", r: 1, c: 98304 }, { id: "ernie-5.0-thinking-preview", n: "ERNIE 5.0 Thinking", r: 1, c: 119000 }]
    },
    {
      id: "github-copilot", label: "Copilot", hint: "GitHub device login", url: "https://api.individual.githubcopilot.com", api: "openai-completions", auth: ["oauth"],
      m: [{ id: "claude-sonnet-4", n: "Claude Sonnet 4", r: 0, c: 200000 }, { id: "gpt-4o", n: "GPT-4o", r: 0, c: 128000 }, { id: "o4-mini", n: "o4 Mini", r: 1, c: 200000 }, { id: "gemini-2.5-pro", n: "Gemini 2.5 Pro", r: 1, c: 1048576 }]
    },
    { id: "vercel-ai-gateway", label: "Vercel AI Gateway", hint: "API key", url: "https://ai-gateway.vercel.sh/v1", api: "openai-completions", auth: ["api_key"], env: "AI_GATEWAY_API_KEY", m: [] },
    { id: "opencode", label: "OpenCode Zen", hint: "Claude, GPT, Gemini", url: "https://opencode.ai/zen/v1", api: "openai-completions", auth: ["api_key"], env: "OPENCODE_API_KEY", m: [] },
    {
      id: "xiaomi", label: "Xiaomi", hint: "API key", url: "https://api.xiaomimimo.com/anthropic", api: "anthropic-messages", auth: ["api_key"], env: "XIAOMI_API_KEY",
      m: [{ id: "mimo-v2-flash", n: "MiMo V2 Flash", r: 0, c: 262144 }]
    },
    {
      id: "synthetic", label: "Synthetic", hint: "Multi-model Anthropic proxy", url: "https://api.synthetic.new/anthropic", api: "anthropic-messages", auth: ["api_key"], env: "SYNTHETIC_API_KEY",
      m: [{ id: "hf:MiniMaxAI/MiniMax-M2.1", n: "MiniMax M2.1", r: 0, c: 192000 }, { id: "hf:moonshotai/Kimi-K2-Thinking", n: "Kimi K2 Thinking", r: 1, c: 256000 }, { id: "hf:zai-org/GLM-4.7", n: "GLM-4.7", r: 0, c: 198000 }, { id: "hf:deepseek-ai/DeepSeek-V3.2", n: "DeepSeek V3.2", r: 0, c: 159000 }, { id: "hf:deepseek-ai/DeepSeek-R1-0528", n: "DeepSeek R1", r: 0, c: 128000 }, { id: "hf:Qwen/Qwen3-Coder-480B-A35B-Instruct", n: "Qwen3 Coder 480B", r: 0, c: 256000 }, { id: "hf:openai/gpt-oss-120b", n: "GPT OSS 120B", r: 0, c: 128000 }]
    },
    {
      id: "together", label: "Together AI", hint: "Open models", url: "https://api.together.xyz/v1", api: "openai-completions", auth: ["api_key"], env: "TOGETHER_API_KEY",
      m: [{ id: "zai-org/GLM-4.7", n: "GLM 4.7", r: 0, c: 202752 }, { id: "moonshotai/Kimi-K2.5", n: "Kimi K2.5", r: 1, c: 262144 }, { id: "deepseek-ai/DeepSeek-V3.1", n: "DeepSeek V3.1", r: 0, c: 131072 }, { id: "deepseek-ai/DeepSeek-R1", n: "DeepSeek R1", r: 1, c: 131072 }, { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", n: "Llama 3.3 70B", r: 0, c: 131072 }, { id: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", n: "Llama 4 Maverick", r: 0, c: 20000000 }]
    },
    { id: "venice", label: "Venice AI", hint: "Privacy-focused", url: "https://api.venice.ai/api/v1", api: "openai-completions", auth: ["api_key"], env: "VENICE_API_KEY", m: [] },
    { id: "litellm", label: "LiteLLM", hint: "100+ providers gateway", url: "", api: "openai-completions", auth: ["api_key"], env: "LITELLM_API_KEY", m: [] },
    { id: "cloudflare-ai-gateway", label: "Cloudflare AI Gateway", hint: "Account+Gateway+Key", url: "", api: "anthropic-messages", auth: ["api_key"], env: "CLOUDFLARE_AI_GATEWAY_API_KEY", m: [] },
    {
      id: "mistral", label: "Mistral", hint: "API key", url: "https://api.mistral.ai/v1", api: "openai-completions", auth: ["api_key"], env: "MISTRAL_API_KEY",
      m: [{ id: "codestral-latest", n: "Codestral", r: 0, c: 256000 }]
    },
    {
      id: "llama", label: "Llama API", hint: "Meta Llama models \u2014 API key", url: "https://api.llama.com/v1", api: "openai-completions", auth: ["api_key"], env: "LLAMA_API_KEY",
      m: [{ id: "Llama-4-Maverick-17B-128E-Instruct", n: "Llama 4 Maverick", r: 0, c: 1048576 }, { id: "Llama-4-Scout-17B-16E-Instruct", n: "Llama 4 Scout", r: 0, c: 524288 }, { id: "Llama-3.3-70B-Instruct", n: "Llama 3.3 70B", r: 0, c: 131072 }]
    },
  ];

  function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") }
  function fc(n) { if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(0) + "K"; return n }
  function getApp() { return document.querySelector("openclaw-app") }
  function getMain() { return document.querySelector("main.content") }
  function isTab() { var a = getApp(); return a && a.tab === "providers" }
  function getCfg() { var a = getApp(); return a ? a.configForm : null }

  function loadCfgFromGateway(app){
    if(!app||!app.client||!app.client.request)return Promise.resolve();
    return app.client.request("config.get",{}).then(function(res){
      if(res){
        app.configSnapshot=res;
        if(res.config){
          app.configForm=JSON.parse(JSON.stringify(res.config));
          app.configFormOriginal=JSON.parse(JSON.stringify(res.config));
          app.configRaw=JSON.stringify(res.config,null,2);
          app.configRawOriginal=JSON.stringify(res.config,null,2);
        }
      }
      return res;
    });
  }

  function ensureConfigLoaded(){
    var app=getApp();if(!app)return;
    if(!app.configForm&&!configLoaded){
      configLoaded=true;
      if(app.handleConfigLoad){app.handleConfigLoad()}
      else{loadCfgFromGateway(app).then(function(){setTimeout(render,100)}).catch(function(e){console.warn("providers: config load failed",e)})}
    }
  }

  function cfgProv(cfg) {
    if (!cfg || !cfg.models || !cfg.models.providers) return [];
    return Object.entries(cfg.models.providers).map(function (e) {
      return { id: e[0], baseUrl: e[1].baseUrl || "", api: e[1].api || "", apiKey: e[1].apiKey, models: Array.isArray(e[1].models) ? e[1].models : [] };
    });
  }
  function cfgProf(cfg) { return cfg && cfg.auth && cfg.auth.profiles ? cfg.auth.profiles : {} }
  function cfgAl(cfg) { return cfg && cfg.agents && cfg.agents.defaults && cfg.agents.defaults.models ? cfg.agents.defaults.models : {} }

  function reloadAfterRestart(app){
    var attempts=0,max=20;
    function tryLoad(){
      attempts++;
      if(!app||!app.client||!app.client.request||attempts>max){render();return}
      app.configFormDirty=false;
      loadCfgFromGateway(app).then(function(){configLoaded=true;setTimeout(render,50)}).catch(function(){setTimeout(tryLoad,500)});
    }
    setTimeout(tryLoad,1500);
  }

  function patchCfg(app,patch,onOk){
    if(!app||!app.client||!app.client.request||!app.connected){console.warn("providers: gateway not connected, retrying in 1s...");setTimeout(function(){patchCfg(app,patch,onOk)},1000);return}
    var raw=JSON.stringify(patch,null,2);
    console.log("providers: sending config.patch",patch);
    function doPatch(hash){
      app.client.request("config.patch",{raw:raw,baseHash:hash}).then(function(){
        console.log("providers: config.patch succeeded");
        if(onOk)onOk();
        return loadCfgFromGateway(app);
      }).then(function(){setTimeout(render,50)}).catch(function(e){
        var msg=String(e);
        if(msg.indexOf("1012")>=0||msg.indexOf("restart")>=0||msg.indexOf("closed")>=0){
          console.log("providers: gateway restarting after config change, will reconnect...");
          if(onOk)onOk();
          configLoaded=false;
          reloadAfterRestart(app);
        } else{console.error("providers: save failed",e);alert("Save failed: "+e)}
      });
    }
    var hash=app.configSnapshot&&app.configSnapshot.hash?app.configSnapshot.hash:null;
    if(hash){doPatch(hash)}
    else{
      app.client.request("config.get",{}).then(function(res){
        if(res)app.configSnapshot=res;
        if(res&&res.hash)doPatch(res.hash);else console.error("providers: no config hash");
      }).catch(function(e){console.error(e)});
    }
  }

  function countAccounts(provId, cfgProfiles, bp) {
    var keys = bp && bp.provKeys ? bp.provKeys : [provId];
    var count = 0, types = [];
    keys.forEach(function (k) {
      Object.entries(cfgProfiles).forEach(function (e) {
        var profId = e[0], prof = e[1];
        var provMatch = (prof && prof.provider === k);
        var idMatch = (profId.indexOf(k + ":") === 0);
        if (provMatch || idMatch) {
          count++;
          var t = prof && prof.mode ? prof.mode : (prof && prof.type ? prof.type : "api_key");
          if (types.indexOf(t) < 0) types.push(t);
        }
      });
    });
    return { count: count, types: types };
  }

  function getAuthStatus(provId, apiKey, cfgProfiles, bp) {
    var accts = countAccounts(provId, cfgProfiles, bp);
    var hasApiKeyInCfg = !!apiKey;
    var configured = accts.count > 0 || hasApiKeyInCfg;
    var totalCount = accts.count || (hasApiKeyInCfg ? 1 : 0);
    var label = "";
    if (configured) {
      var parts = [];
      if (accts.types.indexOf("oauth") >= 0) parts.push("\uD83D\uDD10 OAuth");
      if (accts.types.indexOf("token") >= 0) parts.push("\uD83C\uDFAB Token");
      if (accts.types.indexOf("api_key") >= 0 || hasApiKeyInCfg) parts.push("\uD83D\uDD11 API Key");
      label = parts.join(" + ") + " \u2014 " + totalCount + " account" + (totalCount > 1 ? "s" : "");
    } else if (bp && bp.env) {
      label = "Not configured (env: $" + bp.env + ")";
    } else {
      label = "Not configured";
    }
    return { configured: configured, label: label, count: totalCount };
  }

  function merge(cprovs, profs) {
    var cm = {}; cprovs.forEach(function (p) { cm[p.id] = p });
    var configured = [], available = [];
    var seen = {};

    BP.forEach(function (bp) {
      seen[bp.id] = 1;
      if (bp.provKeys) bp.provKeys.forEach(function (k) { seen[k] = 1 });
      var cp = cm[bp.id];
      var st = getAuthStatus(bp.id, cp ? cp.apiKey : undefined, profs, bp);
      var cModels = cp ? cp.models : [];
      var bModels = bp.m.map(function (m) { return { id: m.id, name: m.n, reasoning: !!m.r, input: ["text"], contextWindow: m.c, maxTokens: 8192 } });
      var entry = {
        id: bp.id, label: bp.label, hint: bp.hint, baseUrl: cp ? cp.baseUrl : bp.url, api: cp ? cp.api : bp.api, apiKey: cp ? cp.apiKey : undefined,
        models: cModels.length > 0 ? cModels : bModels, authModes: bp.auth, env: bp.env, builtin: true, status: st, cModels: cModels, bModels: bModels
      };
      if (st.configured) configured.push(entry); else available.push(entry);
    });

    cprovs.forEach(function (p) {
      if (!seen[p.id]) {
        var st = getAuthStatus(p.id, p.apiKey, profs, null);
        configured.push({
          id: p.id, label: p.id, hint: "Custom", baseUrl: p.baseUrl, api: p.api, apiKey: p.apiKey,
          models: p.models, authModes: ["api_key"], builtin: false, status: st, cModels: p.models, bModels: []
        });
      }
    });

    return { configured: configured, available: available };
  }

  function doAddBuiltin(app, bpId, key, oauth) {
    var bp = BP.find(function (b) { return b.id === bpId });
    if (!bp || !app) return;
    var models = bp.m.map(function (m) { return { id: m.id, name: m.n, reasoning: !!m.r, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: m.c, maxTokens: 8192 } });
    var provPatch = { baseUrl: bp.url, api: bp.api, models: models };
    if (key && key.trim()) provPatch.apiKey = key.trim();
    var patch = { models: { providers: {} }, auth: { profiles: {} } };
    patch.models.providers[bp.id] = provPatch;
    if (key && key.trim()) patch.auth.profiles[bp.id + ":default"] = { provider: bp.id, mode: "api_key" };
    if (oauth) patch.auth.profiles[bp.id + ":default"] = { provider: bp.id, mode: "oauth" };
    showAdd = false; addSel = ""; addKey = ""; addOauth = false;
    patchCfg(app, patch);
  }

  function doAddCustom(app) {
    var f = addCustom;
    var pid = f.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!pid || !f.baseUrl.trim() || !f.modelId.trim() || !app) return;
    var provPatch = { baseUrl: f.baseUrl.trim(), api: f.api, models: [{ id: f.modelId.trim(), name: f.modelName.trim() || f.modelId.trim(), reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: parseInt(f.ctx) || 131072, maxTokens: parseInt(f.max) || 8192 }] };
    if (addKey.trim()) provPatch.apiKey = addKey.trim();
    var patch = { models: { providers: {} }, auth: { profiles: {} } };
    patch.models.providers[pid] = provPatch;
    if (addKey.trim()) patch.auth.profiles[pid + ":default"] = { provider: pid, mode: "api_key" };
    showAdd = false; addSel = ""; addKey = ""; addOauth = false;
    addCustom = { id: "", baseUrl: "", api: "openai-completions", modelId: "", modelName: "", ctx: "131072", max: "8192" };
    patchCfg(app, patch);
  }

  function doSetKey(app, pid, key) {
    if (!app) return;
    var patch = { models: { providers: {} } };
    var cfg = getCfg();
    var existsInCfg = cfg && cfg.models && cfg.models.providers && cfg.models.providers[pid];
    if (existsInCfg) {
      patch.models.providers[pid] = { apiKey: key.trim() || null };
    } else {
      var bp = BP.find(function (b) { return b.id === pid });
      if (bp && key.trim()) {
        patch.models.providers[pid] = { baseUrl: bp.url, api: bp.api, apiKey: key.trim(), models: bp.m.map(function (m) { return { id: m.id, name: m.n, reasoning: !!m.r, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: m.c, maxTokens: 8192 } }) };
      } else return;
    }
    editProv = null;
    patchCfg(app, patch, function(){ alert("API key saved for " + pid + ". You may need to wait a moment for the gateway to restart.") });
  }

  function doRemove(app, pid) {
    if (!app) return;
    var patch = { models: { providers: {} }, auth: { profiles: {} } };
    patch.models.providers[pid] = null;
    var cfg = getCfg();
    if (cfg && cfg.auth && cfg.auth.profiles) Object.keys(cfg.auth.profiles).forEach(function (k) { if (k.indexOf(pid + ":") === 0) patch.auth.profiles[k] = null });
    patchCfg(app, patch);
  }

  function isRedacted(v) { return !v || v === "***" || v === "__OPENCLAW_REDACTED__" || v.indexOf("REDACTED") >= 0 }

  function doDiscoverModels(app, pid) {
    var cfg = getCfg();
    var prov = cfg && cfg.models && cfg.models.providers ? cfg.models.providers[pid] : null;
    var bp = BP.find(function (b) { return b.id === pid });
    var baseUrl = prov ? prov.baseUrl : (bp ? bp.url : "");
    if (!baseUrl) { alert("No base URL for " + pid); return }
    var cfgKey = prov ? prov.apiKey : "";
    var apiKey = "";
    if (cfgKey && !isRedacted(cfgKey)) {
      apiKey = cfgKey;
    } else {
      apiKey = prompt("Enter API key for " + (bp ? bp.label : pid) + " (needed for model discovery):", "");
      if (!apiKey || !apiKey.trim()) { alert("API key required for model discovery"); return }
      apiKey = apiKey.trim();
    }
    var modelsUrl = (bp && bp.discoverUrl) ? bp.discoverUrl : baseUrl.replace(/\/+$/, "") + "/models";
    var proxyHost = location.hostname || "127.0.0.1";
    var proxyBase = "http://" + proxyHost + ":18791";
    var fetchUrl = proxyBase + "/?url=" + encodeURIComponent(modelsUrl) + "&key=" + encodeURIComponent(apiKey);
    fetch(fetchUrl).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + (r.status === 401 ? " (Unauthorized — check your API key)" : ""));
      return r.json();
    }).then(function (data) {
      var models = (data.data || data.models || []).filter(function (m) {
        return m.id && !m.id.match(/embed|tts|whisper|dall|image|diffusion|ocr|Guard|audio|rerank/i);
      }).map(function (m) {
        var isR = !!(m.supported_features && m.supported_features.indexOf("reasoning") >= 0) ||
                  !!(m.supported_parameters && m.supported_parameters.indexOf("reasoning") >= 0);
        var inp = ["text"];
        var inMods = m.input_modalities || (m.architecture && m.architecture.input_modalities) || [];
        if (inMods.indexOf("image") >= 0) inp.push("image");
        var ctx = m.context_length || m.max_model_len || (m.top_provider && m.top_provider.context_length) || 131072;
        var maxT = m.max_output_length || (m.top_provider && m.top_provider.max_completion_tokens) || 8192;
        return { id: m.id, name: m.name || m.id.split("/").pop() || m.id, reasoning: isR, input: inp, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: ctx, maxTokens: maxT };
      });
      if (models.length === 0) { alert("No models discovered from " + modelsUrl); return }
      alert("Discovered " + models.length + " models for " + (bp ? bp.label : pid) + ". Saving...");
      var patch = { models: { providers: {} } };
      var provPatch = { models: models };
      if (!prov) { provPatch.baseUrl = baseUrl; provPatch.api = bp ? bp.api : "openai-completions" }
      if (cfgKey && isRedacted(cfgKey)) { provPatch.apiKey = apiKey }
      patch.models.providers[pid] = provPatch;
      patchCfg(app, patch);
    }).catch(function (e) { alert("Model discovery failed: " + e.message) });
  }

  var CSS = `<style>
.pi{display:flex;flex-direction:column;gap:16px}
.pi-sh{font-size:.88rem;font-weight:700;color:var(--fg,#e0e0e0);display:flex;align-items:center;gap:8px;margin:4px 0 2px}
.pi-sh .ct{font-size:.72rem;font-weight:500;color:var(--muted,#aaa);background:var(--bg-3,#222238);padding:1px 8px;border-radius:10px}
.pi-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(370px,1fr));gap:12px}
.pi-c{background:var(--bg-2,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:10px;padding:14px 16px;transition:all .15s}
.pi-c:hover{border-color:var(--accent,#6c63ff);box-shadow:0 2px 12px rgba(108,99,255,.06)}
.pi-c.on{border-left:3px solid #2ecc71}
.pi-c.off{opacity:.65}
.pi-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.pi-nm{font-size:.95rem;font-weight:600;color:var(--fg,#e0e0e0)}
.pi-hn{font-size:.7rem;color:var(--muted,#888);margin-left:4px;font-weight:400}
.pi-url{font-size:.68rem;color:var(--muted,#666);word-break:break-all;margin-top:1px}
.pi-tags{display:flex;gap:3px;flex-shrink:0}
.pi-tag{font-size:.6rem;padding:1px 6px;border-radius:3px;font-weight:500}
.pi-t-bi{background:#162a3a;color:#5ba3d9}.pi-t-cu{background:#2a1a3a;color:#b87fd9}.pi-t-api{background:#1a2a2a;color:#5bbf9f}
.pi-row{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap}
.pi-auth{font-size:.75rem;padding:2px 8px;border-radius:5px;display:inline-flex;align-items:center;gap:3px}
.pi-auth.ok{background:#12291a;color:#2ecc71}.pi-auth.no{background:#2a2a18;color:#c4a83a}
.pi-amodes{font-size:.65rem;color:var(--muted,#777);margin-top:2px}
.pi-mbtn{font-size:.72rem;color:var(--accent,#6c63ff);background:none;border:1px solid var(--accent,#6c63ff);border-radius:4px;padding:2px 9px;cursor:pointer;transition:all .12s}
.pi-mbtn:hover{background:var(--accent,#6c63ff);color:#fff}
.pi-mlist{margin-top:6px;border-top:1px solid var(--border,#2a2a3e);padding-top:6px}
.pi-m{display:flex;align-items:center;justify-content:space-between;padding:3px 7px;background:var(--bg-3,#191930);border-radius:4px;font-size:.75rem;margin-bottom:2px}
.pi-m-n{color:var(--fg,#e0e0e0)}.pi-m-m{color:var(--muted,#888);font-size:.65rem}
.pi-acts{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
.pi-kr{display:flex;gap:5px;margin-top:6px;align-items:center}.pi-kr input{flex:1;min-width:0;background:var(--bg-3,#222238);border:1px solid var(--border,#2a2a3e);border-radius:5px;padding:5px 8px;color:var(--fg,#e0e0e0);font-size:.78rem}.pi-kr input:focus{outline:none;border-color:var(--accent,#6c63ff)}
.pi-add{background:var(--bg-2,#1a1a2e);border:1px solid var(--accent,#6c63ff);border-radius:10px;padding:18px}
.pi-add-t{font-size:.95rem;font-weight:600;color:var(--fg,#e0e0e0);margin-bottom:12px}
.pi-add-row{display:flex;flex-direction:column;gap:8px}
.pi-add-row label{font-size:.75rem;font-weight:500;color:var(--muted,#888)}
.pi-add-row select,.pi-add-row input{background:var(--bg-3,#222238);border:1px solid var(--border,#2a2a3e);border-radius:5px;padding:7px 9px;color:var(--fg,#e0e0e0);font-size:.82rem;width:100%}
.pi-add-row select:focus,.pi-add-row input:focus{outline:none;border-color:var(--accent,#6c63ff)}
.pi-add-info{font-size:.75rem;color:var(--muted,#999);margin-top:2px;padding:8px 10px;background:var(--bg-3,#191930);border-radius:6px;line-height:1.5}
.pi-add-auth{display:flex;gap:6px;margin-top:6px}
.pi-add-auth button{padding:5px 12px;border-radius:5px;font-size:.78rem;cursor:pointer;border:1px solid var(--border,#2a2a3e);background:var(--bg-3,#222238);color:var(--fg,#e0e0e0);transition:all .12s}
.pi-add-auth button.sel{border-color:var(--accent,#6c63ff);background:rgba(108,99,255,.15);color:var(--accent,#6c63ff)}
.pi-add-btns{display:flex;gap:8px;margin-top:12px;justify-content:flex-end}
.pi-tb{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.pi-cg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}
.pi-cg.full{grid-template-columns:1fr}
.pi-fi{display:flex;flex-direction:column;gap:2px}
.pi-fi label{font-size:.72rem;font-weight:500;color:var(--muted,#888)}
.pi-fi input,.pi-fi select{background:var(--bg-3,#222238);border:1px solid var(--border,#2a2a3e);border-radius:5px;padding:6px 8px;color:var(--fg,#e0e0e0);font-size:.8rem}
.pi-fi input:focus,.pi-fi select:focus{outline:none;border-color:var(--accent,#6c63ff)}
.pi-loading{text-align:center;color:var(--muted,#888);padding:24px;font-size:.9rem}
</style>`;

  function render() {
    var el = getMain(), app = getApp(); if (!el || !app) return;
    var cfg = getCfg();

    var box = el.querySelector(".pi-inj");
    if (!box) {
      box = document.createElement("div"); box.className = "pi-inj"; var hdr = el.querySelector(".content-header");
      if (hdr && hdr.nextSibling) el.insertBefore(box, hdr.nextSibling); else el.appendChild(box)
    }

    if (!cfg) {
      box.innerHTML = CSS + '<div class="pi"><div class="pi-loading">Loading configuration...</div></div>';
      return;
    }

    var cp = cfgProv(cfg), pr = cfgProf(cfg), al = cfgAl(cfg), data = merge(cp, pr);

    var h = CSS + '<div class="pi">';
    h += '<div class="card"><div class="pi-tb"><div><div class="card-title">AI Providers</div>';
    h += '<div class="card-sub">\u2705 ' + data.configured.length + ' configured &nbsp;\u00B7&nbsp; \uD83D\uDD13 ' + data.available.length + ' available</div></div>';
    h += '<div style="display:flex;gap:6px"><button class="btn" id="pi-ref">Refresh</button>';
    h += '<button class="btn btn--primary" id="pi-ta">' + (showAdd ? "Cancel" : "\uFF0B Add Provider") + '</button></div></div></div>';

    if (showAdd) h += renderAddForm();

    if (data.configured.length > 0) {
      h += '<div class="pi-sh">\u2705 Configured <span class="ct">' + data.configured.length + '</span></div>';
      h += '<div class="pi-g">'; data.configured.forEach(function (p) { h += renderCard(p, al, true) }); h += '</div>';
    }
    if (data.available.length > 0) {
      h += '<div class="pi-sh" style="margin-top:6px">\uD83D\uDD13 Available <span class="ct">' + data.available.length + '</span></div>';
      h += '<div class="pi-g">'; data.available.forEach(function (p) { h += renderCard(p, al, false) }); h += '</div>';
    }
    h += '</div>';
    box.innerHTML = h;
    bind(app);
  }

  function renderAddForm() {
    var bp = addSel && addSel !== "custom" ? BP.find(function (b) { return b.id === addSel }) : null;
    var isCustom = addSel === "custom";
    var h = '<div class="pi-add"><div class="pi-add-t">Add Provider</div><div class="pi-add-row">';
    h += '<label>Select Provider</label><select id="pa-sel"><option value="">-- Choose a provider --</option>';
    BP.forEach(function (b) { h += '<option value="' + esc(b.id) + '"' + (addSel === b.id ? " selected" : "") + '>' + esc(b.label) + " \u2014 " + esc(b.hint) + '</option>' });
    h += '<option value="custom"' + (isCustom ? " selected" : "") + '>Custom Provider \u2014 Any OpenAI/Anthropic endpoint</option>';
    h += '</select>';

    if (bp) {
      h += '<div class="pi-add-info"><strong>' + esc(bp.label) + '</strong> &mdash; ' + esc(bp.hint) + '<br>';
      if (bp.url) h += 'Endpoint: <code>' + esc(bp.url) + '</code><br>';
      h += bp.m.length + ' models available</div>';
      h += '<label>Authentication Method</label><div class="pi-add-auth">';
      if (bp.auth.indexOf("api_key") >= 0 || bp.auth.indexOf("token") >= 0) h += '<button id="pa-ak" class="' + (!addOauth ? "sel" : "") + '">API Key</button>';
      if (bp.auth.indexOf("oauth") >= 0) h += '<button id="pa-oa" class="' + (addOauth ? "sel" : "") + '">OAuth</button>';
      h += '</div>';
      if (!addOauth) { h += '<label>API Key</label><input id="pa-key" type="password" placeholder="Enter your ' + esc(bp.label) + ' API key" value="' + esc(addKey) + '"/>'; }
      else { h += '<div class="pi-add-info">\uD83D\uDD10 To configure OAuth, run <code>openclaw onboard</code> in your terminal and select <strong>' + esc(bp.label) + '</strong>. The credentials will be saved automatically and appear here.</div>'; }
    }

    if (isCustom) {
      var f = addCustom;
      h += '<div class="pi-cg">';
      h += '<div class="pi-fi"><label>Provider ID</label><input id="pc-id" placeholder="e.g. my-provider" value="' + esc(f.id) + '"/></div>';
      h += '<div class="pi-fi"><label>Base URL</label><input id="pc-url" placeholder="https://api.example.com/v1" value="' + esc(f.baseUrl) + '"/></div>';
      h += '<div class="pi-fi"><label>API Type</label><select id="pc-api"><option value="openai-completions"' + (f.api === "openai-completions" ? " selected" : "") + '>OpenAI</option><option value="anthropic-messages"' + (f.api === "anthropic-messages" ? " selected" : "") + '>Anthropic</option></select></div>';
      h += '<div class="pi-fi"><label>API Key</label><input id="pa-key" type="password" placeholder="API key" value="' + esc(addKey) + '"/></div>';
      h += '<div class="pi-fi"><label>Model ID</label><input id="pc-mid" placeholder="e.g. gpt-4" value="' + esc(f.modelId) + '"/></div>';
      h += '<div class="pi-fi"><label>Model Name</label><input id="pc-mn" placeholder="e.g. GPT-4" value="' + esc(f.modelName) + '"/></div>';
      h += '<div class="pi-fi"><label>Context Window</label><input id="pc-ctx" type="number" value="' + esc(f.ctx) + '"/></div>';
      h += '<div class="pi-fi"><label>Max Tokens</label><input id="pc-max" type="number" value="' + esc(f.max) + '"/></div>';
      h += '</div>';
    }

    h += '</div><div class="pi-add-btns"><button class="btn" id="pa-cc">Cancel</button>';
    if (bp) h += '<button class="btn btn--primary" id="pa-ok">' + (addOauth ? "Done" : "Add with API Key") + '</button>';
    if (isCustom) h += '<button class="btn btn--primary" id="pa-ok-c">Add Custom Provider</button>';
    h += '</div></div>';
    return h;
  }

  function renderCard(p, al, isOn) {
    var apiLbl = (p.api || "").indexOf("anthropic") >= 0 ? "Anthropic" : (p.api || "").indexOf("gemini") >= 0 ? "Gemini" : "OpenAI";
    var exp = !!expandedModels[p.id], mc = p.models.length;

    var h = '<div class="pi-c ' + (isOn ? "on" : "off") + '">';
    h += '<div class="pi-hd"><div><span class="pi-nm">' + esc(p.label || p.id) + '</span>';
    if (p.hint) h += '<span class="pi-hn">' + esc(p.hint) + '</span>';
    h += '</div><div class="pi-tags"><span class="pi-tag ' + (p.builtin ? "pi-t-bi" : "pi-t-cu") + '">' + (p.builtin ? "Built-in" : "Custom") + '</span>';
    h += '<span class="pi-tag pi-t-api">' + apiLbl + '</span></div></div>';
    if (p.baseUrl) h += '<div class="pi-url">' + esc(p.baseUrl) + '</div>';

    h += '<div class="pi-row"><span class="pi-auth ' + (p.status.configured ? "ok" : "no") + '">' + (p.status.configured ? "\u2705" : "\u26A0\uFE0F") + ' ' + esc(p.status.label) + '</span></div>';
    if (p.authModes && p.authModes.length > 0) h += '<div class="pi-amodes">Supports: ' + p.authModes.map(function (a) { return a === "oauth" ? "\uD83D\uDD10 OAuth" : a === "token" ? "\uD83C\uDFAB Token" : "\uD83D\uDD11 API Key" }).join(", ") + '</div>';

    if (editProv === p.id) {
      h += '<div class="pi-kr"><input type="password" id="pk-' + esc(p.id) + '" placeholder="Enter API key"/>';
      h += '<button class="btn btn--sm" data-sk="' + esc(p.id) + '">Save</button><button class="btn btn--sm" data-ck="1">Cancel</button></div>';
    }

    h += '<div class="pi-row" style="margin-top:4px">';
    if (mc > 0) h += '<button class="pi-mbtn" data-tm="' + esc(p.id) + '">' + (exp ? "\u25B2 Hide" : "\u25BC Show") + ' ' + mc + ' model' + (mc > 1 ? "s" : "") + '</button>';
    else h += '<span class="pi-m-m">' + (p.builtin ? "Models resolved at runtime" : "No models") + '</span>';
    h += '</div>';

    if (exp && mc > 0) {
      h += '<div class="pi-mlist">';
      p.models.forEach(function (m) {
        var ref = p.id + "/" + m.id, alias = al[ref] && al[ref].alias ? al[ref].alias : "";
        h += '<div class="pi-m"><div><span class="pi-m-n">' + esc(m.name || m.id) + '</span>';
        if (alias) h += '<span class="pi-m-m"> \u2014 ' + esc(alias) + '</span>';
        if (m.reasoning) h += '<span class="pi-m-m"> (reasoning)</span>';
        h += '</div><span class="pi-m-m">' + fc(m.contextWindow || 4096) + ' ctx</span></div>';
      });
      h += '</div>';
    }

    h += '<div class="pi-acts">';
    if (editProv !== p.id) h += '<button class="btn btn--sm" data-ek="' + esc(p.id) + '">\uD83D\uDD11 Set API Key</button>';
    h += '<button class="btn btn--sm" data-dm="' + esc(p.id) + '">\uD83D\uDD0D Discover Models</button>';
    if (!p.builtin && isOn) h += '<button class="btn btn--sm btn--danger" data-rp="' + esc(p.id) + '">Remove</button>';
    h += '</div></div>';
    return h;
  }

  function bind(app) {
    var ref = document.getElementById("pi-ref");
    if (ref) ref.onclick = function () { configLoaded = false; ensureConfigLoaded() };

    var ta = document.getElementById("pi-ta");
    if (ta) ta.onclick = function () { showAdd = !showAdd; if (!showAdd) { addSel = ""; addKey = ""; addOauth = false } render() };

    var sel = document.getElementById("pa-sel");
    if (sel) sel.onchange = function () { addSel = sel.value; addKey = ""; addOauth = false; render() };

    var ak = document.getElementById("pa-ak"); if (ak) ak.onclick = function () { addOauth = false; render() };
    var oa = document.getElementById("pa-oa"); if (oa) oa.onclick = function () { addOauth = true; render() };

    var cc = document.getElementById("pa-cc");
    if (cc) cc.onclick = function () { showAdd = false; addSel = ""; addKey = ""; addOauth = false; render() };

    var ok = document.getElementById("pa-ok");
    if (ok) ok.onclick = function () { var ki = document.getElementById("pa-key"); if (ki) addKey = ki.value; doAddBuiltin(app, addSel, addKey, addOauth); render() };

    var okc = document.getElementById("pa-ok-c");
    if (okc) okc.onclick = function () {
      var g = function (i) { var e = document.getElementById(i); return e ? e.value : "" };
      addCustom.id = g("pc-id"); addCustom.baseUrl = g("pc-url"); addCustom.api = g("pc-api") || "openai-completions";
      addCustom.modelId = g("pc-mid"); addCustom.modelName = g("pc-mn"); addCustom.ctx = g("pc-ctx") || "131072"; addCustom.max = g("pc-max") || "8192";
      addKey = g("pa-key"); doAddCustom(app); render();
    };

    document.querySelectorAll("[data-ek]").forEach(function (b) { b.onclick = function () { editProv = b.dataset.ek; render() } });
    document.querySelectorAll("[data-ck]").forEach(function (b) { b.onclick = function () { editProv = null; render() } });
    document.querySelectorAll("[data-sk]").forEach(function (b) { b.onclick = function () { var i = document.getElementById("pk-" + b.dataset.sk); if (i) doSetKey(app, b.dataset.sk, i.value); render() } });
    document.querySelectorAll("[data-rp]").forEach(function (b) { b.onclick = function () { if (confirm("Remove " + b.dataset.rp + "?")) doRemove(app, b.dataset.rp); render() } });
    document.querySelectorAll("[data-tm]").forEach(function (b) { b.onclick = function () { expandedModels[b.dataset.tm] = !expandedModels[b.dataset.tm]; render() } });
    document.querySelectorAll("[data-dm]").forEach(function (b) { b.onclick = function () { doDiscoverModels(app, b.dataset.dm) } });
  }

  setInterval(function () {
    var t = isTab();
    if (t && !active) { active = true; ensureConfigLoaded(); setTimeout(render, 100) }
    else if (t && active) { var c = getCfg(); if (c !== cfgCache) { cfgCache = c; render() } }
    else if (!t && active) { active = false; configLoaded = false; var b = document.querySelector(".pi-inj"); if (b) b.remove() }
  }, POLL);
})();
