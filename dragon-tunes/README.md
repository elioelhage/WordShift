# Dragon Tunes

Dragon Tunes is the Imagine Dragons song-guessing game at `/dragon-tunes/`.

## Gameplay prototype

- Easy, Medium, and Hard song pools.
- Ten rounds per run.
- Playback starts at one second; each skip reveals one additional second, up to five.
- Score rewards earlier correct guesses.
- Song titles and the available catalog are loaded dynamically, with a link back to Apple Music.

## Important audio rights note

The current prototype uses the iTunes Search API's promotional preview URLs. Apple's published terms state that preview audio is meant to promote the related music and must not be used for independent entertainment value. A standalone song-guessing game appears to be outside that permission. Do not ship this implementation publicly with Apple-provided clips unless Apple provides permission or you replace the adapter with an appropriately licensed source. Do not download, mirror, or cache preview files.

The rest of the game logic is separated from catalog loading so a licensed provider can be substituted without redesigning the game.

## Local testing

Serve the repository with a local web server and open `/dragon-tunes/`. Catalog requests and audio playback need a browser with network access. Test loading failures, tracks without previews, and browser playback behavior before launch.