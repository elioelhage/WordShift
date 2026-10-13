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
  const guessForm = $("guess-form");
  const gameCard = $("game-card");
  const preGameControls = $("pre-game-controls");
  const difficultyPicker = document.querySelector(".difficulty");
  const artistPicker = document.querySelector(".artist-picker");
  const artistProfileLink = $("artist-profile-link");
  const artistOrbLink = $("artist-orb-link");
  const artistOrbImage = $("artist-orb-image");
  const artistOrbFallback = $("artist-orb-fallback");
  const artistButtons = [...document.querySelectorAll("[data-artist]")];
  const clipProgressbar = $("clip-progressbar");
  const clipProgress = $("clip-progress");
  const clipMarkers = [...document.querySelectorAll(".clip-timeline__markers [data-stage]")];
  const songInputArt = $("song-input-art");
  const songInputArtImage = $("song-input-art-img");
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

  // The first clip is 1.4 seconds in audio but is advertised as "1 sec".
  const clipStages = [
    {label: 1, seconds: 1.4},
    {label: 2, seconds: 2.5},
    {label: 4, seconds: 4},
    {label: 5, seconds: 5}
  ];
  const initialClipSeconds = clipStages[0].seconds;
  const answerPlaybackSeconds = 8;
  const APPLE_SEARCH_URL = "https://itunes.apple.com/search";
  const ARTISTS = {
    "imagine-dragons": {
      name: "Imagine Dragons",
      searchTerm: "Imagine Dragons",
      artistAliases: ["Imagine Dragons"],
      profileImage: "https://i.scdn.co/image/01b36ca0f45f2f15117022a2754287a6ca1acdcc",
      spotifyUrl: "https://open.spotify.com/artist/53XhwfbYqKCa1cC15pYq2q",
      appleArtistUrl: "https://music.apple.com/ca/artist/imagine-dragons/358714030",
      easyTitles: [
        "believer", "thunder", "radioactive", "demons", "it's time", "whatever it takes",
        "bones", "enemy", "natural", "on top of the world", "bad liar", "follow you",
        "sharks", "wrecked", "zero", "i bet my life", "next to me", "walking the wire",
        "mouth of the river", "gold", "birds", "nice to meet you"
      ]
    },
    "kanye-west": {
      name: "Kanye West",
      searchTerm: "Kanye West",
      artistAliases: ["Kanye West", "Ye"],
      profileImage: "https://i.scdn.co/image/a12d8543e28d71d9f1e7f5f363c1a6c73316f9e6",
      spotifyUrl: "https://open.spotify.com/artist/5K4W6rqBFWDnAN6FQUkS6x",
      appleArtistUrl: "https://music.apple.com/ca/search?term=Kanye%20West",
      easyTitles: [
        "stronger", "heartless", "gold digger", "power", "flashing lights", "good life",
        "all falls down", "through the wire", "jesus walks", "can't tell me nothing",
        "homecoming", "runaway", "bound 2", "black skinhead", "famous", "fade",
        "ultralight beam", "father stretch my hands pt. 1", "all of the lights",
        "touch the sky", "good morning", "no church in the wild", "ghost town",
        "violent crimes", "off the grid", "i wonder", "love lockdown", "monster"
      ]
    }
  };
  let chosenArtistId = "imagine-dragons";
  let chosenArtist = ARTISTS[chosenArtistId];
  const catalogCache = new Map();
  const catalogPromises = new Map();

  let catalog = [];
  let playable = [];
  let currentTrack = null;
  let chosenDifficulty = "easy";
  let roundIndex = 0;
  let roundsPlayed = 0;
  let score = 0;
  let streak = 0;
  let clipStageIndex = 0;
  let clipSeconds = initialClipSeconds;
  let roundSolved = false;
  let gameStarted = false;
  let startingGame = false;
  let startRequestToken = 0;
  let previewTimer = null;
  let advanceTimer = null;
  let countdownTimer = null;
  let playbackToken = 0;
  let roundPool = [];
  let usedIds = new Set();
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
    value = value.replace(/\s*\([^)]*\b(?:live|remix|acoustic|instrumental|karaoke|sped up|slowed|nightcore|radio edit|remaster(?:ed)?|demo|cover|orchestral|reimagined|stripped|piano version|rock version|commentary)\b[^)]*\)/gi, "");
    value = value.replace(/\s*\[[^\]]*\b(?:live|remix|acoustic|instrumental|karaoke|sped up|slowed|nightcore|radio edit|remaster(?:ed)?|demo|cover|orchestral|reimagined|stripped|piano version|rock version|commentary)\b[^\]]*\]/gi, "");
    value = value.replace(/\s*[-–—:]\s*(?:live|remix|acoustic|instrumental|karaoke|sped up|slowed|nightcore|radio edit|remaster(?:ed)?|demo|cover|orchestral|reimagined|stripped)\b.*$/i, "");
    value = value.replace(/\s*[-–—:]\s*(?:from the series|from the .* soundtrack|music from .*|feat(?:uring)?\.?|ft\.?)\b.*$/i, "");
    value = value.replace(/\s*\((?:from the series|from the .* soundtrack|music from .*|feat(?:uring)?\.?|ft\.?).*?\)/gi, "");
    value = value.replace(/\s*\[(?:from the series|from the .* soundtrack|music from .*|feat(?:uring)?\.?|ft\.?).*?\]/gi, "");
    value = value.replace(/\s+(?:feat(?:uring)?|ft\.?)\s+.*$/i, "");
    return normalize(value);
  }

  function isAlternateVersion(track, artistConfig = chosenArtist) {
    const title = String(track.trackName || "");
    const album = String(track.collectionName || "");
    const artist = normalize(track.artistName);
    if (alternatePattern.test(title) || alternatePattern.test(album)) return true;
    const acceptedNames = (artistConfig.artistAliases || [artistConfig.name]).map(normalize);
    return /\b(feat(?:uring)?|ft)\b/i.test(title) || !acceptedNames.includes(artist);
  }

  function trackQuality(track, artistConfig = chosenArtist) {
    const title = String(track.trackName || "").trim();
    let quality = 0;
    if (normalize(title) === canonicalTitle(title)) quality += 10;
    if (!isAlternateVersion(track, artistConfig)) quality += 20;
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

  function selectArtist(artistId) {
    if (gameStarted || !ARTISTS[artistId]) return;
    // Allow re-selecting the current artist to retry a failed catalog load. The old
    // early return blocked that path and could leave Start disabled after a fetch error.

    // Invalidate any pending start attempt for the previously selected artist.
    startRequestToken += 1;
    startingGame = false;
    chosenArtistId = artistId;
    chosenArtist = ARTISTS[artistId];
    artistButtons.forEach((button) => {
      const active = button.dataset.artist === artistId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      const status = button.querySelector(".artist-option-status");
      if (status) status.textContent = active ? "Selected" : "Select";
    });

    const selectionArtistId = artistId;
    artistOrbImage.hidden = true;
    artistOrbFallback.textContent = chosenArtist.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
    artistOrbFallback.hidden = false;
    artistOrbImage.alt = chosenArtist.name + " artist profile image";
    artistOrbImage.onload = () => {
      if (chosenArtistId !== selectionArtistId) return;
      artistOrbImage.hidden = false;
      artistOrbFallback.hidden = true;
    };
    artistOrbImage.onerror = () => {
      if (chosenArtistId !== selectionArtistId) return;
      artistOrbImage.hidden = true;
      artistOrbFallback.hidden = false;
    };
    artistOrbImage.src = chosenArtist.profileImage;
    artistOrbLink.href = chosenArtist.spotifyUrl;
    artistOrbLink.setAttribute("aria-label", "Open " + chosenArtist.name + " profile on Spotify");
    artistProfileLink.href = chosenArtist.spotifyUrl;
    $("artist-label").textContent = chosenArtist.name.toUpperCase();
    gameCard.dataset.artist = artistId;
    closeSuggestions();
    guessInput.value = "";
    updateSongInputArtwork(null);
    setControls();

    const cached = catalogCache.get(artistId);
    if (cached) {
      catalog = cached;
      playable = cached;
      startButton.disabled = false;
      startButton.textContent = "Start game →";
      setCatalogAttribution(chosenArtist);
      setFeedback("Ready to play " + chosenArtist.name + ". Choose a difficulty, then start.");
      return;
    }

    catalog = [];
    playable = [];
    startButton.disabled = true;
    startButton.textContent = "Loading songs…";
    audioNote.textContent = "Loading songs for " + chosenArtist.name + "…";
    setFeedback("Loading the " + chosenArtist.name + " song list…");
    loadCatalog(artistId).then((tracks) => {
      if (chosenArtistId !== selectionArtistId || gameStarted) return;
      catalog = tracks;
      playable = tracks;
      startButton.disabled = false;
      startButton.textContent = "Start game →";
      setCatalogAttribution(chosenArtist);
      setFeedback("Ready to play " + chosenArtist.name + ". Choose a difficulty, then start.");
    }).catch((error) => {
      if (chosenArtistId !== selectionArtistId || gameStarted) return;
      startButton.disabled = false;
      startButton.textContent = "Retry loading songs ↻";
      audioNote.textContent = "Track previews depend on third-party catalog availability in your region.";
      setFeedback(error.message || "Could not load songs. Try again.", "error");
    });
  }

  function setCatalogAttribution(artistConfig) {
    audioNote.replaceChildren();
    const attribution = document.createElement("span");
    attribution.textContent = "Track metadata and available previews by Apple Music/iTunes. ";
    const link = document.createElement("a");
    link.href = artistConfig.appleArtistUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open " + artistConfig.name + " on Apple Music";
    audioNote.append(attribution, link);
  }

  function closeSuggestions() {
    suggestionBox.hidden = true;
    guessInput.setAttribute("aria-expanded", "false");
    activeSuggestionIndex = -1;
    suggestionBox.querySelectorAll(".song-suggestion").forEach((button) => button.classList.remove("active"));
  }

  function chooseSuggestion(track) {
    if (!track) return;
    guessInput.value = track.title;
    updateSongInputArtwork(track);
    closeSuggestions();
    guessInput.focus();
  }

  function updateSongInputArtwork(track) {
    if (!track || !track.artworkUrl) {
      songInputArt.hidden = true;
      picker.classList.remove("has-preview");
      return;
    }
    songInputArtImage.onerror = () => {
      songInputArt.hidden = true;
      picker.classList.remove("has-preview");
    };
    songInputArtImage.src = track.artworkUrl;
    songInputArt.hidden = false;
    picker.classList.add("has-preview");
  }

  function renderSuggestions() {
    const query = normalize(guessInput.value);
    suggestionBox.replaceChildren();
    activeSuggestionIndex = -1;
    if (guessInput.disabled || query.length < 2) {
      closeSuggestions();
      updateSongInputArtwork(null);
      return;
    }

    const matches = playable
      .filter((track) => normalize(track.title).includes(query))
      .sort((a, b) => {
        const aTitle = normalize(a.title);
        const bTitle = normalize(b.title);
        const aPrefix = aTitle.startsWith(query) ? 0 : 1;
        const bPrefix = bTitle.startsWith(query) ? 0 : 1;
        return aPrefix - bPrefix || aTitle.localeCompare(bTitle);
      })
      .slice(0, 8);

    updateSongInputArtwork(matches[0] || null);
    if (!matches.length) {
      closeSuggestions();
      return;
    }

    matches.forEach((track) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "song-suggestion";
      button.dataset.trackId = track.id;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");

      if (track.artworkUrl) {
        const image = document.createElement("img");
        image.className = "song-suggestion__art";
        image.alt = "";
        image.loading = "lazy";
        image.src = track.artworkUrl;
        image.onerror = () => { image.hidden = true; };
        button.append(image);
      } else {
        const fallback = document.createElement("span");
        fallback.className = "song-suggestion__fallback";
        fallback.textContent = "♫";
        button.append(fallback);
      }

      const title = document.createElement("span");
      title.className = "song-suggestion__title";
      title.textContent = track.title;
      const album = document.createElement("small");
      album.textContent = track.album || chosenArtist.name;
      const copy = document.createElement("span");
      copy.className = "song-suggestion__copy";
      copy.append(title, album);
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

  function enhanceArtwork(url) {
    if (!url) return "";
    // Apple commonly returns 100x100 artwork; request a larger rendition when that URL pattern is present.
    return url.replace(/\b100x100bb\b/i, "600x600bb").replace(/\b100x100\b/i, "600x600");
  }

  function deduplicateTracks(tracks, artistConfig = chosenArtist) {
    const groups = new Map();
    for (const raw of tracks) {
      const title = String(raw.trackName || "").trim();
      const id = String(raw.trackId || "");
      if (!id || !title) continue;
      const candidate = {
        id,
        title,
        album: raw.collectionName || "",
        artist: raw.artistName || artistConfig.name,
        previewUrl: raw.previewUrl || "",
        artworkUrl: enhanceArtwork(raw.artworkUrl100 || raw.artworkUrl60 || ""),
        storeUrl: raw.trackViewUrl || raw.collectionViewUrl || artistConfig.appleArtistUrl || artistConfig.spotifyUrl,
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
      const clean = group.filter((track) => !isAlternateVersion(track.raw, artistConfig));
      if (!clean.length) continue;
      clean.sort((a, b) => trackQuality(b.raw, artistConfig) - trackQuality(a.raw, artistConfig));
      unique.push(clean[0]);
    }
    return unique.sort((a, b) => a.title.localeCompare(b.title));
  }

  async function loadCatalog(artistId = chosenArtistId) {
    const artistConfig = ARTISTS[artistId];
    if (!artistConfig) throw new Error("Choose a supported artist.");
    const cached = catalogCache.get(artistId);
    if (cached) return cached;
    const pending = catalogPromises.get(artistId);
    if (pending) return pending;

    const request = (async () => {
      const results = await appleSearch(artistConfig.searchTerm);
      const tracks = Array.isArray(results.results) ? results.results : [];
      const acceptedNames = (artistConfig.artistAliases || [artistConfig.name]).map(normalize);
      const artistMatches = tracks.filter((track) => acceptedNames.includes(normalize(track.artistName)));
      const uniqueTracks = deduplicateTracks(artistMatches, artistConfig);
      if (!uniqueTracks.length) {
        throw new Error("No playable songs were returned for " + artistConfig.name + ". Try reloading the catalog.");
      }
      catalogCache.set(artistId, uniqueTracks);
      return uniqueTracks;
    })();

    catalogPromises.set(artistId, request);
    try {
      return await request;
    } finally {
      if (catalogPromises.get(artistId) === request) catalogPromises.delete(artistId);
    }
  }

  function getDifficultyPool() {
    const easyTitles = new Set(chosenArtist.easyTitles.map(normalize));
    const hits = playable.filter((track) => easyTitles.has(normalize(track.title)));
    const deeperCuts = playable.filter((track) => !easyTitles.has(normalize(track.title)));

    if (chosenDifficulty === "easy") return hits;
    if (chosenDifficulty === "hard") return deeperCuts;

    // Medium deliberately combines hits and deeper cuts where possible.
    const mediumTarget = Math.min(playable.length, Math.max(roundsPerGame, Math.ceil(playable.length * 0.6)));
    const medium = shuffle(hits).slice(0, Math.ceil(mediumTarget / 2))
      .concat(shuffle(deeperCuts).slice(0, Math.floor(mediumTarget / 2)));
    return medium.length >= roundsPerGame ? medium : playable;
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function refreshClipTimeline(isPlaying = false) {
    const stage = clipStages[clipStageIndex] || clipStages[0];
    const width = Math.max(0, Math.min(100, (stage.seconds / 5) * 100));
    clipProgressbar.setAttribute("aria-valuenow", String(stage.label));
    clipProgressbar.style.setProperty("--clip-end-width", width + "%");
    clipProgressbar.style.setProperty("--clip-duration", stage.seconds + "s");
    clipProgressbar.classList.remove("is-playing");
    clipProgress.style.width = isPlaying ? "0%" : width + "%";
    clipMarkers.forEach((marker, index) => {
      marker.classList.toggle("active", index === clipStageIndex);
      marker.classList.toggle("unlocked", index < clipStageIndex);
    });
    if (isPlaying) {
      void clipProgressbar.offsetWidth;
      clipProgressbar.classList.add("is-playing");
    }
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
    refreshClipTimeline(false);
    playButton.disabled = !currentTrack;
    return playbackToken;
  }

  function setAudioTrack(track) {
    if (audio.src !== track.previewUrl) {
      audio.src = track.previewUrl;
      audio.load();
    }
  }

  function playSnippet(seconds = clipSeconds) {
    if (!currentTrack || !currentTrack.previewUrl) return;
    const isAnswerReplay = roundSolved;
    const token = stopAudio();
    setAudioTrack(currentTrack);
    const stage = clipStages[clipStageIndex] || clipStages[0];
    clipLabel.textContent = isAnswerReplay ? "ANSWER PREVIEW" :
      (clipStageIndex === 0 ? "YOUR FIRST CLIP" : "CLIP REVEALED · " + stage.label + " SECONDS");
    stageCaption.textContent = isAnswerReplay
      ? "Playing the 8-second answer preview…"
      : "Playing the " + stage.label + "-second clip…";
    waveform.classList.add("playing");
    refreshClipTimeline(true);
    playButton.disabled = true;
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Playing…';
    playButton.dataset.answerReplay = isAnswerReplay ? "true" : "false";

    const failPlayback = () => {
      if (token !== playbackToken) return;
      if (previewTimer) window.clearTimeout(previewTimer);
      previewTimer = null;
      waveform.classList.remove("playing");
      refreshClipTimeline(false);
      stageCaption.textContent = "This preview could not be played.";
      setFeedback("This preview is unavailable. Try replaying or skip to reveal another section.", "error");
      playButton.disabled = false;
      playButton.innerHTML = '<span aria-hidden="true">▶</span> Try again';
    };
    const startAt = () => {
      if (token !== playbackToken || !currentTrack) return;
      try { audio.currentTime = 0; } catch (_) {}
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") playback.catch(failPlayback);
      previewTimer = window.setTimeout(() => {
        if (token !== playbackToken) return;
        audio.pause();
        previewTimer = null;
        waveform.classList.remove("playing");
        refreshClipTimeline(false);
        stageCaption.textContent = isAnswerReplay
          ? "Preview finished. Continue to the next song when ready."
          : "Clip finished. Make your guess or listen again.";
        playButton.disabled = false;
        playButton.innerHTML = isAnswerReplay
          ? '<span aria-hidden="true">▶</span> Replay 8 seconds'
          : '<span aria-hidden="true">▶</span> Replay ' + stage.label + " second" + (stage.label === 1 ? "" : "s");
      }, (isAnswerReplay ? answerPlaybackSeconds : seconds) * 1000);
    };

    if (audio.readyState >= 1) startAt();
    else {
      audio.addEventListener("loadedmetadata", startAt, {once: true});
      audio.addEventListener("error", failPlayback, {once: true});
    }
  }


  function showAnswerDetails() {
    guessForm.hidden = true;
    answerReveal.hidden = false;
    answerReveal.classList.remove("is-autoplaying");
    $("answer-title").textContent = currentTrack.title;
    $("answer-artist").textContent = currentTrack.artist || "Imagine Dragons";
    $("answer-album").textContent = currentTrack.album ? "From " + currentTrack.album : "Album information unavailable";
    $("answer-store-link").href = currentTrack.storeUrl;

    const artwork = $("answer-artwork");
    const fallback = $("answer-artwork-fallback");
    fallback.hidden = true;
    artwork.hidden = false;
    artwork.alt = "Cover artwork for " + currentTrack.title;
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

  }

  function playAnswerThenAdvance() {
    const token = stopAudio();
    setAudioTrack(currentTrack);
    autoAdvanceBox.hidden = false;
    autoAdvanceMessage.textContent = "Continuing from the clip for 8 seconds…";
    autoAdvanceCountdown.textContent = String(answerPlaybackSeconds).padStart(2, "0");
    autoAdvanceProgress.style.animation = "none";
    void autoAdvanceProgress.offsetWidth;
    autoAdvanceProgress.style.animation = "";
    answerReveal.classList.add("is-autoplaying");
    clipLabel.textContent = "ANSWER REVEALED";
    stageCaption.textContent = "The song continues just before where your clip ended.";
    playButton.disabled = true;
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Playing answer…';
    playButton.dataset.answerReplay = "false";
    waveform.classList.add("playing");

    let timersStarted = false;
    const startCountdown = () => {
      if (timersStarted || token !== playbackToken) return;
      timersStarted = true;
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

    const startAt = () => {
      if (token !== playbackToken || !currentTrack) return;
      // Overlap the end of the guessing clip by 0.4 seconds so the reveal flows into the song.
      const resumeAt = Math.max(0, clipSeconds - 0.4);
      try { audio.currentTime = resumeAt; } catch (_) {}
      const playback = audio.play();
      if (playback && typeof playback.then === "function") {
        playback.then(() => {
          if (token === playbackToken) startCountdown();
        }).catch(() => {
          if (token !== playbackToken) return;
          autoAdvanceMessage.textContent = "Preview unavailable — moving to the next song shortly…";
          startCountdown();
        });
      } else {
        startCountdown();
      }
    };

    if (audio.readyState >= 1) {
      startAt();
    } else {
      audio.addEventListener("loadedmetadata", startAt, {once: true});
      audio.addEventListener("error", () => {
        if (token !== playbackToken) return;
        autoAdvanceMessage.textContent = "Preview unavailable — moving to the next song shortly…";
        startCountdown();
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
    clipStageIndex = 0;
    clipSeconds = initialClipSeconds;
    roundSolved = false;
    answerReveal.hidden = true;
    answerReveal.classList.remove("is-autoplaying");
    guessForm.hidden = false;
    gameCard.classList.add("is-playing");
    updateSongInputArtwork(null);
    roundChip.textContent = "ROUND " + (roundIndex + 1) + " / " + roundsPerGame;
    clipLabel.textContent = "YOUR FIRST CLIP";
    stageCaption.textContent = "Ready when you are.";
    attemptCount.textContent = "Clip: 1 second";
    guessInput.value = "";
    closeSuggestions();
    setAudioTrack(currentTrack);
    refreshClipTimeline(false);
    setControls({guess: true, skip: true, play: true});
    nextButton.hidden = true;
    nextButton.textContent = "Skip to next song →";
    startButton.hidden = true;
    setFeedback("Listen to the snippet, then type your guess.");
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Play 1 second';
    playButton.dataset.answerReplay = "false";
    skipButton.innerHTML = 'Skip to 2 sec <span aria-hidden="true">→</span>';
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
    // A wrong guess should not interrupt or disable the audio preview.
  }

  function solveRound(won) {
    if (roundSolved) return;
    roundSolved = true;
    roundsPlayed = Math.max(roundsPlayed, roundIndex + 1);
    stopAudio();
    closeSuggestions();
    setControls();
    const basePoints = [100, 60, 40, 20][clipStageIndex] || 20;
    const difficultyMultiplier = {easy: 1, medium: 1.5, hard: 2}[chosenDifficulty];
    const points = won ? Math.round(basePoints * difficultyMultiplier) : 0;
    if (won) {
      score += points;
      streak += 1;
      scoreLabel.textContent = String(score);
      streakLabel.textContent = String(streak);
      setFeedback("Correct — “" + currentTrack.title + "”! +" + points + " points", "success");
      clipLabel.textContent = "YOU GOT IT";
      stageCaption.textContent = "Song identified. Nice ears!";
    } else {
      setFeedback("The song was “" + currentTrack.title + "”.", "error");
      clipLabel.textContent = "ANSWER REVEALED";
      stageCaption.textContent = "Keep going — the next song is waiting.";
    }
    showAnswerDetails();
    nextButton.hidden = false;
    nextButton.textContent = won ? "Skip song →" : "Next song →";
    if (won) {
      playButton.dataset.answerReplay = "false";
      playAnswerThenAdvance();
    } else {
      autoAdvanceBox.hidden = true;
      // Wrong answers reveal the song and offer the full preview on demand.
      playButton.disabled = false;
      playButton.innerHTML = '<span aria-hidden="true">▶</span> Play 8-second preview';
      playButton.dataset.answerReplay = "true";
      stageCaption.textContent = "Hear the full 8-second preview, then continue when ready.";
      nextButton.focus({preventScroll: true});
    }
  }

  function skipSong() {
    if (!currentTrack || roundSolved) return;
    if (clipStageIndex >= clipStages.length - 1) {
      solveRound(false);
      return;
    }
    clipStageIndex += 1;
    clipSeconds = clipStages[clipStageIndex].seconds;
    const label = clipStages[clipStageIndex].label;
    attemptCount.textContent = "Clip: " + label + " seconds";
    clipLabel.textContent = "CLIP REVEALED · " + label + " SECONDS";
    stageCaption.textContent = "Now you can hear " + label + " seconds.";
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Play ' + label + " second" + (label === 1 ? "" : "s");
    skipButton.innerHTML = clipStageIndex >= clipStages.length - 1
      ? 'Reveal song <span aria-hidden="true">→</span>'
      : 'Skip to ' + clipStages[clipStageIndex + 1].label + ' sec <span aria-hidden="true">→</span>';
    refreshClipTimeline(false);
    setFeedback("More audio revealed. Try to identify the song in " + label + " seconds.");
    stopAudio();
    setControls({guess: true, skip: true, play: true});
  }

  function finishGame() {
    gameStarted = false;
    startingGame = false;
    stopAudio();
    gameCard.classList.remove("is-playing");
    setControls();
    closeSuggestions();
    artistButtons.forEach((button) => { button.disabled = false; });
    difficultyButtons.forEach((button) => { button.disabled = false; });
    artistPicker.hidden = false;
    difficultyPicker.hidden = false;
    if (preGameControls) preGameControls.hidden = false;
    gameCard.removeAttribute("data-difficulty");
    startButton.hidden = false;
    startButton.disabled = !catalogCache.has(chosenArtistId);
    startButton.textContent = catalogCache.has(chosenArtistId) ? "Start game →" : "Retry loading songs ↻";
    nextButton.hidden = true;
    roundChip.textContent = "GAME COMPLETE";
    resultsCopy.textContent = "You scored " + score + " points across " + roundsPlayed + " rounds. Ready for another run?";
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

  async function startGame() {
    if (gameStarted || startingGame) return;
    startingGame = true;
    const requestToken = ++startRequestToken;
    const artistId = chosenArtistId;
    startButton.disabled = true;
    startButton.textContent = "Loading songs…";

    try {
      const songs = await loadCatalog(artistId);
      if (requestToken !== startRequestToken || artistId !== chosenArtistId) return;
      catalog = songs;
      playable = songs;

        const pool = getDifficultyPool();
      if (pool.length < roundsPerGame) {
        setFeedback(
          "Only " + pool.length + " playable songs are available in " + chosenDifficulty +
          " for " + chosenArtist.name + ". Try another difficulty or artist; the game won't silently mix difficulty pools.",
          "error"
        );
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
      artistPicker.hidden = true;
      difficultyPicker.hidden = true;
      if (preGameControls) preGameControls.hidden = true;
      gameCard.classList.add("is-playing");
      gameCard.dataset.difficulty = chosenDifficulty;
      guessForm.hidden = false;
      answerReveal.hidden = true;
      artistButtons.forEach((button) => { button.disabled = true; });
      difficultyButtons.forEach((button) => { button.disabled = true; });
      skipButton.innerHTML = 'Skip to 2 sec <span aria-hidden="true">→</span>';
      startRound();
    } catch (error) {
      if (requestToken === startRequestToken && artistId === chosenArtistId) {
        setFeedback(error.message || "Could not load the song list. Please retry.", "error");
      }
    } finally {
      if (requestToken === startRequestToken) {
        startingGame = false;
        if (!gameStarted && artistId === chosenArtistId) {
          startButton.disabled = false;
          startButton.textContent = catalogCache.has(artistId) ? "Start game →" : "Retry loading songs ↻";
        }
      }
    }
  }

  artistButtons.forEach((button) => {
    const image = button.querySelector("img");
    if (image) image.addEventListener("error", () => { button.classList.add("image-unavailable"); });
    button.addEventListener("click", () => selectArtist(button.dataset.artist));
  });
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
        const selectedTrack = playable.find((track) => track.id === options[activeSuggestionIndex].dataset.trackId);
        if (selectedTrack) chooseSuggestion(selectedTrack);
        else closeSuggestions();
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
    gameStarted = false;
    artistButtons.forEach((button) => { button.disabled = false; });
    difficultyButtons.forEach((button) => { button.disabled = false; });
    artistPicker.hidden = false;
    difficultyPicker.hidden = false;
    gameCard.removeAttribute("data-difficulty");
    startButton.hidden = false;
    startButton.disabled = !catalogCache.has(chosenArtistId);
    startButton.textContent = catalogCache.has(chosenArtistId) ? "Start game →" : "Loading songs…";
    guessForm.hidden = false;
    answerReveal.hidden = true;
    setControls();
    selectArtist(chosenArtistId);
    setFeedback("Choose an artist and difficulty, then start a new run.");
  });
  audio.addEventListener("ended", () => {
    if (previewTimer) window.clearTimeout(previewTimer);
    previewTimer = null;
    waveform.classList.remove("playing");
    if (!roundSolved) {
      waveform.classList.remove("playing");
      refreshClipTimeline(false);
      playButton.disabled = false;
      playButton.innerHTML = '<span aria-hidden="true">▶</span> Replay ' + clipStages[clipStageIndex].label + " second" + (clipStages[clipStageIndex].label === 1 ? "" : "s");
    }
  });

  skipButton.innerHTML = 'Skip to 2 sec <span aria-hidden="true">→</span>';
  refreshClipTimeline(false);
  selectArtist("imagine-dragons");
})();