# WordShift

WordShift is a browser-game arcade with a daily word puzzle, competitive race mode, and music-recognition challenges.

**Play:** https://wordshift.dev

## Games

- **WordShift / Wordle** — daily word puzzle at `/wordle/`, with hints, themes, accounts, and leaderboard integration.
- **Track ID** — music recognition game at `/track-id/`, with genre/era/artist filters and four difficulty tiers.
- **Song Hunt** — endless music deduction game at `/song-hunt/`, using artist, release year, genre, album, stream count, duration, and feature clues.
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

## Song Hunt

Song Hunt is a metadata-deduction game at `/song-hunt/`. It is separate from Track ID: no audio is played. Players search the available catalogue and compare each guess against the mystery song using artist, first release year, genre tags, album, cumulative Spotify streams, duration, and whether other artists are featured. Guess attempts are unlimited; personal wins, win rate, streak, and average winning guesses are saved locally in the browser.

### Initial catalogue and canonical versions

- The game is designed for multiple artists. The initial catalogue includes Imagine Dragons and Kanye West.
- Imagine Dragons has no stream-count cutoff. Kanye West tracks are included only when Soundcharts verifies at least **50 million cumulative Spotify streams**; tracks with unknown stream counts do not qualify.
- Live, acoustic, remix, demo, instrumental, karaoke, remastered, and other recognizable alternate-title versions are excluded. Deluxe, reissue, live, remix, and compilation album editions are filtered where identifiable. When multiple eligible releases share a normalized title and base artist, the earliest eligible release is selected as the canonical recording.
- Spotify provides artist-level genre tags rather than consistent per-track genre labels through this catalogue route, so the first release uses the artist profile's genre tags as the genre clue. A later data pass can add track-specific genre classifications.
- Catalogue metadata comes from Spotify and cumulative Spotify stream counts from Soundcharts. Missing counts are never presented as zero. The API caches the generated catalogue in server memory for 12 hours.
- Backend route: `GET /api/song-hunt/catalog` on the WordShift Render API. Spotify and Soundcharts credentials must already be configured as described in [backend/README.md](backend/README.md).

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
