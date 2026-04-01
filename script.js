(() => {
  const WORDS = [
    { word: "TABERNACLE", category: "Christianity" }, { word: "CORNICHE", category: "Lebanon" }, { word: "ROOM", category: "General" }, { word: "COMEDY", category: "Theater" },
    { word: "BIBLE", category: "Christianity" }, { word: "FALAFEL", category: "Lebanon" }, { word: "GLOVE", category: "General" }, { word: "DRAMA", category: "Theater" },
    { word: "DIASPORA", category: "Lebanon" }, { word: "DIRECTOR", category: "Theater" }, { word: "BISHOP", category: "Christianity" }, { word: "GUITAR", category: "General" },
    { word: "ACTRESS", category: "Theater" }, { word: "ZAATAR", category: "Lebanon" }, { word: "WATER", category: "General" }, { word: "RESURRECTION", category: "Christianity" },
    { word: "SCARF", category: "General" }, { word: "ENCORE", category: "Theater" }, { word: "PRIEST", category: "Christianity" }, { word: "LIRA", category: "Lebanon" },
    { word: "WIND", category: "General" }, { word: "PROPHET", category: "Christianity" }, { word: "DABKE", category: "Lebanon" }, { word: "MARQUEE", category: "Theater" },
    { word: "ORTHODOX", category: "Christianity" }, { word: "SHIRT", category: "General" }, { word: "SPOTLIGHT", category: "Theater" }, { word: "BAKLAVA", category: "Lebanon" },
    { word: "USHER", category: "Theater" }, { word: "SAINT", category: "Christianity" }, { word: "MOUNTAIN", category: "Lebanon" }, { word: "INSECT", category: "General" },
    { word: "VATICAN", category: "Christianity" }, { word: "OPERA", category: "Theater" }, { word: "MILK", category: "General" }, { word: "BEACH", category: "Lebanon" },
    { word: "PRAYER", category: "Christianity" }, { word: "STRIKE", category: "Theater" }, { word: "COAST", category: "Lebanon" }, { word: "SPACE", category: "General" },
    { word: "PROPS", category: "Theater" }, { word: "KNAFEH", category: "Lebanon" }, { word: "DOOR", category: "General" }, { word: "HOLY", category: "Christianity" },
    { word: "GARLIC", category: "Lebanon" }, { word: "LIGHT", category: "General" }, { word: "SERMON", category: "Christianity" }, { word: "WARDROBE", category: "Theater" },
    { word: "BAPTISM", category: "Christianity" }, { word: "PIANO", category: "General" }, { word: "REHEARSAL", category: "Theater" }, { word: "HUMMUS", category: "Lebanon" },
    { word: "WINTER", category: "Lebanon" }, { word: "TRAGEDY", category: "Theater" }, { word: "ANIMAL", category: "General" }, { word: "COMMUNION", category: "Christianity" },
    { word: "BALCONY", category: "Theater" }, { word: "HEAVEN", category: "Christianity" }, { word: "BOAT", category: "General" }, { word: "TEMPLE", category: "Lebanon" },
    { word: "PENCIL", category: "General" }, { word: "CROSS", category: "Christianity" }, { word: "PLAYWRIGHT", category: "Theater" }, { word: "LEVANT", category: "Lebanon" },
    { word: "CHORUS", category: "Theater" }, { word: "LUTHERAN", category: "Christianity" }, { word: "TABBOULEH", category: "Lebanon" }, { word: "OCEAN", category: "General" },
    { word: "EPISTLE", category: "Christianity" }, { word: "MEZZANINE", category: "Theater" }, { word: "FRUIT", category: "General" }, { word: "ROOTS", category: "Lebanon" },
    { word: "APOSTLE", category: "Christianity" }, { word: "CLOCK", category: "General" }, { word: "CABARET", category: "Theater" }, { word: "ARAK", category: "Lebanon" },
    { word: "ISLAND", category: "General" }, { word: "MONOLOGUE", category: "Theater" }, { word: "VILLAGE", category: "Lebanon" }, { word: "DISCIPLE", category: "Christianity" },
    { word: "PRODUCER", category: "Theater" }, { word: "NUN", category: "Christianity" }, { word: "PLANE", category: "General" }, { word: "ROMAN", category: "Lebanon" },
    { word: "POPE", category: "Christianity" }, { word: "MANAWEESH", category: "Lebanon" }, { word: "CHAIR", category: "General" }, { word: "SCENERY", category: "Theater" },
    { word: "VALLEY", category: "Lebanon" }, { word: "GRACE", category: "Christianity" }, { word: "MUSICAL", category: "Theater" }, { word: "BREAD", category: "General" },
    { word: "ROOF", category: "General" }, { word: "CREED", category: "Christianity" }, { word: "BLOCKING", category: "Theater" }, { word: "CEDAR", category: "Lebanon" },
    { word: "CHOIR", category: "Christianity" }, { word: "PANTS", category: "General" }, { word: "OTTOMAN", category: "Lebanon" }, { word: "ACTOR", category: "Theater" },
    { word: "SHORE", category: "Lebanon" }, { word: "JESUS", category: "Christianity" }, { word: "SCRIPT", category: "Theater" }, { word: "EARTH", category: "General" },
    { word: "COMPANY", category: "Theater" }, { word: "STALACTITE", category: "Lebanon" }, { word: "RIVER", category: "General" }, { word: "PENANCE", category: "Christianity" },
    { word: "CHURCH", category: "Christianity" }, { word: "VAUDEVILLE", category: "Theater" }, { word: "PINE", category: "Lebanon" }, { word: "WATCH", category: "General" },
    { word: "FATTOUSH", category: "Lebanon" }, { word: "MONK", category: "Christianity" }, { word: "COLOR", category: "General" }, { word: "UNDERSTUDY", category: "Theater" },
    { word: "TRINITY", category: "Christianity" }, { word: "BIRD", category: "General" }, { word: "THESPIAN", category: "Theater" }, { word: "FAMILY", category: "Lebanon" },
    { word: "COAT", category: "General" }, { word: "APPLAUSE", category: "Theater" }, { word: "MINISTRY", category: "Christianity" }, { word: "MEDITERRANEAN", category: "Lebanon" },
    { word: "MERCY", category: "Christianity" }, { word: "SHWARMA", category: "Lebanon" }, { word: "BALLET", category: "Theater" }, { word: "STAR", category: "General" },
    { word: "DERBAKKE", category: "Lebanon" }, { word: "BRUSH", category: "General" }, { word: "REVELATION", category: "Christianity" }, { word: "CASTING", category: "Theater" },
    { word: "SAVIOR", category: "Christianity" }, { word: "BACKSTAGE", category: "Theater" }, { word: "MEAT", category: "General" }, { word: "RUINS", category: "Lebanon" },
    { word: "STAGE", category: "Theater" }, { word: "GOSPEL", category: "Christianity" }, { word: "PHONE", category: "General" }, { word: "TREE", category: "Lebanon" },
    { word: "CATHOLIC", category: "Christianity" }, { word: "BICYCLE", category: "General" }, { word: "KIBBEH", category: "Lebanon" }, { word: "AUDIENCE", category: "Theater" },
    { word: "FRENCH", category: "Lebanon" }, { word: "PROTESTANT", category: "Christianity" }, { word: "PAINT", category: "General" }, { word: "SCENE", category: "Theater" },
    { word: "LENT", category: "Christianity" }, { word: "TABLE", category: "General" }, { word: "WINGS", category: "Theater" }, { word: "OLIVE", category: "Lebanon" },
    { word: "BRACELET", category: "General" }, { word: "CHALICE", category: "Christianity" }, { word: "OVERTURE", category: "Theater" }, { word: "PHOENICIAN", category: "Lebanon" },
    { word: "MATINEE", category: "Theater" }, { word: "MANDATE", category: "Lebanon" }, { word: "ALTAR", category: "Christianity" }, { word: "FISH", category: "General" },
    { word: "ANGEL", category: "Christianity" }, { word: "FLOWER", category: "General" }, { word: "PIGEON", category: "Lebanon" }, { word: "REVIVAL", category: "Theater" },
    { word: "BRIDGE", category: "General" }, { word: "DEACON", category: "Christianity" }, { word: "CLIFF", category: "Lebanon" }, { word: "DIALOGUE", category: "Theater" },
    { word: "ROSARY", category: "Christianity" }, { word: "DANCE", category: "General" }, { word: "TROUPE", category: "Theater" }, { word: "SUMMER", category: "Lebanon" },
    { word: "CAVE", category: "Lebanon" }, { word: "REPERTOIRE", category: "Theater" }, { word: "FAITH", category: "Christianity" }, { MOON: "General" },
    { word: "HOUSE", category: "General" }, { word: "BAPTIST", category: "Christianity" }, { word: "IMPROV", category: "Theater" }, { word: "INDEPENDENCE", category: "Lebanon" },
    { word: "BOOK", category: "General" }, { word: "GENESIS", category: "Christianity" }, { word: "ENSEMBLE", category: "Theater" }, { word: "BRANCH", category: "Lebanon" },
    { word: "SNOW", category: "Lebanon" }, { word: "CRUCIFIX", category: "Christianity" }, { word: "PAPER", category: "General" }, { word: "GREENROOM", category: "Theater" },
    { word: "EXODUS", category: "Christianity" }, { word: "CHEESE", category: "General" }, { word: "ROCKS", category: "Lebanon" }, { word: "LIGHTING", category: "Theater" },
    { word: "TICKETS", category: "Theater" }, { word: "ABSOLUTION", category: "Christianity" }, { word: "STREET", category: "General" }, { word: "LABNEH", category: "Lebanon" },
    { word: "COVENANT", category: "Christianity" }, { word: "ROAD", category: "General" }, { word: "PANTOMIME", category: "Theater" }, { word: "COFFEE", category: "Lebanon" },
    { word: "CHOREOGRAPHY", category: "Theater" }, { word: "CONFESSION", category: "Christianity" }, { word: "TOUM", category: "Lebanon" }, { word: "DESERT", category: "General" },
    { word: "CHRISTMAS", category: "Christianity" }, { word: "RING", category: "General" }, { word: "ORCHESTRA", category: "Theater" }, { word: "HALLOUMI", category: "Lebanon" },
    { word: "FINJAAN", category: "Lebanon" }, { word: "SACRAMENT", category: "Christianity" }, { word: "SEASON", category: "Theater" }, { word: "COMPUTER", category: "General" },
    { word: "BACKDROP", category: "Theater" }, { word: "SALVATION", category: "Christianity" }, { word: "TRAIN", category: "General" }, { word: "CARDAMOM", category: "Lebanon" },
    { word: "REDEMPTION", category: "Christianity" }, { word: "PLANET", category: "General" }, { word: "NARGHILE", category: "Lebanon" }, { word: "PROMPTER", category: "Theater" },
    { word: "WINDOW", category: "General" }, { word: "PARABLE", category: "Christianity" }, { word: "PERFORMANCE", category: "Theater" }, { word: "BYZANTINE", category: "Lebanon" },
    { word: "SOLILOQUY", category: "Theater" }, { word: "EASTER", category: "Christianity" }, { word: "FOREST", category: "General" }, { word: "FLAG", category: "Lebanon" },
    { word: "EUCHARIST", category: "Christianity" }, { word: "VEGETABLE", category: "General" }, { word: "BOXOFFICE", category: "Theater" }, { word: "HOSPITALITY", category: "Lebanon" },
    { word: "RIGGING", category: "Theater" }, { word: "METHODIST", category: "Christianity" }, { word: "MEZZE", category: "Lebanon" }, { word: "TIME", category: "General" },
    { word: "ADVENT", category: "Christianity" }, { word: "SOUND", category: "Theater" }, { word: "PATH", category: "General" }, { word: "COLUMN", category: "Lebanon" },
    { word: "FESTIVAL", category: "Theater" }, { word: "VESPERS", category: "Christianity" }, { word: "VOICE", category: "General" }, { word: "SONG", category: "General" },
    { word: "MATINS", category: "Christianity" }, { word: "FIRE", category: "General" }, { word: "INTERMISSION", category: "Theater" }, { word: "LITURGY", category: "Christianity" },
    { word: "SHOE", category: "General" }, { word: "PREMIERE", category: "Theater" }, { word: "PSALM", category: "Christianity" }, { word: "NECKLACE", category: "General" },
    { word: "DRUMS", category: "General" }, { word: "CURTAIN", category: "Theater" }, { word: "HYMN", category: "Christianity" }, { word: "DARK", category: "General" },
    { word: "AUDITION", category: "Theater" }, { word: "MUSIC", category: "General" }, { word: "WALL", category: "General" }, { word: "FLOOR", category: "General" }
  ];

  const DAILY_WORDS = WORDS.filter(obj => /^[a-zA-Z]+$/.test(obj.word));
  const launchDate = Date.UTC(2026, 2, 31);
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

  const instructionCard = document.getElementById("instruction-card");
  const closeInstructionBtn = document.getElementById("close-instruction");

  if (!DAILY_WORDS.length) {
    throw new Error("No words available.");
  }

  const today = new Date();

  const localDateAsUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysPassed = Math.max(0, Math.floor((localDateAsUTC - launchDate) / 86400000));

  if (daysPassed >= DAILY_WORDS.length) {
    document.body.innerHTML = "<h1 style='text-align:center; padding: 2rem; color: var(--text); font-family: sans-serif;'>We are out of words! Check back later.</h1>";
    throw new Error("Word list exhausted.");
  }

  const solutionIndex = daysPassed;

  const activeSolutionObj = DAILY_WORDS[solutionIndex];
  const solution = activeSolutionObj.word.toUpperCase();
  const wordCategory = activeSolutionObj.category;
  const wordLength = solution.length;
  const maxRows = wordLength <= 5 ? 6 : wordLength + 1;  
  const storageKey = `wordle-mobile-${solutionIndex}`;
  const themeKey = "wordle-mobile-theme";
  const instructionDismissKey = "wordle-mobile-instruction-dismissed";

  let currentRow = 0;
  let currentGuess = "";
  let boardState = Array.from({ length: maxRows }, () => null);
  let gameOver = false;
  let isSubmitting = false;
  let countdownTimer = null;
  let messageTimer = null;
  let hintsUsed = 0;

  const savedState = loadState();
  if (savedState && savedState.solutionIndex === solutionIndex) {
    currentRow = Math.min(savedState.currentRow ?? 0, maxRows - 1);
    currentGuess = typeof savedState.currentGuess === "string" ? savedState.currentGuess : "";
    gameOver = Boolean(savedState.gameOver);
    boardState = Array.from({ length: maxRows }, (_, i) => savedState.boardState?.[i] ?? null);
    hintsUsed = savedState.hintsUsed || 0;
  }

  setupUI();
  setupTheme();
  setMetaText();
  buildBoard();
  buildKeyboard();
  restoreBoard();
  updateBoard();
  updateKeyboardColorsFromBoard();
  updateHintBadge();
  bindEvents();

  if (gameOver) {
    showEndModal(Boolean(savedState?.won));
  }

  function setupUI() {
    if (localStorage.getItem(instructionDismissKey) === "true") {
      instructionCard.classList.add("hidden");
    }
  }

  function setMetaText() {
    metaLineEl.textContent = `${wordLength} letters · ${maxRows} tries`;

    boardEl.style.setProperty("--word-length", wordLength);
  }

  function setupTheme() {
    const savedTheme = localStorage.getItem(themeKey);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);

    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      localStorage.setItem(themeKey, nextTheme);
    });
  }

  function setTheme(theme) {
    document.body.dataset.theme = theme;
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    themeIcon.innerHTML = theme === "dark" ? sunIcon() : moonIcon();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#121213" : "#ffffff");
  }

  function moonIcon() {
    return `
      <path d="M20 13.2A7.8 7.8 0 0 1 10.8 4a8.8 8.8 0 1 0 9.2 9.2Z"></path>
    `;
  }

  function sunIcon() {
    return `
      <circle cx="12" cy="12" r="4.2"></circle>
      <path d="M12 2.8v2.3"></path>
      <path d="M12 18.9v2.3"></path>
      <path d="M2.8 12h2.3"></path>
      <path d="M18.9 12h2.3"></path>
      <path d="M4.6 4.6l1.6 1.6"></path>
      <path d="M17.8 17.8l1.6 1.6"></path>
      <path d="M19.4 4.6l-1.6 1.6"></path>
      <path d="M6.2 17.8l-1.6 1.6"></path>
    `;
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--tile-size", computeTileSize() + "px");

    for (let r = 0; r < maxRows; r += 1) {
      const row = document.createElement("div");
      row.className = "row";
      for (let c = 0; c < wordLength; c += 1) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.id = `tile-${r}-${c}`;
        tile.setAttribute("aria-label", `Row ${r + 1} column ${c + 1}`);
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function computeTileSize() {
    const vw = window.innerWidth || 375;
    const vh = window.innerHeight || 700;
    const boardPadding = 28;
    const gap = 5;
    const widthFit = (vw - boardPadding - gap * (wordLength - 1)) / wordLength;
    const heightFit = (vh * 0.42 - gap * (maxRows - 1)) / maxRows;
    return Math.max(25, Math.min(58, Math.floor(Math.min(widthFit, heightFit))));
  }

  function buildKeyboard() {
    keyboardEl.innerHTML = "";
    const rows = [
      ["Q","W","E","R","T","Y","U","I","O","P"],
      ["A","S","D","F","G","H","J","K","L"],
      ["ENTER","Z","X","C","V","B","N","M","⌫"]
    ];

    rows.forEach((letters) => {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      letters.forEach(letter => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "key";
        button.id = `key-${letter}`;
        button.textContent = letter;
        if (letter === "ENTER" || letter === "⌫") button.classList.add("wide");
        button.addEventListener("click", () => handleKey(letter));
        row.appendChild(button);
      });
      keyboardEl.appendChild(row);
    });
  }

  function bindEvents() {
    closeInstructionBtn.addEventListener("click", () => {
      instructionCard.classList.add("hidden");
      localStorage.setItem(instructionDismissKey, "true");
    });

    hintButton.addEventListener("click", showHint);

    window.addEventListener("resize", () => {
      boardEl.style.setProperty("--tile-size", computeTileSize() + "px");
    });

    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter") {
        event.preventDefault();
        handleKey("ENTER");
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        handleKey("⌫");
        return;
      }
      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        handleKey(event.key.toUpperCase());
      }
    });

    closeModal.addEventListener("click", hideEndModal);
  }

  function updateHintBadge() {
    const hintsLeft = 2 - hintsUsed;
    hintBadge.textContent = Math.max(0, hintsLeft);
    if (hintsLeft <= 0) {
      hintBadge.classList.add("empty");
    }
  }

  function showHint() {
    if (gameOver || isSubmitting) return;

    if (hintsUsed === 0) {
      showMessage(`Category: ${wordCategory}`);
      hintsUsed++;
      updateHintBadge();
      saveState();
      return;
    }

    if (hintsUsed === 1) {
      const correctLetters = new Set();

      for (const row of boardState) {
        if (!row) continue;
        for (let i = 0; i < wordLength; i++) {
          if (row.colors[i] === "correct" || row.colors[i] === "present") {
            correctLetters.add(row.guess[i]);
          }
        }
      }

      const unrevealed = solution.split('').filter(l => !correctLetters.has(l));

      if (unrevealed.length > 0) {
        const randomHintLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        showMessage(`Hint: Try finding a spot for '${randomHintLetter}'`);
        hintsUsed++;
        updateHintBadge();
        saveState();
      } else {
        showMessage("You've found all letters, now find their spots!");
      }
      return;
    }

  }

  function handleKey(key) {
    if (gameOver || isSubmitting) return;

    if (key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "⌫") {
      if (!currentGuess.length) return;
      currentGuess = currentGuess.slice(0, -1);
      updateBoard();
      saveState();
      return;
    }

    if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
      currentGuess += key;
      animateTilePop();
      updateBoard();
      saveState();
    }
  }

  function animateTilePop() {
    const tile = document.getElementById(`tile-${currentRow}-${Math.max(0, currentGuess.length - 1)}`);
    if (!tile) return;
    tile.classList.remove("pop");
    void tile.offsetWidth;
    tile.classList.add("pop");
  }

  function updateBoard() {
    for (let c = 0; c < wordLength; c += 1) {
      const tile = document.getElementById(`tile-${currentRow}-${c}`);
      if (!tile) continue;
      const letter = currentGuess[c] || "";
      tile.textContent = letter;
      tile.classList.toggle("filled", Boolean(letter));
    }
  }

  function restoreBoard() {
    for (let r = 0; r < maxRows; r += 1) {
      const rowData = boardState[r];
      if (!rowData) continue;

      const guess = rowData.guess || "";
      const colors = rowData.colors || [];
      for (let c = 0; c < wordLength; c += 1) {
        const tile = document.getElementById(`tile-${r}-${c}`);
        if (!tile) continue;
        tile.textContent = guess[c] || "";
        tile.classList.toggle("filled", Boolean(guess[c]));
        if (colors[c]) {
          tile.classList.add(colors[c]);
          tile.style.color = "#fff";
          tile.style.borderColor = "transparent";
        }
      }
    }
  }

  async function submitGuess() {
    if (!currentGuess || currentGuess.length !== wordLength) {
      showMessage(`Need ${wordLength} letters.`);
      shakeCurrentRow();
      return;
    }

    const guess = currentGuess.toUpperCase();
    isSubmitting = true;

    const valid = await isValidWord(guess.toLowerCase());
    if (!valid) {
      showMessage("That word is not accepted.");
      shakeCurrentRow();
      isSubmitting = false;
      return;
    }

    const colors = getTileColors(guess, solution);
    boardState[currentRow] = { guess, colors };
    saveState();

    animateFlip(currentRow, guess, colors);

    window.setTimeout(() => {
      if (guess === solution) {
        gameOver = true;
        saveState(true);
        showMessage("Solved.");
        showEndModal(true);
        isSubmitting = false;
        return;
      }

      currentRow += 1;
      currentGuess = "";

      if (currentRow >= maxRows) {
        gameOver = true;
        saveState(false);
        showMessage(`The word was ${solution}.`);
        showEndModal(false);
      } else {
        updateBoard();
        saveState();
      }

      isSubmitting = false;
    }, wordLength * 280 + 420);
  }

  function getTileColors(guess, answer) {
    const answerLetters = answer.split("");
    const guessLetters = guess.split("");
    const colors = Array(wordLength).fill("absent");

    for (let i = 0; i < wordLength; i += 1) {
      if (guessLetters[i] === answerLetters[i]) {
        colors[i] = "correct";
        answerLetters[i] = null;
        guessLetters[i] = null;
      }
    }

    for (let i = 0; i < wordLength; i += 1) {
      const letter = guessLetters[i];
      if (letter && answerLetters.includes(letter)) {
        colors[i] = "present";
        answerLetters[answerLetters.indexOf(letter)] = null;
      }
    }

    return colors;
  }

  function animateFlip(rowIndex, guess, colors) {
    for (let i = 0; i < wordLength; i += 1) {
      const tile = document.getElementById(`tile-${rowIndex}-${i}`);
      if (!tile) continue;

      window.setTimeout(() => {
        tile.classList.add("flip");
        window.setTimeout(() => {
          tile.classList.remove("flip");
          tile.classList.add(colors[i]);
          tile.style.color = "#fff";
          tile.style.borderColor = "transparent";
          updateKeyboardColor(guess[i], colors[i]);
        }, 220);
      }, i * 250);
    }
  }

  function shakeCurrentRow() {
    const row = boardEl.children[currentRow];
    if (!row) return;
    row.classList.remove("shake");
    void row.offsetWidth;
    row.classList.add("shake");
    window.setTimeout(() => row.classList.remove("shake"), 360);
  }

  function updateKeyboardColor(letter, color) {
    const key = document.getElementById(`key-${letter}`);
    if (!key) return;

    const priority = { absent: 0, present: 1, correct: 2 };
    const existing = key.classList.contains("correct") ? "correct"
      : key.classList.contains("present") ? "present"
      : key.classList.contains("absent") ? "absent"
      : null;

    if (existing && priority[existing] >= priority[color]) return;

    key.classList.remove("correct", "present", "absent");
    key.classList.add(color);
  }

  function updateKeyboardColorsFromBoard() {
    for (const rowData of boardState) {
      if (!rowData) continue;
      const guess = rowData.guess || "";
      const colors = rowData.colors || [];
      for (let i = 0; i < guess.length; i += 1) {
        updateKeyboardColor(guess[i], colors[i]);
      }
    }
  }

  function showMessage(text) {
    messageEl.textContent = text;
    messageEl.classList.add("show");
    clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => {
      if (!gameOver) messageEl.classList.remove("show");
    }, 1800);
  }

  async function isValidWord(word) {
    if (word.length !== wordLength) return false;

    if (DAILY_WORDS.some(w => w.word.toLowerCase() === word.toLowerCase())) return true;
    if (!/^[a-z]+$/.test(word)) return false;

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      return response.ok;
    } catch {
      return /^[a-z]+$/.test(word);
    }
  }

  function showEndModal(won) {
    endTitle.textContent = won ? "You got it." : `The word was ${solution}`;
    modal.classList.remove("hidden");
    startCountdown();
  }

  function hideEndModal() {
    modal.classList.add("hidden");
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);

    const update = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      if (diff <= 0) {
        countdownEl.textContent = "00:00:00";
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      countdownEl.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    update();
    countdownTimer = setInterval(update, 1000);
  }

  function saveState(won = null) {
    const state = {
      solutionIndex,
      currentRow,
      currentGuess,
      gameOver,
      won,
      boardState,
      hintsUsed
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
})();