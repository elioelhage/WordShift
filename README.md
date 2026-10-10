# WordShift

WordShift is a browser-game hub, starting with a daily word puzzle, competitive 1v1 races, and artist-focused music guessing games.

**Play:** https://wordshift.dev

## Games

- **WordShift** — a daily word puzzle with adaptive word lengths, feedback, hints, accounts, and leaderboards.
- **Race mode** — create or join a private 1v1 room and race another player.
- **Dragon Tunes** — guess Imagine Dragons songs from progressively longer audio previews. Choose Easy, Medium, or Hard and play ten rounds.

## Dragon Tunes

Open **https://wordshift.dev/dragon-tunes**.

Each round starts with a two-second snippet. Skipping reveals one additional second, up to six seconds. Correct answers reward more points when fewer seconds were needed. A correct answer reveals the song and album artwork, an artist photo, and album details; the preview then plays for eight seconds before the next round starts automatically. Players can skip that wait and advance immediately. Song metadata and available previews are fetched from the Apple Music/iTunes catalog; preview availability can vary by region. The game displays attribution and a link back to Apple Music.

The music catalog is a third-party service. Song titles and recordings belong to their respective rights holders, and WordShift is not affiliated with Imagine Dragons.

## WordShift Features

- Daily puzzle and adaptive board.
- Word validation and optional hints.
- Accounts and persistent competitive statistics.
- Global leaderboard and 1v1 race mode.
- Light/dark presentation options.
- Reveal word; revealed games do not produce leaderboard results.

## How to Play WordShift

1. Open https://wordshift.dev.
2. Read the word-length indicator for the day.
3. Enter a word and press **Enter**.
4. Use feedback to refine your next guess: green means the letter is in the right position, yellow means the letter is in the word but another position, and gray means the letter is absent.
5. Continue until you solve the word or run out of attempts.

The daily puzzle can be played as a guest. An account is required only for account-based features such as persistent competitive statistics and leaderboard placement.

## Race Mode

- Open **https://wordshift.dev/race**.
- Create a room or enter an existing room code.
- Share the room code with your opponent.
- Both players ready up before the race begins.
- Race results are handled separately from the daily puzzle leaderboard.

## Project Structure

```text
WordShift/
├── index.html
├── style.css
├── script.js
├── script-core.js
├── race/
├── leaderboard/
├── dragon-tunes/
│   ├── index.html
│   ├── dragon-tunes.css
│   └── dragon-tunes.js
├── supabase/
└── backend/
```

## Technology

- Vanilla HTML, CSS, and JavaScript
- Supabase for persistent WordShift game/account data
- Render for the backend API used to provide protected configuration
- Static frontend hosting with Vercel-compatible routes

## Local Development

The frontend is static. Open pages through a local static server rather than relying on `file://` when testing browser APIs and external requests. The backend lives in `backend/` and is deployed separately.

Do not commit private backend credentials, service-role keys, or other secrets to the repository.

## Reporting a Bug

Include the page where it happened, reproduction steps, browser/device, expected behavior, actual behavior, and relevant console errors.

## Ownership

WordShift is an original project by **Elio El Hage**. Website code, game implementation, visual design, and original project content are owned by the developer except where third-party software or services are used.

© 2026 Elio El Hage. All rights reserved.
