# WordShift

WordShift is a browser-game arcade with a daily word puzzle, competitive race mode, and music-recognition challenges.

**Play:** https://wordshift.dev

## Games

- **WordShift / Wordle** — daily word puzzle at `/wordle/`, with hints, themes, accounts, and leaderboard integration.
- **Track ID** — music recognition game at `/track-id/`, with genre/era/artist filters and four difficulty tiers.
- **Race mode** — create or join a private 1v1 room at `/race/`.
- **Arcade** — browse available games at `/games/`.

## Track ID

Track ID uses ten rounds, ten points per correct song, and a maximum score of 100. The chosen clue length controls how many seconds of audio to play; an incorrect guess unlocks the next clue, while Skip reveals the answer. A correct answer or Skip plays the answer preview for about seven seconds before the next round. The result view shows artwork, title, artist, and album, along with a source link.

For Imagine Dragons, the new catalogue path builds song metadata from the Spotify Web API and enriches it with Soundcharts cumulative Spotify stream counts. The current stream-based bands are:

- **Easy:** 250 million streams or more.
- **Medium:** 75 million to under 250 million.
- **Hard:** 10 million to under 75 million.
- **Impossible:** under 10 million.

Songs without an available stream count are excluded from these bands; unknown counts are never treated as zero. This stream-count integration is currently scoped to Imagine Dragons for testing. Other artist selections still use the legacy catalogue until their Spotify/Soundcharts mapping is added.

The backend caches the enriched Imagine Dragons catalogue for 12 hours. The frontend needs the existing WordShift Render backend, with Spotify and Soundcharts credentials configured server-side. See [backend/README.md](backend/README.md) and [backend/.env.example](backend/.env.example).

### Audio source note

Spotify's Web API supplies metadata but is not used to extract preview audio. WordShift currently matches Spotify tracks with iTunes Search API promotional preview URLs. Apple's previews may not be authorized for a standalone song-guessing game, so confirm permission or replace the preview adapter with an appropriately licensed provider before public production. Do not download, mirror, or cache preview audio.

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
├── backend/
│   ├── api.js
│   ├── README.md
│   └── .env.example
└── supabase/
```

## Local development

Serve the repository with a local web server rather than opening pages through `file://`, as browser APIs and external requests require a web origin. The frontend is static; the backend lives in `backend/`.

Never commit private backend credentials, service-role keys, or other secrets.

© 2026 Elio El Hage. All rights reserved.
