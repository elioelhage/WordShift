(() => {
  const WORDS = [
    // Christianity (65)
    { word: "JESUS", category: "Christianity" }, { word: "BIBLE", category: "Christianity" }, { word: "CHURCH", category: "Christianity" },
    { word: "ALTAR", category: "Christianity" }, { word: "GOSPEL", category: "Christianity" }, { word: "CROSS", category: "Christianity" },
    { word: "PRAYER", category: "Christianity" }, { word: "SAINT", category: "Christianity" }, { word: "ANGEL", category: "Christianity" },
    { word: "FAITH", category: "Christianity" }, { word: "MERCY", category: "Christianity" }, { word: "PSALM", category: "Christianity" },
    { word: "HEAVEN", category: "Christianity" }, { word: "HOLY", category: "Christianity" }, { word: "BAPTISM", category: "Christianity" },
    { word: "COMMUNION", category: "Christianity" }, { word: "APOSTLE", category: "Christianity" }, { word: "PROPHET", category: "Christianity" },
    { word: "GRACE", category: "Christianity" }, { word: "RESURRECTION", category: "Christianity" }, { word: "TRINITY", category: "Christianity" },
    { word: "SAVIOR", category: "Christianity" }, { word: "PARABLE", category: "Christianity" }, { word: "CHALICE", category: "Christianity" },
    { word: "BISHOP", category: "Christianity" }, { word: "PRIEST", category: "Christianity" }, { word: "DEACON", category: "Christianity" },
    { word: "MONK", category: "Christianity" }, { word: "NUN", category: "Christianity" }, { word: "VATICAN", category: "Christianity" },
    { word: "POPE", category: "Christianity" }, { word: "CATHOLIC", category: "Christianity" }, { word: "ORTHODOX", category: "Christianity" },
    { word: "PROTESTANT", category: "Christianity" }, { word: "LUTHERAN", category: "Christianity" }, { word: "METHODIST", category: "Christianity" },
    { word: "BAPTIST", category: "Christianity" }, { word: "CREED", category: "Christianity" }, { word: "SERMON", category: "Christianity" },
    { word: "CHOIR", category: "Christianity" }, { word: "HYMN", category: "Christianity" }, { word: "ROSARY", category: "Christianity" },
    { word: "CRUCIFIX", category: "Christianity" }, { word: "TABERNACLE", category: "Christianity" }, { word: "EUCHARIST", category: "Christianity" },
    { word: "VESPERS", category: "Christianity" }, { word: "MATINS", category: "Christianity" }, { word: "LITURGY", category: "Christianity" },
    { word: "SACRAMENT", category: "Christianity" }, { word: "PENANCE", category: "Christianity" }, { word: "CONFESSION", category: "Christianity" },
    { word: "ABSOLUTION", category: "Christianity" }, { word: "SALVATION", category: "Christianity" }, { word: "REDEMPTION", category: "Christianity" },
    { word: "COVENANT", category: "Christianity" }, { word: "GENESIS", category: "Christianity" }, { word: "EXODUS", category: "Christianity" },
    { word: "REVELATION", category: "Christianity" }, { word: "EPISTLE", category: "Christianity" }, { word: "DISCIPLE", category: "Christianity" },
    { word: "CHRISTMAS", category: "Christianity" }, { word: "EASTER", category: "Christianity" }, { word: "ADVENT", category: "Christianity" },
    { word: "LENT", category: "Christianity" }, { word: "MINISTRY", category: "Christianity" },
    
    // Theater (65)
    { word: "STAGE", category: "Theater" }, { word: "ACTOR", category: "Theater" }, { word: "ACTRESS", category: "Theater" },
    { word: "SCENE", category: "Theater" }, { word: "SCRIPT", category: "Theater" }, { word: "DRAMA", category: "Theater" },
    { word: "COMEDY", category: "Theater" }, { word: "TRAGEDY", category: "Theater" }, { word: "CURTAIN", category: "Theater" },
    { word: "MONOLOGUE", category: "Theater" }, { word: "DIALOGUE", category: "Theater" }, { word: "DIRECTOR", category: "Theater" },
    { word: "PRODUCER", category: "Theater" }, { word: "REHEARSAL", category: "Theater" }, { word: "AUDITION", category: "Theater" },
    { word: "CASTING", category: "Theater" }, { word: "BACKSTAGE", category: "Theater" }, { word: "WARDROBE", category: "Theater" },
    { word: "PROPS", category: "Theater" }, { word: "SPOTLIGHT", category: "Theater" }, { word: "CHORUS", category: "Theater" },
    { word: "MUSICAL", category: "Theater" }, { word: "CHOREOGRAPHY", category: "Theater" }, { word: "PLAYWRIGHT", category: "Theater" },
    { word: "IMPROV", category: "Theater" }, { word: "PANTOMIME", category: "Theater" }, { word: "VAUDEVILLE", category: "Theater" },
    { word: "CABARET", category: "Theater" }, { word: "BALLET", category: "Theater" }, { word: "OPERA", category: "Theater" },
    { word: "OVERTURE", category: "Theater" }, { word: "INTERMISSION", category: "Theater" }, { word: "APPLAUSE", category: "Theater" },
    { word: "ENCORE", category: "Theater" }, { word: "THESPIAN", category: "Theater" }, { word: "PROMPTER", category: "Theater" },
    { word: "AUDIENCE", category: "Theater" }, { word: "BALCONY", category: "Theater" }, { word: "MEZZANINE", category: "Theater" },
    { word: "ORCHESTRA", category: "Theater" }, { word: "SCENERY", category: "Theater" }, { word: "BACKDROP", category: "Theater" },
    { word: "WINGS", category: "Theater" }, { word: "RIGGING", category: "Theater" }, { word: "MARQUEE", category: "Theater" },
    { word: "BOXOFFICE", category: "Theater" }, { word: "USHER", category: "Theater" }, { word: "MATINEE", category: "Theater" },
    { word: "PREMIERE", category: "Theater" }, { word: "REVIVAL", category: "Theater" }, { word: "REPERTOIRE", category: "Theater" },
    { word: "TROUPE", category: "Theater" }, { word: "ENSEMBLE", category: "Theater" }, { word: "BLOCKING", category: "Theater" },
    { word: "STRIKE", category: "Theater" }, { word: "GREENROOM", category: "Theater" }, { word: "LIGHTING", category: "Theater" },
    { word: "SOUND", category: "Theater" }, { word: "TICKETS", category: "Theater" }, { word: "PERFORMANCE", category: "Theater" },
    { word: "SOLILOQUY", category: "Theater" }, { word: "UNDERSTUDY", category: "Theater" }, { word: "COMPANY", category: "Theater" },
    { word: "SEASON", category: "Theater" }, { word: "FESTIVAL", category: "Theater" },
    
    // Lebanon (60)
    { word: "CEDAR", category: "Lebanon" }, { word: "MOUNTAIN", category: "Lebanon" }, { word: "MEDITERRANEAN", category: "Lebanon" },
    { word: "LEVANT", category: "Lebanon" }, { word: "PHOENICIAN", category: "Lebanon" }, { word: "TABBOULEH", category: "Lebanon" },
    { word: "HUMMUS", category: "Lebanon" }, { word: "FATTOUSH", category: "Lebanon" }, { word: "KIBBEH", category: "Lebanon" },
    { word: "MANAWEESH", category: "Lebanon" }, { word: "ZAATAR", category: "Lebanon" }, { word: "SHWARMA", category: "Lebanon" },
    { word: "FALAFEL", category: "Lebanon" }, { word: "BAKLAVA", category: "Lebanon" }, { word: "KNAFEH", category: "Lebanon" },
    { word: "ARAK", category: "Lebanon" }, { word: "DABKE", category: "Lebanon" }, { word: "DERBAKKE", category: "Lebanon" },
    { word: "LIRA", category: "Lebanon" }, { word: "DIASPORA", category: "Lebanon" }, { word: "TOUM", category: "Lebanon" },
    { word: "GARLIC", category: "Lebanon" }, { word: "OLIVE", category: "Lebanon" }, { word: "PINE", category: "Lebanon" },
    { word: "SNOW", category: "Lebanon" }, { word: "BEACH", category: "Lebanon" }, { word: "SUMMER", category: "Lebanon" },
    { word: "WINTER", category: "Lebanon" }, { word: "RUINS", category: "Lebanon" }, { word: "TEMPLE", category: "Lebanon" },
    { word: "COLUMN", category: "Lebanon" }, { word: "ROMAN", category: "Lebanon" }, { word: "BYZANTINE", category: "Lebanon" },
    { word: "OTTOMAN", category: "Lebanon" }, { word: "FRENCH", category: "Lebanon" }, { word: "MANDATE", category: "Lebanon" },
    { word: "INDEPENDENCE", category: "Lebanon" }, { word: "FLAG", category: "Lebanon" }, { word: "TREE", category: "Lebanon" },
    { word: "BRANCH", category: "Lebanon" }, { word: "ROOTS", category: "Lebanon" }, { word: "HOSPITALITY", category: "Lebanon" },
    { word: "FAMILY", category: "Lebanon" }, { word: "VILLAGE", category: "Lebanon" }, { word: "VALLEY", category: "Lebanon" },
    { word: "COAST", category: "Lebanon" }, { word: "SHORE", category: "Lebanon" }, { word: "CLIFF", category: "Lebanon" },
    { word: "CAVE", category: "Lebanon" }, { word: "STALACTITE", category: "Lebanon" }, { word: "PIGEON", category: "Lebanon" },
    { word: "ROCKS", category: "Lebanon" }, { word: "CORNICHE", category: "Lebanon" }, { word: "MEZZE", category: "Lebanon" },
    { word: "LABNEH", category: "Lebanon" }, { word: "HALLOUMI", category: "Lebanon" }, { word: "CARDAMOM", category: "Lebanon" },
    { word: "COFFEE", category: "Lebanon" }, { word: "FINJAAN", category: "Lebanon" }, { word: "NARGHILE", category: "Lebanon" },
    
    // General (70)
    { word: "WATER", category: "General" }, { word: "EARTH", category: "General" }, { word: "FIRE", category: "General" },
    { word: "WIND", category: "General" }, { word: "SPACE", category: "General" }, { word: "TIME", category: "General" },
    { word: "LIGHT", category: "General" }, { word: "DARK", category: "General" }, { word: "MOON", category: "General" },
    { word: "STAR", category: "General" }, { word: "PLANET", category: "General" }, { word: "OCEAN", category: "General" },
    { word: "RIVER", category: "General" }, { word: "FOREST", category: "General" }, { word: "DESERT", category: "General" },
    { word: "ISLAND", category: "General" }, { word: "ANIMAL", category: "General" }, { word: "BIRD", category: "General" },
    { word: "FISH", category: "General" }, { word: "INSECT", category: "General" }, { word: "FLOWER", category: "General" },
    { word: "FRUIT", category: "General" }, { word: "VEGETABLE", category: "General" }, { word: "BREAD", category: "General" },
    { word: "CHEESE", category: "General" }, { word: "MEAT", category: "General" }, { word: "MILK", category: "General" },
    { word: "HOUSE", category: "General" }, { word: "DOOR", category: "General" }, { word: "WINDOW", category: "General" },
    { word: "ROOF", category: "General" }, { word: "FLOOR", category: "General" }, { word: "WALL", category: "General" },
    { word: "ROOM", category: "General" }, { word: "CHAIR", category: "General" }, { word: "TABLE", category: "General" },
    { word: "CLOCK", category: "General" }, { word: "WATCH", category: "General" }, { word: "PHONE", category: "General" },
    { word: "COMPUTER", category: "General" }, { word: "BOOK", category: "General" }, { word: "PAPER", category: "General" },
    { word: "PENCIL", category: "General" }, { word: "SHOE", category: "General" }, { word: "SHIRT", category: "General" },
    { word: "PANTS", category: "General" }, { word: "COAT", category: "General" }, { word: "GLOVE", category: "General" },
    { word: "SCARF", category: "General" }, { word: "RING", category: "General" }, { word: "NECKLACE", category: "General" },
    { word: "BRACELET", category: "General" }, { word: "TRAIN", category: "General" }, { word: "PLANE", category: "General" },
    { word: "BOAT", category: "General" }, { word: "BICYCLE", category: "General" }, { word: "ROAD", category: "General" },
    { word: "BRIDGE", category: "General" }, { word: "STREET", category: "General" }, { word: "PATH", category: "General" },
    { word: "MUSIC", category: "General" }, { word: "GUITAR", category: "General" }, { word: "PIANO", category: "General" },
    { word: "DRUMS", category: "General" }, { word: "VOICE", category: "General" }, { word: "SONG", category: "General" },
    { word: "DANCE", category: "General" }, { word: "PAINT", category: "General" }, { word: "COLOR", category: "General" },
    { word: "BRUSH", category: "General" }
  ];

  // Dynamically accept only alphabetic characters
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
  // Standardize the local calendar date to UTC to fix the timezone bug
  const localDateAsUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysPassed = Math.max(0, Math.floor((localDateAsUTC - launchDate) / 86400000));
  
  // The Kill Switch: Stop the game if we run out of words
  if (daysPassed >= DAILY_WORDS.length) {
    document.body.innerHTML = "<h1 style='text-align:center; padding: 2rem; color: var(--text); font-family: sans-serif;'>We are out of words! Check back later.</h1>";
    throw new Error("Word list exhausted.");
  }

  // Set the index directly without the modulo (%) loop
  const solutionIndex = daysPassed;
  
  const activeSolutionObj = DAILY_WORDS[solutionIndex];
  const solution = activeSolutionObj.word.toUpperCase();
  const wordCategory = activeSolutionObj.category;
  const wordLength = solution.length;
  const maxRows = 6;
  
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
    // Pass word length to CSS for grid setup
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

    // Still supports desktop physical keyboard
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
      // Track any letter that has been played and isn't purely absent
      for (const row of boardState) {
        if (!row) continue;
        for (let i = 0; i < wordLength; i++) {
          if (row.colors[i] === "correct" || row.colors[i] === "present") {
            correctLetters.add(row.guess[i]);
          }
        }
      }

      // Filter solution for letters we haven't found yet
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
    
    // 3rd click does nothing
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
    // Check local whitelist to ensure themed words pass regardless of dictionary api
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