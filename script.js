(() => {
  const core = document.createElement('script');
  core.src = './script-core.js';
  core.onload = () => {
    // Keep navigation usable even after the daily game ends.
    const leaderboardButton = document.getElementById('leaderboard-button');
    if (leaderboardButton) {
      leaderboardButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = '/leaderboard/';
      }, true);
    }

    // Desktop-only ownership footer. Mobile layout is intentionally untouched.
    const footer = document.querySelector('.site-footer') || (() => {
      const el = document.createElement('footer');
      el.className = 'site-footer';
      el.setAttribute('aria-label', 'Copyright');
      el.innerHTML = '<span>© 2026 Elio El Hage. All rights reserved.</span><span>WordShift</span>';
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
          gap:.45rem;
          min-height:1.6rem;
          margin:.15rem auto 0;
          padding:.1rem .75rem .35rem;
          color:var(--muted);
          font-size:.62rem;
          line-height:1;
          letter-spacing:.03em;
          opacity:.72;
          text-align:center;
        }
        .site-footer span + span::before { content:'·'; margin-right:.45rem; }
        .app-shell { min-height:calc(100dvh - 1.6rem); }
      }
    `;
    document.head.appendChild(style);
  };
  document.head.appendChild(core);
})();
