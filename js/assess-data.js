// js/assess-data.js - Full Consciousness Destabilization Risk Assessment: items, scoring and report text.
// Used by the questionnaire and report pages (browser) and by functions/api/assess (server).
// Generated from the approved scale (version 5) and Dr. Overall's report template.

export const SECTIONS = [
 {
  "key": "trauma",
  "name": "Lifetime trauma exposure",
  "note": "Rate how much you agree that each statement describes your life so far.",
  "items": [
   {
    "id": "trauma1",
    "t": "I have had property taken from me by force.",
    "r": false
   },
   {
    "id": "trauma2",
    "t": "Another person has assaulted me.",
    "r": false
   },
   {
    "id": "trauma3",
    "t": "Someone has used a weapon to threaten me.",
    "r": false
   },
   {
    "id": "trauma4",
    "t": "I have been at home during a break-in.",
    "r": false
   },
   {
    "id": "trauma5",
    "t": "I have been in an accident that put my life at risk.",
    "r": false
   },
   {
    "id": "trauma6",
    "t": "I have lived through a natural disaster.",
    "r": false
   },
   {
    "id": "trauma7",
    "t": "I have seen someone get seriously injured.",
    "r": false
   },
   {
    "id": "trauma8",
    "t": "I have seen someone die.",
    "r": false
   },
   {
    "id": "trauma9",
    "t": "I have been present when someone died a violent death.",
    "r": false
   },
   {
    "id": "trauma10",
    "t": "I have been injured in a physical attack.",
    "r": false
   },
   {
    "id": "trauma11",
    "t": "Someone has touched me sexually without my consent.",
    "r": false
   },
   {
    "id": "trauma12",
    "t": "When I was a child, a caregiver hurt me physically.",
    "r": false
   },
   {
    "id": "trauma13",
    "t": "Another person has made me fear for my safety.",
    "r": false
   },
   {
    "id": "trauma14",
    "t": "Someone has seriously threatened to harm me.",
    "r": false
   },
   {
    "id": "trauma15",
    "t": "I have lived through a war.",
    "r": false
   },
   {
    "id": "trauma16",
    "t": "Someone close to me has died suddenly.",
    "r": false
   }
  ]
 },
 {
  "key": "impact",
  "name": "Unresolved impact of past events",
  "note": "Answer for the past month.",
  "items": [
   {
    "id": "impact1",
    "t": "Painful memories from my past still upset me.",
    "r": false
   },
   {
    "id": "impact2",
    "t": "Memories of past events overwhelm me at times.",
    "r": false
   }
  ]
 },
 {
  "key": "distress",
  "name": "Current psychological distress",
  "note": "Answer for the past two weeks.",
  "items": [
   {
    "id": "distress1",
    "t": "I have trouble relaxing.",
    "r": false
   },
   {
    "id": "distress2",
    "t": "Positive feelings seem out of reach for me.",
    "r": false
   },
   {
    "id": "distress3",
    "t": "I get short of breath while I am resting.",
    "r": false
   },
   {
    "id": "distress4",
    "t": "Starting tasks takes me a lot of effort.",
    "r": false
   },
   {
    "id": "distress5",
    "t": "My emotional reactions are stronger than situations call for.",
    "r": false
   },
   {
    "id": "distress6",
    "t": "I feel nervous.",
    "r": false
   },
   {
    "id": "distress7",
    "t": "There is little I look forward to.",
    "r": false
   },
   {
    "id": "distress8",
    "t": "I feel restless.",
    "r": false
   },
   {
    "id": "distress9",
    "t": "I feel discouraged.",
    "r": false
   },
   {
    "id": "distress10",
    "t": "Interruptions irritate me.",
    "r": false
   },
   {
    "id": "distress11",
    "t": "I feel close to panic.",
    "r": false
   },
   {
    "id": "distress12",
    "t": "Feeling excited about anything is hard for me.",
    "r": false
   },
   {
    "id": "distress13",
    "t": "I see myself as having little worth.",
    "r": false
   },
   {
    "id": "distress14",
    "t": "Small things upset me.",
    "r": false
   },
   {
    "id": "distress15",
    "t": "My heart races when I am at rest.",
    "r": false
   },
   {
    "id": "distress16",
    "t": "Fear comes over me for no clear reason.",
    "r": false
   },
   {
    "id": "distress17",
    "t": "My life feels meaningless.",
    "r": false
   }
  ]
 },
 {
  "key": "rigidity",
  "name": "Ontological rigidity",
  "note": "",
  "items": [
   {
    "id": "rigidity1",
    "t": "Trusting people fully usually causes trouble.",
    "r": false
   },
   {
    "id": "rigidity2",
    "t": "Being open-minded matters more to me than being right.",
    "r": true
   },
   {
    "id": "rigidity3",
    "t": "The world divides into people who stand for truth and people who oppose it.",
    "r": false
   },
   {
    "id": "rigidity4",
    "t": "Putting personal happiness first is morally wrong.",
    "r": false
   },
   {
    "id": "rigidity5",
    "t": "I change my views when the evidence points elsewhere.",
    "r": true
   },
   {
    "id": "rigidity6",
    "t": "Planning for the future matters more than fixing today’s problems.",
    "r": false
   },
   {
    "id": "rigidity7",
    "t": "There is more than one valid way to understand life.",
    "r": true
   },
   {
    "id": "rigidity8",
    "t": "Holding firmly to one set of beliefs is the ideal way to live.",
    "r": false
   },
   {
    "id": "rigidity9",
    "t": "Traditional ideas are usually better than new ones.",
    "r": false
   },
   {
    "id": "rigidity10",
    "t": "Most people are poor judges of what is good for them.",
    "r": false
   },
   {
    "id": "rigidity11",
    "t": "I find it hard to step away from a heated argument.",
    "r": false
   },
   {
    "id": "rigidity12",
    "t": "Everyone’s grasp of ultimate truth is limited.",
    "r": true
   },
   {
    "id": "rigidity13",
    "t": "I am sure my opinions are correct.",
    "r": false
   },
   {
    "id": "rigidity14",
    "t": "People without strong convictions are weak.",
    "r": false
   },
   {
    "id": "rigidity15",
    "t": "Caution is wiser than boldness.",
    "r": false
   },
   {
    "id": "rigidity16",
    "t": "Most situations have more than one reasonable interpretation.",
    "r": true
   },
   {
    "id": "rigidity17",
    "t": "I have the right answers to life’s important questions.",
    "r": false
   }
  ]
 },
 {
  "key": "structure",
  "name": "Need for structure",
  "note": "",
  "items": [
   {
    "id": "structure1",
    "t": "I like my life to be organized.",
    "r": false
   },
   {
    "id": "structure2",
    "t": "I like knowing what will happen next.",
    "r": false
   },
   {
    "id": "structure3",
    "t": "I enjoy acting on impulse.",
    "r": true
   },
   {
    "id": "structure4",
    "t": "Daily routines suit me.",
    "r": false
   },
   {
    "id": "structure5",
    "t": "Uncertain situations make me uneasy.",
    "r": false
   },
   {
    "id": "structure6",
    "t": "Unpredictable situations bother me.",
    "r": false
   },
   {
    "id": "structure7",
    "t": "Entering an unfamiliar situation upsets me.",
    "r": false
   },
   {
    "id": "structure8",
    "t": "Unclear rules make me uncomfortable.",
    "r": false
   },
   {
    "id": "structure9",
    "t": "I enjoy situations with few rules.",
    "r": true
   }
  ]
 },
 {
  "key": "authentic",
  "name": "Authenticity incongruence",
  "note": "",
  "items": [
   {
    "id": "authentic1",
    "t": "I feel disconnected from my full authentic expression.",
    "r": false
   },
   {
    "id": "authentic2",
    "t": "I find it hard to understand myself.",
    "r": false
   },
   {
    "id": "authentic3",
    "t": "I feel like a stranger to myself.",
    "r": false
   },
   {
    "id": "authentic4",
    "t": "My sense of who I am is unclear.",
    "r": false
   },
   {
    "id": "authentic5",
    "t": "My daily choices follow my own values.",
    "r": true
   },
   {
    "id": "authentic6",
    "t": "I stand firm in my beliefs under pressure.",
    "r": true
   },
   {
    "id": "authentic7",
    "t": "I act like my real self in most situations.",
    "r": true
   },
   {
    "id": "authentic8",
    "t": "The way I live expresses who I am.",
    "r": true
   },
   {
    "id": "authentic9",
    "t": "I do what others expect of me.",
    "r": false
   },
   {
    "id": "authentic10",
    "t": "Other people’s opinions sway me.",
    "r": false
   },
   {
    "id": "authentic11",
    "t": "I feel I must earn other people’s approval.",
    "r": false
   },
   {
    "id": "authentic12",
    "t": "My decisions are shaped by what others expect.",
    "r": false
   }
  ]
 },
 {
  "key": "fusion",
  "name": "Identity fusion",
  "note": "",
  "items": [
   {
    "id": "fusion1",
    "t": "My group and I are one.",
    "r": false
   },
   {
    "id": "fusion2",
    "t": "I am absorbed in my group.",
    "r": false
   },
   {
    "id": "fusion3",
    "t": "My group makes me strong.",
    "r": false
   },
   {
    "id": "fusion4",
    "t": "My group is stronger because of me.",
    "r": false
   },
   {
    "id": "fusion5",
    "t": "At my core, I am the same as my group.",
    "r": false
   },
   {
    "id": "fusion6",
    "t": "I am more committed to my group than its other members are.",
    "r": false
   },
   {
    "id": "fusion7",
    "t": "I would make big sacrifices for my group.",
    "r": false
   }
  ]
 },
 {
  "key": "attach",
  "name": "Attachment insecurity",
  "note": "These statements are about romantic partners. If you are not in a relationship now, think about your past relationships.",
  "items": [
   {
    "id": "attach1",
    "t": "I worry that I care more for my partner than my partner cares for me.",
    "r": false
   },
   {
    "id": "attach2",
    "t": "I rely on my partner to reassure me of their love.",
    "r": false
   },
   {
    "id": "attach3",
    "t": "I fear that the people closest to me will leave me.",
    "r": false
   },
   {
    "id": "attach4",
    "t": "I get frustrated when my partner is unavailable.",
    "r": false
   },
   {
    "id": "attach5",
    "t": "I doubt my partner’s love for me.",
    "r": false
   },
   {
    "id": "attach6",
    "t": "I want more closeness than my partner does.",
    "r": false
   },
   {
    "id": "attach7",
    "t": "I keep my deepest feelings from my partner.",
    "r": false
   },
   {
    "id": "attach8",
    "t": "Closeness with a partner makes me uneasy.",
    "r": false
   },
   {
    "id": "attach9",
    "t": "I find it easy to depend on a partner.",
    "r": true
   },
   {
    "id": "attach10",
    "t": "Sharing my feelings with a partner comes easily to me.",
    "r": true
   },
   {
    "id": "attach11",
    "t": "Relying on a partner is hard for me.",
    "r": false
   },
   {
    "id": "attach12",
    "t": "I avoid getting too close to a partner.",
    "r": false
   }
  ]
 },
 {
  "key": "reldis",
  "name": "Relationship dissatisfaction",
  "note": "",
  "items": [
   {
    "id": "reldis1",
    "t": "I am satisfied with my relationship.",
    "r": true
   },
   {
    "id": "reldis2",
    "t": "My relationship meets my needs.",
    "r": true
   },
   {
    "id": "reldis3",
    "t": "I wish I were in a different relationship.",
    "r": false
   },
   {
    "id": "reldis4",
    "t": "My partner and I have grown apart.",
    "r": false
   }
  ]
 },
 {
  "key": "trust",
  "name": "Trust and surrender",
  "note": "",
  "items": [
   {
    "id": "trust1",
    "t": "Letting go of control is hard for me.",
    "r": false
   },
   {
    "id": "trust2",
    "t": "Trusting the person leading a practice is hard for me.",
    "r": false
   },
   {
    "id": "trust3",
    "t": "I can let an experience unfold on its own.",
    "r": true
   },
   {
    "id": "trust4",
    "t": "I resist intense inner experiences.",
    "r": false
   }
  ]
 },
 {
  "key": "career",
  "name": "Career dissatisfaction",
  "note": "Think about your current work. If you are not working now, think about your most recent work.",
  "items": [
   {
    "id": "career1",
    "t": "I am pleased with what I have accomplished in my career.",
    "r": true
   },
   {
    "id": "career2",
    "t": "My career is progressing toward my goals.",
    "r": true
   },
   {
    "id": "career3",
    "t": "My income matches my goals.",
    "r": true
   },
   {
    "id": "career4",
    "t": "I am thinking about leaving my line of work.",
    "r": false
   }
  ]
 },
 {
  "key": "values",
  "name": "Values misalignment",
  "note": "Think about your current workplace. If you are not working now, think about your most recent workplace.",
  "items": [
   {
    "id": "values1",
    "t": "My workplace values what I value.",
    "r": true
   },
   {
    "id": "values2",
    "t": "My personal values align with my workplace.",
    "r": true
   },
   {
    "id": "values3",
    "t": "My workplace is a good match for my values.",
    "r": true
   }
  ]
 },
 {
  "key": "support",
  "name": "Support and integration",
  "note": "",
  "items": [
   {
    "id": "support1",
    "t": "I have people I can talk to about unusual inner experiences.",
    "r": true
   },
   {
    "id": "support2",
    "t": "A community would support me through a hard inner experience.",
    "r": true
   },
   {
    "id": "support3",
    "t": "I have a regular grounding practice.",
    "r": true
   },
   {
    "id": "support4",
    "t": "I know where to get professional help if I need it.",
    "r": true
   },
   {
    "id": "support5",
    "t": "My life is stable right now.",
    "r": true
   }
  ]
 }
];

export const DOMAIN_TEXT = {
 "rigidity": [
  "This looks at how fixed or certain your beliefs are, and how open you are to reconsidering your views when you meet new information.",
  "You tend to hold beliefs flexibly and are generally open to reconsidering a position when presented with new evidence.",
  "You show a mixed pattern, holding some beliefs firmly while remaining open to reconsideration in other areas.",
  "You tend to hold beliefs with high certainty and firmness, and may find it more difficult to reconsider a position once it is formed."
 ],
 "structure": [
  "This looks at how strongly you prefer predictability, clear rules and routine, and how comfortable you are with ambiguity and unstructured situations.",
  "You are generally comfortable with unpredictability and unstructured situations.",
  "You show a moderate preference for structure: generally comfortable with routine, with some discomfort in more ambiguous situations.",
  "You show a strong preference for structure and predictability, and tend to feel notably uncomfortable in ambiguous or unstructured situations."
 ],
 "trauma": [
  "This looks at lifetime exposure to potentially traumatic events, including violence, accidents, loss and abuse.",
  "You report relatively low exposure to potentially traumatic events.",
  "You report a moderate history of exposure to potentially traumatic events.",
  "You report a substantial history of exposure to potentially traumatic events."
 ],
 "impact": [
  "This looks at how much difficult past experiences still affect you today.",
  "Past difficult experiences appear to have little ongoing effect on you.",
  "Some past difficult experiences still affect you at times.",
  "Past difficult experiences still affect you strongly and may surface during intense inner work."
 ],
 "distress": [
  "This looks at your current levels of low mood, anxiety and stress.",
  "You are currently experiencing relatively little psychological distress.",
  "You are currently experiencing a moderate level of psychological distress.",
  "You are currently experiencing a substantial level of psychological distress across mood, anxiety and stress."
 ],
 "career": [
  "This looks at how satisfied you currently feel with your career progress, achievements and income goals.",
  "You report high satisfaction with your career progress and achievements.",
  "You report a mixed or moderate level of career satisfaction.",
  "You report low satisfaction with your career progress, achievements or income goals."
 ],
 "reldis": [
  "This looks at how satisfied you currently feel in your romantic relationship, where this applies.",
  "You report high satisfaction in your current relationship.",
  "You report a mixed or moderate level of relationship satisfaction.",
  "You report low satisfaction in your current relationship."
 ],
 "attach": [
  "This looks at how much anxiety and avoidance shape your patterns in close relationships, including fear of abandonment, need for reassurance and discomfort with emotional closeness.",
  "You show relatively secure patterns in close relationships, with low anxiety and low avoidance.",
  "You show a moderate degree of anxiety or avoidance in close relationships.",
  "You show a substantial degree of anxiety, avoidance, or both in close relationships."
 ],
 "authentic": [
  "This looks at how connected you feel to your true self, and how much your choices are shaped by your own values rather than external expectations.",
  "You report a strong, stable connection to your sense of self and generally act in line with your own values.",
  "You report a mixed pattern, with some areas of self-alignment and some areas more shaped by external expectations.",
  "You report feeling notably disconnected from your sense of self, or notably shaped by external expectations rather than your own values."
 ],
 "values": [
  "This looks at how closely your personal values align with the values of your workplace or organization.",
  "You report strong alignment between your personal values and your workplace’s values.",
  "You report a mixed or moderate degree of alignment between your personal and workplace values.",
  "You report a notable mismatch between your personal values and your workplace’s values."
 ],
 "fusion": [
  "This looks at how strongly your sense of self is merged with a group identity, to the point that the group’s interests and your own identity feel inseparable.",
  "Your sense of self is relatively distinct from any single group identity.",
  "You show a moderate degree of fusion with a group identity.",
  "You show a high degree of fusion with a group identity, to the point that the group’s interests and your own identity feel closely intertwined."
 ],
 "trust": [
  "This looks at how easily you can let go of control and trust a process when an experience becomes intense or uncertain.",
  "You generally find it possible to let go of control and trust a process.",
  "You can let go of control in some situations but find it difficult in others.",
  "Letting go of control is difficult for you, and you may resist intense inner experiences."
 ],
 "support": [
  "This looks at whether you have people and resources to help you make sense of, and integrate, unusual inner experiences.",
  "You report good support for making sense of and integrating unusual inner experiences.",
  "You report some support, with gaps in who you can turn to after unusual inner experiences.",
  "You report limited support for making sense of unusual inner experiences, which can make integration harder and lonelier."
 ]
};

export const OVERALL_TEXT = {
 "low": "Your overall profile suggests a relatively low likelihood of destabilization in response to consciousness-expanding practices, reflecting lower rigidity, a lighter trauma and distress burden, and stronger identity, relational, and value alignment. Recommendation: This does not make any practice risk-free, but it widens the range of approaches that can reasonably be considered, with mindfulness, yoga, and structured breathwork as the most evidence-supported starting points; more intensive approaches, including psychedelics, may also be appropriate but only within properly screened and supported settings.",
 "medium": "Your overall profile suggests a moderate likelihood of destabilization, reflecting a mix of some risk factors alongside areas of relative strength, rather than a strongly elevated overall pattern. Recommendation: The emphasis should shift from broad access toward graded, trauma-sensitive, and support-heavy approaches; guided trauma-sensitive mindfulness, yoga, and slower guided breathwork are the most defensible starting points, and any psychedelic approach should involve formal screening, preparation, and integration support rather than unsupervised use.",
 "high": "Your overall profile suggests a concentrated pattern of risk factors across multiple domains and a higher likelihood of destabilization in response to a peak consciousness-expansion experience. Recommendation: A stabilization-first, trauma-informed, and clinically conservative approach is indicated; brief, externally anchored, facilitator-guided practices are recommended over prolonged inward absorption, and classic psychedelics are not recommended as a first-line option outside specialized, clinically supported care."
};

export const GUIDANCE = {
 "low": {
  "intro": "People in the low-risk category are generally better positioned to tolerate ambiguity, emotional intensity, and meaning reconstruction. That does not make intense methods risk-free, but it does widen the set of practices that can reasonably be considered. Low-risk individuals are not immune to adverse effects; the literature suggests they are generally better candidates for a graded, well-supported progression into deeper consciousness-expanding work.",
  "items": [
   {
    "h": "Mindfulness-based interventions",
    "p": "A strong first-line recommendation. Across reviews, mindfulness-based interventions are consistently associated with improvements in anxiety, depression, and stress-related outcomes across multiple populations."
   },
   {
    "h": "Yoga and related embodied contemplative practices",
    "p": "Yoga- and mindfulness-based approaches are associated with beneficial effects on physiological stress markers, including cortisol, heart rate, and blood pressure, suggesting these practices may help regulate stress systems in ways relevant to emotional stabilization and consciousness exploration."
   },
   {
    "h": "Breathwork as a moderate-intensity option",
    "p": "Slow, regulated breathing practices are associated with reductions in stress, anxiety, and symptoms of trauma-related dysregulation, though the field continues to call for larger and more rigorous trials to clarify mechanisms and long-term effects."
   },
   {
    "h": "Psychedelics",
    "p": "Classic psychedelics have generally been found well tolerated in clinical and research settings, though serious adverse events do occur and safety cannot be assumed outside controlled contexts. Psychedelic work may be appropriate for low-risk individuals, but only in screened, supported, and legally compliant contexts rather than through casual or unsupervised use."
   }
  ],
  "overall": "Overall, individuals in the low destabilization-risk category are the strongest candidates for a broad range of consciousness-expanding practices, with mindfulness, yoga, and structured breathing practices as the most evidence-supported starting points. Psychedelic-assisted approaches may also be appropriate for this group, but only within settings that include proper screening, preparation, facilitation, and integration — even well-screened participants can experience adverse events or difficult material during altered states."
 },
 "medium": {
  "intro": "The literature supports a selective, paced, and support-heavy approach for this group. Consciousness-expanding methods may still be beneficial, but the emphasis should shift from broad access to graded exposure, trauma sensitivity, and relational or clinical containment. Moderate-risk individuals are not necessarily unsuitable for deeper practices, but they are less suitable for unsupervised, high-intensity, or poorly integrated approaches, and better suited to approaches that explicitly scaffold regulation and safety.",
  "items": [
   {
    "h": "Trauma-sensitive mindfulness",
    "p": "The most defensible recommendation is guided, moderate-dose, trauma-sensitive mindfulness, ideally in formats that allow titration of interoceptive exposure, normalization of difficult experiences, and access to support if dysregulation emerges."
   },
   {
    "h": "Yoga and related embodiment practices",
    "p": "These may be particularly beneficial because they can support emotional regulation, interoception, and somatic stabilization without requiring immediate immersion in highly unstructured inner experience. Reviews have found beneficial effects of yoga on PTSD symptoms specifically, supporting its use as a complementary rather than stand-alone intervention."
   },
   {
    "h": "Breathwork",
    "p": "Breathing exercises can reduce anxiety and stress, and effective interventions typically involve guided instruction, multiple sessions, and avoidance of fast-only or very brief practices. The literature most clearly supports slow, paced, diaphragmatic, guided respiration — not indiscriminate use of highly activating hyperventilatory methods. For individuals with moderate trauma burden, dissociative tendencies, or emotional suppression, slower and more structured breathing approaches are more defensible because they align better with nervous-system regulation and are less likely to produce abrupt destabilizing activation."
   },
   {
    "h": "Psychedelics",
    "p": "Psychological safety, readiness, and trauma-informed care are central to safety and acceptability for this group, especially given trauma-related vulnerabilities. If psychedelic approaches are considered at all, they should require high-quality screening, trauma-informed preparation, closely supported administration, and substantial integration support. Ketamine has shown promise for PTSD and trauma-related symptoms, with modest symptom reduction reported, especially in the short term. MDMA-assisted therapy has shown significant efficacy for chronic PTSD in clinical trials and meta-analytic reviews, though it remains a specialized, closely supervised intervention."
   }
  ],
  "overall": "Overall, individuals in the medium destabilization-risk category are best served by practices that are structured, trauma-sensitive, and gradual: guided mindfulness in trauma-sensitive formats, yoga and other embodied regulation practices, and slower guided breathwork, all of which offer meaningful benefit with a comparatively lower destabilization burden than more intense approaches. Psychedelic approaches should be approached more cautiously; the literature does not support treating medium-risk individuals as ideal candidates for unsupervised or high-intensity psychedelic exploration."
 },
 "high": {
  "intro": "The literature supports a stabilization-first, trauma-informed, and clinically conservative approach for this group. It does not support recommending highly intense, unsupervised, or poorly contained consciousness-expanding practices; instead it supports a model centered on safety, pacing, titration, and relational or clinical containment.",
  "items": [
   {
    "h": "Meditative practices",
    "p": "High-risk individuals are likely better served by brief, grounding-oriented interventions and paced attention training that allow moving in and out of experience rather than remaining immersed in difficult internal material without adequate support."
   },
   {
    "h": "Trauma-informed mindfulness",
    "p": "The most appropriate contemplative approach for this group is brief, externally anchored, clinician- or facilitator-guided practice emphasizing orienting, sensory grounding, self-compassion, and flexible attention rather than prolonged inward absorption. For high-risk individuals, mindfulness should function as a carefully titrated regulation practice, not an immediate pathway into ego-transcendence or ontological disruption."
   },
   {
    "h": "Trauma-informed yoga and gentle embodied practices",
    "p": "Yoga can reduce PTSD and depressive symptoms in trauma-exposed populations, with trauma-sensitive formats particularly compatible with individuals who need body-based regulation rather than immediate deep cognitive deconstruction. Gentle, trauma-informed, body-based practices that restore safety and tolerance gradually are the strongest recommendation here; they may still expand consciousness meaningfully — through improved interoception, self-awareness, and affect regulation — but in a less destabilizing way than methods designed to induce dramatic non-ordinary states."
   },
   {
    "h": "Breathwork",
    "p": "Breathing interventions can reduce anxiety and stress when structured, repeated, and guided, but the evidence is strongest for slower, more regulated approaches rather than highly activating or cathartic forms. For this group, breathwork is best used as a nervous-system regulation practice, not as a shortcut to catharsis or ego-dissolution."
   },
   {
    "h": "Psychedelics",
    "p": "The literature does not support recommending classic psychedelic use as a first-line intervention for high-risk individuals. Reviews of modern microdosing research note that alongside reported improvements in mood and focus, participants also report challenges such as physiological discomfort and increased anxiety, and microdosing or very low-dose psychedelic use should not be assumed to be a safe entry point: the current controlled evidence is limited, efficacy findings are mixed, and some studies report increased anxiety or physiological discomfort, particularly outside ideal research conditions. Ketamine has shown some promise for PTSD and trauma-related symptoms, though its research context is generally more medicalized, titratable, and symptom-focused than self-directed classic psychedelic use. MDMA-assisted therapy has demonstrated efficacy for PTSD in clinical trials, but remains a specialized intervention requiring intensive screening, psychotherapy, monitoring, and integration. High-risk individuals should not be encouraged toward unsupervised consciousness-expansion practices that substantially destabilize ordinary consciousness."
   }
  ],
  "overall": "Overall, individuals in the high destabilization-risk category are best served by stabilization-first, trauma-informed, low-intensity approaches: brief trauma-sensitive mindfulness, gentle trauma-informed yoga, slow-paced breathing practices, psychotherapy, and integration-oriented relational support, rather than abrupt or highly immersive state-change methods. Classic psychedelics should generally not be recommended as first-line options for this group, since current safety data come largely from screened research samples and do not adequately justify extrapolation to highly vulnerable individuals. Microdosing and very low-dose psychedelic use also should not be assumed to be safe entry points."
 }
};

export const REFERENCES = {
 "low": [
  "Britton, W. B., Lindahl, J. R., Cooper, D. J., Canby, N. K., & Palitsky, R. (2021). Defining and measuring meditation-related adverse effects in mindfulness-based programs. Clinical Psychological Science, 9(6), 1185–1204.",
  "Brown, R. P., & Gerbarg, P. L. (2005). Sudarshan Kriya yogic breathing in the treatment of stress, anxiety, and depression: Part I—Neurophysiologic model. Journal of Alternative and Complementary Medicine, 11(1), 189–201.",
  "Cramer, H., Lauche, R., Anheyer, D., Pilkington, K., de Manincor, M., Dobos, G., & Ward, L. (2018). Yoga for anxiety: A systematic review and meta-analysis of randomized controlled trials. Depression and Anxiety, 35(9), 830–843.",
  "Hinkle, J. T., Ahuja, T., Grandhi, D., et al. (2024). Adverse events in studies of classic psychedelics: A systematic review and meta-analysis. JAMA Psychiatry, 81(12), 1243–1255.",
  "Hofmann, S. G., & Gómez, A. F. (2017). Mindfulness-based interventions for anxiety and depression. Psychiatric Clinics of North America, 40(4), 739–749.",
  "Pascoe, M. C., Thompson, D. R., & Ski, C. F. (2017). Yoga, mindfulness-based stress reduction and stress-related physiological measures: A meta-analysis. Psychoneuroendocrinology, 86, 152–168.",
  "Zaccaro, A., Piarulli, A., Laurino, M., Garbella, E., Menicucci, D., Neri, B., & Gemignani, A. (2018). How breath-control can change your life: A systematic review on psychophysiological correlates of slow breathing. Frontiers in Human Neuroscience, 12, 353."
 ],
 "medium": [
  "Almeida, T. M., Mothes, H., de Oliveira, P. S., et al. (2024). Effectiveness of ketamine for the treatment of post-traumatic stress disorder: A systematic review. Frontiers in Psychiatry, 15, 1354330.",
  "Bentley, T. G. K., Matz, C. J., Xu, X., et al. (2023). Breathing practices for stress and anxiety reduction: Conceptual framework of implementation guidelines based on a systematic review of the published literature. Brain and Behavior, 13(12), e3338.",
  "Britton, W. B., Lindahl, J. R., Cooper, D. J., Canby, N. K., & Palitsky, R. (2021). Defining and measuring meditation-related adverse effects in mindfulness-based programs. Clinical Psychological Science, 9(6), 1185–1204.",
  "Brown, R. P., & Gerbarg, P. L. (2013). Breathing practices for treatment of psychiatric and stress-related medical conditions. Psychiatric Clinics of North America, 36(1), 121–140.",
  "Cramer, H., Anheyer, D., Saha, F. J., & Dobos, G. (2018). Yoga for posttraumatic stress disorder: A systematic review and meta-analysis. BMC Psychiatry, 18, 72.",
  "Hinkle, J. T., Ahuja, T., Grandhi, D., et al. (2024). Adverse events in studies of classic psychedelics: A systematic review and meta-analysis. JAMA Psychiatry, 81(12), 1243–1255.",
  "Mitchell, J. M., Bogenschutz, M., Lilienstein, A., et al. (2023). MDMA-assisted therapy for moderate to severe PTSD: A randomized, placebo-controlled phase 3 trial. Nature Medicine, 29, 2473–2480.",
  "Modlin, N. L., Mountford, V. A., Beetham, T., et al. (2024). Trauma-informed care in psychedelic therapy research: A qualitative literature review of evidence-based psychotherapy interventions in PTSD and psychedelic therapy across conditions. Neuropsychiatric Disease and Treatment, 20, 109–135.",
  "Nejadghaderi, S. A., Sullman, M. J. M., Kolahi, A.-A., et al. (2024). Efficacy of yoga for posttraumatic stress disorder: A systematic review and meta-analysis. Journal of Clinical Medicine, 13(14), 4138.",
  "Sicignano, D. J., Gonzalez, A., Keane, T. M., et al. (2024). The impact of ketamine for treatment of post-traumatic stress disorder: A systematic review and meta-analysis. Journal of Psychiatric Research, 170, 25–35.",
  "Yang, J., Wang, D., Sun, C., et al. (2024). The efficacy and safety of MDMA-assisted psychotherapy for the treatment of posttraumatic stress disorder: A systematic review and meta-analysis. Psychiatry Research, 338, 116030."
 ],
 "high": [
  "Almeida, T. M., Mothes, H., de Oliveira, P. S., et al. (2024). Effectiveness of ketamine for the treatment of post-traumatic stress disorder: A systematic review. Frontiers in Psychiatry, 15, 1354330.",
  "Bentley, T. G. K., Matz, C. J., Xu, X., et al. (2023). Breathing practices for stress and anxiety reduction: Conceptual framework of implementation guidelines based on a systematic review of the published literature. Brain and Behavior, 13(12), e3338.",
  "Borgogna, N. C., Ismayilova, D., McDermott, R. C., et al. (2024). So how special is special K? A systematic review and meta-analysis of ketamine treatment for posttraumatic stress disorder. Psychological Medicine, 54(7), 1552–1563.",
  "Britton, W. B., Lindahl, J. R., Cooper, D. J., Canby, N. K., & Palitsky, R. (2021). Defining and measuring meditation-related adverse effects in mindfulness-based programs. Clinical Psychological Science, 9(6), 1185–1204.",
  "Brown, R. P., & Gerbarg, P. L. (2013). Breathing practices for treatment of psychiatric and stress-related medical conditions. Psychiatric Clinics of North America, 36(1), 121–140.",
  "Cramer, H., Anheyer, D., Saha, F. J., & Dobos, G. (2018). Yoga for posttraumatic stress disorder: A systematic review and meta-analysis. BMC Psychiatry, 18, 72.",
  "Gibson, J. (2024). Trauma, early life stress, and mindfulness in adulthood. Current Opinion in Psychology, 58, 101837.",
  "Hinkle, J. T., Ahuja, T., Grandhi, D., et al. (2024). Adverse events in studies of classic psychedelics: A systematic review and meta-analysis. JAMA Psychiatry, 81(12), 1243–1255.",
  "Lo, D. F., Phan, S. M., Gould, C. E., et al. (2024). Modern psychedelic microdosing research on mental health: A systematic review. Frontiers in Psychiatry, 14, 1306493.",
  "Mitchell, J. M., Bogenschutz, M., Lilienstein, A., et al. (2023). MDMA-assisted therapy for moderate to severe PTSD: A randomized, placebo-controlled phase 3 trial. Nature Medicine, 29, 2473–2480.",
  "Modlin, N. L., Mountford, V. A., Beetham, T., et al. (2024). Trauma-informed care in psychedelic therapy research: A qualitative literature review of evidence-based psychotherapy interventions in PTSD and psychedelic therapy across conditions. Neuropsychiatric Disease and Treatment, 20, 109–135.",
  "Murphy, R. J., Kettner, H., Zeifman, R. J., et al. (2024). Microdosing psychedelics: Current evidence from controlled studies. Neuropsychopharmacology, 49(4), 663–674.",
  "Nejadghaderi, S. A., Sullman, M. J. M., Kolahi, A.-A., et al. (2024). Efficacy of yoga for posttraumatic stress disorder: A systematic review and meta-analysis. Journal of Clinical Medicine, 13(14), 4138.",
  "Sicignano, D. J., Gonzalez, A., Keane, T. M., et al. (2024). The impact of ketamine for treatment of post-traumatic stress disorder: A systematic review and meta-analysis. Journal of Psychiatric Research, 170, 25–35.",
  "Yildirim, B., et al. (2024). Adverse psychiatric effects of psychedelic drugs: A systematic review of case reports. Psychological Medicine, 54(15), 1–13."
 ]
};

export const NOTICE = [
 "This questionnaire explores psychological, emotional, relational, and experiential factors that may influence how individuals respond to consciousness-expanding practices, including meditation, breathwork, mindfulness, spiritual or contemplative practices, and psychedelic or plant-based substances.",
 "Results from this questionnaire are not diagnostic, do not predict outcomes with certainty, and do not determine the safety or suitability of any practice for any individual.",
 "Experiences related to consciousness-expanding practices can be highly variable and unpredictable, and are influenced by many personal, social, environmental, and biological factors. Completing this assessment cannot guarantee, verify, or fully anticipate outcomes.",
 "This questionnaire does not provide medical, psychological, or legal advice and is not a substitute for consultation with qualified health or mental health professionals.",
 "By using this report, you acknowledge that you understand these limitations and agree that the information provided does not constitute assurance of safety, effectiveness, or risk reduction for any consciousness-expanding practice."
];

export const BAND_LABEL = { low: "Low", medium: "Medium", high: "High" };

// Scoring (approved design v3): each area = average of its items after reversing R items (8 - answer).
// The 1-7 range is split into three equal parts: 1.00-3.00 Low, 3.01-5.00 Medium, 5.01-7.00 High.
// Overall = average of the area averages (relationship area left out when not in a relationship).
export function bandFor(score) {
  const s = Math.round(score * 100) / 100;
  return s <= 3 ? "low" : s <= 5 ? "medium" : "high";
}

export function scoreAssessment(answers, inRelationship) {
  const domains = {};
  const used = [];
  for (const sec of SECTIONS) {
    if (sec.key === "reldis" && !inRelationship) { domains[sec.key] = null; continue; }
    let sum = 0;
    for (const it of sec.items) {
      const v = Number(answers[it.id]);
      if (!(v >= 1 && v <= 7)) throw new Error("Missing answer " + it.id);
      sum += it.r ? 8 - v : v;
    }
    const score = Math.round((sum / sec.items.length) * 100) / 100;
    domains[sec.key] = { score, band: bandFor(score) };
    used.push(score);
  }
  const overall = Math.round((used.reduce((a, b) => a + b, 0) / used.length) * 100) / 100;
  return { domains, overall: { score: overall, band: bandFor(overall) } };
}

export const INTRO = [
 "This questionnaire explores psychological, emotional, relational, and experiential factors that may influence how individuals respond to consciousness-expanding practices, including meditation, breathwork, mindfulness, spiritual or contemplative practices, and psychedelic or plant-based substances.",
 "Results from this questionnaire are not diagnostic, do not predict outcomes with certainty, and do not determine the safety or suitability of any practice for any individual.",
 "Experiences related to consciousness-expanding practices can be highly variable and unpredictable, and are influenced by many personal, social, environmental, and biological factors. Completing this assessment cannot guarantee, verify, or fully anticipate outcomes.",
 "This questionnaire does not provide medical, psychological, or legal advice and is not a substitute for consultation with qualified health or mental health professionals.",
 "By proceeding, you acknowledge that you understand these limitations and agree that the information provided does not constitute assurance of safety, effectiveness, or risk reduction for any consciousness-expanding practice.",
 "This questionnaire takes about 15 to 20 minutes. You can stop and continue later."
];

export const INSTRUCTIONS = [
 "Please indicate the extent to which you agree or disagree with each statement.",
 "(For this research, interpret \u201cgroup\u201d as your primary professional, organizational, or achievement identity.)"
];

export const RELATIONSHIP_QUESTION = "Are you in a romantic relationship now?";

export const LETTER = [
 "Thank you for submitting your responses. This is a participant information letter for a research project involving The Professor Inc. The intentions of this research are to understand the role that psychedelics have on life outcomes.",
 "After the data analysis phase, data will be stored securely in private, access-restricted storage for an indefinite period. There are no known risks to participating in this research. The results from this project will be disseminated through, but not limited to: scholarly journal publications, podcasts, films, books, academic conferences, op-ed submissions to newspapers, management periodicals, lectures, social media, and traditional media.",
 "Your name, contact details and location will be removed before your responses are used for research, so research results cannot be linked to you. Participation in this study is voluntary, you are under no obligation to participate, and you are free to withdraw at any time.",
 "If you are interested in having your data used for this research, please check the box below:"
];
