# tools/

The **T** in WAT. Pure helpers and integrations that workflows use.

## Rules

1. **No `@trigger.dev/sdk` imports.** Tools must be runnable outside a Trigger.dev task — that's what makes them testable and reusable.
2. **One file per integration.** `openai-client.ts`, future: `slack.ts`, `email.ts`.
3. **Re-export from `tools/index.ts`** so workflows import via `from "../tools"`.

## Layout

```
tools/
├── README.md
├── index.ts              ← re-exports public API
├── openai-client.ts      ← shared OpenAI client + model constants
└── scripts/              ← dev/deploy/type-check shell scripts (not imported)
```

## Why the no-Trigger.dev rule

Trigger.dev tasks run in a checkpointed runtime. If a tool imports task primitives, you can't unit-test it locally without spinning up Trigger.dev. Keeping tools pure means: write a tool, run it with `node`, ship it.
