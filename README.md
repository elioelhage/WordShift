# Track ID

Track ID is WordShift's multi-artist song-guessing game at `/track-id/`.

## Gameplay prototype

- Choose between Imagine Dragons and Kanye West before a run.
- Ten-round runs with four colour-themed difficulties (the whole page re-tints to the selected tier):
  - **Easy** (green): hit list, five clips (1, 2, 3, 5, 8 s), unlimited guesses, x1.
  - **Medium** (amber): hits + deeper cuts, four clips (up to 5 s), unlimited guesses, x1.5.
  - **Hard** (red): deeper cuts only, three clips (up to 3 s); a wrong guess burns a clip, x2.
  - **Impossible** (purple): whole catalog, two clips (1, 2 s) taken from a random point mid-song; one wrong guess ends the round, x3.5.
- The first clip is 1.4 seconds of audio but is labelled one second.
- Points per clip shrink as you skip; difficulty multipliers are not disclosed on the site.
- Hit or miss (correct guess, "Give up & hear it", running out of clips, or a fatal wrong guess), the song plays out for eight seconds before advancing. After a win, playback resumes near the end of the clip *before* the one that cracked it (1 s win resumes near the end of the 1 s clip; 3 s win resumes near the end of the 2 s clip). After a miss it continues from the end of the last clip heard.
- Duplicate releases are grouped by normalized title; live/remix/etc. variants are filtered out where possible.
- Searchable song picker with keyboard support; correct answers reveal cover art and album.

## Important audio rights note

The current prototype uses the iTunes Search API's promotional preview URLs. Apple's published terms state that preview audio is meant to promote the related music and must not be used for independent entertainment value. A standalone song-guessing game appears to be outside that permission. Do not ship this implementation publicly with Apple-provided clips unless Apple provides permission or you replace the adapter with an appropriately licensed source. Do not download, mirror, or cache preview files.

The rest of the game logic is separated from catalog loading so a licensed provider can be substituted without redesigning the game.

## Local testing

Serve the repository with a local web server and open `/track-id/`. The page assets live in this directory. Catalog requests and audio playback need a browser with network access. Test loading failures, tracks without previews, and browser playback behavior before launch.