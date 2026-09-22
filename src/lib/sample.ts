import type { Dossier } from "./types";

// Hardcoded specimen for design iteration and the landing-page preview.
export const SAMPLE_DOSSIER: Dossier = {
  codeName: "PRIVATE UNTIL PERFECT",
  basicInfo: {
    name: { value: "Jonah", confidence: 90 },
    birthday: { value: "Est. b. 2003 (early 20s)", confidence: 62 },
    sex: { value: "Male", confidence: 80 },
    nationality: { value: "United States", confidence: 78 },
    location: { value: "Texas (Central US)", confidence: 66 },
    occupation: { value: "Software engineer, pre-first-job", confidence: 84 },
    education: { value: "Self-taught + coding cohort", confidence: 71 },
    languages: { value: "English", confidence: 88 },
    relationshipStatus: { value: "Single (inferred)", confidence: 44 },
  },
  astrology: {
    sun: { value: "Virgo", confidence: 41 },
    moon: { value: "Scorpio", confidence: 30 },
    rising: { value: "Capricorn", confidence: 26 },
  },
  activityClock: [9, 8, 7, 4, 2, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 9, 10, 10],
  honeytrap: {
    codename: "MARA",
    appearance: "Female, early 20s. Dark hair, low-key style, resting focus.",
    method: "Shares his hours and his obsessions; respects the craft, never flatters.",
    why: "He distrusts praise, not competence.",
    confidence: 64,
  },
  typology: [
    { system: "16 Personalities", value: "INTJ", take: "Would rather be right alone than fast with help.", confidence: 68 },
    { system: "Archetype", value: "The Apprentice", take: "Always training for the real thing, never calling it arrived.", confidence: 74 },
    { system: "Zodiac (est.)", value: "Virgo", take: "Perfectionism aimed inward, so nothing is ever done.", confidence: 41 },
  ],
  patternOfLife: [
    { claim: "Most active late at night; works in bursts, then goes quiet.", confidence: 82 },
    { claim: "Works from home and through a cohort program.", confidence: 70 },
    { claim: "Searches for dev tools and game engines, not places.", confidence: 76 },
    { claim: "Treats small tasks as rehearsals for a bigger one coming.", confidence: 64 },
  ],
  psychWeakness: [
    { claim: "Asks for the correct terminology instead of the answer — needs to feel he earned it.", confidence: 79 },
    { claim: "Frames questions defensively, bracing to be told he's behind.", confidence: 72 },
    { claim: "Over-prepares under uncertainty; equates unfinished with exposed.", confidence: 81 },
    { claim: "Attachment to a personal game project reads as a world he can perfect alone.", confidence: 58 },
    { claim: "Rarely mentions people; the AI is doing some of a confidant's work.", confidence: 63 },
  ],
  privacyHazards: {
    people: [{ relation: "Cohort", detail: "A coding program he checks in with" }],
    pets: [],
    places: ["Texas"],
    accounts: ["GitHub (referenced)", "Godot forums (referenced)"],
    other: ["A Greek-myth game project he's attached to"],
  },
  misc: [
    { claim: "Comfortable at the command line; reaching for senior git habits.", confidence: 77 },
    { claim: "Deadlines cluster around summer.", confidence: 60 },
  ],
  confidence: 71,
  updateNote: "",
};

