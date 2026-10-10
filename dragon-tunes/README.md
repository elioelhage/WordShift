# Dragon Tunes

Dragon Tunes is the Imagine Dragons song-guessing game at `/dragon-tunes/`.

## Gameplay prototype

- Easy, Medium, and Hard song pools.
- Ten rounds per run.
- Playback starts at two seconds; each skip reveals one additional second, up to six.
- Score rewards earlier correct guesses.
- Duplicate album/single releases are grouped by normalized title; live, remix, acoustic, instrumental, remastered, and featured-artist variants are filtered out where possible.
- A custom searchable song picker supports mouse and keyboard navigation.
- Correct answers reveal song-cover art, album/artist details, and an artist photo when available.
- On a correct guess, the preview plays for eight seconds, then advances automatically; the user can advance sooner.

## Important audio rights note

The current prototype uses the iTunes Search API's promotional preview URLs. Apple's published terms state that preview audio is meant to promote the related music and must not be used for independent entertainment value. A standalone song-guessing game appears to be outside that permission. Do not ship this implementation publicly with Apple-provided clips unless Apple provides permission or you replace the adapter with an appropriately licensed source. Do not download, mirror, or cache preview files.

The rest of the game logic is separated from catalog loading so a licensed provider can be substituted without redesigning the game.

## Local testing

Serve the repository with a local web server and open `/dragon-tunes/`. Catalog requests and audio playback need a browser with network access. Test loading failures, tracks without previews, and browser playback behavior before launch.