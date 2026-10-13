# Track ID

Track ID is WordShift's browser-based music recognition game at `/track-id/`.

## Gameplay

- Ten rounds; ten points per correct answer; maximum score 100.
- Four color-coded difficulty tiers: Easy, Medium, Hard (red), and Impossible (purple). There is no Expert tier.
- The "Guess After" setting chooses the audio clip duration (0.1, 0.5, 2, 8, or 15 seconds). A wrong guess moves to the next clue. Skip reveals the current song immediately.
- A correct answer or Skip reveals artwork, title, artist and album, plays the answer preview for roughly seven seconds, then transitions to the next round. The tenth round remains on a results view with Play again.
- The Track ID favicon matches the WordShift Wordle favicon. Layout and filter carousels are responsive.

## Streaming-based song difficulty

For Imagine Dragons, the backend builds the playable catalogue from the Spotify Web API's Canadian album/single/compilation listings. Soundcharts then supplies cumulative Spotify stream counts for matched tracks. The first testing thresholds are:

- **Easy:** at least 250,000,000 streams.
- **Medium:** 75,000,000 to 249,999,999.
- **Hard:** 10,000,000 to 74,999,999.
- **Impossible:** fewer than 10,000,000.

Tracks with missing stream data do not enter any tier. If a tier has no eligible tracks, the UI asks the player to choose another tier instead of silently using the whole catalogue. These thresholds are initial cutoffs for testing Imagine Dragons and can be tuned after reviewing the resulting pool sizes.

The server caches the enriched catalogue for 12 hours. Configure the Render backend with `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SOUNDCHARTS_CLIENT_ID`, and `SOUNDCHARTS_CLIENT_SECRET`; `SOUNDCHARTS_TEAM_ID` is optional. Do not put provider secrets in browser code or commit them to GitHub. Setup notes: [backend/README.md](../backend/README.md).

If the Spotify/Soundcharts integration is not configured or fails, Track ID explicitly falls back to the previous iTunes-search catalog for playability. That fallback uses legacy rank-based selection and should not be presented as stream-based difficulty.

## Audio preview source

Spotify's Web API is used for track metadata, not for extracting preview audio. A separate iTunes Search API match supplies promotional previews. Verify that the preview source is licensed for standalone gameplay before production deployment; do not download, mirror, or cache previews.

## Testing

Run the repository with a local web server, configure the server-side environment variables, and test:
- Spotify album pagination and missing/unplayable previews.
- Soundcharts stream counts, missing metrics, and tier sizes.
- Wrong guesses, Skip, 7-second answer playback, automatic round transitions, and tenth-round completion.
- Mobile carousel and search behavior.
