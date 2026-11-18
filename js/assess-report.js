// js/assess-report.js - shows a completed Full Assessment report to its owner (or to Dr. Overall).
import { SECTIONS, DOMAIN_TEXT, OVERALL_TEXT, GUIDANCE, REFERENCES, NOTICE, BAND_LABEL } from "./assess-data.js?v=20261117h";
import { $, show, message, esc, api, startGate } from "./assess-auth.js?v=20261117h";

const CALENDLY = "https://calendly.com/jeff-capitalistbuddha/30min";
const qs = new URLSearchParams(location.search);
const id = qs.get("id") || "";
const here = "/assessment-report.html" + (id ? "?id=" + encodeURIComponent(id) : "");
// Links in our emails name the account (?for=email). Dr. Overall's admin link has no "for".
const wantEmail = qs.get("for") || "";
if (wantEmail) history.replaceState(null, "", here);

startGate({ returnPath: here, wantEmail, onReady: load });

async function load(user) {
  message("One moment…", "<p>Loading your report.</p>");
  let r;
  try {
    r = await api(user, "report?id=" + encodeURIComponent(id));
  } catch (e) {
    if (e.status === 404 || e.status === 403) {
      message("Report not found", "<p>We could not find a completed report for <strong>" + esc(user.email) +
        "</strong>. If you have not finished your assessment yet, <a href=\"assessment-start.html\">continue it here</a>.</p>");
    } else {
      message("Something went wrong", "<p>We could not load your report. Please refresh the page.</p>");
    }
    return;
  }
  render(r);
}

const lv = (b) => b ? '<span class="lv ' + b[0].toUpperCase() + '">' + BAND_LABEL[b] + "</span>" : '<span class="lv NA">Not applicable</span>';

function render(r) {
  const rep = r.report, band = rep.overall.band, g = GUIDANCE[band];
  const name = r.name || "";
  const date = new Date(r.submitted).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  let h = "<h1>Your Consciousness Destabilization Risk Profile</h1>" +
    '<p class="fine">Prepared for ' + esc(name) + " &middot; completed " + esc(date) + "</p>" +
    '<div class="band" style="background:' + ({ low: "#3d696a", medium: "#967ca0", high: "#8a5a6e" }[band]) + '"><small>Overall destabilization likelihood</small><b>' + BAND_LABEL[band] + "</b></div>" +
    "<p>" + esc(OVERALL_TEXT[band]) + "</p>";

  h += '<div class="card"><h2>Your profile</h2><table class="pr"><tr><th>Area</th><th>Result</th></tr>' +
    SECTIONS.map((s) => { const d = rep.domains[s.key]; return "<tr><td>" + esc(s.name) + "</td><td>" + lv(d && d.band) + "</td></tr>"; }).join("") +
    "</table></div>";

  h += '<div class="card"><h2>Area by area</h2><p class="fine">Each area below reflects one factor considered in your overall result. The practice guidance that follows is based on your overall result, not on individual areas.</p>' +
    SECTIONS.map((s) => {
      const d = rep.domains[s.key], t = DOMAIN_TEXT[s.key];
      return '<div class="dom"><b>' + esc(s.name) + ": " + (d ? BAND_LABEL[d.band] : "Not applicable") + "</b><br>" +
        '<span class="fine">' + esc(t[0]) + "</span><br>" + (d ? esc(t[{ low: 1, medium: 2, high: 3 }[d.band]]) : "You told us you are not in a romantic relationship now, so this area is not included in your overall result.") + "</div>";
    }).join("") + "</div>";

  h += '<div class="card"><h2>Practice guidance for a ' + BAND_LABEL[band] + " result</h2><p>" + esc(g.intro) + "</p>" +
    g.items.map((i) => "<p><strong>" + esc(i.h) + "</strong><br>" + esc(i.p) + "</p>").join("") +
    "<p>" + esc(g.overall) + "</p>" +
    '<h2 style="font-size:20px;margin-top:18px">References</h2><ul class="refs">' + REFERENCES[band].map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>";

  const cal = CALENDLY + "?name=" + encodeURIComponent(name) + "&email=" + encodeURIComponent(r.email || "") + "&hide_gdpr_banner=1";
  h += '<div class="card noprint"><h2>Book your results review</h2><p>Your assessment includes a results review with Dr. Overall. Choose a time below.</p>' +
    '<div class="calendly-inline-widget" data-url="' + esc(cal) + '"></div></div>';

  h += '<p class="noprint" style="text-align:center"><button type="button" class="ghost" id="pdf">Download PDF</button></p>' +
    '<p class="fine noprint" style="text-align:center">Choose &ldquo;Save as PDF&rdquo; in the print window.</p>';

  h += '<div class="card fine"><strong>Important information.</strong>' + NOTICE.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>";

  $("s-report").innerHTML = h;
  show("s-report");
  $("pdf").onclick = () => window.print();
  const sc = document.createElement("script");
  sc.src = "https://assets.calendly.com/assets/external/widget.js";
  sc.async = true;
  document.body.appendChild(sc);
}
