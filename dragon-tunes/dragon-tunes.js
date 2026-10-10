(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const audio = $("song-audio");
  const startButton = $("start-button");
  const nextButton = $("next-button");
  const playButton = $("play-button");
  const skipButton = $("skip-button");
  const submitButton = $("submit-guess");
  const guessInput = $("guess-input");
  const suggestionBox = $("song-suggestions");
  const feedback = $("feedback");
  const audioNote = $("audio-note");
  const stageCaption = $("stage-caption");
  const clipLabel = $("clip-label");
  const waveform = $("waveform");
  const roundChip = $("round-chip");
  const scoreLabel = $("score");
  const streakLabel = $("streak");
  const attemptCount = $("attempt-count");
  const answerReveal = $("answer-reveal");
  const autoAdvanceBox = $("auto-advance");
  const autoAdvanceMessage = $("auto-advance-message");
  const autoAdvanceCountdown = $("auto-advance-countdown");
  const autoAdvanceProgress = $("auto-advance-progress");
  const resultsModal = $("results-modal");
  const resultsCopy = $("results-copy");
  const roundsPerGame = 10;

  // The initial clip is intentionally longer than a literal one-second Heardle clip.
  const initialClipSeconds = 2;
  const maxClipSeconds = 6;
  const answerPlaybackSeconds = 8;
  const APPLE_SEARCH_URL = "https://itunes.apple.com/search";
  const ARTIST_WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/Imagine_Dragons";

  let catalog = [];
  let playable = [];
  let currentTrack = null;
  let chosenDifficulty = "easy";
  let roundIndex = 0;
  let roundsPlayed = 0;
  let score = 0;
  let streak = 0;
  let clipSeconds = initialClipSeconds;
  let roundSolved = false;
  let gameStarted = false;
  let loadingCatalog = false;
  let previewTimer = null;
  let advanceTimer = null;
  let countdownTimer = null;
  let playbackToken = 0;
  let roundPool = [];
  let usedIds = new Set();
  let artistInfo = null;
  let artistInfoPromise = null;
  let activeSuggestionIndex = -1;
  const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];
  const picker = document.querySelector(".song-picker");

  const normalize = (value) => String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ")
    .trim().replace(/\s+/g, " ");

  const alternatePattern = /\b(live|remix|acoustic|instrumental|karaoke|sped up|slowed|nightcore|radio edit|remaster(?:ed)?|demo|cover|orchestral|reimagined|stripped|piano version|rock version|re recorded|re-recorded|anniversary edition|commentary|tribute|tribute version|8d audio|looped)\b/i;

  function canonicalTitle(title) {
    let value = String(title || "").trim();
    // Remove common bracketed or dash-suffixed editions, not words that are part of the real title.
    value = value.replace(/\s*[([{][^\])}]*\b(?:live|remix|acoustic|instrumental|karaoke|sped up|slowed|nightcore|radio edit|remaster(?:ed)?|demo|cover|orchestral|reimagined|stripped|piano version|rock version|commentary)\b[^\])}]*[\])}]/gi, "");
    value = value.replace(/\s*[-–—:]\s*(?:live|remix|acoustic|instrumental|karaoke|sped up|slowed|nightcore|radio edit|remaster(?:ed)?|demo|cover|orchestral|reimagined|stripped)\b.*$/i, "");
    value = value.replace(/\s*[([{]\s*(?:from the series|from the .* soundtrack|music from .*|feat(?:uring)?\.?|ft\.?)\b.*?[\])}]/gi, "");
    value = value.replace(/\s+(?:feat(?:uring)?|ft\.?)\s+.*$/i, "");
    return normalize(value);
  }

  function isAlternateVersion(track) {
    const title = String(track.trackName || "");
    const album = String(track.collectionName || "");
    const artist = normalize(track.artistName);
    if (alternatePattern.test(title) || alternatePattern.test(album)) return true;
    // Treat tracks marketed with another featured artist as variants where a standard version exists.
    if (/\b(feat(?:uring)?|ft)\b/i.test(title) || artist !== "imagine dragons") return true;
    return false;
  }

  function trackQuality(track) {
    const title = String(track.trackName || "").trim();
    let quality = 0;
    if (normalize(title) === canonicalTitle(title)) quality += 10;
    if (!isAlternateVersion(track)) quality += 20;
    if (!/\b(from the series|from the .* soundtrack|music from)\b/i.test(title)) quality += 2;
    if (/\b(deluxe|expanded|anniversary|remastered|greatest hits|best of)\b/i.test(track.collectionName || "")) quality -= 2;
    if (track.previewUrl) quality += 1;
    return quality;
  }

  function setFeedback(text, kind = "") {
    feedback.replaceChildren();
    feedback.textContent = text;
    feedback.className = "feedback" + (kind ? " " + kind : "");
  }

  function setControls({guess = false, skip = false, play = false} = {}) {
    guessInput.disabled = !guess;
    submitButton.disabled = !guess;
    skipButton.disabled = !skip;
    playButton.disabled = !play;
  }

  function setDifficulty(value) {
    if (gameStarted) return;
    chosenDifficulty = value;
    difficultyButtons.forEach((button) => {
      const active = button.dataset.difficulty === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function closeSuggestions() {
    suggestionBox.hidden = true;
    guessInput.setAttribute("aria-expanded", "false");
    activeSuggestionIndex = -1;
    suggestionBox.querySelectorAll(".song-suggestion").forEach((button) => button.classList.remove("active"));
  }

  function chooseSuggestion(track) {
    guessInput.value = track.title;
    closeSuggestions();
    guessInput.focus();
  }

  function renderSuggestions() {
    const query = normalize(guessInput.value);
    suggestionBox.replaceChildren();
    activeSuggestionIndex = -1;
    if (guessInput.disabled || query.length < 2) {
      closeSuggestions();
      return;
    }
    const matches = playable
      .filter((track) => normalize(track.title).includes(query))
      .slice(0, 8);
    if (!matches.length) {
      closeSuggestions();
      return;
    }
    matches.forEach((track, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "song-suggestion";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      const label = document.createElement("span");
      label.textContent = track.title;
      const album = document.createElement("small");
      album.textContent = track.album || "Imagine Dragons";
      const copy = document.createElement("span");
      copy.append(label, album);
      button.append(copy);
      button.addEventListener("click", () => chooseSuggestion(track));
      suggestionBox.append(button);
    });
    suggestionBox.hidden = false;
    guessInput.setAttribute("aria-expanded", "true");
  }

  function moveSuggestionSelection(direction) {
    const options = [...suggestionBox.querySelectorAll(".song-suggestion")];
    if (!options.length) return false;
    activeSuggestionIndex = (activeSuggestionIndex + direction + options.length) % options.length;
    options.forEach((option, index) => {
      const active = index === activeSuggestionIndex;
      option.classList.toggle("active", active);
      option.setAttribute("aria-selected", String(active));
    });
    options[activeSuggestionIndex].scrollIntoView({block: "nearest"});
    return true;
  }

  function appleSearch(term, limit = 200) {
    const url = new URL(APPLE_SEARCH_URL);
    url.searchParams.set("term", term);
    url.searchParams.set("entity", "song");
    url.searchParams.set("country", "ca");
    url.searchParams.set("limit", String(limit));
    return fetch(url.toString(), {mode: "cors"}).then((response) => {
      if (!response.ok) throw new Error("The music catalog is unavailable right now.");
      return response.json();
    });
  }

  async function loadArtistInfo() {
    if (artistInfoPromise) return artistInfoPromise;
    artistInfoPromise = fetch(ARTIST_WIKI_API, {headers: {Accept: "application/json"}})
      .then((response) => {
        if (!response.ok) throw new Error("Artist photo unavailable");
        return response.json();
      })
      .then((data) => {
        artistInfo = {
          image: data.thumbnail?.source || data.originalimage?.source || "",
          page: data.content_urls?.desktop?.page || "https://en.wikipedia.org/wiki/Imagine_Dragons",
          description: data.description || ""
        };
        return artistInfo;
      })
      .catch(() => null);
    return artistInfoPromise;
  }

  function enhanceArtwork(url) {
    if (!url) return "";
    // Apple commonly returns 100x100 artwork; request a larger rendition when that URL pattern is present.
    return url.replace(/\b100x100bb\b/i, "600x600bb").replace(/\b100x100\b/i, "600x600");
  }

  function deduplicateTracks(tracks) {
    const groups = new Map();
    for (const raw of tracks) {
      const title = String(raw.trackName || "").trim();
      const id = String(raw.trackId || "");
      if (!id || !title) continue;
      const candidate = {
        id,
        title,
        album: raw.collectionName || "",
        artist: raw.artistName || "Imagine Dragons",
        previewUrl: raw.previewUrl || "",
        artworkUrl: enhanceArtwork(raw.artworkUrl100 || raw.artworkUrl60 || ""),
        storeUrl: raw.trackViewUrl || raw.collectionViewUrl || "https://music.apple.com/ca/artist/imagine-dragons/358714030",
        raw
      };
      if (!candidate.previewUrl) continue;
      const canonical = canonicalTitle(title);
      if (!canonical) continue;
      if (!groups.has(canonical)) groups.set(canonical, []);
      groups.get(canonical).push(candidate);
    }

    const unique = [];
    for (const group of groups.values()) {
      // Prefer the standard studio title. If a group only contains live/remix/feature variants, omit it.
      const clean = group.filter((track) => !isAlternateVersion(track));
      if (!clean.length) continue;
      clean.sort((a, b) => trackQuality(b.raw) - trackQuality(a.raw));
      unique.push(clean[0]);
    }
    return unique.sort((a, b) => a.title.localeCompare(b.title));
  }

  async function loadCatalog() {
    if (loadingCatalog) return;
    loadingCatalog = true;
    startButton.disabled = true;
    startButton.textContent = "Loading songs…";
    audioNote.textContent = "Loading Imagine Dragons tracks and artwork…";
    try {
      const results = await appleSearch("Imagine Dragons");
      const tracks = Array.isArray(results.results) ? results.results : [];
      const artistMatches = tracks.filter((track) => normalize(track.artistName).includes("imagine dragons"));
      catalog = deduplicateTracks(artistMatches);
      playable = catalog;

      audioNote.replaceChildren();
      const attribution = document.createElement("span");
      attribution.textContent = "Catalog metadata and available previews by Apple Music/iTunes. ";
      const link = document.createElement("a");
      link.href = "https://music.apple.com/ca/artist/imagine-dragons/358714030";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open Imagine Dragons on Apple Music";
      audioNote.append(attribution, link);

      if (playable.length < 1) {
        throw new Error("No clean, playable Imagine Dragons tracks were returned in your region.");
      }
      startButton.textContent = "Start game →";
      startButton.disabled = false;
      setFeedback(`Loaded ${playable.length} unique studio tracks with available previews.`);
    } catch (error) {
      console.error("Dragon Tunes catalog load failed:", error);
      audioNote.textContent = "Track information and previews depend on third-party catalog availability in your region.";
      startButton.textContent = "Retry loading songs ↻";
      startButton.disabled = false;
      setFeedback(error.message || "Could not load the song catalog.", "error");
    } finally {
      loadingCatalog = false;
    }
  }

  function getDifficultyPool() {
    const easyTitles = new Set([
      "believer", "thunder", "radioactive", "demons", "its time", "whatever it takes",
      "bones", "enemy", "natural", "on top of the world", "bad liar", "follow you",
      "sharks", "wrecked", "zero", "i bet my life", "next to me", "walking the wire",
      "mouth of the river", "gold", "birds", "nice to meet you"
    ].map(normalize));
    if (chosenDifficulty === "easy") {
      const hits = playable.filter((track) => easyTitles.has(normalize(track.title)));
      return hits.length >= roundsPerGame ? hits : playable;
    }
    if (chosenDifficulty === "hard") {
      const deeperCuts = playable.filter((track) => !easyTitles.has(normalize(track.title)));
      return deeperCuts.length >= roundsPerGame ? deeperCuts : playable;
    }
    return playable;
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function stopAudio() {
    playbackToken += 1;
    if (previewTimer) window.clearTimeout(previewTimer);
    if (advanceTimer) window.clearTimeout(advanceTimer);
    if (countdownTimer) window.clearInterval(countdownTimer);
    previewTimer = null;
    advanceTimer = null;
    countdownTimer = null;
    audio.pause();
    waveform.classList.remove("playing");
    answerReveal.classList.remove("is-autoplaying");
    autoAdvanceBox.hidden = true;
    playButton.disabled = !currentTrack || roundSolved;
    return playbackToken;
  }

  function setAudioTrack(track) {
    if (audio.src !== track.previewUrl) {
      audio.src = track.previewUrl;
      audio.load();
    }
  }

  function playSnippet(seconds = clipSeconds) {
    if (!currentTrack || !currentTrack.previewUrl || roundSolved) return;
    const token = stopAudio();
    setAudioTrack(currentTrack);
    clipLabel.textContent = seconds === initialClipSeconds ? "YOUR FIRST CLIP" : `CLIP REVEALED · ${seconds} SECONDS`;
    stageCaption.textContent = `Playing ${seconds} second${seconds === 1 ? "" : "s"}…`;
    waveform.classList.add("playing");
    playButton.disabled = true;
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Playing…';

    const failPlayback = () => {
      if (token !== playbackToken) return;
      if (previewTimer) window.clearTimeout(previewTimer);
      previewTimer = null;
      waveform.classList.remove("playing");
      stageCaption.textContent = "This preview could not be played.";
      setFeedback("This preview is unavailable. Try replaying or skip to reveal another second.", "error");
      playButton.disabled = false;
      playButton.innerHTML = '<span aria-hidden="true">▶</span> Try again';
    };
    const startAt = () => {
      if (token !== playbackToken || roundSolved || !currentTrack) return;
      try { audio.currentTime = 0; } catch (_) {}
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") playback.catch(failPlayback);
      previewTimer = window.setTimeout(() => {
        if (token !== playbackToken) return;
        audio.pause();
        previewTimer = null;
        waveform.classList.remove("playing");
        stageCaption.textContent = "Clip finished. Make your guess or listen again.";
        playButton.disabled = false;
        playButton.innerHTML = '<span aria-hidden="true">▶</span> Replay snippet';
      }, seconds * 1000);
    };

    if (audio.readyState >= 1) startAt();
    else {
      audio.addEventListener("loadedmetadata", startAt, {once: true});
      audio.addEventListener("error", failPlayback, {once: true});
    }
  }

  function showAnswerDetails() {
    answerReveal.hidden = false;
    answerReveal.classList.remove("is-autoplaying");
    $("answer-title").textContent = currentTrack.title;
    $("answer-artist").textContent = currentTrack.artist || "Imagine Dragons";
    $("answer-album").textContent = currentTrack.album ? `From ${currentTrack.album}` : "Album information unavailable";
    $("answer-store-link").href = currentTrack.storeUrl;

    const artwork = $("answer-artwork");
    const fallback = $("answer-artwork-fallback");
    fallback.hidden = true;
    artwork.hidden = false;
    artwork.alt = `Cover artwork for ${currentTrack.title}`;
    artwork.onerror = () => {
      artwork.hidden = true;
      fallback.hidden = false;
    };
    if (currentTrack.artworkUrl) {
      artwork.src = currentTrack.artworkUrl;
    } else {
      artwork.hidden = true;
      fallback.hidden = false;
    }

    const thisTrackId = currentTrack.id;
    loadArtistInfo().then((info) => {
      if (!info || !info.image || !currentTrack || currentTrack.id !== thisTrackId) return;
      const artistCard = $("artist-card");
      const artistImage = $("artist-image");
      artistImage.onerror = () => { artistCard.hidden = true; };
      artistImage.src = info.image;
      artistCard.hidden = false;
      $("artist-source-link").href = info.page;
    });
  }

  function playAnswerThenAdvance() {
    const token = stopAudio();
    setAudioTrack(currentTrack);
    autoAdvanceBox.hidden = false;
    autoAdvanceMessage.textContent = "Playing the song for 8 seconds…";
    autoAdvanceCountdown.textContent = "08";
    autoAdvanceProgress.style.animation = "none";
    // Force the progress animation to restart when an answer is revealed.
    void autoAdvanceProgress.offsetWidth;
    autoAdvanceProgress.style.animation = "";
    answerReveal.classList.add("is-autoplaying");
    clipLabel.textContent = "ANSWER REVEALED";
    stageCaption.textContent = "Enjoy a little of the song before the next round.";
    playButton.disabled = true;
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Playing answer…';

    const startAt = () => {
      if (token !== playbackToken || !currentTrack) return;
      try { audio.currentTime = 0; } catch (_) {}
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {
          if (token === playbackToken) autoAdvanceMessage.textContent = "Moving to the next song shortly…";
        });
      }
      const endAt = Date.now() + answerPlaybackSeconds * 1000;
      const updateCountdown = () => {
        if (token !== playbackToken) return;
        const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        autoAdvanceCountdown.textContent = String(remaining).padStart(2, "0");
      };
      updateCountdown();
      countdownTimer = window.setInterval(updateCountdown, 180);
      previewTimer = window.setTimeout(() => {
        if (token !== playbackToken) return;
        audio.pause();
        previewTimer = null;
        waveform.classList.remove("playing");
      }, answerPlaybackSeconds * 1000);
      advanceTimer = window.setTimeout(() => {
        if (token !== playbackToken) return;
        advanceTimer = null;
        nextRound();
      }, answerPlaybackSeconds * 1000);
    };

    waveform.classList.add("playing");
    if (audio.readyState >= 1) startAt();
    else {
      audio.addEventListener("loadedmetadata", startAt, {once: true});
      audio.addEventListener("error", () => {
        if (token !== playbackToken) return;
        autoAdvanceMessage.textContent = "Preview unavailable — moving to the next song shortly…";
        // Preserve the automatic advance even if audio fails to start.
        advanceTimer = window.setTimeout(() => {
          if (token === playbackToken) nextRound();
        }, answerPlaybackSeconds * 1000);
        countdownTimer = window.setInterval(() => {
          const remaining = Math.max(0, Math.ceil((answerPlaybackSeconds * 1000 - ((advanceTimer ? 0 : 0))) / 1000));
          autoAdvanceCountdown.textContent = String(remaining).padStart(2, "0");
        }, 1000);
      }, {once: true});
    }
  }

  function startRound() {
    const next = roundPool.find((track) => !usedIds.has(track.id));
    if (!next) {
      setFeedback("There are not enough unique playable songs for ten rounds at this difficulty. Try a different difficulty.", "error");
      finishGame();
      return;
    }
    stopAudio();
    currentTrack = next;
    usedIds.add(next.id);
    clipSeconds = initialClipSeconds;
    roundSolved = false;
    answerReveal.hidden = true;
    answerReveal.classList.remove("is-autoplaying");
    $("artist-card").hidden = true;
    roundChip.textContent = `ROUND ${roundIndex + 1} / ${roundsPerGame}`;
    clipLabel.textContent = "YOUR FIRST CLIP";
    stageCaption.textContent = "Ready when you are.";
    attemptCount.textContent = `Clip: ${clipSeconds} seconds`;
    guessInput.value = "";
    closeSuggestions();
    setAudioTrack(currentTrack);
    setControls({guess: true, skip: true, play: true});
    nextButton.hidden = true;
    nextButton.textContent = "Skip to next song →";
    startButton.hidden = true;
    setFeedback("Listen to the snippet, then type your guess.");
    playButton.innerHTML = `<span aria-hidden="true">▶</span> Play ${clipSeconds} seconds`;
  }

  function cleanGuess(value) {
    return canonicalTitle(String(value || "").replace(/\b(remastered|radio edit|single version|explicit)\b/gi, ""));
  }

  function checkGuess() {
    if (!currentTrack || roundSolved) return;
    const guess = cleanGuess(guessInput.value);
    if (!guess) {
      setFeedback("Type a song title first.", "error");
      guessInput.focus();
      return;
    }
    const answer = canonicalTitle(currentTrack.title);
    if (guess === answer) {
      solveRound(true);
      return;
    }
    streak = 0;
    streakLabel.textContent = String(streak);
    setFeedback("Not quite. Listen again, or skip to reveal another second.", "error");
    guessInput.select();
  }

  function solveRound(won) {
    if (roundSolved) return;
    roundSolved = true;
    roundsPlayed = Math.max(roundsPlayed, roundIndex + 1);
    stopAudio();
    closeSuggestions();
    setControls();
    const points = won ? Math.max(100, 600 - (clipSeconds - initialClipSeconds) * 100) : 0;
    if (won) {
      score += points;
      streak += 1;
      scoreLabel.textContent = String(score);
      streakLabel.textContent = String(streak);
      setFeedback(`Correct — “${currentTrack.title}”! +${points} points`, "success");
      clipLabel.textContent = "YOU GOT IT";
      stageCaption.textContent = "Song identified. Nice ears!";
    } else {
      setFeedback(`The song was “${currentTrack.title}”.`, "error");
      clipLabel.textContent = "ANSWER REVEALED";
      stageCaption.textContent = "Keep going — the next song is waiting.";
    }
    showAnswerDetails();
    nextButton.hidden = false;
    nextButton.textContent = won ? "Skip to next song →" : "Next song →";
    if (won) {
      playAnswerThenAdvance();
    } else {
      autoAdvanceBox.hidden = true;
      nextButton.focus({preventScroll: true});
    }
  }

  function skipSong() {
    if (!currentTrack || roundSolved) return;
    if (clipSeconds >= maxClipSeconds) {
      solveRound(false);
      return;
    }
    clipSeconds += 1;
    attemptCount.textContent = `Clip: ${clipSeconds} seconds`;
    clipLabel.textContent = `CLIP REVEALED · ${clipSeconds} SECONDS`;
    stageCaption.textContent = `Now you can hear ${clipSeconds} seconds.`;
    playButton.innerHTML = `<span aria-hidden="true">▶</span> Play ${clipSeconds} seconds`;
    setFeedback(`More audio revealed. Try to identify the song in ${clipSeconds} seconds.`);
    stopAudio();
    setControls({guess: true, skip: true, play: true});
  }

  function finishGame() {
    gameStarted = false;
    stopAudio();
    setControls();
    closeSuggestions();
    difficultyButtons.forEach((button) => { button.disabled = false; });
    startButton.hidden = false;
    startButton.textContent = "Start another game →";
    nextButton.hidden = true;
    roundChip.textContent = "GAME COMPLETE";
    resultsCopy.textContent = `You scored ${score} points across ${roundsPlayed} rounds, with a final streak of ${streak}. Ready for another run?`;
    resultsModal.hidden = false;
    $("play-again").focus();
  }

  function nextRound() {
    if (!gameStarted) return;
    if (roundIndex + 1 >= roundsPerGame) {
      finishGame();
      return;
    }
    roundIndex += 1;
    startRound();
  }

  function startGame() {
    if (loadingCatalog) return;
    if (!playable.length) {
      loadCatalog();
      return;
    }
    const pool = getDifficultyPool();
    if (pool.length < roundsPerGame) {
      setFeedback(`Only ${pool.length} unique songs are available for this difficulty; choose another difficulty or try again later.`, "error");
      return;
    }
    gameStarted = true;
    roundIndex = 0;
    roundsPlayed = 0;
    score = 0;
    streak = 0;
    roundPool = shuffle(pool);
    usedIds = new Set();
    scoreLabel.textContent = "0";
    streakLabel.textContent = "0";
    resultsModal.hidden = true;
    difficultyButtons.forEach((button) => { button.disabled = true; });
    startRound();
  }

  difficultyButtons.forEach((button) => button.addEventListener("click", () => setDifficulty(button.dataset.difficulty)));
  startButton.addEventListener("click", startGame);
  nextButton.addEventListener("click", nextRound);
  playButton.addEventListener("click", () => playSnippet(clipSeconds));
  skipButton.addEventListener("click", skipSong);
  submitButton.addEventListener("click", checkGuess);
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
      const options = [...suggestionBox.querySelectorAll(".song-suggestion")];
      if (!suggestionBox.hidden && activeSuggestionIndex >= 0 && options[activeSuggestionIndex]) {
        event.preventDefault();
        const selected = options[activeSuggestionIndex].querySelector("span");
        if (selected) guessInput.value = selected.firstChild?.textContent || guessInput.value;
        closeSuggestions();
      } else {
        event.preventDefault();
        checkGuess();
      }
    }
  });
  document.addEventListener("click", (event) => {
    if (picker && !picker.contains(event.target)) closeSuggestions();
  });
  $("play-again").addEventListener("click", () => {
    resultsModal.hidden = true;
    difficultyButtons.forEach((button) => { button.disabled = false; });
    startButton.hidden = false;
    startGame();
  });
  audio.addEventListener("ended", () => {
    if (previewTimer) window.clearTimeout(previewTimer);
    previewTimer = null;
    waveform.classList.remove("playing");
    if (!roundSolved) {
      playButton.disabled = false;
      playButton.innerHTML = `<span aria-hidden="true">▶</span> Replay ${clipSeconds} seconds`;
    }
  });

  loadArtistInfo();
  loadCatalog();
})();