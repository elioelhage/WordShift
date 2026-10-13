# Track ID

Track ID is WordShift's multi-artist song-guessing game at `/track-id/`.

## Gameplay prototype

- Choose between Imagine Dragons and Kanye West before a run.
- Ten-round runs with distinct Easy hit-list and Hard deeper-cut pools; Medium mixes both pools. If a tier lacks ten playable songs, it reports that rather than silently borrowing from another tier.
- The first clip is 1.4 seconds of audio but is labelled one second; later stages reveal 2.5, 4, and 5 seconds.
- Each stage has a different base score; difficulty affects the score awarded. The site does not disclose the multipliers.
- Duplicate album/single releases are grouped by normalized title; live, remix, acoustic, instrumental, remastered, and featured-artist variants are filtered out where possible.
- A custom searchable song picker supports mouse and keyboard navigation.
- The selected artist's profile image appears in the sound orb; correct answers reveal song-cover art and album details.
- On a correct guess, playback resumes about 0.4 seconds before the end of the guessing clip and continues for eight seconds before advancing automatically; the in-panel button can advance sooner.
- On an incorrect guess, the answer is revealed and a separate button lets the player hear the full eight-second preview before manually advancing.
- Artist and difficulty choices are grouped as pre-game setup and hidden during a run.

## Important audio rights note

The current prototype uses the iTunes Search API's promotional preview URLs. Apple's published terms state that preview audio is meant to promote the related music and must not be used for independent entertainment value. A standalone song-guessing game appears to be outside that permission. Do not ship this implementation publicly with Apple-provided clips unless Apple provides permission or you replace the adapter with an appropriately licensed source. Do not download, mirror, or cache preview files.

The rest of the game logic is separated from catalog loading so a licensed provider can be substituted without redesigning the game.

## Local testing

Serve the repository with a local web server and open `/track-id/`. The page assets live in this directory. Catalog requests and audio playback need a browser with network access. Test loading failures, tracks without previews, and browser playback behavior before launch.