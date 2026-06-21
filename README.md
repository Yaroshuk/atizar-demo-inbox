# atizar-demo-inbox

A **runnable example** built on the [Atizar](https://atizar.io) framework
([source](https://github.com/Yaroshuk/atizar)) — installed from npm (`@atizar/*`), not vendored. An email-inbox automation: a **sorter** agent reads unread mail and
routes each message to a **reply**, **reader**, **spam**, or **important** agent. Every
consequential action (saving a draft, starring, trashing) waits behind an **approval gate** — the
agent proposes, you approve, the server acts.

> **Developer builds · Human directs · Agent runs.** The model never fires an action on its own.

Clone it, run the zero-credential demo, then point it at your own Gmail.

---

## Quick start — the zero-credential demo

No Docker, no API keys, no LLM provider. The demo runs on an in-memory database and committed,
recorded "cassettes" — fully deterministic.

```bash
npm install
npm run demo          # → http://localhost:5173
```

Open the page, start the inbox, and walk the pipeline: the sorter routes a batch of emails, each
worker proposes its action, and you **approve / edit / reject** at each gate. Nothing touches a real
service.

Requirements: **Node ≥ 20.19** (Vite 8). Check with `node -v`.

---

## Run the inbox on your own Gmail

The demo above is fake data. To run the **real** inbox against your Gmail you supply three things:
a Postgres database, an LLM provider, and a Google OAuth app. Everything is configured through
environment variables — copy [`.env.example`](.env.example) to `.env.local` (gitignored) and fill
only what you use.

### 1. Install & database

```bash
npm install
docker compose up -d postgres     # default DATABASE_URL already matches these creds
npm run db:migrate                # create the schema
```

The Postgres URL resolves in order `ATIZAR_DATABASE_URL` → `DATABASE_URL` → the docker-compose
default — so with the standard `docker compose up` you set nothing.

### 2. Credentials

| Variable                                                   | Required for          | What it is / where to get it                                                                                                                                                                                         |
| ---------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ATIZAR_SECRET_KEY`                                        | any OAuth integration | AES master key for the **encrypted credential store**. Any strong random string (`openssl rand -hex 32`). Per-user tokens are encrypted with it.                                                                     |
| `ANTHROPIC_API_KEY`                                        | production provider   | Anthropic API key, used when `PROVIDER=mastra`. (Vendor convention — **not** namespaced.)                                                                                                                            |
| `ATIZAR_GOOGLE_CLIENT_ID`<br>`ATIZAR_GOOGLE_CLIENT_SECRET` | Gmail                 | One-time OAuth app from **Google Cloud Console → APIs & Services → Credentials → OAuth client ID** (enable the Gmail API). The per-user token is obtained later via the in-app **Connect** button — not pasted here. |
| `ATIZAR_AUTH_TOKEN`                                        | deploy only           | Shared bearer token guarding mutation routes. **Skip it locally** (see the auth note below) — set it only when exposing the server, and pair it with `VITE_ATIZAR_AUTH_TOKEN` (same value) so the client sends it.   |

Choose a provider:

- **`PROVIDER=mastra`** — the production path. Needs `ANTHROPIC_API_KEY`. (Optional `MASTRA_MODEL`.)
- **`PROVIDER=claude-cli`** — dev only (macOS). Uses your local Claude Code **subscription** via the
  keychain — no API key — but spawns the `claude` binary, so it's not for production.

`ANTHROPIC_API_KEY` is only for `PROVIDER=mastra`. With `PROVIDER=claude-cli` you don't set it —
the CLI authenticates through your Claude Code subscription in the macOS keychain.

A minimal `.env.local` for a real Gmail run **with `mastra`** (production):

> The file MUST be named **`.env.local`** (not `.env`) — that's the only name the server's dev
> autoloader reads.

```bash
ATIZAR_SECRET_KEY=<openssl rand -hex 32>
PROVIDER=mastra
ANTHROPIC_API_KEY=sk-ant-...
ATIZAR_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
ATIZAR_GOOGLE_CLIENT_SECRET=...
# DATABASE_URL defaults to the docker-compose Postgres — leave unset for the standard setup
```

Or **with `claude-cli`** (local dev on macOS — no API key, uses your Claude Code subscription):

```bash
ATIZAR_SECRET_KEY=<openssl rand -hex 32>
PROVIDER=claude-cli
# NO ANTHROPIC_API_KEY — claude-cli signs in via your Claude Code subscription (macOS keychain)
ATIZAR_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
ATIZAR_GOOGLE_CLIENT_SECRET=...
# DATABASE_URL defaults to the docker-compose Postgres — leave unset for the standard setup
```

Requires the `claude` CLI installed and logged in (`claude` once, interactively). It spawns the
binary per run, so it's for local dev, not production.

> **Don't set `ATIZAR_AUTH_TOKEN` locally.** It turns on bearer-token auth for every mutation; the
> client only sends a token if `VITE_ATIZAR_AUTH_TOKEN` is **also** set to the same value — otherwise
> every action returns `401 Unauthorized`. Use it only when deploying, and set **both** vars.

### 3. Run & connect

```bash
npm run dev          # server (:4000) + client (:5173)
```

Open the app, click **Connect** to authorize your Google account (the OAuth flow stores an encrypted
per-user token), and the inbox goes live: unread mail is sorted, replies are drafted, and every
consequential action waits for your approval before the server runs it.

---

## How it's wired (the example)

```
workflows/email-inbox/   the workflow: agent definitions, prompts, payload contracts, cards
server/                  composition root — createServer({ ... }) + the effect functions
client/                  the React board (mounts @atizar/react) + this workflow's cards
mcp/                     stdio MCP tools exposed to the claude-cli provider
demo-cassettes/          committed synthetic recordings that power `npm run demo`
```

The whole framework comes from npm: [`@atizar/core`](https://www.npmjs.com/package/@atizar/core),
`@atizar/providers`, `@atizar/server`, `@atizar/react`, `@atizar/integrations` — source at
**[github.com/Yaroshuk/atizar](https://github.com/Yaroshuk/atizar)**. This repo is only the
**userland** — the workflow policy and the UI cards. To build your own workflow on top, see
**[AGENTS.md](AGENTS.md)**.

## Coding-agent skills (from the packages)

The `@atizar/*` packages ship **skills** for AI coding agents inside them — `add-workflow`
(in `@atizar/core`, scaffolds a whole workflow end-to-end) and `gmail` (in `@atizar/integrations`).
This repo surfaces them with [`skills-npm`](https://github.com/antfu/skills-npm): a `prepare` script
runs on every `npm install` and **symlinks each package's skill into `skills/npm-<package>-<skill>/`**
(gitignored, regenerated each install — nothing to commit).

So right after `npm install` you'll have:

```
skills/
├── npm-atizar-core-add-workflow/   → @atizar/core's add-workflow skill
└── npm-atizar-integrations-gmail/  → @atizar/integrations' gmail skill
```

Point your coding agent at that folder (or open the `SKILL.md` inside directly). To add skills from
another package, just install a package that ships a `skills/` dir — `skills-npm` picks it up on the
next install. (Wiring lives in `package.json` → `"prepare": "skills-npm"` + the `**/skills/npm-*`
gitignore entry.)

## Scripts

| Command                   | What it does                                                |
| ------------------------- | ----------------------------------------------------------- |
| `npm run demo`            | zero-credential demo (in-memory DB + cassettes) on :5173    |
| `npm run dev`             | real server (:4000) + client (:5173)                        |
| `npm run db:migrate`      | create the schema in your Postgres                          |
| `npm test`                | unit + component tests (workflow + cards)                   |
| `npm run ui` / `ui:smoke` | Playwright browser E2E against the demo (headed / headless) |
| `npm run typecheck`       | `tsc --noEmit`                                              |
| `npm run lint` / `format` | ESLint / Prettier                                           |

## Safety, in one line

Effect tools bind to server-side functions the model never sees and run through an action ledger
**exactly once, only after you approve**. A jailbroken prompt still cannot fire an action. Stop one
agent, one workflow, or everything, at any moment.

## License

[MIT](LICENSE). Built on [atizar.io](https://atizar.io).
