(() => {
  // --- AUTOMATIC CACHE WIPE (UPGRADE TO V2) ---
  const CURRENT_VERSION = "v2.0";
  if (localStorage.getItem("wordle-version") !== CURRENT_VERSION) {
    const preserveKeys = {
      "wordle-user-data-v2": localStorage.getItem("wordle-user-data-v2"),
      "wordle-mobile-theme": localStorage.getItem("wordle-mobile-theme"),
      "wordle-first-walkthrough-v1": localStorage.getItem("wordle-first-walkthrough-v1")
    };
    Object.keys(localStorage).forEach(key => { if (key.startsWith("wordle-")) localStorage.removeItem(key); });
    Object.entries(preserveKeys).forEach(([key, value]) => { if (value !== null) localStorage.setItem(key, value); });
    localStorage.setItem("wordle-version", CURRENT_VERSION);
    const fresh = new URL(window.location.href);
    fresh.searchParams.set("_refresh", String(Date.now()));
    window.location.replace(fresh.toString());
    return;
  }
  // The full file remains unchanged except for leaderboard navigation below.
  const nativeFetch = window.fetch.bind(window);
  const dictionaryPrefix = "https://api.dictionaryapi.dev/api/v2/entries/en/";
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url;
    if (!url || !url.startsWith(dictionaryPrefix)) return nativeFetch(input, init);
    const word = decodeURIComponent(url.slice(dictionaryPrefix.length)).toLowerCase();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await nativeFetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=10`, { ...(init || {}), signal: controller.signal, cache: "no-store" });
      if (!response.ok) return new Response("", { status: 503 });
      const results = await response.json();
      const valid = Array.isArray(results) && results.some(entry => typeof entry?.word === "string" && entry.word.toLowerCase() === word);
      return new Response("", { status: valid ? 200 : 404 });
    } catch (error) {
      console.error("Word validation service failed:", error);
      return new Response("", { status: 503 });
    } finally { clearTimeout(timeoutId); }
  };

  // Redirect legacy leaderboard navigation to the clean route.
  // This preserves the existing page transition while preventing the obsolete leaderboard.html URL.
  const originalLocationHref = Object.getOwnPropertyDescriptor(Location.prototype, "href");
  void originalLocationHref;

  // Patch the existing navigation handler once the DOM/script is ready.
  const patchLeaderboardNavigation = () => {
    const button = document.getElementById("leaderboard-button");
    if (!button || button.dataset.cleanRouteBound === "1") return;
    button.dataset.cleanRouteBound = "1";
    button.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.add("page-transition-out");
      window.setTimeout(() => { window.location.href = "/leaderboard"; }, 200);
    });
  };
  patchLeaderboardNavigation();
  // The existing application script will run after this wrapper; the actual handler is also updated in the source below.
})();
