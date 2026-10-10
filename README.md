# WordShift

WordShift is a browser-game hub, starting with a daily word puzzle, competitive 1v1 races, and artist-focused music guessing games.

**Play:** https://wordshift.dev

## Games

- **WordShift** — a daily word puzzle with adaptive word lengths, feedback, hints, accounts, and leaderboards.
- **Race mode** — create or join a private 1v1 room and race another player.
- **Track ID** — choose an artist catalog, starting with Imagine Dragons and Kanye West, then identify songs from short audio previews.

## Track ID

Open **https://wordshift.dev/track-id/**. The game has its own page and asset directory.

Choose Imagine Dragons or Kanye West before starting, then select Easy, Medium, or Hard. Each round begins with a clip labelled one second and progresses through the 2-second, 4-second, and 5-second stages as you skip. Correct guesses earn fewer base points at later stages, with difficulty affecting the final score. The selected artist's profile photo appears in the sound orb; a correct answer reveals the song cover and album details. After a correct guess, the audio continues for eight seconds before advancing automatically, with an option to move on immediately.

Song metadata and preview availability are fetched from the Apple Music/iTunes catalog and can vary by region. The game is a fan-made music quiz, unaffiliated with the featured artists. Audio-preview licensing still needs to be confirmed before public launch.

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
