// script.js
(() => {
  // --- AUTOMATIC CACHE WIPE (UPGRADE TO V3) ---
  const CURRENT_VERSION = "v3.0";
  if (localStorage.getItem("wordle-version") !== CURRENT_VERSION) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("wordle-")) localStorage.removeItem(key);
    });
    localStorage.setItem("wordle-version", CURRENT_VERSION);
    window.location.reload(true);
    return;
  }

  // --- SUPABASE CONFIGURATION ---
  const supabaseUrl = 'https://hcehsxnudbwjydvenlfz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZWhzeG51ZGJ3anlkdmVubGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzY4NzAsImV4cCI6MjA5MDY1Mjg3MH0.dPawhX90yZrme7nftMTq6A1j-KGqfHZJ8QnbBeFurl8';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const WORD_SOURCE = "supabase";
  const GUESS_SCALE = 10;
  const launchDate = Date.UTC(2026, 3, 1);
  
  // Elements
  const boardEl = document.getElementById("board");
  const keyboardEl = document.getElementById("keyboard");
  const messageEl = document.getElementById("message");
  const metaLineEl = document.getElementById("meta-line");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const hintButton = document.getElementById("hint-button");
  const hintBadge = document.getElementById("hint-badge");
  const modal = document.getElementById("end-modal");
  const endTitle = document.getElementById("end-title");
  const countdownEl = document.getElementById("countdown");
  const closeModal = document.getElementById("close-modal");
  const usernameInput = document.getElementById("username-input");
  const passwordInput = document.getElementById("password-input"); 
  const leaderboardBtn = document.getElementById("leaderboard-button");
  const leaderboardModal = document.getElementById("leaderboard-modal");
  const closeLeaderboardBtn = document.getElementById("close-leaderboard");
  const usernameView = document.getElementById("username-view");
  const statsView = document.getElementById("stats-view");
  const saveUsernameBtn = document.getElementById("save-username-btn");
  const usernameError = document.getElementById("username-error");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const lbLoading = document.getElementById("lb-loading");
  const lbList = document.getElementById("lb-list");

  // Game State
  const wordCache = {};
  const today = new Date();
  const localDateAsUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysPassed = Math.max(0, Math.floor((localDateAsUTC - launchDate) / 86400000));
  const solutionIndex = daysPassed;
  const userKey = "wordle-user-data-v2";
  const storageKey = `wordle-mobile-${solutionIndex}`;

  let solution = "";
  let wordCategory = "";
  let wordLength = 0;
  let maxRows = 0;
  let currentRow = 0;
  let currentGuess = "";
  let boardState = [];
  let gameOver = false;
  let isSubmitting = false;
  let hintsUsed = 0;
  let hasSubmittedToLeaderboard = false;
  let saveTimeout = null; // For debouncing cloud saves

  // Conflict resolution: track the latest timestamp of the game state
  let lastUpdatedAt = 0; // milliseconds

  // --- UTILS ---
  function generateUUID() { return crypto.randomUUID(); }
  function getUserData() {
    let data = localStorage.getItem(userKey);
    if (!data) {
      data = { uuid: generateUUID(), username: null };
      localStorage.setItem(userKey, JSON.stringify(data));
    } else { data = JSON.parse(data); }
    return data;
  }

  // --- CORE LOGIC ---
  async function fetchTodaysWord() {
    if (WORD_SOURCE === "supabase") {
      try {
        const { data, error } = await supabase.from('words').select('word, category').eq('day_index', solutionIndex).single();
        if (error) throw error;
        solution = data.word.toUpperCase();
        wordCategory = data.category;
      } catch (err) {
        solution = "CEDAR"; wordCategory = "Lebanon";
      }
    }
    wordLength = solution.length;
    maxRows = wordLength <= 5 ? 6 : wordLength + 1;
  }

  // --- SYNC ENGINE ---
  function setupRealtimeSync(uuid) {
    supabase
      .channel('any')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leaderboards', filter: `uuid=eq.${uuid}` }, payload => {
        const cloudState = payload.new.daily_state;
        if (cloudState && cloudState.solutionIndex === solutionIndex) {
          // Only apply if cloud state is newer
          if (cloudState.updatedAt && cloudState.updatedAt > lastUpdatedAt) {
            syncWithCloudState(cloudState);
          }
        }
      })
      .subscribe();
  }

  // Apply cloud state to local game (overwrites everything)
  function syncWithCloudState(cloudState) {
    // Prevent any ongoing submission
    isSubmitting = true;
    // Update local variables
    currentRow = Math.min(cloudState.currentRow ?? 0, maxRows - 1);
    currentGuess = typeof cloudState.currentGuess === "string" ? cloudState.currentGuess : "";
    gameOver = Boolean(cloudState.gameOver);
    boardState = Array.from({ length: maxRows }, (_, i) => cloudState.boardState?.[i] ?? null);
    hintsUsed = cloudState.hintsUsed || 0;
    hasSubmittedToLeaderboard = cloudState.hasSubmittedToLeaderboard || false;
    lastUpdatedAt = cloudState.updatedAt || 0;

    // Re-render UI completely
    restoreBoard();
    updateBoard();
    updateKeyboardColorsFromBoard();
    updateHintBadge();

    // If game ended, show appropriate modal (but only if not already shown)
    if (gameOver) {
      showMessage(cloudState.won ? "Solved!" : `The word was ${solution}`);
      showEndModal(Boolean(cloudState.won));
    } else {
      // Close any open modal if game restarted
      modal.classList.add("hidden");
    }

    // Re-enable submissions after sync
    isSubmitting = false;
  }

  // --- SAVE STATE (with timestamp) ---
  async function saveState(won = null) {
    const state = {
      solutionIndex,
      currentRow,
      currentGuess,
      gameOver,
      won,
      boardState,
      hintsUsed,
      hasSubmittedToLeaderboard,
      updatedAt: Date.now()   // important for conflict resolution
    };
    localStorage.setItem(storageKey, JSON.stringify(state));

    const userData = getUserData();
    if (userData.username) {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        // Only update if we haven't been overwritten by a newer cloud state
        if (state.updatedAt >= lastUpdatedAt) {
          const { error } = await supabase
            .from('leaderboards')
            .update({ daily_state: state, updated_at: new Date().toISOString() })
            .eq('uuid', userData.uuid);
          if (error) console.warn('Cloud save failed', error);
        }
      }, 250);
    }
  }

  // --- LOAD STATE (from local or cloud) ---
  function loadState() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      // Ensure we have an updatedAt for compatibility
      if (!parsed.updatedAt) parsed.updatedAt = 0;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  // --- MAIN INITIALISATION ---
  fetchTodaysWord().then(async () => {
    boardState = Array.from({ length: maxRows }, () => null);
    let savedState = loadState();
    const userData = getUserData();

    // Attempt to fetch cloud state if logged in
    if (userData.username) {
      const { data: cloudRecord } = await supabase
        .from('leaderboards')
        .select('daily_state')
        .eq('uuid', userData.uuid)
        .maybeSingle();
      if (cloudRecord?.daily_state?.solutionIndex === solutionIndex) {
        // Compare timestamps and use the newest one
        const cloudState = cloudRecord.daily_state;
        const cloudTime = cloudState.updatedAt || 0;
        const localTime = savedState?.updatedAt || 0;
        if (cloudTime > localTime) {
          savedState = cloudState;
        }
      }
      setupRealtimeSync(userData.uuid); // start listening
    }

    // Apply the chosen state
    if (savedState && savedState.solutionIndex === solutionIndex) {
      currentRow = Math.min(savedState.currentRow ?? 0, maxRows - 1);
      currentGuess = typeof savedState.currentGuess === "string" ? savedState.currentGuess : "";
      gameOver = Boolean(savedState.gameOver);
      boardState = Array.from({ length: maxRows }, (_, i) => savedState.boardState?.[i] ?? null);
      hintsUsed = savedState.hintsUsed || 0;
      hasSubmittedToLeaderboard = savedState.hasSubmittedToLeaderboard || false;
      lastUpdatedAt = savedState.updatedAt || 0;
    } else {
      lastUpdatedAt = 0;
    }

    setupTheme();
    setMetaText();
    buildBoard();
    buildKeyboard();
    restoreBoard();
    updateBoard();
    updateKeyboardColorsFromBoard();
    updateHintBadge();
    bindEvents();
    if (gameOver) showEndModal(Boolean(savedState?.won));
  });

  // --- UI/RENDER (unchanged except for the sync adjustments) ---
  function setMetaText() {
    metaLineEl.textContent = `${wordLength} letters · ${maxRows} tries`;
    boardEl.style.setProperty("--word-length", wordLength);
  }

  function setupTheme() {
    const savedTheme = localStorage.getItem("wordle-mobile-theme") || "dark";
    setTheme(savedTheme);
    themeToggle.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem("wordle-mobile-theme", next);
    });
  }

  function setTheme(t) {
    document.body.dataset.theme = t;
    themeIcon.innerHTML = t === "dark" ? sunIcon() : moonIcon();
  }

  function moonIcon() { return `<path d="M20 13.2A7.8 7.8 0 0 1 10.8 4a8.8 8.8 0 1 0 9.2 9.2Z"></path>`; }
  function sunIcon() { return `<circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.8v2.3"></path><path d="M12 18.9v2.3"></path><path d="M2.8 12h2.3"></path><path d="M18.9 12h2.3"></path><path d="M4.6 4.6l1.6 1.6"></path><path d="M17.8 17.8l1.6 1.6"></path><path d="M19.4 4.6l-1.6 1.6"></path><path d="M6.2 17.8l-1.6 1.6"></path>`; }

  function buildBoard() {
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--tile-size", computeTileSize() + "px");
    for (let r = 0; r < maxRows; r++) {
      const row = document.createElement("div");
      row.className = "row";
      for (let c = 0; c < wordLength; c++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.id = `tile-${r}-${c}`;
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function computeTileSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const widthFit = (vw - 40) / wordLength;
    const heightFit = (vh * 0.4) / maxRows;
    return Math.min(58, Math.floor(Math.min(widthFit, heightFit)));
  }

  function buildKeyboard() {
    keyboardEl.innerHTML = "";
    const rows = [["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["ENTER","Z","X","C","V","B","N","M","⌫"]];
    rows.forEach(letters => {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      letters.forEach(letter => {
        const btn = document.createElement("button");
        btn.className = "key" + (letter.length > 1 ? " wide" : "");
        btn.id = `key-${letter}`;
        btn.textContent = letter;
        btn.onclick = () => handleKey(letter);
        row.appendChild(btn);
      });
      keyboardEl.appendChild(row);
    });
  }

  function restoreBoard() {
    for (let r = 0; r < maxRows; r++) {
      const rowData = boardState[r];
      if (!rowData) {
        for (let c = 0; c < wordLength; c++) {
          const t = document.getElementById(`tile-${r}-${c}`);
          if (t) { t.textContent = ""; t.className = "tile"; t.style.borderColor = ""; }
        }
        continue;
      }
      for (let c = 0; c < wordLength; c++) {
        const tile = document.getElementById(`tile-${r}-${c}`);
        if (!tile) continue;
        tile.textContent = rowData.guess[c] || "";
        tile.className = `tile filled ${rowData.colors[c]}`;
        if (rowData.colors[c]) { tile.style.borderColor = "transparent"; tile.style.color = "#fff"; }
      }
    }
  }

  function updateBoard() {
    for (let c = 0; c < wordLength; c++) {
      const tile = document.getElementById(`tile-${currentRow}-${c}`);
      if (!tile) continue;
      tile.textContent = currentGuess[c] || "";
      tile.classList.toggle("filled", !!currentGuess[c]);
    }
  }

  // --- ACTIONS (with conflict prevention) ---
  async function handleKey(key) {
    // Block if game over or currently submitting/syncing
    if (gameOver || isSubmitting) return;
    // If the cloud state has moved beyond the current row (e.g., row already filled), block
    if (boardState[currentRow] !== null) {
      showMessage("This row is already solved on another device.");
      return;
    }

    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫") { currentGuess = currentGuess.slice(0, -1); }
    else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) { currentGuess += key; }
    updateBoard();
    saveState(); // debounced
  }

  async function submitGuess() {
    if (gameOver || isSubmitting) return;
    if (currentGuess.length !== wordLength) return;

    // Double-check that the row is still empty (sync might have filled it)
    if (boardState[currentRow] !== null) {
      showMessage("This row is already taken on another device.");
      return;
    }

    isSubmitting = true;
    const guess = currentGuess.toUpperCase();
    const valid = await isValidWord(guess.toLowerCase());
    if (!valid) { showMessage("Not a word"); isSubmitting = false; return; }

    const colors = getTileColors(guess, solution);
    // Update local state immediately to prevent double submissions
    boardState[currentRow] = { guess, colors };
    animateFlip(currentRow, guess, colors);

    setTimeout(() => {
      if (guess === solution) {
        gameOver = true;
        updateUserStats(true, currentRow + 1, hintsUsed);
        saveState(true);
        showEndModal(true);
      } else {
        currentRow++;
        currentGuess = "";
        if (currentRow >= maxRows) {
          gameOver = true;
          updateUserStats(false, maxRows, hintsUsed);
          saveState(false);
          showEndModal(false);
        } else {
          saveState();
        }
      }
      isSubmitting = false;
    }, wordLength * 250);
  }

  function getTileColors(g, s) {
    const sol = s.split("");
    const res = Array(wordLength).fill("absent");
    for (let i = 0; i < wordLength; i++) if (g[i] === sol[i]) { res[i] = "correct"; sol[i] = null; }
    for (let i = 0; i < wordLength; i++) if (res[i] !== "correct" && sol.includes(g[i])) { res[i] = "present"; sol[sol.indexOf(g[i])] = null; }
    return res;
  }

  function animateFlip(r, g, colors) {
    for (let i = 0; i < wordLength; i++) {
      const t = document.getElementById(`tile-${r}-${i}`);
      setTimeout(() => {
        t.classList.add("flip");
        setTimeout(() => {
          t.className = `tile filled ${colors[i]}`;
          t.style.borderColor = "transparent";
          t.style.color = "#fff";
          updateKeyboardColor(g[i], colors[i]);
        }, 250);
      }, i * 200);
    }
  }

  // --- HELPER FUNCTIONS (unchanged) ---
  async function isValidWord(word) {
    try {
      const { data } = await supabase.from('words').select('word').eq('word', word).maybeSingle();
      return !!data;
    } catch { return true; }
  }

  function showMessage(msg, isError = true) {
    messageEl.textContent = msg;
    messageEl.classList.add("visible");
    setTimeout(() => messageEl.classList.remove("visible"), 2000);
  }

  function updateKeyboardColorsFromBoard() {
    const keyMap = new Map();
    for (let r = 0; r <= currentRow; r++) {
      const row = boardState[r];
      if (!row) continue;
      for (let i = 0; i < row.guess.length; i++) {
        const letter = row.guess[i];
        const color = row.colors[i];
        const existing = keyMap.get(letter);
        if (!existing || (existing === "correct") || (existing === "present" && color === "correct")) {
          keyMap.set(letter, color);
        }
      }
    }
    for (const [letter, color] of keyMap.entries()) {
      const btn = document.getElementById(`key-${letter}`);
      if (btn) btn.classList.add(color);
    }
  }

  function updateKeyboardColor(letter, color) {
    const btn = document.getElementById(`key-${letter}`);
    if (!btn) return;
    const current = btn.classList;
    if (color === "correct") current.add("correct");
    else if (color === "present" && !current.contains("correct")) current.add("present");
    else if (color === "absent" && !current.contains("correct") && !current.contains("present")) current.add("absent");
  }

  function updateHintBadge() {
    const remaining = 2 - hintsUsed;
    hintBadge.textContent = remaining;
    if (remaining === 0) hintBadge.classList.add("empty");
    else hintBadge.classList.remove("empty");
  }

  async function showHint() {
    if (gameOver) return;
    if (hintsUsed >= 2) { showMessage("No hints left!"); return; }
    hintsUsed++;
    updateHintBadge();
    saveState();

    // Find all letters not yet revealed
    const letters = solution.split('');
    const used = new Set();
    for (let i = 0; i <= currentRow; i++) {
      const row = boardState[i];
      if (row) row.guess.split('').forEach(l => used.add(l));
    }
    const missing = letters.filter(l => !used.has(l));
    const hintLetter = missing.length ? missing[0] : letters[0];
    showMessage(`Hint: the word contains the letter "${hintLetter}".`, false);
  }

  async function updateUserStats(won, guessesUsed, hints) {
    const userData = getUserData();
    if (!userData.username) return;

    const { data: stats } = await supabase
      .from('leaderboards')
      .select('total_guesses, games_played, winstreak, max_winstreak, total_hints')
      .eq('uuid', userData.uuid)
      .single();

    let newTotalGuesses = (stats?.total_guesses || 0) + guessesUsed;
    let newGamesPlayed = (stats?.games_played || 0) + 1;
    let newWinstreak = won ? (stats?.winstreak || 0) + 1 : 0;
    let newMaxWinstreak = Math.max(stats?.max_winstreak || 0, newWinstreak);
    let newTotalHints = (stats?.total_hints || 0) + hints;

    await supabase
      .from('leaderboards')
      .update({
        total_guesses: newTotalGuesses,
        games_played: newGamesPlayed,
        winstreak: newWinstreak,
        max_winstreak: newMaxWinstreak,
        total_hints: newTotalHints,
      })
      .eq('uuid', userData.uuid);
  }

  function showEndModal(won) {
    endTitle.textContent = won ? `Solved in ${currentRow+1}` : `Word was ${solution}`;
    modal.classList.remove("hidden");
    startCountdown();
  }

  function startCountdown() {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextMidnight - now;
      if (diff <= 0) {
        clearInterval(interval);
        window.location.reload();
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      countdownEl.textContent = `Next word in ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  }

  // --- LEADERBOARD (unchanged) ---
  async function openLeaderboard() {
    leaderboardModal.classList.remove("hidden");
    const userData = getUserData();
    if (!userData.username) {
      usernameView.classList.remove("hidden");
      statsView.classList.add("hidden");
    } else {
      usernameView.classList.add("hidden");
      statsView.classList.remove("hidden");
      await loadLeaderboardData();
    }
  }

  async function loadLeaderboardData() {
    lbLoading.classList.remove("hidden");
    lbList.classList.add("hidden");
    const { data: players } = await supabase
      .from('leaderboards')
      .select('username, total_guesses, games_played, winstreak')
      .not('username', 'is', null)
      .gte('games_played', 1)
      .order('total_guesses', { ascending: true });
    if (players) {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      let sorted = [...players];
      if (activeTab === 'avg') {
        sorted.sort((a,b) => (a.total_guesses/a.games_played) - (b.total_guesses/b.games_played));
      } else if (activeTab === 'streak') {
        sorted.sort((a,b) => b.winstreak - a.winstreak);
      }
      lbList.innerHTML = sorted.map(p => `<li>${p.username} — ${activeTab === 'avg' ? (p.total_guesses/p.games_played).toFixed(1) : p.winstreak}</li>`).join('');
      lbLoading.classList.add("hidden");
      lbList.classList.remove("hidden");
    }
  }

  function bindEvents() {
    hintButton.onclick = showHint;
    leaderboardBtn.onclick = openLeaderboard;
    closeLeaderboardBtn.onclick = () => leaderboardModal.classList.add("hidden");
    closeModal.onclick = () => modal.classList.add("hidden");
    
    saveUsernameBtn.onclick = async () => {
      const name = usernameInput.value.trim();
      const pass = await hashPassword(passwordInput.value.trim());
      const userData = getUserData();
      
      const { data: existing } = await supabase.from('leaderboards').select('uuid, password').eq('username', name).maybeSingle();
      if (existing) {
        if (existing.password === pass) { 
          userData.uuid = existing.uuid; 
          userData.username = name; 
          localStorage.setItem(userKey, JSON.stringify(userData));
          setupRealtimeSync(userData.uuid);
          location.reload();
        } else { usernameError.textContent = "Wrong password"; usernameError.classList.remove("hidden"); }
      } else {
        await supabase.from('leaderboards').insert([{ uuid: userData.uuid, username: name, password: pass, total_hints: 0, games_played: 0, total_guesses: 0, winstreak: 0, max_winstreak: 0 }]);
        userData.username = name;
        localStorage.setItem(userKey, JSON.stringify(userData));
        location.reload();
      }
    };

    tabBtns.forEach(btn => {
      btn.onclick = async () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        await loadLeaderboardData();
      };
    });
  }

  async function hashPassword(p) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
})();