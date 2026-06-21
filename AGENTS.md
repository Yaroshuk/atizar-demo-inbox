# AGENTS.md — notes for a coding agent working in this repo

This repo is **userland** built on the [Atizar](https://atizar.io) framework. The framework is
installed from npm (`@atizar/*`); you do **not** edit it here — you write workflow policy and UI
cards on top of it.

## The one rule that defines this codebase

**The agent proposes; a human approves; the server acts.** A model NEVER performs a consequential
action directly. Consequences live in **effect functions** (`server/`), bound to a tool name, run by
the **server** through an action ledger **exactly once, only after a human approves a gate**. A
prompt — even a jailbroken one — cannot fire an effect. Keep it that way: never move a side effect
into the model's tool surface or a prompt.

## What's where

```
workflows/email-inbox/   the example workflow — read this first as the template:
  descriptor.ts            defineWorkflow + defineAgent (structure: tools/approvals/renders/handoffs)
  prompts.ts               definePrompt per agent (turn-only prose; identity is prepended by the provider)
  contracts.ts             zod payload schemas passed between agents
  ids.ts / tools.ts / cards.ts   the per-workflow string consts (no magic literals)
  server.ts                allowed-tool lists + the EFFECT functions (the only place actions run)
  client.tsx               maps tool names → React card components
server/                  composition root: createServer({ workflowServers, providerRegistry, ... })
client/                  the board (mounts @atizar/react) + this workflow's cards
mcp/                     stdio MCP tools for the claude-cli provider
demo-cassettes/          committed SYNTHETIC recordings for `npm run demo` (safe to commit)
```

## Adding a new workflow

Mirror `workflows/email-inbox/`: a folder with `descriptor` (defineWorkflow/defineAgent), `prompts`
(definePrompt), `server` bindings (+ effect fns), and `client` (card registry) — then register it in
the three aggregators: `workflows/index.ts`, `server/workflows.ts`, `client/src/workflows.ts`.

- A tool that has a side effect → put it in the agent's `approvals` **and** `effects`, give it a
  `renders` card, and implement the effect in that workflow's `server.ts`. It will gate.
- A pure read → `readonly` only (never in `tools`).
- Operator-tunable values (windows, limits, thresholds) are **typed config parameters**, never magic
  numbers buried in prompt prose.

### Skills shipped with the framework

The `@atizar/*` packages ship coding-agent skills inside them — `add-workflow` (in `@atizar/core`,
scaffolds a whole workflow) and `gmail` (in `@atizar/integrations`). This repo wires
[`skills-npm`](https://github.com/antfu/skills-npm) via the `prepare` script, so **`npm install`
symlinks those skills into `skills/npm-<package>-<skill>/`** (gitignored, regenerated each install).
Point your agent at them, or open `skills/npm-atizar-core-add-workflow/SKILL.md` directly.

## Verifying your change

```bash
npm run typecheck && npm test       # unit + component tests
npm run demo                        # then click through the pipeline in the browser
```

The real bugs here are browser-only — **always click through `npm run demo`** (or `npm run ui` for
the Playwright suite) before claiming a UI change works. Approval flows especially.

## Hard rules

- **`demo-cassettes/` = synthetic, committed.** `.cassettes/` (gitignored) would hold REAL captured
  email data — never commit it.
- **Never send/act without an approval gate.** Drafts only; the human approves every Gmail action.
- The framework (`@atizar/*`) is a dependency — fix framework bugs upstream, not by patching
  `node_modules` here.
