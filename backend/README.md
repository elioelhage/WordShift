# WordShift Backend

Express backend deployed on Render. It serves the existing Supabase configuration and a server-side music catalogue endpoint for Track ID.

## Environment variables

Configure these in the Render dashboard. Keep all real credentials in Render only; never commit them to the repository.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Existing WordShift Supabase project URL |
| `SUPABASE_KEY` | Existing Supabase public client key served to the current frontend |
| `SPOTIFY_CLIENT_ID` | Spotify Developer app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer app client secret |
| `SOUNDCHARTS_CLIENT_ID` | Soundcharts API client ID |
| `SOUNDCHARTS_CLIENT_SECRET` | Soundcharts API client secret |
| `SOUNDCHARTS_TEAM_ID` | Optional Soundcharts team name/ID when your account requires it |

A blank template is in `.env.example`. Do not replace those blank values with real credentials in GitHub.

## Track ID catalogue endpoint

`GET /api/track-id/catalog?artist=Imagine%20Dragons`

The first stream-tier integration is deliberately allowlisted to Imagine Dragons for testing.

1. Uses Spotify's Web API to paginate the artist's albums, singles and compilations and gather catalogue track metadata.
2. Matches Spotify song titles with Canadian iTunes Search results to obtain playable preview URLs. Spotify's Web API no longer provides a dependable preview URL; the iTunes preview remains a separate audio-source adapter.
3. Uses Soundcharts song audience data to enrich playable tracks with cumulative Spotify stream counts.
4. Caches the enriched artist catalogue in process memory for 12 hours to limit external API calls. Missing stream counts remain `null` and are not treated as zero.

Difficulty bands used by the frontend:
- Easy: at least 250,000,000 cumulative Spotify streams.
- Medium: 75,000,000 to 249,999,999.
- Hard: 10,000,000 to 74,999,999.
- Impossible: fewer than 10,000,000.

Tracks with unknown stream counts are excluded from all four bands. These bands are initial, configurable cutoffs for testing Imagine Dragons, not universal music-industry definitions.

The endpoint returns an actionable error if Spotify configuration is missing. Soundcharts plan/permission failures appear as unavailable stream data; the frontend does not fabricate stream counts.

## Required production setup

The backend process can start and pass `/health` while Song Hunt is still unable to create its catalogue. On the Render service named **WordShift**, set all four provider credentials in **Environment** before expecting Song Hunt to work:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SOUNDCHARTS_CLIENT_ID`
- `SOUNDCHARTS_CLIENT_SECRET`

Get each value from the corresponding provider account. Add the values directly in the Render dashboard; never commit them to GitHub or paste secret values into issue reports. Save the environment changes and let Render redeploy. Then run the **Song Hunt validation** workflow in GitHub Actions to test and warm the catalogue.

## Song Hunt catalogue endpoint

`GET /api/song-hunt/catalog`

Song Hunt is a metadata-only deduction game and does not use audio previews.

1. Loads the official album and single catalogue for Imagine Dragons and Kanye West from Spotify.
2. Skips compilations and recognizable alternate titles or album editions, including live, acoustic, remix, demo, instrumental, karaoke, remastered, deluxe, and reissue variants where identifiable.
3. Deduplicates normalized song titles per base artist and chooses the earliest eligible release as the canonical recording. If duplicate editions have the same release date, explicit original masters are preferred where identifiable.
4. Adds artist-level genre tags, first eligible release year, album, duration, and credited featured-artist status.
5. Uses Soundcharts cumulative Spotify audience data to verify stream counts. Imagine Dragons has no stream threshold. Kanye West tracks are included only when a stream count is available and at least 50,000,000.
6. Caches the entire generated catalogue in process memory for 12 hours. A missing stream count is not interpreted as zero.

**Genre limitation:** Spotify's artist catalogue metadata does not offer a consistent per-track genre field in this route. Initial Song Hunt genre clues use the main artist profile's genre tags. A future catalogue version can replace these with curated or per-track classifications.

## Spotify developer requirements

Spotify Developer Mode access is subject to Spotify's current account and endpoint eligibility rules. Verify that the app owner has the required Premium account and that the necessary catalogue endpoints are available to the app. Spotify credentials must only be used on this server, not from browser JavaScript.

## Local development

Run `npm start` with the environment variables above set. The existing server still requires Supabase environment values at startup. External catalogue calls require outbound network access and valid Spotify/Soundcharts API permissions.
