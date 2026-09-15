# AI Monitor

![ci](https://github.com/rajasekharponakala/ai-monitor/actions/workflows/ci.yml/badge.svg)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

AI platform usage + cost tracking: **OpenAI, Anthropic, OpenRouter** (API) and
**OpenCode, Claude Code** (local, no keys needed).

Single-stack **Next.js 14 + TypeScript**, zero runtime npm dependencies
(`node:sqlite` for storage). License: AGPL-3.0-or-later.

## Layout

```
dashboard/
  app/
    page.tsx                 # overview UI (provider cards + top costs)
    api/
      collect/route.ts       # POST: run all collectors (Bearer CRON_SECRET if set)
      resources/route.ts     # GET: rows JSON
      summary/route.ts       # GET: cost-by-provider JSON
  lib/monitor/
    config.ts db.ts util.ts collect.ts
    providers/openai.ts anthropic.ts openrouter.ts opencode_local.ts claude_local.ts
  scripts/collect-loop.mjs   # cron sidecar: POSTs /api/collect on an interval
.github/workflows/ci.yml     # lint + build
Dockerfile.dashboard docker-compose.yml
```

## Quick start

```bash
cp config.example.toml config.toml   # fill tokens; never commit this file
cd dashboard && npm install && npm run dev   # :3000, API on same origin
curl -X POST http://127.0.0.1:3000/api/collect   # run collectors
```

Scheduling: `scripts/collect-loop.mjs` (used by compose `collector` service),
Vercel Cron, or host cron hitting `POST /api/collect`. Set `CRON_SECRET` to
guard the endpoint. Env knobs: `CM_CONFIG` (default `../config.toml`),
`CM_DB` (default `../ai-monitor.db`).

Docker:

```bash
cp config.example.toml config.toml
CRON_SECRET=... docker compose up --build
```

Caddy:

```
ai.example.com {
    reverse_proxy 127.0.0.1:3002
}
```

## Provider auth (`config.toml` token)

| Provider | `token =` |
|---|---|
| openai | Org **admin** key (usage + costs API; plain API keys return 403) |
| anthropic | Org **admin** key (Claude Code `usage_report` analytics API) |
| openrouter | API key (key credits: limit / `usage_monthly`) |
| opencode | Local: empty = `~/.local/share/opencode/opencode.db`, or explicit path (per-session cost + tokens) |
| claudecode | Local: empty = `~/.claude/projects`, or explicit dir (token sums per day+model, cost estimated) |

## Cost model (estimates, not invoices)

- OpenAI: real 30d costs + per-model token usage (admin key required).
- Anthropic: `usage_report` analytics (defensive parse; raw snapshot row if shape differs).
- OpenRouter: key credits (`usage_monthly` as MTD).
- OpenCode (local): exact per-session cost + tokens from `opencode.db`.
- Claude Code (local): exact token sums from transcripts; cost estimated from public per-MTok rates.
- Gemini/ChatGPT subscriptions: no API — track via OpenRouter/GCP-billing rows or manual entries (gap documented).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security: [SECURITY.md](SECURITY.md).
