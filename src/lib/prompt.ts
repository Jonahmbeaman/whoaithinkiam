// The interrogation prompt handed to each AI. Concrete facets, hinted rather
// than announced, short chunks — with hard anti-flattery rules. Unknowns are
// answered "Insufficient evidence." rather than invented; the synthesis step
// depends on that honesty, and it keeps the sensitive fields safe.
export const INTERROGATION_PROMPT = `Your task: from the whole history of how I have used you — what I ask, how I ask
it, the things I keep returning to — extrapolate what can be inferred about who I
am, and write it up. Work ONLY from what you actually know about me from our
prior conversations and your memory of me. No web search. No guessing.

Rules that matter more than the sections below:
- Be specific and concrete. Every line must be true of ME and capable of being
  wrong about someone else. If it could be pasted onto a stranger, delete it.
- Hint, don't announce. Reveal facts in passing.
- Do NOT flatter, reassure, or compliment. Describe what I do, not how good it is.
- Plain, everyday language. Short.
- If you genuinely don't know a section, write exactly "Insufficient evidence."
  Never invent names, places, secrets, injuries, or facts I haven't given you.

Cover each of these, on its own line, prefixed with the bracketed label:

[NAME] my name or first name, if you know it.
[LOCATION] the city or region I'm based in.
[AGE] approximate is fine.
[WORK] what I do or am becoming, and the phase of life I'm in.
[EDUCATION] my schooling or how I've actually learned.
[HEADSPACE] what is genuinely occupying my mind right now.
[ROUTINE & PLACES] my daily rhythm — when I'm active, where I work or study, and
any specific places, restaurants, or spots I mention or look up.
[PEOPLE] names of family, partners, friends, or pets I've actually mentioned.
[INTERESTS] hobbies, teams I follow, favorite color, things I'd want as gifts.
[SKILLS] what I'm demonstrably good at, based on what I bring you.
[THE LENS] the specific assumption about the world I run on.
[HOW I THINK] how I actually approach problems and decide, including where it fails me.
[WHAT DRIVES ME] the need underneath my stated goals.
[WHAT I AVOID] what I deflect, defer, over-prepare for, or won't look at.
[WEAK POINTS] what gets to me, how someone could push my buttons, what I'm
insecure about — inferred from how I talk to you.
[LIABILITIES] any injuries, health limits, or vulnerabilities I've mentioned.
[LEVERAGE] anything I've actually told you that I'd be embarrassed by or that
could be used against me. Only real things I've said — otherwise "Insufficient evidence."
[TYPE] your honest best read of my Myers-Briggs (16 Personalities) type, an
archetype that fits me, and the zodiac energy I give off — each with a one-line
reason. Have an opinion.
[BLIND SPOT] one specific thing that is true about me that I don't seem to see.
State it even if it's unflattering.
[GOALS] what I'm working toward and any timelines I've attached.
[CONFIDENCE] one line: how well do you actually know me, honestly?

No emojis. No headings other than the bracketed labels above.`;
