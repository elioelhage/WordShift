# Track ID

Track ID is WordShift's browser-based music recognition game at `/track-id/`.

## Current interface and gameplay

- Three-column desktop layout that collapses to a mobile-friendly stacked layout.
- Filter the next track by genre, era, and artist. The artist picker includes a broad featured list and an "Any artist" option.
- Five difficulty tiers (Easy, Medium, Hard, Expert, Impossible) each have a distinct accent theme and use a different ranking band from the filtered catalog.
- Progressive clue durations: 0.1, 0.5, 2, 8, and 15 seconds. A miss or Skip unlocks the next duration; Skip at the 15-second stage reveals the track.
- Search suggestions are scoped to the current difficulty pool. A correct answer or final reveal shows artwork, title, artist, album, score, and a Next action.
- Playback can begin at the start or a random point, the starting clue duration is selectable, and volume is adjustable.
- Track filters and difficulty changes made during a round apply to the next track. Reroll all generates a new mix.
- The original WordShift Wordle page has been restored at `/wordle/` from the pre-Track ID homepage implementation.

## Catalog and audio source

The current adapter queries the iTunes Search API for metadata and promotional preview URLs. The repository's earlier notes flag a licensing concern: Apple promotional previews may not be authorized for use as the entertainment content of a standalone guessing game. Before public production launch, replace this adapter with an appropriately licensed audio/catalog provider or confirm permission from the provider. Do not download, mirror, or cache preview audio.

## Testing

The game is static HTML/CSS/JS. Run it through a local web server and verify:
- Catalog behavior with artist, genre, and era combinations.
- Preview loading/error states and browser playback permissions.
- Guess suggestions, clue progression, score behavior, and Next/Reroll flows.
- Desktop and mobile layouts, especially the horizontal filter reels.
