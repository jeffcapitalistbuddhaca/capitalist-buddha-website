// js/assess.js - Full assessment: after payment, sign in, then the questionnaire (saved as you go).
// Answers are saved to the server (/api/assess/save) and scored there when submitted.
import { SECTIONS, INTRO, INSTRUCTIONS, RELATIONSHIP_QUESTION, LETTER } from "./assess-data.js";
import { $, show, message, esc, api, startGate, logout } from "./assess-auth.js";

const STEPS = SECTIONS.length + 3; // 0 intro, 1 about you, 2..14 sections, 15 letter + consent
let user = null, id = null, rec = null, saveTimer = null;

// ---------- 1. Coming back from Stripe: look up the email they paid with ----------
const params = new URLSearchParams(location.search);
const sessionId = params.get("session_id");

(async function init() {
  let wantEmail = "";
  if (sessionId) {
    try {
      const r = await fetch("/api/assess/session?id=" + encodeURIComponent(sessionId));
      if (r.ok) wantEmail = (await r.json()).email || "";
    } catch (_) {}
    history.replaceState(null, "", "/assessment-start.html");
  }
  startGate({ returnPath: "/assessment-start.html", wantEmail, onReady: load });
})();

// ---------- 2. Signed in: find their assessment ----------
async function load(u) {
  user = u;
  $("whoami").innerHTML = "Signed in as " + esc(u.email) + ". <a href=\"#\" id=\"lo\">Not you?</a>";
  $("whoami").hidden = false;
  $("lo").onclick = (e) => { e.preventDefault(); logout().then(() => location.reload()); };
  message("One moment…", "<p>Loading your assessment.</p>");
  let st;
  try { st = await api(user, "state"); }
  catch (e) { message("Something went wrong", "<p>We could not load your assessment. Please refresh the page. If this keeps happening, contact us.</p>"); return; }
  const open = (st.assessments || []).find((a) => !a.submitted);
  const done = (st.assessments || []).filter((a) => a.submitted);
  if (open) {
    id = open.id;
    rec = Object.assign({ about: {}, answers: {}, rel: null, consent: null, step: 0 }, open.data || {});
    rec.about = rec.about || {}; rec.answers = rec.answers || {};
    render();
  } else if (done.length) {
    message("Your report is ready", "<p>You have completed your assessment.</p>" +
      done.map((a) => '<p><a class="go" href="assessment-report.html?id=' + encodeURIComponent(a.id) + '">See my report</a> <span class="fine">completed ' + esc(a.submittedOn || "") + "</span></p>").join(""));
  } else {
    message("No assessment found for this email", "<p>We could not find a payment for the full assessment under <strong>" + esc(user.email) +
      "</strong>. If you paid with a different email, <a href=\"#\" id=\"lo2\">sign out</a> and use that one.</p>" +
      '<p><a class="go" href="assessment.html">Get the full assessment</a></p>' +
      '<p class="fine">Just paid? It can take a minute to appear. <a href="assessment-start.html">Refresh</a>.</p>');
    const l = $("lo2"); if (l) l.onclick = (e) => { e.preventDefault(); logout().then(() => location.reload()); };
  }
}

// ---------- 3. Saving as they go ----------
function save(now) {
  clearTimeout(saveTimer);
  const go = () => api(user, "save", { id, data: rec }).catch(() => {});
  if (now) return go();
  saveTimer = setTimeout(go, 1200);
}

// ---------- 4. Screens ----------
const SAVE_NOTE = "Your answers are saved as you go, so you can stop at any time and pick up where you left off, on any device. Every question needs an answer before you can continue.";

function bar() {
  return '<div class="prog"><div style="width:' + Math.round(rec.step / (STEPS - 1) * 100) + '%"></div></div>';
}
function scale(itemId) {
  let b = "";
  for (let v = 1; v <= 7; v++) b += '<button type="button" data-i="' + itemId + '" data-v="' + v + '" class="' + (rec.answers[itemId] === v ? "on" : "") + '" aria-label="' + v + '">' + v + "</button>";
  return '<div class="scale">' + b + '</div><div class="ends"><span>Strongly disagree</span><span>Strongly agree</span></div>';
}
function yesNo(key, val) {
  return '<div class="yn" data-k="' + key + '">' + ["yes", "no"].map((x) =>
    '<button type="button" data-yn="' + x + '" class="' + (val === x ? "on" : "") + '">' + (x === "yes" ? "Yes" : "No") + "</button>").join("") + "</div>";
}
function nav(nextLabel) {
  return '<p class="msg" id="q-msg" hidden></p><div class="navb">' +
    (rec.step > 0 ? '<button type="button" class="ghost" id="q-prev">&larr; Previous</button>' : "<span></span>") +
    '<button type="button" class="go" id="q-next">' + nextLabel + "</button></div>";
}

function render() {
  const s = rec.step;
  let h = "";
  if (s === 0) {
    h = "<h1>Consciousness Destabilization Risk Scale</h1>" + INTRO.map((p) => "<p>" + esc(p) + "</p>").join("") +
      '<p class="fine">' + SAVE_NOTE + "</p>" + nav("Start");
  } else if (s === 1) {
    const a = rec.about;
    h = "<h1>About you</h1>" + bar() + '<p class="fine">' + SAVE_NOTE + "</p>" +
      '<div class="card">' +
      '<div class="field q" data-f="name"><label for="f-name">What is your name?</label><input type="text" id="f-name" autocomplete="name" value="' + esc(a.name || "") + '"></div>' +
      '<div class="field q" data-f="birth"><label for="f-birth">What is your birth date?</label><input type="date" id="f-birth" max="' + new Date().toISOString().slice(0, 10) + '" value="' + esc(a.birth || "") + '"></div>' +
      '<div class="field"><label for="f-email">What is your e-mail address?</label><input type="email" id="f-email" value="' + esc(user.email) + '" readonly></div>' +
      '<div class="field q" data-f="psy"><label for="f-psy">How many times have you used psychedelics or plant medicine in the past two years?</label><input type="number" id="f-psy" min="0" step="1" inputmode="numeric" value="' + esc(a.psy == null ? "" : a.psy) + '"></div>' +
      "</div>" + nav("Next");
  } else if (s < STEPS - 1) {
    const sec = SECTIONS[s - 2];
    h = "<h1>Part " + (s - 1) + " of " + SECTIONS.length + "</h1>" + bar() +
      "<p>" + esc(INSTRUCTIONS[0]) + ' <span class="fine">' + esc(INSTRUCTIONS[1]) + "</span></p>" +
      (sec.note ? "<p><em>" + esc(sec.note) + "</em></p>" : "") + '<p class="fine">' + SAVE_NOTE + "</p>" + '<div class="card">';
    if (sec.key === "reldis") {
      h += '<div class="q" data-q="rel"><p>' + esc(RELATIONSHIP_QUESTION) + "</p>" + yesNo("rel", rec.rel) + "</div>";
    }
    if (sec.key !== "reldis" || rec.rel === "yes") {
      h += sec.items.map((it) => '<div class="q" data-q="' + it.id + '"><p>' + esc(it.t) + "</p>" + scale(it.id) + "</div>").join("");
    }
    h += "</div>" + nav(s === STEPS - 2 ? "Next" : "Next section");
  } else {
    h = "<h1>Before you submit</h1>" + bar() + '<div class="card">' + LETTER.map((p) => "<p>" + esc(p) + "</p>").join("") +
      '<div class="q" data-q="consent">' + yesNo("consent", rec.consent) + "</div></div>" +
      '<p class="fine">When you submit, your report is created straight away. You will not be able to change your answers after that.</p>' + nav("Submit my answers");
  }
  $("q-area").innerHTML = h;
  show("s-quest");
  wire();
}

function wire() {
  const area = $("q-area");
  area.querySelectorAll(".scale button").forEach((b) => b.onclick = () => {
    rec.answers[b.dataset.i] = Number(b.dataset.v);
    b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    b.closest(".q").classList.remove("miss");
    save();
  });
  area.querySelectorAll(".yn button").forEach((b) => b.onclick = () => {
    const k = b.parentElement.dataset.k;
    rec[k] = b.dataset.yn;
    save();
    if (k === "rel") render(); else { b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); b.closest(".q").classList.remove("miss"); }
  });
  [["f-name", "name"], ["f-birth", "birth"], ["f-psy", "psy"]].forEach(([el, k]) => {
    const i = $(el); if (!i) return;
    i.oninput = () => { rec.about[k] = k === "psy" ? (i.value === "" ? null : Number(i.value)) : i.value.trim(); i.closest(".q").classList.remove("miss"); save(); };
  });
  const prev = $("q-prev");
  if (prev) prev.onclick = () => { rec.step--; save(true); render(); };
  $("q-next").onclick = next;
}

// Every question is required.
function missing() {
  const s = rec.step, miss = [];
  if (s === 1) {
    const a = rec.about;
    if (!a.name) miss.push("name");
    if (!a.birth) miss.push("birth");
    if (!(Number.isInteger(a.psy) && a.psy >= 0)) miss.push("psy");
    miss.forEach((f) => document.querySelector('[data-f="' + f + '"]').classList.add("miss"));
  } else if (s >= 2 && s < STEPS - 1) {
    const sec = SECTIONS[s - 2];
    if (sec.key === "reldis" && !rec.rel) miss.push("rel");
    if (sec.key !== "reldis" || rec.rel === "yes") sec.items.forEach((it) => { if (!rec.answers[it.id]) miss.push(it.id); });
    miss.forEach((q) => { const el = document.querySelector('[data-q="' + q + '"]'); if (el) el.classList.add("miss"); });
  } else if (s === STEPS - 1) {
    if (!rec.consent) { miss.push("consent"); document.querySelector('[data-q="consent"]').classList.add("miss"); }
  }
  return miss;
}

async function next() {
  const miss = missing();
  if (miss.length) {
    const m = $("q-msg");
    m.textContent = rec.step === STEPS - 1 ? "Please choose Yes or No to continue." : "Please answer every question to continue. The ones still needed are highlighted.";
    m.hidden = false;
    const first = document.querySelector(".miss"); if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (rec.step < STEPS - 1) { rec.step++; save(true); render(); return; }
  // Submit
  const btn = $("q-next"); btn.disabled = true; btn.textContent = "Creating your report…";
  try {
    await save(true);
    await api(user, "submit", { id });
    location.href = "assessment-report.html?id=" + encodeURIComponent(id);
  } catch (e) {
    btn.disabled = false; btn.textContent = "Submit my answers";
    const m = $("q-msg");
    m.textContent = e.data && e.data.missing ? "Some answers are missing. Please go back and check every part." : "Sorry, your answers could not be submitted. Please try again in a moment.";
    m.hidden = false;
  }
}
