(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const ITUNES_SEARCH = "https://itunes.apple.com/search";
  const SONG_HUNT_ARTISTS = [
    { name: "Imagine Dragons", genre: "Rock" },
    { name: "Kanye West", genre: "Hip-Hop" }
  ];
  const STORAGE_KEY = "wordshift-song-hunt-stats-v1";

  const guessForm = $("guess-form");
  const guessInput = $("guess-input");
  const guessButton = $("guess-button");
  const suggestionBox = $("song-suggestions");
  const searchHelp = $("search-help");
  const catalogStatus = $("catalog-status");
  const guessHistory = $("guess-history");
  const tableScroll = $("history-scroll");
  const emptyState = $("empty-state");
  const guessCount = $("guess-count");
  const feedback = $("feedback");
  const revealButton = $("reveal-button");
  const nextButton = $("next-button");
  const answerPanel = $("answer-panel");
  const loadError = $("load-error");
  const loadErrorMessage = $("load-error-message");
  const retryButton = $("retry-button");

  const state = {
    catalog: [],
    target: null,
    guesses: [],
    suggestions: [],
    selectedSuggestion: -1,
    usedTargets: new Set(),
    loading: false,
    resolved: false,
    resultRecorded: false,
    stats: loadStats()
  };

  function defaultStats() {
    return { played: 0, wins: 0, streak: 0, bestStreak: 0, winningGuesses: 0 };
  }

  function loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return { ...defaultStats(), ...(saved && typeof saved === "object" ? saved : {}) };
    } catch (_) {
      return defaultStats();
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
    } catch (_) {
      // The game still works when browser storage is disabled.
    }
    renderStats();
  }

  function renderStats() {
    const stats = state.stats;
    $("stat-played").textContent = String(stats.played);
    $("stat-win-rate").textContent = stats.played ? Math.round((stats.wins / stats.played) * 100) + "%" : "—";
    $("stat-streak").textContent = String(stats.streak);
    $("stat-average").textContent = stats.wins ? (stats.winningGuesses / stats.wins).toFixed(1) : "—";
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function formatStreams(value) {
    if (!Number.isFinite(value)) return "N/A";
    if (value >= 1000000000) return (value / 1000000000).toFixed(value >= 10000000000 ? 1 : 2).replace(/0+$/, "").replace(/\.$/, "") + "B";
    if (value >= 1000000) return (value / 1000000).toFixed(value >= 100000000 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (value >= 1000) return (value / 1000).toFixed(0) + "K";
    return value.toLocaleString();
  }

  function formatDuration(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) return "N/A";
    const seconds = Math.round(durationMs / 1000);
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function formatYear(year) {
    return Number.isFinite(year) ? String(year) : "N/A";
  }

  function setFeedback(message, kind = "") {
    feedback.textContent = message;
    feedback.className = "feedback" + (kind ? " " + kind : "");
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function isAlternateSong(title, album) {
    const alternateTitle = /\b(?:live|acoustic|remix(?:ed)?|demo|instrumental|karaoke|sped up|slowed(?: down)?|nightcore|reimagined|orchestral|piano version|stripped|unplugged|cover|remaster(?:ed)?|re-record(?:ed|ing)?)\b/i;
    const alternateAlbum = /\b(?:live|deluxe|expanded|anniversary|greatest hits|best of|remaster(?:ed)?|remix|acoustic|karaoke|instrumentals|reissue|special edition|super deluxe|collector'?s edition|bonus tracks)\b/i;
    return alternateTitle.test(String(title || "")) || alternateAlbum.test(String(album || ""));
  }

  function cleanSongTitle(title) {
    return String(title || "")
      .replace(/\s*[\[(]\s*(?:feat(?:uring)?|ft)\.?\s+[^\])]+[\])]/ig, "")
      .replace(/\s+(?:feat(?:uring)?|ft)\.?\s+.+$/ig, "")
      .replace(/\s*[\[(]\s*(?:single version|album version|remaster(?:ed)?(?:\s+\d{4})?)[^\])]*[\])]\s*$/i, "")
      .trim();
  }

  function isCreditedToArtist(credit, artistName) {
    const normalizedCredit = normalize(credit);
    const normalizedArtist = normalize(artistName);
    return normalizedCredit === normalizedArtist ||
      normalizedCredit.startsWith(normalizedArtist + " ") ||
      normalizedCredit.startsWith(normalizedArtist + " and ") ||
      normalizedCredit.includes(" and " + normalizedArtist);
  }

  async function searchItunesArtist(artist) {
    const url = new URL(ITUNES_SEARCH);
    url.searchParams.set("term", artist.name);
    url.searchParams.set("entity", "song");
    url.searchParams.set("country", "ca");
    url.searchParams.set("limit", "200");

    const response = await fetch(url.toString(), {
      mode: "cors",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error("Apple Music search for " + artist.name + " failed (" + response.status + ").");
    }

    const payload = await response.json();
    const results = Array.isArray(payload.results) ? payload.results : [];
    return results
      .filter((raw) => raw && raw.trackId && raw.trackName && raw.artistName)
      .filter((raw) => isCreditedToArtist(raw.artistName, artist.name))
      .filter((raw) => !isAlternateSong(raw.trackName, raw.collectionName))
      .map((raw) => {
        const releaseDate = String(raw.releaseDate || "");
        const yearMatch = releaseDate.match(/^(\d{4})/);
        const genre = String(raw.primaryGenreName || artist.genre).trim() || artist.genre;
        const rawTitle = String(raw.trackName || "").trim();
        const credit = String(raw.artistName || "").trim();
        return {
          id: "itunes-" + String(raw.trackId),
          title: cleanSongTitle(rawTitle),
          artist: artist.name,
          year: yearMatch ? Number(yearMatch[1]) : null,
          releaseDate,
          genres: [genre],
          genre,
          album: String(raw.collectionName || "").trim(),
          streamCount: null,
          durationMs: Number(raw.trackTimeMillis) > 0 ? Number(raw.trackTimeMillis) : null,
          isFeatured: /\b(?:feat(?:uring)?|ft)\.?\b/i.test(rawTitle) ||
            (normalize(credit) !== normalize(artist.name) && isCreditedToArtist(credit, artist.name)),
          featuredArtists: [],
          storeUrl: String(raw.trackViewUrl || raw.collectionViewUrl || ""),
          spotifyUrl: "",
          explicit: Boolean(raw.trackExplicitness === "explicit")
        };
      })
      .filter((track) => track.id && track.title && track.artist);
  }

  function deduplicateSongCatalog(tracks) {
    const canonical = new Map();
    tracks.forEach((track) => {
      const key = normalize(track.artist) + "|" + normalize(track.title);
      const previous = canonical.get(key);
      if (!previous || String(track.releaseDate || "9999").localeCompare(String(previous.releaseDate || "9999")) < 0) {
        canonical.set(key, track);
      }
    });
    return [...canonical.values()].sort((a, b) =>
      a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
    );
  }

  async function loadCatalog() {
    state.loading = true;
    loadError.hidden = true;
    guessInput.disabled = true;
    guessButton.disabled = true;
    revealButton.disabled = true;
    nextButton.disabled = true;
    catalogStatus.textContent = "Loading songs from Apple Music…";
    setFeedback("Fetching song metadata…");
    try {
      const responses = await Promise.all(SONG_HUNT_ARTISTS.map(async (artist) => {
        try {
          return { artist, tracks: await searchItunesArtist(artist), error: null };
        } catch (error) {
          return { artist, tracks: [], error };
        }
      }));
      const tracks = deduplicateSongCatalog(responses.flatMap((response) => response.tracks));
      if (!tracks.length) {
        const cause = responses.find((response) => response.error)?.error;
        throw new Error(cause?.message || "Apple Music Search returned no eligible songs. Try again in a moment.");
      }

      state.catalog = tracks;
      const counts = Object.fromEntries(SONG_HUNT_ARTISTS.map((artist) => [
        artist.name,
        tracks.filter((track) => track.artist === artist.name).length
      ]));
      $("count-imagine-dragons").textContent = String(counts["Imagine Dragons"] || 0);
      $("count-kanye-west").textContent = String(counts["Kanye West"] || 0);
      catalogStatus.textContent = state.catalog.length + " eligible songs loaded";
      state.loading = false;
      guessInput.disabled = false;
      guessButton.disabled = false;
      guessInput.setAttribute("aria-expanded", "false");
      startRound();
      if (responses.some((response) => response.error)) {
        const missing = responses.filter((response) => response.error).map((response) => response.artist.name);
        setFeedback("Catalogue loaded, but Apple Music search failed for: " + missing.join(", ") + ".", "error");
      }
    } catch (error) {
      state.loading = false;
      catalogStatus.textContent = "Catalogue unavailable";
      const rawMessage = String(error && error.message || "");
      loadErrorMessage.textContent = /failed to fetch|networkerror|load failed/i.test(rawMessage)
        ? "The browser cannot reach Apple Music Search. Check your connection and try again."
        : rawMessage || "Apple Music Search could not load the song catalogue.";
      loadError.hidden = false;
      setFeedback("The game can't start without its song catalogue.", "error");
      retryButton.focus();
    }
  }

  function pickTarget() {
    if (!state.catalog.length) return null;
    let available = state.catalog.filter((track) => !state.usedTargets.has(track.id));
    if (!available.length) {
      state.usedTargets.clear();
      available = state.catalog.slice();
    }
    if (available.length > 1 && state.target) {
      const withoutPrevious = available.filter((track) => track.id !== state.target.id);
      if (withoutPrevious.length) available = withoutPrevious;
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    state.usedTargets.add(selected.id);
    return selected;
  }

  function startRound() {
    state.target = pickTarget();
    state.guesses = [];
    state.suggestions = [];
    state.selectedSuggestion = -1;
    state.resolved = false;
    state.resultRecorded = false;
    guessInput.value = "";
    closeSuggestions();
    clearNode(guessHistory);
    tableScroll.hidden = true;
    emptyState.hidden = false;
    guessCount.textContent = "0 guesses";
    answerPanel.hidden = true;
    clearNode(answerPanel);
    revealButton.disabled = false;
    nextButton.disabled = true;
    guessInput.disabled = false;
    guessButton.disabled = false;
    setFeedback("New mystery song selected. Make your first guess.");
    guessInput.focus({ preventScroll: true });
  }

  function closeSuggestions() {
    suggestionBox.hidden = true;
    guessInput.setAttribute("aria-expanded", "false");
    state.suggestions = [];
    state.selectedSuggestion = -1;
    searchHelp.textContent = state.resolved
      ? "Start another round to keep playing."
      : "Choose a song from the suggestions to lock in your guess.";
  }

  function renderSuggestions() {
    if (state.loading || state.resolved || !state.catalog.length) {
      closeSuggestions();
      return;
    }
    const query = normalize(guessInput.value);
    if (!query) {
      closeSuggestions();
      return;
    }
    const usedIds = new Set(state.guesses.map((guess) => guess.id));
    const matches = state.catalog
      .filter((track) => !usedIds.has(track.id))
      .map((track) => {
        const title = normalize(track.title);
        const artist = normalize(track.artist);
        const album = normalize(track.album);
        const searchable = title + " " + artist + " " + album;
        let rank = 4;
        if (title === query) rank = 0;
        else if (title.startsWith(query)) rank = 1;
        else if (artist.startsWith(query)) rank = 2;
        else if (searchable.includes(query)) rank = 3;
        return { track, rank, title };
      })
      .filter((item) => item.rank < 4)
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title) || a.track.artist.localeCompare(b.track.artist))
      .slice(0, 9)
      .map((item) => item.track);

    state.suggestions = matches;
    state.selectedSuggestion = matches.length ? 0 : -1;
    clearNode(suggestionBox);
    if (!matches.length) {
      suggestionBox.appendChild(el("div", "no-suggestions", "No matching song in the current catalogue."));
    } else {
      matches.forEach((track, index) => {
        const option = el("button", "song-suggestion", "");
        option.type = "button";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(index === state.selectedSuggestion));
        option.dataset.index = String(index);
        const main = el("span", "suggestion-main");
        main.appendChild(el("span", "suggestion-title", track.title));
        main.appendChild(el("span", "suggestion-subtitle", track.artist + (track.album ? " · " + track.album : "")));
        option.appendChild(main);
        option.appendChild(el("span", "suggestion-year", formatYear(track.year)));
        suggestionBox.appendChild(option);
      });
    }
    suggestionBox.hidden = false;
    guessInput.setAttribute("aria-expanded", "true");
    searchHelp.textContent = matches.length ? "Use ↑ and ↓ to choose a result, then press Enter." : "Try another title or artist.";
  }

  function moveSuggestionSelection(step) {
    if (suggestionBox.hidden || !state.suggestions.length) {
      renderSuggestions();
      return;
    }
    const count = state.suggestions.length;
    state.selectedSuggestion = (state.selectedSuggestion + step + count) % count;
    const options = [...suggestionBox.querySelectorAll(".song-suggestion")];
    options.forEach((option, index) => {
      option.setAttribute("aria-selected", String(index === state.selectedSuggestion));
      if (index === state.selectedSuggestion) option.scrollIntoView({ block: "nearest" });
    });
  }

  function exactTrackFromInput() {
    const title = normalize(guessInput.value);
    const exact = state.catalog.filter((track) => normalize(track.title) === title);
    if (exact.length === 1) return exact[0];
    return null;
  }

  function submitGuess(track) {
    if (!track || state.loading || state.resolved || !state.target) return;
    if (state.guesses.some((guess) => guess.id === track.id)) {
      setFeedback("You've already guessed that song. Try another one.", "error");
      return;
    }
    state.guesses.push(track);
    guessInput.value = "";
    closeSuggestions();
    renderHistory();
    if (track.id === state.target.id) {
      state.resolved = true;
      recordResult(true);
      showAnswer(true);
      return;
    }
    setFeedback("Not quite. Check the colors and arrows, then try again.");
    guessInput.focus({ preventScroll: true });
  }

  function submitFromForm() {
    if (!state.suggestions.length) {
      const exact = exactTrackFromInput();
      if (exact) {
        submitGuess(exact);
        return;
      }
      setFeedback("Choose a song from the suggestion list before submitting.", "error");
      renderSuggestions();
      guessInput.focus();
      return;
    }
    if (state.selectedSuggestion >= 0 && state.suggestions[state.selectedSuggestion]) {
      submitGuess(state.suggestions[state.selectedSuggestion]);
      return;
    }
    setFeedback("Choose a song from the suggestion list before submitting.", "error");
  }

  function compareBasic(guessValue, targetValue, displayValue) {
    if (guessValue === null || guessValue === undefined || targetValue === null || targetValue === undefined || guessValue === "" || targetValue === "") {
      return { status: "unknown", value: displayValue === undefined ? "N/A" : displayValue, hint: "Not available" };
    }
    return {
      status: normalize(guessValue) === normalize(targetValue) ? "match" : "miss",
      value: displayValue === undefined ? String(guessValue) : displayValue
    };
  }

  function compareNumber(guessValue, targetValue, formatter, smallerIsHigher) {
    if (!Number.isFinite(guessValue) || !Number.isFinite(targetValue)) {
      return { status: "unknown", value: "N/A", hint: "Stream or metadata unavailable" };
    }
    if (guessValue === targetValue) return { status: "match", value: formatter(guessValue) };
    const targetIsHigher = guessValue < targetValue;
    return {
      status: "miss",
      value: formatter(guessValue),
      direction: targetIsHigher ? (smallerIsHigher ? "↓" : "↑") : (smallerIsHigher ? "↑" : "↓"),
      hint: targetIsHigher ? "The target is higher" : "The target is lower"
    };
  }

  function compareGenres(guess, target) {
    const guessGenres = [...new Set((guess.genres || [guess.genre || "Unknown"]).map(normalize).filter(Boolean))];
    const targetGenres = [...new Set((target.genres || [target.genre || "Unknown"]).map(normalize).filter(Boolean))];
    if (!guessGenres.length || !targetGenres.length) return { status: "unknown", value: "N/A" };
    const intersection = guessGenres.filter((genre) => targetGenres.includes(genre));
    let status = "miss";
    if (intersection.length === targetGenres.length && intersection.length === guessGenres.length) status = "match";
    else if (intersection.length) status = "partial";
    return { status, value: (guess.genres || [guess.genre || "Unknown"]).join(" · ") };
  }

  function compareFeatured(guess, target) {
    if (Boolean(guess.isFeatured) === Boolean(target.isFeatured)) {
      return { status: "match", value: guess.isFeatured ? "Yes" : "No" };
    }
    return { status: "miss", value: guess.isFeatured ? "Yes" : "No" };
  }

  function clueFor(guess, target, field) {
    if (field === "artist") return compareBasic(guess.artist, target.artist, guess.artist);
    if (field === "year") return compareNumber(guess.year, target.year, formatYear, false);
    if (field === "genre") return compareGenres(guess, target);
    if (field === "album") return compareBasic(guess.album, target.album, guess.album || "N/A");
    if (field === "streams") return compareNumber(guess.streamCount, target.streamCount, formatStreams, false);
    if (field === "duration") return compareNumber(
      Number.isFinite(guess.durationMs) ? Math.round(guess.durationMs / 1000) : null,
      Number.isFinite(target.durationMs) ? Math.round(target.durationMs / 1000) : null,
      (seconds) => formatDuration(seconds * 1000),
      false
    );
    if (field === "feature") return compareFeatured(guess, target);
    return { status: "unknown", value: "N/A" };
  }

  function renderClueCell(row, clue) {
    const td = el("td", "clue-cell " + clue.status);
    td.title = clue.hint || clue.value || "";
    td.appendChild(el("span", "clue-value", clue.value));
    if (clue.direction) td.appendChild(el("span", "direction", clue.direction));
    row.appendChild(td);
  }

  function renderHistory() {
    clearNode(guessHistory);
    tableScroll.hidden = state.guesses.length === 0;
    emptyState.hidden = state.guesses.length > 0;
    guessCount.textContent = state.guesses.length + (state.guesses.length === 1 ? " guess" : " guesses");

    state.guesses.forEach((guess) => {
      const row = document.createElement("tr");
      const songCell = document.createElement("td");
      const songLink = el("a", "song-link", guess.title);
      songLink.href = guess.storeUrl || guess.spotifyUrl || "https://music.apple.com/";
      songLink.target = "_blank";
      songLink.rel = "noopener noreferrer";
      songLink.title = "Open " + guess.title + " song listing";
      songCell.appendChild(songLink);
      songCell.appendChild(el("span", "song-artist-sub", guess.artist));
      row.appendChild(songCell);

      [
        ["artist", guess.artist],
        ["year", formatYear(guess.year)],
        ["genre", (guess.genres || [guess.genre || "Unknown"]).join(" · ")],
        ["album", guess.album || "N/A"],
        ["streams", formatStreams(guess.streamCount)],
        ["duration", formatDuration(guess.durationMs)],
        ["feature", guess.isFeatured ? "Yes" : "No"]
      ].forEach(([field]) => renderClueCell(row, clueFor(guess, state.target, field)));
      guessHistory.appendChild(row);
    });
  }

  function recordResult(won) {
    if (state.resultRecorded) return;
    state.resultRecorded = true;
    state.stats.played += 1;
    if (won) {
      state.stats.wins += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      state.stats.winningGuesses += state.guesses.length;
    } else {
      state.stats.streak = 0;
    }
    saveStats();
  }

  function showAnswer(won) {
    if (!state.target) return;
    closeSuggestions();
    guessInput.disabled = true;
    guessButton.disabled = true;
    revealButton.disabled = true;
    nextButton.disabled = false;
    answerPanel.hidden = false;
    clearNode(answerPanel);
    answerPanel.appendChild(el("span", "answer-mark", won ? "✓" : "♫"));
    const copy = el("div", "answer-copy");
    copy.appendChild(el("strong", "", won ? "Found it in " + state.guesses.length + (state.guesses.length === 1 ? " guess!" : " guesses!") : "Mystery song revealed"));
    const details = state.target.artist + " · " + formatYear(state.target.year) + (state.target.album ? " · " + state.target.album : "");
    copy.appendChild(el("p", "", state.target.title + " — " + details));
    const link = el("a", "", "Open song listing ↗");
    link.href = state.target.storeUrl || state.target.spotifyUrl || "https://music.apple.com/";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    copy.appendChild(link);
    answerPanel.appendChild(copy);
    setFeedback(
      won ? "Nice deduction. Ready for another mystery song?" : "No worries. Study the clues and try another song.",
      won ? "success" : ""
    );
  }

  guessInput.addEventListener("input", renderSuggestions);
  guessInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSuggestionSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSuggestionSelection(-1);
    } else if (event.key === "Escape") {
      closeSuggestions();
    } else if (event.key === "Enter") {
      event.preventDefault();
      submitFromForm();
    }
  });

  suggestionBox.addEventListener("click", (event) => {
    const option = event.target.closest(".song-suggestion");
    if (!option) return;
    const index = Number(option.dataset.index);
    if (state.suggestions[index]) submitGuess(state.suggestions[index]);
  });

  document.addEventListener("click", (event) => {
    // Keep the selected result alive through the form button's click/submit cycle.
    if (!event.target.closest(".search-wrap") && !event.target.closest(".guess-button")) closeSuggestions();
  });

  guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitFromForm();
  });

  revealButton.addEventListener("click", () => {
    if (state.resolved || !state.target) return;
    state.resolved = true;
    recordResult(false);
    showAnswer(false);
  });

  nextButton.addEventListener("click", () => {
    if (!state.resolved) return;
    startRound();
  });

  retryButton.addEventListener("click", loadCatalog);

  renderStats();
  loadCatalog();
})();