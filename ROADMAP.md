# Roadmap

Where Dossier is, and what it is deliberately not doing yet.

## Shipped

The product works end to end: pick the AI assistants you actually talk to, send
each the interrogation prompt, paste the replies back, and one Opus 5 call
compiles them into a three-sheet case file you can share by link.

**Nothing is stored.** No account, no cookies, no database, no history. A
dossier lives in the tab and in whatever link you choose to send. Three
carve-outs are stated plainly rather than papered over: the rate limiter holds
an IP in memory for ten minutes, Vercel keeps its own access logs, and you can
save the share image yourself.

**Each witness is asked for what it actually holds.** A chat assistant is asked
about conversation; Perplexity is asked for its query log, because a search
history is closer to intent than anything a person says out loud, and because
no prompt turns a search product into a profiler. See `src/lib/providers.ts`.

## Next — wire the field registry

`spec/field-registry.ts` holds 73 curated inferences, each with its own
inference prompt, voice note and redaction tier. `spec/field-schema.ts` holds
the type system and the exclusion list. Neither is imported by the application.

`PROMPT_SPEC.md` describes the method that makes them executable: every section
declares values on five axis groups, and a section prompt is assembled
deterministically from those axes rather than written by hand. Section 4 of
that document lists the four steps that remain.

The point of the registry is not more fields. It is that each field becomes
independently testable — you tune a section by choosing axis values and
measuring, instead of rewriting prose and hoping.

### The anti-glaze machinery, and the hole in it

`PROMPT_SPEC.md` §2C specifies `barnum_test`, `specificity_probe`,
`banned_lexicon` and `falsifier`. The falsifier is the sharpest of them: state
in one line what evidence would disprove the claim, and if you cannot, the
field is a horoscope rather than a finding.

There is a gap between two of those axes worth naming, because it is a
Goodhart problem. `specificity_probe` requires a concrete noun, number or time
window, and nothing requires that token be grounded in the corpus. A model told
to be specific will manufacture a specific, because specificity is the thing
being measured. The rule that closes it: **the token that satisfies the
specificity probe must itself satisfy `grounding_mode`.** Enforcing that needs
a verification pass that sees the claim and the corpus side by side with no
stake in having produced the claim — the generating model cannot audit its own
motivated reasoning.

## Also queued

- **Streaming progress.** A compile takes roughly half a minute and the page
  says nothing while it happens. Sections should arrive as they finish.
- **Prompting for form over content.** `src/lib/prompt.ts` asks witnesses
  mostly about topics. The stronger signal is the shape of the asking — what
  gets re-asked, what is hedged, and what is conspicuously never asked.
- **A durable rate limit.** `src/lib/guard.ts` explains why the in-memory
  counter is per-instance on Vercel and therefore not really enforced. Move it
  to KV before the URL reaches strangers at any scale.
- **An Open Graph image.** `twitter.card` is set to `summary_large_image` with
  no image behind it, so shared links preview blank.

## Deliberately not doing

Anything in the exclusion list at the top of `spec/field-schema.ts`: enumerated
secrets, precise geolocation, named third parties and pet names, operational
manipulation how-tos, and special-category health inference. Each is replaced
by an abstracted field that makes the same privacy point without producing the
exploit. The registry demonstrates that an inference is possible; it does not
hand anyone a weapon built from it.
