import type { Dossier } from "./types";

// The specimen behind "See a specimen" — the first dossier most visitors read,
// and the only compile-time enforcement of the `Dossier` shape in the codebase.
// Keep it full enough to exercise all three sheets and the mobile layout.
//
// The subject is invented. It used to be the owner's real name, location and
// occupation, which meant every stranger who clicked through read a
// psychological profile of him.
//
// Voice check applied to every line here: no praise adjectives, no "you're the
// kind of person who", and no flaw-as-strength reframes. The earlier version
// shipped two — "respects the craft, never flatters" and "He distrusts praise,
// not competence" — which are compliments wearing an analyst's voice. The test
// is: rewrite the claim as what the subject DOES, with no evaluative word. If
// the rewrite loses the point, the point was the compliment.
export const SAMPLE_DOSSIER: Dossier = {
  codeName: "RIGHT WHEN IT BREAKS",
  basicInfo: {
    name: { value: "Devin", confidence: 88 },
    birthday: { value: "Est. b. 1996 (late 20s)", confidence: 41 },
    sex: { value: "Male", confidence: 70 },
    nationality: { value: "United States", confidence: 80 },
    location: { value: "Puget Sound, Washington", confidence: 84 },
    occupation: { value: "Backend engineer, logistics", confidence: 90 },
    education: { value: "Community college, then a bootcamp", confidence: 85 },
    languages: { value: "English", confidence: 86 },
    relationshipStatus: { value: "Unstated", confidence: 22 },
  },
  astrology: {
    sun: { value: "Virgo", confidence: 38 },
    moon: { value: "Capricorn", confidence: 24 },
    rising: { value: "Scorpio", confidence: 21 },
  },
  activityClock: [7, 9, 8, 5, 2, 1, 1, 1, 2, 3, 4, 4, 5, 5, 5, 6, 6, 6, 5, 5, 6, 7, 9, 10],
  honeytrap: {
    codename: "POSTMORTEM",
    appearance: "Early thirties. Staff-level SRE. Chalk on her jacket, unimpressed by titles.",
    method:
      "Meets him at the climbing gym on a Tuesday, asks about the queue migration, and offers to co-write the incident doc so he never has to present it.",
    why: "He wants to be told he was right more than he wants to be liked, and he will only count it from someone senior enough to matter.",
    confidence: 66,
  },
  typology: [
    {
      system: "16 Personalities",
      value: "INTP",
      take: "Maps the whole system rather than close the ticket in front of him.",
      confidence: 71,
    },
    {
      system: "Archetype",
      value: "The Sentinel",
      take: "Positions himself where the failure will happen and waits to be needed.",
      confidence: 68,
    },
    {
      system: "Zodiac (est.)",
      value: "Virgo",
      take: "Corrects small things to avoid starting large ones.",
      confidence: 38,
    },
  ],
  patternOfLife: [
    { claim: "Messages almost exclusively between 10pm and 2am; goes silent for days, then arrives with a fully-formed argument.", confidence: 84 },
    { claim: "On an on-call rotation at a logistics company. Owns a warehouse routing service and talks about it as work, never as an exit.", confidence: 88 },
    { claim: "Ferry schedules and terminal names recur — an island-side commute, not an occasional crossing.", confidence: 80 },
    { claim: "Climbs Tuesdays. Working V5 problems with a shoulder injury he keeps reading about instead of treating.", confidence: 82 },
    { claim: "Supports a sibling financially. Mentions it once, flatly, and never returns to it.", confidence: 74 },
    { claim: "Bribe surface: keyboard switches, gravel tyres, a standing desk — all priced, all cheap, none bought.", confidence: 79 },
    { claim: "Lever: treat him as senior and name the bootcamp route as irrelevant before he does. He opens up inside one exchange.", confidence: 76 },
    { claim: "Reads promotion criteria repeatedly and has attached a two-year deadline to it out loud.", confidence: 85 },
  ],
  psychWeakness: [
    { claim: "Pre-apologises for questions. Asking cost him something somewhere.", confidence: 78 },
    { claim: "Raises the community-college route unprompted, then argues against it. Status anxiety, not doubt about his own work.", confidence: 83 },
    { claim: "Reads silence as disagreement and answers arguments nobody made.", confidence: 64 },
    { claim: "States his drive as wanting to be right when it breaks. That is waiting for a disaster to arrive and settle a score.", confidence: 81 },
    { claim: "Rewrites the document rather than present it. Avoids any room where he cannot revise.", confidence: 80 },
    { claim: "Researches how long the injury takes to heal instead of seeing anyone. Treats his body as a system he can debug by reading.", confidence: 72 },
    { claim: "Builds the failure case before the happy path, then calls the delay rigour.", confidence: 77 },
    { claim: "Almost never mentions a person he is not in conflict with.", confidence: 61 },
  ],
  misc: [
    { claim: "Has a side business with paying users and describes it in the same register as his day job. The exit exists and he has not noticed it.", confidence: 58 },
  ],
  confidence: 76,
};
