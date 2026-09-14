(() => {
  const legacyScript = document.createElement('script');
  legacyScript.src = './script-core.js';
  legacyScript.defer = false;
  document.head.appendChild(legacyScript);
})();
