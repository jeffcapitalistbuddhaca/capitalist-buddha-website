// js/risk-scale.js - free short Consciousness Destabilization Risk Assessment.
// Scoring runs in the browser (js/risk-data.js). Only the name, email, band, top areas, segment and source are sent
// to /api/risk-signup (Brevo and the result email). Individual answers are never sent or stored.
import { Q, D, BANDS, scoreRisk } from "./risk-data.js?v=20261117c";
(function () {
  var MODE = document.body.getAttribute("data-mode") || "one"; // "one" = one question per screen; "all" = all on one page
  // r: true = reverse-scored (agreeing means LOWER risk)
  var answers = new Array(Q.length).fill(null), idx = 0;
  var $ = function (id) { return document.getElementById(id); };
  function show(id) { ["s-intro", "s-questions", "s-email", "s-result"].forEach(function (s) { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
  function done() { return answers.filter(function (a) { return a !== null; }).length; }
  function progress() { $("prog").style.width = (done() / Q.length * 100) + "%"; }

  function scaleHtml(i) {
    var b = "";
    for (var v = 1; v <= 7; v++) b += '<button type="button" data-q="' + i + '" data-v="' + v + '" class="' + (answers[i] === v ? "on" : "") + '" aria-label="' + v + '">' + v + "</button>";
    return '<div class="scale">' + b + '</div><div class="ends"><span>Strongly disagree</span><span>Strongly agree</span></div>';
  }
  function renderOne() {
    var q = Q[idx];
    $("q-area").innerHTML = '<div class="card"><div class="qnum">Question ' + (idx + 1) + " of " + Q.length + '</div><div class="qtext">' + q.t + "</div>" +
      (q.note ? '<p class="fine" style="margin-top:-6px">' + q.note + "</p>" : "") + scaleHtml(idx) +
      '<div class="nav"><button type="button" class="linkbtn" id="qback"' + (idx === 0 ? " hidden" : "") + '>&larr; Back</button><span></span></div></div>';
    if ($("qback")) $("qback").onclick = function () { history.back(); };
  }
  function renderAll() {
    var h = '<div class="card q-all">';
    Q.forEach(function (q, i) { h += '<div class="qitem"><div class="qnum">' + (i + 1) + " of " + Q.length + '</div><div class="qtext">' + q.t + "</div>" + (q.note ? '<p class="fine">' + q.note + "</p>" : "") + scaleHtml(i) + "</div>"; });
    h += '<p style="text-align:center;margin-top:18px"><button type="button" class="go" id="qnext" disabled>Continue</button></p></div>';
    $("q-area").innerHTML = h;
    $("qnext").onclick = function () { show("s-email"); };
  }
  $("q-area").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (!b) return;
    var i = +b.getAttribute("data-q"); answers[i] = +b.getAttribute("data-v"); progress();
    if (MODE === "one") {
      renderOne();
      setTimeout(function () { if (idx < Q.length - 1) { go({ s: "q", i: idx + 1 }); } else { go({ s: "email" }); } }, 250);
    } else {
      b.parentNode.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
      $("qnext").disabled = done() < Q.length;
    }
  });
  $("start").onclick = function () {
    if (MODE === "one") { go({ s: "q", i: 0 }); } else { show("s-questions"); renderAll(); progress(); }
  };

  // The phone or browser Back button moves back one step inside the assessment instead of leaving the page.
  var lastResult = null;
  function apply(st) {
    st = st || { s: "intro" };
    if (st.s === "q") { idx = Math.max(0, Math.min(Q.length - 1, st.i || 0)); show("s-questions"); renderOne(); progress(); }
    else if (st.s === "email") { show("s-email"); }
    else if (st.s === "result" && lastResult) { renderResult(lastResult); }
    else { show("s-intro"); }
  }
  function go(st) { try { history.pushState(st, ""); } catch (_) {} apply(st); }
  try { history.replaceState({ s: "intro" }, ""); } catch (_) {}
  window.addEventListener("popstate", function (e) { apply(e.state); });

  function score() { return scoreRisk(answers); }
  function source() {
    try {
      var p = new URLSearchParams(location.search);
      var s = (p.get("src") || p.get("utm_source") || localStorage.getItem("cbSource") || "direct").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
      return s || "direct";
    } catch (_) { return "direct"; }
  }
  function renderResult(r) {
    var B = BANDS[r.band];
    $("band").className = "band " + r.band; $("band-name").textContent = B[0];
    $("band-text").textContent = B[1]; $("guide").textContent = B[2];
    if (r.tops.length) {
      $("tops").innerHTML = r.tops.map(function (d) { return "<li><b>" + D[d][0] + "</b>" + D[d][1] + "</li>"; }).join("");
      $("tops-card").hidden = false;
    } else { $("tops-card").hidden = true; }
    show("s-result");
  }
  $("rk-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("rk-msg"), email = $("rk-email").value.trim(), name = $("rk-name").value.trim();
    if ($("rk-website").value) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Please enter a valid email address."; msg.hidden = false; return; }
    if (!$("rk-consent").checked) { msg.textContent = "Please tick the box so we can email you your result."; msg.hidden = false; return; }
    var r = score(); $("rk-send").disabled = true; msg.hidden = true;
    try { localStorage.setItem("cbRiskEmail", email); } catch (_) {}
    fetch("/api/risk-signup", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name, email: email, consent: true, band: r.band, tops: r.tops, segment: $("rk-seg").value, source: source(), website: "" })
    }).catch(function () {}).then(function () { lastResult = r; try { history.replaceState({ s: "result" }, ""); } catch (_) {} renderResult(r); });
  });
})();
