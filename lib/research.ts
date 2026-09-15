/**
 * Research-first write pipeline.
 * A content agent is a research pipeline with a writing step bolted on the end.
 * Writing before research is refused. This seat does not post. Human tap only.
 */

export type FactKind = "sourced" | "inbound" | "seat" | "mapping";

export type ResearchFact = {
  id: string;
  claim: string;
  source: string;
  kind: FactKind;
};

export type ResearchPack = {
  id: string;
  title: string;
  inbound: string;
  facts: ResearchFact[];
  locked: boolean;
};

export type Draft = {
  reply: string;
  callCard: string;
  workBrief: string;
};

export const WRITE_BEFORE_RESEARCH =
  "Writing before research produces slop. Lock the facts first.";

export const EMPTY_RESEARCH = "Need locked facts. Photos do not parse. Type is not enough.";

const FORBIDDEN = [
  /schedule photo/i,
  /who works 5-7/i,
  /auto-send/i,
  /\bPIN\b/,
  /payroll/i,
  /food cost is\s+\d/i,
  /prime cost is\s+\d/i,
];

export const FOGG_INBOUND = [
  "Hello, Myke",
  "",
  "This is Stephanie, I work on BJ's team.",
  "",
  "Thanks for writing and for your interest in Dr. Fogg's work.",
  "",
  "BJ is booking these calls a few weeks out, typically on Wednesday mid-afternoon in Pacific time.",
  "",
  "Are you looking for training options in addition to discussing your work?",
  "",
  "With your reply, I can help guide next steps.",
  "",
  "Kind regards,",
  "Stephanie",
].join("\n");

export const FOGG_SOURCES = {
  learn: "https://www.bjfogg.com/learn",
  model: "https://www.behaviormodel.org/",
  call: "https://bjfogg.typeform.com/callwithBJFogg",
  course: "https://www.bjfogg.com/course",
} as const;

export function foggResearchFacts(): ResearchFact[] {
  return [
    {
      id: "inbound-ask",
      claim:
        "Stephanie (BJ's team) asked if Myke wants training options in addition to discussing his work. BJ books a few weeks out, typically Wednesday mid-afternoon Pacific.",
      source: "inbound email",
      kind: "inbound",
    },
    {
      id: "fit-call",
      claim:
        "BJ offers a free 15-minute call to help with what you are building and to decide if training is a fit. Stephanie follows up after the form.",
      source: FOGG_SOURCES.call,
      kind: "sourced",
    },
    {
      id: "live-training",
      claim:
        "Live Fogg Behavior Design Training is 6 interactive Zoom sessions with BJ. Tuition is $4,000 and includes monthly office hours after the training ends.",
      source: FOGG_SOURCES.learn,
      kind: "sourced",
    },
    {
      id: "online-course",
      claim:
        "Self-paced online course is $299: 8 modules, 75 short videos, worksheets, 6 months of access, monthly office hours.",
      source: FOGG_SOURCES.learn,
      kind: "sourced",
    },
    {
      id: "not-coach-cert",
      claim:
        "Tiny Habits coach certification is a different program on a different site. BJ's Behavior Design training is not that certification.",
      source: FOGG_SOURCES.learn,
      kind: "sourced",
    },
    {
      id: "b-map",
      claim:
        "Behavior happens when Motivation, Ability, and a Prompt come together at the same time. When a behavior does not occur, at least one of those three elements is missing.",
      source: FOGG_SOURCES.model,
      kind: "sourced",
    },
    {
      id: "seat",
      claim:
        "Action Shift owner seat: Community Tap, one manager, labor target 28%. Net = PDQ Subtotal. Labor = Labor Summary Total. Food HOLD unless same-day invoices AND a count. Human taps Send. No auto-send.",
      source: "this seat",
      kind: "seat",
    },
    {
      id: "map-loop",
      claim:
        "Mapping, not Fogg's words: Prompt = the PDQ EOD already arrived / desk after 8:05. Ability = two numbers, three tiles, one tap. Motivation = last night's leak, one manager. Tiny behavior = send one text.",
      source: "this seat × Fogg Behavior Model",
      kind: "mapping",
    },
  ];
}

export function foggPack(locked = false): ResearchPack {
  return {
    id: "fogg-stephanie",
    title: "Stephanie / BJ Fogg — discuss the work",
    inbound: FOGG_INBOUND,
    facts: foggResearchFacts(),
    locked,
  };
}

export function lockPack(pack: ResearchPack): ResearchPack {
  if (pack.facts.length === 0) {
    throw new Error(EMPTY_RESEARCH);
  }
  return { ...pack, locked: true };
}

function guardDraft(text: string) {
  for (const re of FORBIDDEN) {
    if (re.test(text)) {
      throw new Error("Draft crossed a locked never-do.");
    }
  }
}

export function writeFromResearch(pack: ResearchPack): Draft {
  if (!pack.locked) {
    throw new Error(WRITE_BEFORE_RESEARCH);
  }
  if (pack.facts.length === 0) {
    throw new Error(EMPTY_RESEARCH);
  }
  const draft = pack.id === "fogg-stephanie" ? writeFoggDraft() : writeGenericDraft(pack);
  guardDraft(draft.reply);
  guardDraft(draft.callCard);
  guardDraft(draft.workBrief);
  return draft;
}

export function writeFoggDraft(): Draft {
  const reply = [
    "Stephanie,",
    "",
    "Thank you. Yes — I want the 15 minutes to discuss the work.",
    "",
    "What I built: Action Shift. One morning habit for a restaurant owner. After 8:05, last night's two numbers are already on the desk (net + labor). Three tiles. One MOVE or HOLD. One text to one manager. Food stays HOLD until there is a same-day count. That loop is the product.",
    "",
    "I am not buying training in this email. If BJ looks at the work and says the Behavior Design training would sharpen it, I will listen on the call.",
    "",
    "Wednesday mid-afternoon Pacific works. I can take the next open Wednesday you have.",
    "",
    "Myke Mueller",
    "Never86'd · Community Tap & Pizza, Fort Dodge, Iowa",
  ].join("\n");

  const callCard = [
    "15 minutes. Wednesday mid-afternoon Pacific.",
    "",
    "1. The behavior: owner opens the desk after 8:05. Two numbers. One send.",
    "2. Fogg: Behavior = Motivation + Ability + Prompt at the same moment.",
    "   Prompt = the EOD already arrived.",
    "   Ability = two fields, three tiles, one tap.",
    "   Motivation = last night's leak, one manager.",
    "3. What I will not do: invent food cost, ask who is on the floor, send the manager without a tap, mix another house's dollars.",
    "4. Ask BJ: is this a real Behavior Design product, or am I missing a piece?",
  ].join("\n");

  const workBrief = [
    "Action Shift is an owner seat, not an operating system.",
    "",
    "Loop:",
    "- Last night arrives (PDQ EOD).",
    "- After 8:05 the desk has net + labor.",
    "- Close math. One MOVE or HOLD.",
    "- One text. Human tap.",
    "- Tomorrow's file proves whether the move landed.",
    "",
    "Community Tap. Fort Dodge. Labor target 28%. Food HOLD.",
    "",
    "Tiny Habits for a restaurant close: make the behavior tiny, anchor it to a prompt that already exists, do not add a dashboard.",
  ].join("\n");

  return { reply, callCard, workBrief };
}

function writeGenericDraft(pack: ResearchPack): Draft {
  const lines = pack.facts.map((f) => `- ${f.claim} (${f.source})`);
  const body = ["From locked research:", ...lines].join("\n");
  return { reply: body, callCard: body, workBrief: pack.title };
}
