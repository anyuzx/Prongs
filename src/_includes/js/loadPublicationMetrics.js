(function () {
  if (!document.querySelector('.altmetric-embed')) return;

  function loadBadges() {
    // Load only on the publications page, after its own content and fonts.
    var script = document.createElement('script');
    script.src = 'https://embed.altmetric.com/assets/embed.js';
    script.async = true;
    script.onload = function () {
      // Explicitly initialize badges when the embed arrives after DOM readiness.
      if (typeof window._altmetric_embed_init === 'function') {
        window._altmetric_embed_init(document.getElementById('publications'));
      }
    };
    document.head.appendChild(script);
  }

  if (document.readyState === 'complete') {
    loadBadges();
  } else {
    window.addEventListener('load', loadBadges, { once: true });
  }
})();
