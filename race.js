(() => {
  const supabaseUrl = "https://hcehsxnudbwjydvenlfz.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZWhzeG51ZGJ3anlkdmVubGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzY4NzAsImV4cCI6MjA5MDY1Mjg3MH0.dPawhX90yZrme7nftMTq6A1j-KGqfHZJ8QnbBeFurl8";
  const supabase = window.supabase?.createClient(supabaseUrl, supabaseKey);

  const createRoomBtn = document.getElementById("create-room-btn");
  const joinRoomBtn = document.getElementById("join-room-btn");
  const roomInput = document.getElementById("room-input");
  const roomCard = document.getElementById("room-card");
  const roomRoleEl = document.getElementById("room-role");
  const roomHintEl = document.getElementById("room-hint");
  const roomCodeEl = document.getElementById("room-code");
  const roomLinkEl = document.getElementById("room-link");
  const copyCodeBtn = document.getElementById("copy-code-btn");
  const copyLinkBtn = document.getElementById("copy-link-btn");
  const shareLinkBtn = document.getElementById("share-link-btn");
  const statusEl = document.getElementById("race-status");

  const roomKey = "wordle-race-room";
  const userKey = "wordle-user-data-v2";
  const clientKey = "wordle-race-client-id";
  const WORD_TABLE = "battle_words";
  const PLAYER_TABLE = "battle_players";

  const PLAYER_ROOM_FIELDS = ["room_code", "code", "room", "battle_code"];
  const PLAYER_ID_FIELDS = ["client_id", "player_id", "uuid", "user_id"];
  const PLAYER_ROLE_FIELDS = ["role", "player_role", "side"];
  const PLAYER_NAME_FIELDS = ["username", "player_name", "display_name", "name"];
  const PLAYER_WORD_FIELDS = ["word", "target_word", "battle_word", "race_word"];

  let currentRoom = null;
  let currentRole = null;
  let roomPoller = null;
  let currentUser = null;

  function getClientId() {
    let id = localStorage.getItem(clientKey);
    if (!id) {
      id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(clientKey, id);
    }
    return id;
  }

  function getUserData() {
    try {
      const raw = localStorage.getItem(userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setControlsEnabled(enabled) {
    createRoomBtn.disabled = !enabled;
    joinRoomBtn.disabled = !enabled;
    roomInput.disabled = !enabled;
  }

  function uniquePayloads(payloads) {
    const seen = new Set();
    const out = [];
    for (const payload of payloads) {
      const key = JSON.stringify(payload);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(payload);
    }
    return out;
  }

  async function tryInsert(table, payloads) {
    const attempts = uniquePayloads(payloads);
    let lastError = null;
    for (const payload of attempts) {
      const { error } = await supabase.from(table).insert([payload]);
      if (!error) return { ok: true, payload };
      lastError = error;
    }
    return { ok: false, error: lastError };
  }

  async function fetchRandomBattleWord() {
    if (!supabase) return null;
    const maxId = 670;
    for (let i = 0; i < 4; i += 1) {
      const randomId = Math.floor(Math.random() * maxId) + 1;
      const { data, error } = await supabase
        .from(WORD_TABLE)
        .select("word")
        .eq("id", randomId)
        .maybeSingle();
      if (!error && data?.word) return String(data.word).toUpperCase();
    }
    return null;
  }

  async function countPlayersInRoom(code) {
    for (const field of PLAYER_ROOM_FIELDS) {
      const { count, error } = await supabase
        .from(PLAYER_TABLE)
        .select("*", { count: "exact", head: true })
        .eq(field, code);

      if (!error) return count ?? 0;
    }
    return -1;
  }

  async function roomExists(code) {
    for (const roomField of PLAYER_ROOM_FIELDS) {
      const { data, error } = await supabase
        .from(PLAYER_TABLE)
        .select("*")
        .eq(roomField, code)
        .limit(1)
        .maybeSingle();
      if (!error && data) return true;
      if (!error && !data) return false;
    }
    return false;
  }

  async function registerPlayerRow(code, role) {
    const userIdentifier = currentUser?.uuid || getClientId();
    const userName = currentUser?.username || "Player";

    for (const roomField of PLAYER_ROOM_FIELDS) {
      for (const idField of PLAYER_ID_FIELDS) {
        const check = await supabase
          .from(PLAYER_TABLE)
          .select("*")
          .eq(roomField, code)
          .eq(idField, userIdentifier)
          .limit(1)
          .maybeSingle();
        if (!check.error && check.data) return true;
      }
    }

    const hostWord = role === "host" ? await fetchRandomBattleWord() : null;

    const payloads = [];
    for (const roomField of PLAYER_ROOM_FIELDS) {
      for (const idField of PLAYER_ID_FIELDS) {
        for (const roleField of PLAYER_ROLE_FIELDS) {
          payloads.push({ [roomField]: code, [idField]: userIdentifier, [roleField]: role });
          for (const nameField of PLAYER_NAME_FIELDS) {
            payloads.push({ [roomField]: code, [idField]: userIdentifier, [roleField]: role, [nameField]: userName });
          }
          if (hostWord) {
            for (const wordField of PLAYER_WORD_FIELDS) {
              payloads.push({ [roomField]: code, [idField]: userIdentifier, [roleField]: role, [wordField]: hostWord });
              for (const nameField of PLAYER_NAME_FIELDS) {
                payloads.push({ [roomField]: code, [idField]: userIdentifier, [roleField]: role, [nameField]: userName, [wordField]: hostWord });
              }
            }
          }
        }
      }
    }

    const result = await tryInsert(PLAYER_TABLE, payloads);
    return result.ok;
  }

  async function refreshRoomStatus() {
    if (!currentRoom) return;

    const count = await countPlayersInRoom(currentRoom);
    if (count < 0) {
      setStatus("Connected, but table columns didn’t match expected room fields.");
      return;
    }

    if (count >= 2) {
      setStatus("Opponent joined ✅ Room is ready for 1v1.");
    } else if (currentRole === "host") {
      setStatus("Room is online. Waiting for opponent to join...");
    } else {
      setStatus("You joined. Waiting for host/opponent sync...");
    }
  }

  function startRoomPolling() {
    if (roomPoller) clearInterval(roomPoller);
    roomPoller = window.setInterval(refreshRoomStatus, 2500);
    refreshRoomStatus();
  }

  function sanitizeRoomCode(value) {
    return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }

  function randomRoomCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);

    let out = "";
    for (let i = 0; i < 6; i += 1) out += alphabet[bytes[i] % alphabet.length];
    return out;
  }

  function roomInviteLink(code) {
    const url = new URL(window.location.href);
    url.searchParams.set("room", code);
    return url.toString();
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  async function ensureAuthenticatedUser() {
    currentUser = getUserData();

    if (!currentUser?.username) {
      setControlsEnabled(false);
      setStatus("Login required: create/login your account from the main game leaderboard first.");
      return false;
    }

    if (!supabase) {
      setControlsEnabled(false);
      setStatus("Supabase client not loaded on this page.");
      return false;
    }

    const { data, error } = await supabase
      .from("leaderboards")
      .select("uuid, username")
      .eq("uuid", currentUser.uuid)
      .maybeSingle();

    if (error || !data?.username) {
      setControlsEnabled(false);
      setStatus("Account not found in DB. Login again from the main page.");
      return false;
    }

    setControlsEnabled(true);
    return true;
  }

  function setRoom(code, role) {
    const cleanCode = sanitizeRoomCode(code);
    if (!cleanCode) return;

    const link = roomInviteLink(cleanCode);
    roomCard.classList.remove("hidden");
    roomCodeEl.textContent = cleanCode;
    roomLinkEl.value = link;

    if (role === "host") {
      roomRoleEl.textContent = "You are Host";
      roomHintEl.textContent = "Invite 1 friend using the code or link below.";
      setStatus("Creating online room...");
    } else {
      roomRoleEl.textContent = "You are Challenger";
      roomHintEl.textContent = "You joined this 1v1 room.";
      setStatus("Joining online room...");
    }

    currentRoom = cleanCode;
    currentRole = role;

    localStorage.setItem(roomKey, JSON.stringify({ code: cleanCode, role, updatedAt: Date.now() }));
    const url = new URL(window.location.href);
    url.searchParams.set("room", cleanCode);
    window.history.replaceState({}, "", url);

    void connectRoomOnline(cleanCode, role);
  }

  async function connectRoomOnline(code, role) {
    if (!(await ensureAuthenticatedUser())) return;

    if (role === "guest") {
      const exists = await roomExists(code);
      if (!exists) {
        setStatus("Room not found online. Check code.");
        return;
      }

      const count = await countPlayersInRoom(code);
      if (count >= 2) {
        setStatus("This room already has 2 players.");
        return;
      }
    }

    const playerOk = await registerPlayerRow(code, role);
    if (!playerOk) {
      setStatus("Could not register you in battle_players (column mismatch or RLS block).");
      return;
    }

    startRoomPolling();
  }

  async function createRoom() {
    if (!(await ensureAuthenticatedUser())) return;
    const code = randomRoomCode();
    setRoom(code, "host");
  }

  async function joinRoom() {
    if (!(await ensureAuthenticatedUser())) return;
    const cleanCode = sanitizeRoomCode(roomInput.value);
    roomInput.value = cleanCode;
    if (cleanCode.length !== 6) {
      setStatus("Room code must be 6 letters/numbers.");
      return;
    }
    setRoom(cleanCode, "guest");
  }

  function restoreLastRoom() {
    if (!currentUser?.username) return;

    const roomFromUrl = sanitizeRoomCode(new URLSearchParams(window.location.search).get("room"));
    if (roomFromUrl) {
      roomInput.value = roomFromUrl;
      setRoom(roomFromUrl, "guest");
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(roomKey) || "null");
      if (saved?.code) {
        setRoom(saved.code, saved.role === "guest" ? "guest" : "host");
      }
    } catch {}
  }

  createRoomBtn?.addEventListener("click", createRoom);
  joinRoomBtn?.addEventListener("click", joinRoom);

  roomInput?.addEventListener("input", () => {
    roomInput.value = sanitizeRoomCode(roomInput.value);
  });

  roomInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinRoom();
  });

  copyCodeBtn?.addEventListener("click", async () => {
    const ok = await copyText(roomCodeEl.textContent.trim());
    setStatus(ok ? "Room code copied." : "Could not copy code on this device.");
  });

  copyLinkBtn?.addEventListener("click", async () => {
    const ok = await copyText(roomLinkEl.value);
    setStatus(ok ? "Invite link copied." : "Could not copy link on this device.");
  });

  shareLinkBtn?.addEventListener("click", async () => {
    const link = roomLinkEl.value;
    if (!link) {
      setStatus("Create or join a room first.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Wordle Unbound Race",
          text: "Join my 1v1 race room!",
          url: link
        });
        setStatus("Share sheet opened.");
        return;
      } catch {}
    }

    const ok = await copyText(link);
    setStatus(ok ? "Share not available here, so link was copied instead." : "Could not share or copy the link.");
  });

  window.addEventListener("beforeunload", () => {
    if (roomPoller) clearInterval(roomPoller);
  });

  ensureAuthenticatedUser().then((ok) => {
    if (ok) {
      setStatus(`Logged in as ${currentUser.username}. Create or join a 1v1 room.`);
      restoreLastRoom();
    }
  });
})();
