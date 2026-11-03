// Phase 3: phone menu (hamburger) + in-page links that open another tab.
// Does not change js/main.js. Uses the existing .tab-btn buttons.
(function () {
  var body = document.body;
  var toggle = document.querySelector('.cb-menu-toggle');

  function closeMenu() {
    body.classList.remove('cb-menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('cb-menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Any tab button (menu or in-page link): close the menu and go to the top
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();
