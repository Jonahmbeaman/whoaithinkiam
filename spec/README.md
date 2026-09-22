# spec/ — design artifacts, not shipped code

Nothing here is imported by the application. These files are the design record
for work that is specified but not yet wired, kept in the repository because the
reasoning is the valuable part and it would otherwise live only in a chat log.

| File | What it is |
|---|---|
| `field-schema.ts` | The type system for a dossier field: its category, redaction tier, shareability, and the safety invariants that bind them. |
| `field-registry.ts` | 61 curated fields the dossier will eventually infer, each with its own inference prompt, voice note, and tier. |

## Why these are not in `src/`

The live application derives a dossier from one system prompt with a fixed set
of sections. The registry replaces that with per-field prompts, which is what
makes each section independently testable — see `../PROMPT_SPEC.md` for the
method and `../ROADMAP.md` for where it sits in the plan.

Until that wiring lands, importing these would mean a thousand lines of unused
code inside the application bundle. They live here instead so the `src/` tree
contains only what actually runs.

## The part worth reading

`field-schema.ts` opens with an exclusion list — the fields deliberately *not*
built. It is the most important file in this directory. Among the rejected:
enumerated "skeletons" and leverage (an outing and blackmail engine), precise
geolocation, minors' details and named third parties, and operational
manipulation how-tos.

Each rejected capability is replaced by an abstracted field that makes the same
privacy point without producing the exploit. The registry demonstrates *that*
an inference is possible; it does not hand anyone a weapon built from it.

`distressGuard` marks signals — self-harm, abuse victimisation, crisis — that
must never render as a scored finding and never appear in an export. Where it
fires, the product owes the reader support resources, not analysis.
