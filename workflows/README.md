# workflows/

The **W** in WAT. Each workflow is one Trigger.dev task plus its spec.

## Pairing rule

Every workflow has two files with the same base name:

| File                  | Purpose                                                                  |
|-----------------------|--------------------------------------------------------------------------|
| `<name>.md`           | Human-readable spec — inputs, outputs, scoring rubric, examples          |
| `<name>.task.ts`      | Trigger.dev v4 `schemaTask` — the runnable implementation                |

Spec first, code second. The spec is the source of truth; the task implements it.

## Conventions

- Use `schemaTask` from `@trigger.dev/sdk` with a Zod schema. The schema **is** the API contract — frontend forms validate against the same schema.
- Task `id` matches the file basename: `qualify-lead.task.ts` → `id: "qualify-lead"`.
- Pull integrations (OpenAI, etc.) from [`../tools/`](../tools/). Do not inline SDK setup.
- Export the task plus its input/output types from `workflows/index.ts`.
- Long-running steps (LLM calls > 5s) are fine — Trigger.dev checkpoints automatically.

## Current workflows

- `qualify-lead` — Scores a sales lead based on form input. (Spec + task to be written.)
