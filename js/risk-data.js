// js/risk-data.js - free 12-item Consciousness Destabilization Risk Assessment: items, result text and scoring.
// Used by the free assessment (js/risk-scale.js) and by the result email (functions/api/risk-signup.js).
export const Q = [
  { d: "rigidity",  t: "There is more than one valid way to understand life.", r: true },
  { d: "structure", t: "Uncertain situations make me uneasy." },
  { d: "trauma",    t: "Painful memories from my past still upset me." },
  { d: "distress",  t: "I have trouble relaxing.", note: "Think about the past two weeks." },
  { d: "career",    t: "My career is progressing toward my goals.", r: true, note: "If you are not working now, think about your most recent work." },
  { d: "attach",    t: "I fear that the people closest to me will leave me." },
  { d: "attach",    t: "I keep my deepest feelings from my partner.", note: "If you are not in a relationship now, think about past relationships." },
  { d: "authentic", t: "I feel disconnected from my full authentic expression." },
  { d: "values",    t: "My personal values align with my workplace.", r: true, note: "If you are not working now, think about your most recent workplace." },
  { d: "fusion",    t: "At my core, I am the same as my group.", note: "\u201cGroup\u201d means your main professional, organizational or achievement identity." },
  { d: "trust",     t: "Letting go of control is hard for me." },
  { d: "support",   t: "I have people I can talk to about unusual inner experiences.", r: true }
];
export const D = {
  rigidity:  ["Ontological rigidity", "You tend to see one right way to understand life, which can make it harder to absorb experiences that challenge your view of the world."],
  structure: ["Need for structure", "Uncertainty makes you uneasy, so the open-ended nature of these practices may feel unsettling."],
  trauma:    ["Unresolved past experiences", "Painful memories still upset you, and deep inner work can bring them to the surface."],
  distress:  ["Current stress", "You are finding it hard to relax right now, which can make intense experiences harder to integrate."],
  career:    ["Career dissatisfaction", "Your career is not where you want it to be, so an intense experience may add pressure to make sudden changes."],
  attach:    ["Attachment insecurity", "Worry or distance in close relationships can make it harder to find steady support after an intense experience."],
  authentic: ["Distance from your authentic self", "You feel disconnected from your full authentic expression, a gap that awakening experiences often bring sharply into focus."],
  values:    ["Values mismatch at work", "Your values and your workplace pull in different directions, a gap that often widens after a peak experience."],
  fusion:    ["Identity fusion", "Your sense of self is closely tied to your professional identity, so experiences that loosen identity can feel especially destabilizing."],
  trust:     ["Difficulty letting go", "Letting go of control is hard for you, and intense inner experiences often ask for exactly that."],
  support:   ["Limited support", "You have few people to talk with about unusual inner experiences, which can make integration harder and lonelier."]
};
export const BANDS = {
  low: ["Lower likelihood", "Your answers suggest a relatively low likelihood of destabilization in response to consciousness-expanding practices. This does not make any practice risk-free, but it widens the range of approaches you could reasonably consider.",
    "Mindfulness, yoga and structured breathwork are the most evidence-supported starting points. More intensive approaches, including psychedelics, may also be appropriate, but only in properly screened and supported settings that include preparation and integration."],
  medium: ["Moderate likelihood", "Your answers suggest a moderate likelihood of destabilization: a mix of some risk factors alongside areas of relative strength, rather than a strongly elevated pattern.",
    "You are likely to be best served by practices that are structured, trauma-sensitive and gradual: guided trauma-sensitive mindfulness, yoga and other embodied practices, and slower guided breathwork. Any psychedelic approach should involve formal screening, preparation and integration support, not unsupervised use."],
  high: ["Higher likelihood", "Your answers suggest a concentrated pattern of risk factors across several areas, and a higher likelihood of destabilization in response to a peak consciousness-expanding experience.",
    "A stabilization-first, gentle approach is recommended: brief, grounding, facilitator-guided practices rather than long inward absorption; gentle trauma-informed yoga; slow-paced breathing; and support from a therapist or integration professional. Classic psychedelics are not recommended as a first step outside specialized, clinically supported care."]
};


// Same rule as the full assessment: overall = average of the area scores (each area counts equally);
// 1.00-3.00 Low, 3.01-5.00 Medium, 5.01-7.00 High. Highlighted areas = those scoring High (above 5.00).
export function scoreRisk(answers) {
  const per = {};
  Q.forEach((q, i) => { const v = q.r ? 8 - answers[i] : answers[i]; (per[q.d] = per[q.d] || []).push(v); });
  const list = Object.keys(per).map((d) => ({ d, s: Math.round(per[d].reduce((x, y) => x + y, 0) / per[d].length * 100) / 100 }));
  const overall = Math.round(list.reduce((x, y) => x + y.s, 0) / list.length * 100) / 100;
  const band = overall > 5 ? "high" : overall > 3 ? "medium" : "low";
  const tops = list.filter((x) => x.s > 5).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.d);
  return { band, tops };
}
