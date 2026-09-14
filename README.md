# WordShift

WordShift is a daily word game built around changing word lengths, fast feedback, optional hints, competitive statistics, and 1v1 race mode.

**Play:** https://wordshift.dev

## Features

- **Daily puzzle** — a new encrypted daily solution with a word length that can change from day to day.
- **Adaptive board** — the number of rows and hints adjusts to the current puzzle.
- **Word validation** — guesses are checked before they are submitted.
- **Hints** — limited daily hints provide help without giving away the entire answer.
- **Accounts** — save progress and statistics across sessions.
- **Leaderboard** — compare average guesses and overall play history.
- **Race mode** — create or join a private 1v1 room and race another player.
- **Themes** — light and dark presentation options, with additional theme support in the client.
- **Reveal word** — players can voluntarily end a daily game and see the solution; revealed games do not produce leaderboard results.

## How to Play

1. Open https://wordshift.dev.
2. Read the word-length indicator for the day.
3. Enter a word and press **Enter**.
4. Use the feedback to refine your next guess:
   - **Green** — the letter is correct and in the correct position.
   - **Yellow** — the letter is in the word but in another position.
   - **Gray** — the letter is not part of the solution.
5. Continue until you solve the word or run out of attempts.

The daily puzzle can also be played as a guest. An account is only required for account-based features such as persistent competitive statistics and leaderboard placement.

## Race Mode

Race mode is a separate 1v1 experience.

- Open **https://wordshift.dev/race**.
- Create a room or enter an existing room code.
- Share the room code with your opponent.
- Both players ready up before the race begins.
- Race results are handled separately from the daily puzzle leaderboard.

## Project Structure

```text
WordShift/
├── index.html          # Daily game
├── race.html            # Race lobby/game
├── leaderboard.html    # Leaderboard page
├── script.js            # Daily game logic
├── race.js              # Race mode logic
├── style.css            # Main styling
├── race.css             # Race styling
├── words.js             # Local/fallback word data
└── backend/             # Backend service used by the frontend
```

The extensionless public routes are:

- `https://wordshift.dev/`
- `https://wordshift.dev/race`
- `https://wordshift.dev/leaderboard`

## Technology

- Vanilla HTML, CSS, and JavaScript
- Supabase for persistent game/account data
- Render for the backend API used to provide protected configuration
- GitHub Pages for frontend hosting

## Local Development

The frontend is a static site. Open `index.html` through a local static server rather than relying on `file://` when testing browser APIs and external requests.

The backend lives in `backend/` and is deployed separately. Frontend configuration is retrieved from the backend at runtime.

## Data & Security

Daily solutions are stored encrypted and decrypted by the client when a puzzle is loaded. Account and leaderboard functionality uses Supabase through the configured application API.

Do not commit private backend credentials, service-role keys, or other secrets to the repository.

## Reporting a Bug

If something is broken, include:

- the page where it happened;
- the steps that reproduce it;
- your browser/device;
- the expected behavior;
- the actual behavior; and
- any relevant console error.

## Ownership

WordShift is an original project by **Elio El Hage**. The website, game implementation, visual design, and original project content are owned by the developer except where third-party software or services are used.

© 2026 Elio El Hage. All rights reserved.
