# DOC 2: ANTIGRAVITY AGENT RULES

## Rule 1: Read Before Writing
Before creating any file, read all existing files in that directory. Never create a file that conflicts with or duplicates existing code.

## Rule 2: One Task Per Response
Execute exactly one atomic task per response. Do not chain unrelated changes.

## Rule 3: Complete Files Only
Never output partial files with "remaining code follows." Every file must be complete, runnable, and importable.

## Rule 4: No Placeholder Code
Replace every TODO, FIXME, placeholder, or mock data with actual working implementation.

## Rule 5: Import What You Use
Every import must be used. Every used module must be imported. No orphan imports, no missing imports.

## Rule 6: Type Everything
TypeScript strict mode. Every parameter, return type, and state variable gets an explicit type. No `any` unless commented why.

## Rule 7: Error Boundaries Everywhere
Every async operation gets try/catch. Every API route validates with Zod. Every database query handles errors.

## Rule 8: Follow Existing Patterns
Replicate existing patterns exactly. Do not introduce a new pattern for the same operation.

## Rule 9: No Dead Code
Do not comment out code. If something is no longer needed, move it to `_trash/`.

## Rule 10: Respect the Build Order
Follow DOC 4 strictly. No skipping. No building ahead of dependencies.

## Rule 11: Validate Assumptions
If unsure about a dependency, API, or behavior, state the assumption in a comment.

## Rule 12: Minimal Explanations
In code responses, output code only. No preamble. No closing.

## Rule 13: Environment Variables Over Hardcodes
Never hardcode secrets. Use `process.env.VARIABLE_NAME`. List new env vars at end of response.

## Rule 14: Mobile-First CSS
Every component usable on 375px before desktop optimization.

## Rule 15: One Source of Truth
If data exists in DB, do not duplicate in local state. If a type is defined in one file, import it.

## Rule 16: Parse AI Responses Defensively
Strip markdown code fences, try `JSON.parse()`, catch failure, return typed fallback. Never throw on bad AI output.

## Rule 17: No New Dependencies Without Asking
If a task requires an npm package not in `package.json`, stop and state: "Need to install `[package]`. Proceed?"

## Rule 18: Server Client vs Browser Client
Use `supabase/server.ts` in `layout.tsx`, `page.tsx`, `route.ts`. Use `supabase/client.ts` only in client components and hooks. Never mix.

## Rule 19: Components Under 150 Lines
If a component exceeds 150 lines, extract sub-components.

## Rule 20: User-Facing Errors Only
Never render raw errors or stack traces to users. Map to human-readable messages.

## Rule 21: Types Match Zod Schemas
Use `z.infer<typeof schema>` as the source of truth. Do not define a separate interface for the same data.

## Rule 22: Trash Folder Protocol
When removing code, move it to `_trash/` with a descriptive filename. Add a comment stating why and when. Never import from `_trash/` into production code.
