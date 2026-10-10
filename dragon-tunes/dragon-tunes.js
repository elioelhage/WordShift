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
  const feedback = $("feedback");
  const audioNote = $("audio-note");
  const stageCaption = $("stage-caption");
  const clipLabel = $("clip-label");
  const waveform = $("waveform");
  const roundChip = $("round-chip");
  const scoreLabel = $("score");
  const streakLabel = $("streak");
  const attemptCount = $("attempt-count");
  const datalist = $("song-options");
  const modal = $("results-modal");
  const resultsCopy = $("results-copy");
  const roundsPerGame = 10;
  const maxClipSeconds = 5;
  const APPLE_SEARCH_URL = "https://itunes.apple.com/search";

  let catalog = [];
  let playable = [];
  let currentTrack = null;
  let chosenDifficulty = "easy";
  let roundIndex = 0;
  let score = 0;
  let streak = 0;
  let clipSeconds = 1;
  let roundSolved = false;
  let gameStarted = false;
  let loadingCatalog = false;
  let previewTimer = null;
  let roundPool = [];
  let usedIds = new Set();
  let playbackToken = 0;
  const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];

  const normalize = (value) => String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ")
    .trim().replace(/\s+/g, " ");

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

  async function loadCatalog() {
    if (loadingCatalog) return;
    loadingCatalog = true;
    startButton.disabled = true;
    startButton.textContent = "Loading songs…";
    audioNote.textContent = "Loading Imagine Dragons tracks from the Apple Music/iTunes catalog…";
    try {
      const results = await appleSearch("Imagine Dragons");
      const tracks = Array.isArray(results.results) ? results.results : [];
      const seen = new Set();
      catalog = tracks.filter((track) => {
        const artistName = normalize(track.artistName);
        const title = String(track.trackName || "").trim();
        const id = String(track.trackId || "");
        if (!id || !title || !artistName.includes("imagine dragons") || seen.has(id)) return false;
        seen.add(id);
        return true;
      }).map((track) => ({
        id: String(track.trackId),
        title: track.trackName,
        album: track.collectionName || "",
        artist: track.artistName,
        previewUrl: track.previewUrl || "",
        storeUrl: track.trackViewUrl || track.collectionViewUrl || "https://music.apple.com/ca/artist/imagine-dragons/358714030"
      }));
      playable = catalog.filter((track) => track.previewUrl);
      datalist.replaceChildren(...catalog.map((track) => {
        const option = document.createElement("option");
        option.value = track.title;
        return option;
      }));

      audioNote.replaceChildren();
      const attribution = document.createElement("span");
      attribution.textContent = "Catalog and available promotional previews by Apple Music/iTunes. ";
      const link = document.createElement("a");
      link.href = "https://music.apple.com/ca/artist/imagine-dragons/358714030";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open Imagine Dragons on Apple Music";
      audioNote.append(attribution, link);

      if (!catalog.length || !playable.length) {
        throw new Error("No playable Imagine Dragons previews were returned in your region.");
      }
      startButton.textContent = "Start game →";
      startButton.disabled = false;
      setFeedback(`Loaded ${catalog.length} tracks; ${playable.length} have previews available.`);
    } catch (error) {
      console.error("Dragon Tunes catalog load failed:", error);
      audioNote.textContent = "Audio previews come from the Apple Music/iTunes catalog and may not be available for every track or region.";
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
      return hits.length >= 5 ? hits : playable;
    }
    if (chosenDifficulty === "hard") {
      const deeperCuts = playable.filter((track) => !easyTitles.has(normalize(track.title)));
      return deeperCuts.length >= 5 ? deeperCuts : playable;
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
    previewTimer = null;
    audio.pause();
    waveform.classList.remove("playing");
    playButton.disabled = !currentTrack || roundSolved;
    return playbackToken;
  }

  function playSnippet(seconds = clipSeconds) {
    if (!currentTrack || !currentTrack.previewUrl || roundSolved) return;
    const token = stopAudio();
    if (audio.src !== currentTrack.previewUrl) {
      audio.src = currentTrack.previewUrl;
      audio.load();
    }
    clipLabel.textContent = seconds === 1 ? "YOUR FIRST CLIP" : `CLIP REVEALED · ${seconds} SECONDS`;
    stageCaption.textContent = `Playing ${seconds} second${seconds === 1 ? "" : "s"}…`;
    waveform.classList.add("playing");
    playButton.disabled = true;
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Playing…';

    const startAt = () => {
      if (token !== playbackToken || roundSolved || !currentTrack) return;
      try { audio.currentTime = 0; } catch (_) {}
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch((error) => {
          if (token !== playbackToken) return;
          console.warn("Preview playback was blocked:", error);
          if (previewTimer) window.clearTimeout(previewTimer);
          previewTimer = null;
          setFeedback("Playback was blocked. Press play again to allow audio.", "error");
          stageCaption.textContent = "Tap play to listen.";
          waveform.classList.remove("playing");
          playButton.disabled = false;
          playButton.innerHTML = '<span aria-hidden="true">▶</span> Play snippet';
        });
      }
      previewTimer = window.setTimeout(() => {
        if (token !== playbackToken) return;
        audio.pause();
        previewTimer = null;
        waveform.classList.remove("playing");
        stageCaption.textContent = "Clip finished. Make your guess or listen again.";
        playButton.disabled = false;
        playButton.innerHTML = '<span aria-hidden="true">▶</span> Replay snippet';
      }, Math.max(1, seconds) * 1000);
    };

    if (audio.readyState >= 1) startAt();
    else {
      audio.addEventListener("loadedmetadata", startAt, {once: true});
      audio.addEventListener("error", () => {
        if (token !== playbackToken) return;
        if (previewTimer) window.clearTimeout(previewTimer);
        previewTimer = null;
        waveform.classList.remove("playing");
        stageCaption.textContent = "This preview couldn't be played.";
        setFeedback("This song's preview is unavailable. Skip to another round.", "error");
        playButton.disabled = false;
        playButton.innerHTML = '<span aria-hidden="true">▶</span> Try again';
      }, {once: true});
    }
  }

  function startRound() {
    if (!roundPool.length) roundPool = shuffle(getDifficultyPool());
    let next = roundPool.find((track) => !usedIds.has(track.id));
    if (!next) {
      usedIds.clear();
      roundPool = shuffle(getDifficultyPool());
      next = roundPool.find((track) => !usedIds.has(track.id));
    }
    if (!next) {
      setFeedback("No more songs with playable previews were found.", "error");
      finishGame();
      return;
    }
    currentTrack = next;
    usedIds.add(next.id);
    clipSeconds = 1;
    roundSolved = false;
    stopAudio();
    audio.src = currentTrack.previewUrl;
    audio.load();
    roundChip.textContent = `ROUND ${roundIndex + 1} / ${roundsPerGame}`;
    clipLabel.textContent = "YOUR FIRST CLIP";
    stageCaption.textContent = "Ready when you are.";
    attemptCount.textContent = "Clip: 1 second";
    guessInput.value = "";
    setControls({guess: true, skip: true, play: true});
    nextButton.hidden = true;
    startButton.hidden = true;
    setFeedback("Listen to the snippet, then type your guess.");
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Play 1 second';
  }

  function cleanGuess(value) {
    return normalize(value).replace(/\b(remastered|radio edit|single version|explicit)\b/g, "").trim();
  }

  function checkGuess() {
    if (!currentTrack || roundSolved) return;
    const guess = cleanGuess(guessInput.value);
    if (!guess) {
      setFeedback("Type a song title first.", "error");
      guessInput.focus();
      return;
    }
    const answer = cleanGuess(currentTrack.title);
    if (guess === answer || guess === answer.replace(/\b(feat|featuring)\b.*$/, "").trim()) {
      solveRound(true);
      return;
    }
    setFeedback("Not quite. Listen again, or skip to reveal another second.", "error");
    guessInput.select();
    streak = 0;
    streakLabel.textContent = String(streak);
  }

  function solveRound(won) {
    roundSolved = true;
    stopAudio();
    setControls();
    const points = won ? Math.max(100, 600 - (clipSeconds - 1) * 100) : 0;
    if (won) {
      score += points;
      streak += 1;
      setFeedback(`Correct — “${currentTrack.title}”! +${points} points`, "success");
      stageCaption.textContent = "Song identified. Nice ears!";
      clipLabel.textContent = "YOU GOT IT";
      scoreLabel.textContent = String(score);
      streakLabel.textContent = String(streak);
    } else {
      setFeedback(`The song was “${currentTrack.title}”.`, "error");
      stageCaption.textContent = "Keep going — the next song is waiting.";
      clipLabel.textContent = "ANSWER REVEALED";
    }
    const storeLink = document.createElement("a");
    storeLink.href = currentTrack.storeUrl;
    storeLink.target = "_blank";
    storeLink.rel = "noopener noreferrer";
    storeLink.textContent = "Open song in Apple Music";
    storeLink.style.display = "inline-block";
    storeLink.style.marginTop = "8px";
    storeLink.style.fontSize = ".75rem";
    storeLink.style.color = "var(--accent)";
    feedback.append(document.createElement("br"), storeLink);
    nextButton.hidden = false;
    nextButton.textContent = roundIndex + 1 >= roundsPerGame ? "View results →" : "Next song →";
    nextButton.focus({preventScroll: true});
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
    startButton.hidden = true;
    nextButton.hidden = true;
    roundChip.textContent = "GAME COMPLETE";
    resultsCopy.textContent = `You scored ${score} points across ${Math.min(roundIndex + (roundSolved ? 1 : 0), roundsPerGame)} round(s), with a final streak of ${streak}. Ready for another run?`;
    modal.hidden = false;
    $("play-again").focus();
  }

  function nextRound() {
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
    gameStarted = true;
    roundIndex = 0;
    score = 0;
    streak = 0;
    roundPool = shuffle(getDifficultyPool());
    usedIds = new Set();
    scoreLabel.textContent = "0";
    streakLabel.textContent = "0";
    modal.hidden = true;
    difficultyButtons.forEach((button) => { button.disabled = true; });
    startRound();
  }

  difficultyButtons.forEach((button) => button.addEventListener("click", () => setDifficulty(button.dataset.difficulty)));
  startButton.addEventListener("click", startGame);
  nextButton.addEventListener("click", nextRound);
  playButton.addEventListener("click", () => playSnippet(clipSeconds));
  skipButton.addEventListener("click", skipSong);
  submitButton.addEventListener("click", checkGuess);
  guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkGuess();
  });
  $("play-again").addEventListener("click", () => {
    modal.hidden = true;
    difficultyButtons.forEach((button) => { button.disabled = false; });
    startButton.hidden = false;
    startButton.textContent = "Start another game →";
    startGame();
  });
  audio.addEventListener("ended", () => {
    if (previewTimer) window.clearTimeout(previewTimer);
    previewTimer = null;
    waveform.classList.remove("playing");
    if (!roundSolved) {
      playButton.disabled = false;
      playButton.innerHTML = `<span aria-hidden="true">▶</span> Replay ${clipSeconds} second${clipSeconds === 1 ? "" : "s"}`;
    }
  });

  loadCatalog();
})();