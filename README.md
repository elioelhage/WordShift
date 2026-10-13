# WordShift

WordShift is a browser-game arcade with a daily word puzzle, competitive race mode, and music-recognition challenges.

**Play:** https://wordshift.dev

## Games

- **WordShift / Wordle** — daily word puzzle at `/wordle/`, with hints, themes, accounts, and leaderboard integration.
- **Track ID** — music recognition game at `/track-id/`, with filters for genre, era, and dozens of artists; five difficulty tiers; and progressive audio clues.
- **Race mode** — create or join a private 1v1 room at `/race/`.
- **Arcade** — browse available games at `/games/`.

## Track ID

Track ID follows a focused music-quiz flow: select a genre, era, artist, and difficulty; then identify each song from progressively longer clues (0.1, 0.5, 2, 8, and 15 seconds). A wrong guess or Skip advances to the next clue, and the final Skip reveals the track. The result displays its artwork, title, artist, and album. Playback can begin at the start or a random point; players can set the first clue length and volume. Filter/difficulty changes apply to the next track during an active round.

### Audio source note

The current adapter uses the iTunes Search API for metadata and promotional preview URLs. Apple's promotional previews may not be authorized for use as the entertainment content of a standalone guessing game. Before public production launch, replace this adapter with an appropriately licensed provider or obtain permission from the provider. Do not download, mirror, or cache preview audio.

## WordShift features

- Daily puzzle with adaptive word lengths and color feedback.
- Word validation, optional hints, and a light/dark presentation.
- Accounts, persistent stats, and leaderboard support.
- Private 1v1 races.
- A multi-game arcade hub.

## Project structure

```text
WordShift/
├── index.html
├── games/
├── wordle.html
├── wordle/
├── style.css
├── script.js
├── script-core.js
├── race/
├── leaderboard/
├── track-id/
│   ├── index.html
│   ├── track-id.css
│   ├── track-id.js
│   └── README.md
├── supabase/
└── backend/
```

## Local development

Serve the repository with a local web server rather than opening pages through `file://`, as browser APIs and external requests require a web origin. The frontend is static; the backend lives in `backend/`.

Never commit private backend credentials, service-role keys, or other secrets.

© 2026 Elio El Hage. All rights reserved.
