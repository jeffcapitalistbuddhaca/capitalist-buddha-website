// Phase 3: "Inside the 16 modules" preview on the Courses tab.
// Reads module numbers and titles from /modules.json (the same file the
// course page already uses). Shows titles only - no videos, no content.
(function () {
  var box = document.getElementById('cb-module-preview');
  if (!box) return;
  var colours = ['#c9a46a', '#3d696a', '#bc88bc', '#957471', '#323b3d', '#d0b08d', '#967ca0', '#7d8a6a'];
  fetch('/modules.json')
    .then(function (r) { return r.json(); })
    .then(function (modules) {
      (modules || []).forEach(function (m, i) {
        var card = document.createElement('div');
        card.className = 'cb-module-card';
        var num = document.createElement('div');
        num.className = 'cb-module-num';
        num.style.background = colours[i % colours.length];
        num.textContent = m.id;
        var name = document.createElement('div');
        name.className = 'cb-module-name';
        name.textContent = m.name;
        card.appendChild(num);
        card.appendChild(name);
        box.appendChild(card);
      });
    })
    .catch(function () {
      var section = box.closest('.cb-section');
      if (section) section.style.display = 'none';
    });
})();
