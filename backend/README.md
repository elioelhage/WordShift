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

## Spotify developer requirements

Spotify Developer Mode access is subject to Spotify's current account and endpoint eligibility rules. Verify that the app owner has the required Premium account and that the necessary catalogue endpoints are available to the app. Spotify credentials must only be used on this server, not from browser JavaScript.

## Local development

Run `npm start` with the environment variables above set. The existing server still requires Supabase environment values at startup. External catalogue calls require outbound network access and valid Spotify/Soundcharts API permissions.
