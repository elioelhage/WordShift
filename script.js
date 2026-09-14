(() => {
  const core = document.createElement('script');
  core.src = './script-core.js';
  core.onload = () => {
    const leaderboardButton = document.getElementById('leaderboard-button');
    if (leaderboardButton) {
      leaderboardButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = '/leaderboard/';
      }, true);
    }

    const footer = document.querySelector('.site-footer') || (() => {
      const el = document.createElement('footer');
      el.className = 'site-footer';
      el.setAttribute('aria-label', 'Copyright');
      el.innerHTML = '<span>© 2026 Elio El Hage. All rights reserved.</span><span class="site-footer__links"><a href="/terms/">Terms of Use</a><span aria-hidden="true">·</span><a href="/privacy/">Privacy Policy</a></span>';
      document.body.appendChild(el);
      return el;
    })();

    const style = document.createElement('style');
    style.textContent = `
      .site-footer { display:none; }
      @media (min-width: 641px) {
        .site-footer {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:1.4rem;
          min-height:1.7rem;
          margin:.15rem auto 0;
          padding:.1rem .75rem .35rem;
          color:var(--muted);
          font-size:.62rem;
          line-height:1;
          letter-spacing:.03em;
          opacity:.72;
          text-align:center;
        }
        .site-footer__links { display:inline-flex; align-items:center; gap:.45rem; }
        .site-footer a { color:inherit; text-decoration:none; }
        .site-footer a:hover { text-decoration:underline; opacity:1; }
        .app-shell { min-height:calc(100dvh - 1.7rem); }
      }
    `;
    document.head.appendChild(style);
  };
  document.head.appendChild(core);
})();
