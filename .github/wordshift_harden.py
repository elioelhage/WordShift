#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# This script is intentionally idempotent. It converts the daily game to a
# server-authoritative flow without touching unrelated UI/auth/race code.

p = ROOT / 'script.js'
s = p.read_text()

old = """  // --- SUPABASE CONFIGURATION ---\n  // Keys are fetched from backend API (protected in Render environment variables)\n  const API_URL = 'https://wordshift-api.onrender.com'; // Change to your Render URL\n  let supabase = null;\n  \n  // Promise that resolves when Supabase is ready\n  const supabaseReady = (async () => {\n    try {\n      const res = await fetch(`${API_URL}/api/keys`);\n      const { supabaseUrl, supabaseKey } = await res.json();\n      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);\n      console.log('✅ Supabase initialized from backend keys');\n      return true;\n    } catch (err) {\n      console.error('Failed to fetch Supabase keys from backend:', err);\n      // Fallback: try to initialize with hardcoded keys (for development)\n      try {\n        supabase = window.supabase?.createClient(\n          'https://hcehsxnudbwjydvenlfz.supabase.co',\n          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImhjZWhzeG51ZGJ3anlkdmVubGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzY4NzAsImV4cCI6MjA5MDY1Mjg3MH0.dPawhX90yZrme7nftMTq6A1j-KGqfHZJ8QnbBeFurl8'\n        );\n        console.log('⚠️ Using fallback hardcoded keys (backend unavailable)');\n        return true;\n      } catch (fallbackErr) {\n        console.error('Failed to initialize Supabase:', fallbackErr);\n        return false;\n      }\n    }\n  })();\n\n  const WORD_SOURCE = \"supabase\";\n"""
new = """  // --- CLIENT CONFIGURATION ---\n  // The daily puzzle is server-authoritative. No daily answer, encryption key,\n  // or direct words-table query is allowed in browser code.\n  const API_URL = 'https://wordshift-api.onrender.com';\n  const DAILY_FUNCTION_URL = `${API_URL}/api/daily`;\n  let supabase = null;\n  const supabaseReady = (async () => {\n    try {\n      const res = await fetch(`${API_URL}/api/keys`);\n      if (!res.ok) throw new Error(`Key endpoint returned ${res.status}`);\n      const { supabaseUrl, supabaseKey } = await res.json();\n      if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase client configuration.');\n      supabase = window.supabase?.createClient(supabaseUrl, supabaseKey);\n      return Boolean(supabase);\n    } catch (err) {\n      console.error('Supabase client initialization failed:', err);\n      return false;\n    }\n  })();\n\n  const WORD_SOURCE = \"server\";\n"""
if old not in s:
    raise SystemExit('script.js: top config block not found')
s = s.replace(old, new, 1)

# Remove the legacy AES implementation and replace fetchTodaysWord with a session bootstrap.
start = s.index('  // NOTE: User requested client-side AES decryption with provided key.')
end = s.index('  armLoaderFailsafe();', start)
replacement = r'''  function generateUUID() { return crypto.randomUUID(); }

  async function dailyRequest(path, payload = {}) {
    const response = await fetch(`${DAILY_FUNCTION_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (!response.ok || !data?.ok) {
      const message = data?.message || `Daily service returned ${response.status}.`;
      const error = new Error(message);
      error.code = data?.code || `HTTP_${response.status}`;
      error.payload = data;
      throw error;
    }
    return data;
  }

  function getUserData() {
    let data = localStorage.getItem(userKey);
    if (!data) {
      data = { uuid: generateUUID(), username: null };
      localStorage.setItem(userKey, JSON.stringify(data));
    } else {
      try { data = JSON.parse(data); }
      catch { data = { uuid: generateUUID(), username: null }; localStorage.setItem(userKey, JSON.stringify(data)); }
    }
    return data;
  }

  let sessionToken = null;

  async function fetchTodaysWord() {
    const userData = getUserData();
    const localSeed = userData?.uuid || generateUUID();
    const session = await dailyRequest('/session', {
      dayIndex: solutionIndex,
      userUuid: userData?.username ? userData.uuid : null,
      sessionSeed: localSeed
    });

    sessionToken = session.sessionToken;
    wordLength = Number(session.wordLength) || 0;
    if (!wordLength) throw new Error('Server did not return a valid word length.');
    maxRows = Number(session.maxGuesses) || (wordLength <= 5 ? 6 : wordLength + 1);
    maxHints = wordLength >= 7 ? 3 : 2;

    const serverBoard = Array.isArray(session.boardState) ? session.boardState : [];
    if (serverBoard.length) {
      boardState = Array.from({ length: maxRows }, (_, i) => serverBoard[i] ?? null);
    }
    gameOver = Boolean(session.gameOver);
    if (typeof session.won === 'boolean') {
      // Preserve the terminal flag in local state; the answer itself is never sent unless the server ends the game.
      window.wordShiftServerWon = session.won;
    }

    // Signed-in leaderboard state is still synchronized through the existing account system.
    const userDataNow = getUserData();
    if (userDataNow.username && supabase) {
      try {
        const { data: remoteSync, error: syncErr } = await supabase
          .from('leaderboards')
          .select('saved_state')
          .eq('uuid', userDataNow.uuid)
          .maybeSingle();
        if (!syncErr && remoteSync?.saved_state) {
          const dbState = remoteSync.saved_state;
          const localState = loadState();
          if (dbState.solutionIndex === solutionIndex) {
            if (!localState || localState.solutionIndex !== solutionIndex ||
                (dbState.currentRow || 0) > (localState.currentRow || 0)) {
              localStorage.setItem(storageKey, JSON.stringify(dbState));
            }
          }
        }
      } catch (e) { console.error('Sync fetch failed:', e); }
    }
  }

'''
s = s[:start] + replacement + s[end:]

# Replace submitGuess implementation and remove getTileColors.
start = s.index('  async function submitGuess() {')
end = s.index('  function animateFlip(', start)
replacement = r'''  async function submitGuess() {
    if (!currentGuess || currentGuess.length !== wordLength) {
      showMessage(`Need ${wordLength} letters.`);
      shakeCurrentRow();
      return;
    }

    const guess = currentGuess.toUpperCase();
    isSubmitting = true;
    messageEl.classList.remove("show");
    wordLoadingEl.classList.remove("hidden");

    try {
      const result = await dailyRequest('/guess', {
        dayIndex: solutionIndex,
        sessionToken,
        guess,
        hintsUsed
      });

      const colors = Array.isArray(result.colors)
        ? result.colors.map(c => c === 'green' ? 'correct' : c === 'yellow' ? 'present' : 'absent')
        : [];
      boardState[currentRow] = { guess, colors };
      saveState(result.won ? true : null);
      animateFlip(currentRow, guess, colors);

      window.setTimeout(() => {
        if (result.gameOver) {
          gameOver = true;
          if (result.revealedWord) {
            window.wordShiftRevealedWord = String(result.revealedWord).toUpperCase();
          }
          if (result.won) {
            updateUserStats(true, result.guessesUsed || currentRow + 1, hintsUsed);
            showMessage("Solved.");
            showEndModal(true, true, result.revealedWord || null);
            saveState(true);
          } else {
            updateUserStats(false, result.guessesUsed || maxRows, hintsUsed);
            showMessage(result.revealedWord ? `The word was ${result.revealedWord}.` : "Out of guesses.");
            showEndModal(false, true, result.revealedWord || null);
            saveState(false);
          }
        } else {
          currentRow = Math.min((result.guessesUsed || currentRow + 1), maxRows - 1);
          currentGuess = "";
          updateBoard();
          saveState();
        }
        isSubmitting = false;
      }, wordLength * 280 + 420);
    } catch (error) {
      console.error('Daily guess failed:', error);
      if (error.code === 'INVALID_WORD') {
        showMessage(error.message || "That word is not accepted.");
        shakeCurrentRow();
      } else {
        showMessage("Could not submit your guess. Please try again.");
      }
      isSubmitting = false;
    } finally {
      wordLoadingEl.classList.add("hidden");
    }
  }

'''
s = s[:start] + replacement + s[end:]

# Replace hint implementation with server-side hints.
start = s.index('  function showHint() {')
end = s.index('  function handleKey(', start)
replacement = r'''  async function showHint() {
    if (gameOver || isSubmitting || hintsUsed >= maxHints) return;
    if (!sessionToken) {
      showMessage("Daily game is still loading.");
      return;
    }

    try {
      const result = await dailyRequest('/hint', {
        dayIndex: solutionIndex,
        sessionToken,
        hintsUsed,
        boardState
      });

      hintsUsed = Number(result.hintsUsed) || hintsUsed + 1;
      updateHintBadge();
      saveState();

      if (result.kind === 'letter' && result.letter) {
        showHintPopup("Letter hint", `The word contains the letter<br><span style="font-size:36px; color: var(--present);">${result.letter}</span>`);
        setTimeout(() => {
          const keyEl = document.getElementById(`key-${result.letter}`);
          if (keyEl) {
            keyEl.classList.add("hint-highlight-anim");
            updateKeyboardColor(result.letter, "present");
            setTimeout(() => keyEl.classList.remove("hint-highlight-anim"), 1000);
          }
        }, 400);
      } else if (result.kind === 'elimination' && Array.isArray(result.letters)) {
        result.letters.forEach(k => {
          updateKeyboardColor(k, "absent");
          const keyEl = document.getElementById(`key-${k}`);
          if (keyEl) {
            keyEl.classList.add("hint-eliminate-anim");
            setTimeout(() => keyEl.classList.remove("hint-eliminate-anim"), 1000);
          }
        });
        showHintPopup("Elimination", "Removed 3 incorrect letters<br>from your keyboard.");
      } else {
        showHintPopup(result.title || "Hint", result.body || "Use this hint to narrow the answer.");
      }
    } catch (error) {
      console.error('Daily hint failed:', error);
      showMessage(error.message || "Could not get a hint.");
    }
  }

'''
s = s[:start] + replacement + s[end:]

# Remove client answer use from validation.
old = '''  async function isValidWord(word) {\n    if (word.length !== wordLength) return false;\n    // Always accept the actual daily solution, even if external dictionary APIs\n    // do not recognize it (coverage gaps, outages, or proper nouns).\n    if (solution && word === solution.toLowerCase()) return true;\n    if (DAILY_WORDS.some(w => w.word.toLowerCase() === word)) return true;\n    if (!/^[a-z]+$/.test(word)) return false;\n    if (wordCache[word] !== undefined) return wordCache[word];\n\n    try {\n      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);\n      const result = response.ok;\n      wordCache[word] = result;\n      return result;\n    } catch {\n      wordCache[word] = false;\n      return false;\n    }\n  }\n'''
new = '''  async function isValidWord(word) {\n    // The authoritative daily validator lives on the server. This helper only\n    // checks local shape so we can fail fast before making a request.\n    if (word.length !== wordLength) return false;\n    return /^[a-z]+$/.test(word);\n  }\n'''
if old in s:
    s = s.replace(old, new, 1)

# Make end modal reveal only a server-provided word.
old = '''  function showEndModal(won, force = false) {\n    if (!force && localStorage.getItem(endModalSeenKey) === "1") return;\n    if (won) {\n      endTitle.innerHTML = `You got it, the word was <span class="modal-word-highlight">${solution}</span>`;\n    } else {\n      endTitle.innerHTML = `The word was <span class="modal-word-highlight">${solution}</span>`;\n    }\n    localStorage.setItem(endModalSeenKey, "1");\n    modal.classList.remove("hidden");\n    startCountdown();\n  }\n'''
new = '''  function showEndModal(won, force = false, revealedWord = null) {\n    if (!force && localStorage.getItem(endModalSeenKey) === "1") return;\n    const answer = revealedWord || window.wordShiftRevealedWord || "";\n    if (answer) {\n      endTitle.innerHTML = won\n        ? `You got it, the word was <span class="modal-word-highlight">${answer}</span>`\n        : `The word was <span class="modal-word-highlight">${answer}</span>`;\n    } else {\n      endTitle.textContent = won ? "You solved it." : "Round complete.";\n    }\n    localStorage.setItem(endModalSeenKey, "1");\n    modal.classList.remove("hidden");\n    startCountdown();\n  }\n'''
if old not in s:
    raise SystemExit('script.js: showEndModal block not found')
s = s.replace(old, new, 1)

# Remove answer-based infer helper.
old = '''  function inferWonFromState(state) {\n    if (!state?.gameOver) return false;\n    if (typeof state.won === "boolean") return state.won;\n    const rows = Array.isArray(state.boardState) ? state.boardState : [];\n    return rows.some((row) => row?.guess === solution);\n  }\n'''
new = '''  function inferWonFromState(state) {\n    return Boolean(state?.won ?? window.wordShiftServerWon);\n  }\n'''
if old in s:
    s = s.replace(old, new, 1)

# Ensure existing initialization does not require a client solution.
p.write_text(s)

# Race client: remove hardcoded fallback credentials while preserving normal Supabase access.
p = ROOT / 'race.js'
r = p.read_text()
old = '''  // Initialize Supabase with keys from backend\n  const supabaseReady = (async () => {\n    try {\n      const res = await fetch(`${API_URL}/api/keys`);\n      const { supabaseUrl, supabaseKey } = await res.json();\n      supabase = window.supabase?.createClient(supabaseUrl, supabaseKey);\n      console.log('✅ Supabase initialized from backend keys');\n      return Boolean(supabase);\n    } catch (err) {\n      console.error('Failed to fetch keys from backend:', err);\n      // Fallback: use hardcoded keys (for development)\n      try {\n        supabase = window.supabase?.createClient(\n          "https://hcehsxnudbwjydvenlfz.supabase.co",\n          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImhjZWhzeG51ZGJ3anlkdmVubGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzY4NzAsImV4cCI6MjA5MDY1Mjg3MH0.dPawhX90yZrme7nftMTq6A1j-KGqfHZJ8QnbBeFurl8"\n        );\n        console.log('⚠️ Using fallback hardcoded keys (backend unavailable)');\n        return Boolean(supabase);\n      } catch (fallbackErr) {\n        console.error('Failed to initialize Supabase:', fallbackErr);\n        return false;\n      }\n    }\n  })();\n'''
new = '''  // Initialize Supabase with runtime configuration only. Never fall back to committed credentials.\n  const supabaseReady = (async () => {\n    try {\n      const res = await fetch(`${API_URL}/api/keys`);\n      if (!res.ok) throw new Error(`Key endpoint returned ${res.status}`);\n      const { supabaseUrl, supabaseKey } = await res.json();\n      if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase client configuration.');\n      supabase = window.supabase?.createClient(supabaseUrl, supabaseKey);\n      return Boolean(supabase);\n    } catch (err) {\n      console.error('Failed to initialize Supabase:', err);\n      return false;\n    }\n  })();\n'''
if old not in r:
    raise SystemExit('race.js config block not found')
(ROOT / 'race.js').write_text(r.replace(old, new, 1))

# Backend: replace the key-only service with safe proxy endpoints for daily mode.
p = ROOT / 'backend' / 'api.js'
b = p.read_text()
b = b.replace("const cors = require('cors');\n", "const cors = require('cors');\nconst https = require('https');\n")
b = b.replace("const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;\n", "const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;\n")
marker = "// ============================================================\n// API ENDPOINTS\n// ============================================================\n"
insert = r'''// ============================================================
// DAILY SERVER-AUTHORITY PROXY
// ============================================================
function callSupabaseFunction(functionName, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/functions/v1/${functionName}`, supabaseUrl);
    const payload = JSON.stringify(body || {});
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        apikey: supabaseServiceRole,
        Authorization: `Bearer ${supabaseServiceRole}`
      }
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { raw += chunk; });
      response.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (_) {}
        resolve({ status: response.statusCode || 502, body: parsed || { ok: false, code: 'INVALID_UPSTREAM_RESPONSE' } });
      });
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

app.post('/api/daily/session', async (req, res) => {
  try {
    const result = await callSupabaseFunction('wordle-session', req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Daily session proxy failed:', error);
    res.status(502).json({ ok: false, code: 'DAILY_SERVICE_UNAVAILABLE' });
  }
});

app.post('/api/daily/guess', async (req, res) => {
  try {
    const result = await callSupabaseFunction('wordle-guess', req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Daily guess proxy failed:', error);
    res.status(502).json({ ok: false, code: 'DAILY_SERVICE_UNAVAILABLE' });
  }
});

app.post('/api/daily/hint', async (req, res) => {
  try {
    const result = await callSupabaseFunction('wordle-hint', req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Daily hint proxy failed:', error);
    res.status(502).json({ ok: false, code: 'DAILY_SERVICE_UNAVAILABLE' });
  }
});

'''
if marker not in b: raise SystemExit('backend api marker missing')
b = b.replace(marker, marker + insert, 1)
# Do not expose service-role key. Retain only the public client config endpoint for leaderboard/auth compatibility.
(ROOT / 'backend' / 'api.js').write_text(b)

# Add a server-side hint function.
hint = '''// @ts-nocheck\nimport { createClient } from "https://esm.sh/@supabase/supabase-js@2";\n\nconst corsHeaders = {\n  "Access-Control-Allow-Origin": "*",\n  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",\n  "Access-Control-Allow-Methods": "POST, OPTIONS"\n};\n\nfunction json(data: unknown, status = 200) {\n  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });\n}\n\nfunction isUuidLike(value: unknown) {\n  return typeof value === "string" && /^[0-9a-fA-F-]{30,80}$/.test(value);\n}\n\nasync function resolveWord(admin: any, dayIndex: number) {\n  const exact = await admin.from("words").select("word").eq("day_index", dayIndex).limit(1).maybeSingle();\n  if (!exact.error && exact.data?.word) return String(exact.data.word).toUpperCase();\n  throw new Error(exact.error?.message || "Word not found.");\n}\n\nfunction uniqueLetters(value: string) { return [...new Set(value.split(""))]; }\n\nDeno.serve(async (req) => {\n  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });\n  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);\n\n  try {\n    const body = await req.json().catch(() => ({}));\n    const dayIndex = Number(body?.dayIndex);\n    const sessionToken = String(body?.sessionToken || "").trim();\n    const hintsUsed = Number(body?.hintsUsed) || 0;\n    if (!Number.isFinite(dayIndex) || dayIndex < 0 || !sessionToken) return json({ ok: false, code: "BAD_REQUEST" }, 400);\n\n    const supabaseUrl = Deno.env.get("SUPABASE_URL");\n    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");\n    if (!supabaseUrl || !serviceRole) return json({ ok: false, code: "SERVER_CONFIG_ERROR" }, 500);\n\n    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });\n    const sessionRes = await admin.from("wordle_daily_sessions").select("id, day_index, guesses, game_over").eq("day_index", dayIndex).eq("session_token", sessionToken).maybeSingle();\n    if (sessionRes.error) return json({ ok: false, code: "SESSION_LOOKUP_FAILED" }, 500);\n    if (!sessionRes.data) return json({ ok: false, code: "SESSION_NOT_FOUND" }, 404);\n    if (sessionRes.data.game_over) return json({ ok: false, code: "GAME_OVER" }, 409);\n    if (hintsUsed < 0 || hintsUsed >= 3) return json({ ok: false, code: "NO_HINTS_LEFT" }, 400);\n\n    const answer = await resolveWord(admin, dayIndex);\n    const guesses = Array.isArray(sessionRes.data.guesses) ? sessionRes.data.guesses : [];\n    const guessedLetters = new Set();\n    const correctLetters = new Set();\n    for (const row of guesses) {\n      const guess = String(row?.guess || '').toUpperCase();\n      const colors = Array.isArray(row?.colors) ? row.colors : [];\n      guess.split('').forEach(ch => guessedLetters.add(ch));\n      for (let i = 0; i < Math.min(answer.length, colors.length); i += 1) {\n        if (colors[i] === 'green') correctLetters.add(guess[i]);\n      }\n    }\n\n    let result;\n    if (hintsUsed === 0) {\n      const counts = {};\n      for (const ch of answer) counts[ch] = (counts[ch] || 0) + 1;\n      const repeated = Object.values(counts).some((n: any) => Number(n) > 1);\n      result = { kind: "text", title: "Letter Pattern", body: repeated ? "This word contains repeated letters." : "This word doesn't contain repeated letters." };\n    } else if (hintsUsed === 1) {\n      const candidates = uniqueLetters(answer).filter(ch => !correctLetters.has(ch));\n      const letter = candidates.find(ch => !guessedLetters.has(ch)) || candidates[0];\n      result = letter ? { kind: "letter", letter } : { kind: "text", title: "You're close!", body: "You've found all the letters — now find their spots!" };\n    } else {\n      const alphabet = "QWERTYUIOPASDFGHJKLZXCVBNM".split('');\n      const letters = alphabet.filter(ch => !answer.includes(ch) && !guessedLetters.has(ch)).slice(0, 3);\n      result = { kind: "elimination", letters };\n    }\n\n    // Persist hint usage server-side, preventing free hint resets.\n    const currentHints = Number((sessionRes.data as any).hints_used || 0);\n    if (hintsUsed !== currentHints) {\n      await admin.from("wordle_daily_sessions").update({ hints_used: hintsUsed + 1, updated_at: new Date().toISOString() }).eq("id", sessionRes.data.id);\n    }\n\n    return json({ ok: true, hintsUsed: hintsUsed + 1, ...result });\n  } catch (error) {\n    return json({ ok: false, code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" }, 500);\n  }\n});\n'''
(ROOT / 'supabase/functions/wordle-hint').mkdir(parents=True, exist_ok=True)
(ROOT / 'supabase/functions/wordle-hint/index.ts').write_text(hint)

# Modify wordle-guess to return the answer only after terminal state and accept no client answer.
p = ROOT / 'supabase/functions/wordle-guess/index.ts'
g = p.read_text()
g = g.replace('    return json({\n      ok: true,\n      colors,\n      guessesUsed: guessCount,\n      requestCount,\n      gameOver,\n      won\n    });', '    return json({\n      ok: true,\n      colors,\n      guessesUsed: guessCount,\n      requestCount,\n      gameOver,\n      won,\n      ...(gameOver ? { revealedWord: answer } : {})\n    });')
p.write_text(g)

# Add hints_used to schema migration.
sql = ROOT / 'supabase/sql/2026-08-28_server_authority.sql'
sql.write_text('''-- WordShift server-authoritative daily mode hardening.\n\nalter table public.wordle_daily_sessions\n  add column if not exists hints_used integer not null default 0;\n\nalter table public.wordle_daily_sessions\n  drop constraint if exists wordle_daily_sessions_hints_used_chk;\n\nalter table public.wordle_daily_sessions\n  add constraint wordle_daily_sessions_hints_used_chk check (hints_used >= 0 and hints_used <= 3);\n\ncreate or replace function public.touch_wordle_daily_session_updated_at()\nreturns trigger\nlanguage plpgsql\nas $$\nbegin\n  new.updated_at = now();\n  return new;\nend;\n$$;\n''')

# Replace security docs with implementation-aligned summary.
(ROOT / 'SECURITY_AUDIT.md').write_text('''# WordShift Security\n\n## Current model\n\nDaily play is server-authoritative:\n\n```text\nBrowser\n  -> Render /api/daily/*\n  -> Supabase Edge Function\n  -> Supabase database\n```\n\nThe browser no longer contains the AES key, does not decrypt daily words, and does not query the `words` table for the answer. The server returns only word length/session state during initialization, guess colors during play, and the answer only after the server marks the game terminal.\n\nThe Supabase anon client configuration may still be used for non-sensitive account/leaderboard UI. It must never be treated as a secret.\n\n## Required deployment settings\n\nRender must define:\n\n- `SUPABASE_URL`\n- `SUPABASE_KEY`\n- `SUPABASE_SERVICE_ROLE_KEY`\n\nRotate any credential that has previously been committed to the repository.\n\n## Database protection\n\n`wordle_daily_sessions` and `word_dictionary` remain protected by RLS and are intended to be accessed by the Edge Functions with the service role only.\n''')

# Remove the committed backend credential file if it exists.
cfg = ROOT / 'backend/config.js'
if cfg.exists(): cfg.unlink()

# Remove the development ZIP from the repo if it exists.
for archive in ROOT.glob('WordShift-*.zip'):
    archive.unlink()

print('Applied WordShift server-authority hardening.')
''