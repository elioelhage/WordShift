/**
 * WORDSHIFT BACKEND API
 * Purpose: Serve Supabase credentials securely to frontend
 * The frontend uses these keys to access Supabase directly
 * Keys are protected in Render environment variables (not in code)
 */

const express = require('express');
const cors = require('cors');

// ============================================================
// ENVIRONMENT VARIABLES (set in Render dashboard)
// ============================================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const port = process.env.PORT || 3000;

// Validate env vars are set
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials!');
  console.error('Set SUPABASE_URL and SUPABASE_KEY in Render Environment variables');
  process.exit(1);
}

const app = express();
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// MIDDLEWARE
// ============================================================
// Enable CORS for all origins (frontend needs to fetch the keys)
app.use(cors());
app.use(express.json());

// ============================================================
// API ENDPOINTS
// ============================================================

// Root route (useful for Render URL checks)
app.get('/', (req, res) => {
  res.json({
    service: 'WordShift backend',
    status: 'online',
    endpoints: ['/health', '/api/keys', '/api/track-id/catalog', '/api/song-hunt/catalog']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve Supabase credentials to frontend (safe to expose from backend)
// Frontend will use these keys to connect to Supabase directly
app.get('/api/keys', (req, res) => {
  res.json({
    supabaseUrl: supabaseUrl,
    supabaseKey: supabaseKey
  });
});



// ============================================================
// TRACK ID: SPOTIFY CATALOGUE + SOUNDCHARTS STREAM COUNTS
// Credentials are server-side Render environment variables only.
// The first production rollout is intentionally limited to Imagine Dragons.
// ============================================================
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SOUNDCHARTS_CLIENT_ID = process.env.SOUNDCHARTS_CLIENT_ID;
const SOUNDCHARTS_CLIENT_SECRET = process.env.SOUNDCHARTS_CLIENT_SECRET;
const SOUNDCHARTS_TEAM_ID = process.env.SOUNDCHARTS_TEAM_ID || "";

const TRACK_ID_ARTISTS = {
  "imagine dragons": {
    displayName: "Imagine Dragons",
    spotifyId: "53XhwfbYqKCa1cC15pYq2q"
  }
};
const TRACK_ID_CACHE_MS = 12 * 60 * 60 * 1000;
const spotifyTokens = { token: "", expiresAt: 0 };
const soundchartsTokens = { token: "", expiresAt: 0 };
const trackCatalogCache = new Map();
let activeImagineDragonsBuild = null;

function trackIdError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizeTrackText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeTrackTitle(value) {
  const cleaned = String(value || "")
    .replace(/\s*[\[(]\s*(?:\d{4}\s+)?(?:remaster(?:ed)?|radio edit|single version|album version|explicit version|bonus track|deluxe edition)[^\])]*[\])]\s*$/i, "")
    .replace(/\s+[-–]\s+(?:\d{4}\s+)?(?:remaster(?:ed)?|radio edit|single version|album version|explicit version|bonus track|deluxe edition).*$/i, "");
  return normalizeTrackText(cleaned)
    .replace(/\b(remaster(ed)?(\s+version)?|radio edit|single version|album version|explicit version|bonus track|deluxe edition)\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

async function readJsonResponse(response, provider) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerMessage = body.error_description || body.message || body.error || response.statusText;
    const error = trackIdError(
      response.status === 401 || response.status === 403 ? 502 : response.status,
      provider.toUpperCase() + "_HTTP_" + response.status,
      provider + " request failed (" + response.status + "): " + providerMessage
    );
    error.providerStatus = response.status;
    throw error;
  }
  return body;
}

async function getSpotifyToken(forceRefresh = false) {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw trackIdError(503, "SPOTIFY_NOT_CONFIGURED",
      "Spotify is not configured on the WordShift backend. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Render.");
  }
  if (!forceRefresh && spotifyTokens.token && spotifyTokens.expiresAt > Date.now() + 30000) {
    return spotifyTokens.token;
  }

  const credentials = Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await readJsonResponse(response, "Spotify authentication");
  if (!data.access_token) {
    throw trackIdError(502, "SPOTIFY_TOKEN_MISSING", "Spotify authentication did not return an access token.");
  }
  spotifyTokens.token = data.access_token;
  spotifyTokens.expiresAt = Date.now() + Math.max(60, Number(data.expires_in) || 3600) * 1000;
  return spotifyTokens.token;
}

async function spotifyGet(path, retry = true) {
  const token = await getSpotifyToken();
  const response = await fetch("https://api.spotify.com/v1" + path, {
    headers: { "Authorization": "Bearer " + token }
  });
  if (response.status === 401 && retry) {
    await getSpotifyToken(true);
    return spotifyGet(path, false);
  }
  if (response.status === 429) {
    throw trackIdError(503, "SPOTIFY_RATE_LIMITED",
      "Spotify is rate-limiting catalogue requests. Wait a moment and retry.");
  }
  return readJsonResponse(response, "Spotify");
}

async function getSoundchartsToken(forceRefresh = false) {
  if (!SOUNDCHARTS_CLIENT_ID || !SOUNDCHARTS_CLIENT_SECRET) {
    throw trackIdError(503, "SOUNDCHARTS_NOT_CONFIGURED",
      "Soundcharts is not configured on the WordShift backend. Add SOUNDCHARTS_CLIENT_ID and SOUNDCHARTS_CLIENT_SECRET in Render.");
  }
  if (!forceRefresh && soundchartsTokens.token && soundchartsTokens.expiresAt > Date.now() + 30000) {
    return soundchartsTokens.token;
  }

  const credentials = Buffer.from(SOUNDCHARTS_CLIENT_ID + ":" + SOUNDCHARTS_CLIENT_SECRET).toString("base64");
  const form = new URLSearchParams({ grant_type: "client_credentials" });
  if (SOUNDCHARTS_TEAM_ID) form.set("team_id", SOUNDCHARTS_TEAM_ID);
  const response = await fetch("https://account.soundcharts.com/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const data = await readJsonResponse(response, "Soundcharts authentication");
  if (!data.access_token) {
    throw trackIdError(502, "SOUNDCHARTS_TOKEN_MISSING",
      "Soundcharts authentication did not return an access token.");
  }
  soundchartsTokens.token = data.access_token;
  soundchartsTokens.expiresAt = Date.now() + Math.max(60, Number(data.expires_in) || 3600) * 1000;
  return soundchartsTokens.token;
}

async function soundchartsGet(path, retry = true) {
  const token = await getSoundchartsToken();
  const response = await fetch("https://customer.api.soundcharts.com" + path, {
    headers: { "Authorization": "Bearer " + token }
  });
  if (response.status === 401 && retry) {
    await getSoundchartsToken(true);
    return soundchartsGet(path, false);
  }
  return readJsonResponse(response, "Soundcharts");
}

async function mapWithConcurrency(items, concurrency, task) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchSpotifyAlbums(artistId) {
  const albums = new Map();
  let offset = 0;
  let total = 0;
  const pageSize = 10;

  do {
    const query = new URLSearchParams({
      include_groups: "album,single,compilation",
      market: "CA",
      limit: String(pageSize),
      offset: String(offset)
    });
    const response = await spotifyGet("/artists/" + encodeURIComponent(artistId) + "/albums?" + query.toString());
    for (const album of (response.items || [])) {
      if (album && album.id && !albums.has(album.id)) albums.set(album.id, album);
    }
    total = Number(response.total) || albums.size;
    offset += pageSize;
  } while (offset < total && offset < 500);

  return [...albums.values()];
}

async function fetchAlbumTracks(album) {
  const tracks = [];
  let offset = 0;
  let total = 0;
  do {
    const query = new URLSearchParams({ market: "CA", limit: "50", offset: String(offset) });
    const response = await spotifyGet("/albums/" + encodeURIComponent(album.id) + "/tracks?" + query.toString());
    for (const track of (response.items || [])) {
      if (!track || !track.id || track.is_local) continue;
      tracks.push({
        id: track.id,
        title: track.name || "",
        artist: (track.artists || []).map((artist) => artist.name).join(", "),
        album: album.name || "",
        artworkUrl: (album.images || []).find((image) => image && image.url)?.url || "",
        releaseDate: album.release_date || "",
        duration: Number(track.duration_ms) || 0,
        spotifyUrl: track.external_urls?.spotify || ("https://open.spotify.com/track/" + track.id),
        isrc: "",
        genre: catalogueGenre,
        previewUrl: ""
      });
    }
    total = Number(response.total) || tracks.length;
    offset += 50;
  } while (offset < total && offset < 250);
  return tracks;
}

async function fetchApplePreviews(artistName) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", artistName);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", "ca");
  url.searchParams.set("limit", "200");
  const response = await fetch(url.toString());
  const data = await readJsonResponse(response, "iTunes preview lookup");
  return (data.results || []).filter((item) => item.trackName && item.artistName && item.previewUrl).map((item) => ({
    title: item.trackName,
    artist: item.artistName,
    previewUrl: item.previewUrl,
    appleTrackId: String(item.trackId || ""),
    artworkUrl: item.artworkUrl100 || ""
  }));
}

async function fetchApplePreviewForTrack(track, artistName) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", track.title + " " + artistName);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", "ca");
  url.searchParams.set("limit", "12");
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  const candidates = (data.results || []).filter((item) =>
    item.trackName && item.artistName && item.previewUrl
  ).map((item) => ({
    title: item.trackName,
    artist: item.artistName,
    previewUrl: item.previewUrl,
    appleTrackId: String(item.trackId || ""),
    artworkUrl: item.artworkUrl100 || ""
  }));
  return matchApplePreview(track, candidates);
}

function matchApplePreview(track, previews) {
  const targetTitle = normalizeTrackTitle(track.title);
  const targetArtist = normalizeTrackText(track.artist);
  let matches = previews.filter((preview) =>
    normalizeTrackTitle(preview.title) === targetTitle &&
    (normalizeTrackText(preview.artist).includes("imagine dragons") || targetArtist.includes(normalizeTrackText(preview.artist)))
  );
  if (!matches.length) {
    matches = previews.filter((preview) =>
      normalizeTrackTitle(preview.title) === targetTitle &&
      normalizeTrackText(preview.artist).includes("imagine dragons")
    );
  }
  return matches[0] || null;
}

function unwrapSoundchartsItem(payload) {
  return payload?.item || payload?.data?.item || payload?.data || payload;
}

function extractSongUuid(payload) {
  const item = unwrapSoundchartsItem(payload);
  return item?.uuid || item?.song?.uuid || item?.data?.uuid || null;
}

function extractLatestCumulativeStreamCount(payload) {
  const item = payload?.item || payload?.data?.item || payload?.data || payload;
  const entries = Array.isArray(item?.items) ? item.items
    : Array.isArray(item?.data?.items) ? item.data.items
    : Array.isArray(payload?.items) ? payload.items
    : [];
  const points = entries
    .filter((entry) => entry?.value !== null && entry?.value !== undefined && entry?.value !== "" && Number.isFinite(Number(entry.value)))
    .sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));
  if (points.length) return Math.max(0, Math.trunc(Number(points[0].value)));
  const direct = item?.spotifyStreams ?? item?.spotifyStream ?? item?.streamCount ??
    item?.audience?.spotify?.streams ?? item?.stats?.spotifyStreams;
  if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) {
    return Math.max(0, Math.trunc(Number(direct)));
  }
  return null;
}

async function getSpotifyStreamCount(trackId) {
  const metadata = await soundchartsGet(
    "/api/v2.25/song/by-platform/spotify/" + encodeURIComponent(trackId)
  );
  const uuid = extractSongUuid(metadata);
  if (!uuid) return null;

  const today = new Date().toISOString().slice(0, 10);
  const query = new URLSearchParams({
    startDate: "2010-01-01",
    endDate: today,
    limit: "100",
    sort: "desc"
  });
  const audience = await soundchartsGet(
    "/api/v2/song/" + encodeURIComponent(uuid) + "/audience/spotify?" + query.toString()
  );
  return extractLatestCumulativeStreamCount(audience);
}

async function buildImagineDragonsCatalog() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw trackIdError(503, "SPOTIFY_NOT_CONFIGURED",
      "Spotify is not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the Render backend.");
  }
  if (!SOUNDCHARTS_CLIENT_ID || !SOUNDCHARTS_CLIENT_SECRET) {
    throw trackIdError(503, "SOUNDCHARTS_NOT_CONFIGURED",
      "Soundcharts is not configured. Add SOUNDCHARTS_CLIENT_ID and SOUNDCHARTS_CLIENT_SECRET in the Render backend.");
  }

  const artist = TRACK_ID_ARTISTS["imagine dragons"];
  let artistGenres = [];
  try {
    const metadata = await spotifyGet("/artists/" + encodeURIComponent(artist.spotifyId));
    artistGenres = Array.isArray(metadata.genres) ? metadata.genres : [];
  } catch (error) {
    // Spotify sometimes omits or restricts artist genre metadata; catalogue retrieval
    // should still work, but the UI will use the generic rock tag in that case.
    console.warn("Spotify artist genres unavailable:", error.message);
  }
  const catalogueGenre = artistGenres.join(", ") || "Rock";
  const albums = await fetchSpotifyAlbums(artist.spotifyId);
  if (!albums.length) {
    throw trackIdError(502, "SPOTIFY_EMPTY_CATALOG", "Spotify returned no Imagine Dragons releases for Canada.");
  }

  const albumBatches = await mapWithConcurrency(albums, 5, async (album) => {
    try { return await fetchAlbumTracks(album); }
    catch (error) {
      if (error.providerStatus === 403) throw error;
      console.warn("Spotify album track lookup failed:", album.name, error.message);
      return [];
    }
  });

  const uniqueTracks = new Map();
  for (const track of albumBatches.flat()) {
    const key = normalizeTrackTitle(track.title) + "|" + normalizeTrackText(track.artist);
    const previous = uniqueTracks.get(key);
    // Prefer the first official release in Spotify's album order; avoid listing
    // duplicate album/single editions as different answers.
    if (!previous) uniqueTracks.set(key, track);
  }
  const spotifyTracks = [...uniqueTracks.values()];
  if (!spotifyTracks.length) {
    throw trackIdError(502, "SPOTIFY_EMPTY_TRACKS", "Spotify returned releases but no readable track listings.");
  }

  const previews = await fetchApplePreviews(artist.displayName);
  const previewByTrackId = new Map();
  const withoutBroadPreview = [];
  for (const track of spotifyTracks) {
    const preview = matchApplePreview(track, previews);
    if (preview) previewByTrackId.set(track.id, preview);
    else withoutBroadPreview.push(track);
  }

  // The broad artist lookup is efficient but often repeats popular album/single
  // versions. Do targeted title lookups for a capped batch of missing Spotify
  // tracks to make the playable catalog deeper without hammering the preview API.
  const targetedCandidates = withoutBroadPreview.slice(0, 120);
  await mapWithConcurrency(targetedCandidates, 5, async (track) => {
    try {
      const preview = await fetchApplePreviewForTrack(track, artist.displayName);
      if (preview) previewByTrackId.set(track.id, preview);
    } catch (error) {
      console.warn("Targeted preview lookup failed:", track.title, error.message);
    }
    return null;
  });

  const matchedTracks = spotifyTracks.map((track) => {
    const preview = previewByTrackId.get(track.id);
    return {
      ...track,
      previewUrl: preview?.previewUrl || "",
      artworkUrl: track.artworkUrl || preview?.artworkUrl || ""
    };
  }).filter((track) => track.previewUrl);

  // Keep the stream enrichment bounded and sequentially cached per whole artist.
  // Soundcharts returns null for songs it does not track; missing data is never
  // treated as zero streams or silently assigned to Impossible.
  let soundchartsUnavailable = false;
  const enriched = await mapWithConcurrency(matchedTracks, 5, async (track) => {
    if (soundchartsUnavailable) return { ...track, streamCount: null };
    try {
      const streamCount = await getSpotifyStreamCount(track.id);
      return { ...track, streamCount };
    } catch (error) {
      if (error.providerStatus === 403 || error.code === "SOUNDCHARTS_HTTP_403") {
        soundchartsUnavailable = true;
      } else if (error.providerStatus !== 404 && error.code !== "SOUNDCHARTS_HTTP_404") {
        console.warn("Soundcharts stream lookup failed for a Spotify track:", track.title, error.message);
      }
      return { ...track, streamCount: null };
    }
  });

  const withStreams = enriched.filter((track) => Number.isFinite(track.streamCount)).length;
  return {
    artist: artist.displayName,
    source: "spotify+soundcharts",
    previewSource: "iTunes Search",
    updatedAt: new Date().toISOString(),
    spotifyAlbumsFound: albums.length,
    spotifyTracksFound: spotifyTracks.length,
    previewableTracks: matchedTracks.length,
    tracksWithStreamCounts: withStreams,
    streamStatsStatus: soundchartsUnavailable ? "not-authorized" : (withStreams ? "available" : "missing"),
    difficultyThresholds: {
      easyMin: 250000000,
      mediumMin: 75000000,
      hardMin: 10000000,
      impossibleMaxExclusive: 10000000
    },
    tracks: enriched
  };
}

// One cached, rate-bounded artist catalogue is shared by all Track ID clients.
app.get('/api/track-id/catalog', async (req, res) => {
  const key = normalizeTrackText(req.query.artist || "");
  const artist = TRACK_ID_ARTISTS[key];
  if (!artist) {
    return res.status(400).json({
      error: "Unsupported artist",
      message: "Spotify streaming-catalog integration is currently enabled for Imagine Dragons only."
    });
  }

  const cacheKey = key;
  const cached = trackCatalogCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ ...cached.payload, cached: true });
  }

  try {
    if (!activeImagineDragonsBuild) {
      activeImagineDragonsBuild = buildImagineDragonsCatalog();
    }
    const payload = await activeImagineDragonsBuild;
    trackCatalogCache.set(cacheKey, { payload, expiresAt: Date.now() + TRACK_ID_CACHE_MS });
    return res.json({ ...payload, cached: false });
  } catch (error) {
    console.error("Track ID catalogue failed:", error.code || "", error.message);
    return res.status(error.status || 502).json({
      error: error.code || "TRACK_ID_CATALOG_FAILED",
      message: error.message || "The Spotify/Soundcharts catalogue could not be loaded."
    });
  } finally {
    activeImagineDragonsBuild = null;
  }
});



// ============================================================
// SONG HUNT: METADATA DEDUCTION CATALOG
// A separate metadata-only game. No audio previews are required.
// Stream counts are verified through Soundcharts; missing counts are
// never fabricated. Kanye West songs must have at least 50M streams.
// ============================================================
const SONG_HUNT_ARTISTS = [
  {
    key: "imagine dragons",
    displayName: "Imagine Dragons",
    spotifyId: "53XhwfbYqKCa1cC15pYq2q",
    defaultGenre: "Rock",
    minimumStreams: null
  },
  {
    key: "kanye west",
    displayName: "Kanye West",
    spotifyId: "5K4W6rqBFWDnAN6FQUkS6x",
    defaultGenre: "Hip-Hop",
    minimumStreams: 50000000
  }
];
const SONG_HUNT_CACHE_MS = 12 * 60 * 60 * 1000;
let songHuntCatalogCache = null;
let activeSongHuntCatalogBuild = null;

function isSongHuntAlternateTitle(title) {
  const value = String(title || "");
  const alternateInBrackets = /[\[(][^\])]*(?:\blive\b|\bacoustic\b|\bremix(?:ed)?\b|\bdemo\b|\binstrumental\b|\bkaraoke\b|\bsped up\b|\bslowed(?: down)?\b|\bnightcore\b|\breimagined\b|\borchestral\b|\bpiano version\b|\bstripped\b|\bunplugged\b|\bcover\b|\bremaster(?:ed)?\b|\bre-record(?:ed|ing)?\b)[^\])]*[\])]/i;
  const alternateSuffix = /\s[-–:]\s*(?:(?:\d{4}\s+)?(?:live|acoustic|remix(?:ed)?|demo|instrumental|karaoke|sped up|slowed(?: down)?|nightcore|reimagined|orchestral|piano version|stripped|unplugged|cover|remaster(?:ed)?|re-record(?:ed|ing)?))(?:\s|$)/i;
  const alternateEnding = /\b(?:live|acoustic|remix(?:ed)?|demo|instrumental|karaoke|sped up|slowed(?: down)?|nightcore|reimagined|orchestral|piano version|stripped|unplugged|cover|remaster(?:ed)?|re-record(?:ed|ing)?)\s+(?:version|edit|recording|mix)\s*$/i;
  return alternateInBrackets.test(value) || alternateSuffix.test(value) || alternateEnding.test(value);
}

function isSongHuntAlternateAlbum(title) {
  return /\b(?:live|deluxe|expanded|anniversary|greatest hits|best of|remaster(?:ed)?|remix|acoustic|karaoke|instrumentals|reissue|special edition|super deluxe|collector'?s edition|bonus tracks)\b/i.test(String(title || ""));
}

function cleanSongHuntTitle(title) {
  return String(title || "")
    .replace(/\s*[\[(]\s*(?:feat(?:uring)?|ft)\.?\s+[^\])]+[\])]/ig, "")
    .replace(/\s+(?:feat(?:uring)?|ft)\.?\s+.+$/ig, "")
    .replace(/\s*[\[(]\s*(?:single version|album version|remaster(?:ed)?(?:\s+\d{4})?)[^\])]*[\])]\s*$/i, "")
    .trim();
}

function songHuntTitleKey(title) {
  return normalizeTrackText(cleanSongHuntTitle(title))
    .replace(/\b(?:the original|original version)\b/g, "")
    .trim();
}

function formatSongHuntGenreTag(value) {
  return String(value || "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function chooseSongHuntGenres(rawGenres, fallback) {
  const cleaned = (Array.isArray(rawGenres) ? rawGenres : [])
    .map(formatSongHuntGenreTag)
    .filter(Boolean);
  const unique = [...new Set(cleaned)].slice(0, 4);
  return unique.length ? unique : [fallback];
}

async function getSongHuntArtistGenres(artist) {
  try {
    const profile = await spotifyGet("/artists/" + encodeURIComponent(artist.spotifyId));
    return chooseSongHuntGenres(profile.genres, artist.defaultGenre);
  } catch (error) {
    console.warn("Song Hunt artist genres unavailable for " + artist.displayName + ":", error.message);
    return [artist.defaultGenre];
  }
}

async function fetchSongHuntAlbumTracks(album) {
  const tracks = [];
  let offset = 0;
  let total = 0;
  do {
    const query = new URLSearchParams({ market: "CA", limit: "50", offset: String(offset) });
    const response = await spotifyGet("/albums/" + encodeURIComponent(album.id) + "/tracks?" + query.toString());
    for (const track of (response.items || [])) {
      if (!track || !track.id || track.is_local || !track.name) continue;
      tracks.push({
        id: track.id,
        title: track.name,
        artists: (track.artists || []).map((artist) => ({ id: artist.id || "", name: artist.name || "" })),
        album: album.name || "",
        albumType: album.album_type || "album",
        albumReleaseDate: album.release_date || "",
        albumTotalTracks: Number(album.total_tracks) || 0,
        trackNumber: Number(track.track_number) || 0,
        releaseDate: album.release_date || "",
        durationMs: Number(track.duration_ms) || 0,
        explicit: Boolean(track.explicit),
        spotifyUrl: track.external_urls?.spotify || ("https://open.spotify.com/track/" + track.id),
        artworkUrl: (album.images || []).find((image) => image && image.url)?.url || ""
      });
    }
    total = Number(response.total) || tracks.length;
    offset += 50;
  } while (offset < total && offset < 250);
  return tracks;
}

function isBetterSongHuntRecording(candidate, previous) {
  const candidateDate = String(candidate.releaseDate || "9999");
  const previousDate = String(previous.releaseDate || "9999");
  if (candidateDate !== previousDate) return candidateDate < previousDate;
  // If the same title was issued on the same date in clean and explicit editions,
  // prefer the explicit original master as the canonical version.
  if (candidate.explicit !== previous.explicit) return candidate.explicit;
  if (candidate.albumType !== previous.albumType) {
    if (candidate.albumType === "single") return true;
    if (previous.albumType === "single") return false;
  }
  return false;
}

function parseSongHuntYear(releaseDate) {
  const match = String(releaseDate || "").match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

async function buildSongHuntArtistCatalog(artist) {
  const [genres, albums] = await Promise.all([
    getSongHuntArtistGenres(artist),
    fetchSpotifyAlbums(artist.spotifyId)
  ]);
  const eligibleAlbums = albums
    .filter((album) => album && album.id && album.album_type !== "compilation" && !isSongHuntAlternateAlbum(album.name))
    .sort((a, b) => String(a.release_date || "9999").localeCompare(String(b.release_date || "9999")));

  const albumBatches = await mapWithConcurrency(eligibleAlbums, 5, async (album) => {
    try {
      return await fetchSongHuntAlbumTracks(album);
    } catch (error) {
      if (error.providerStatus === 403) throw error;
      console.warn("Song Hunt album track lookup failed:", album.name, error.message);
      return [];
    }
  });

  const canonical = new Map();
  for (const raw of albumBatches.flat()) {
    if (!raw || isSongHuntAlternateTitle(raw.title)) continue;
    if (raw.artists.length && !raw.artists.some((credited) => credited.id === artist.spotifyId)) continue;

    const title = cleanSongHuntTitle(raw.title);
    const keyTitle = songHuntTitleKey(title);
    if (!keyTitle) continue;

    const creditedOthers = raw.artists
      .filter((credited) => credited.id && credited.id !== artist.spotifyId)
      .map((credited) => credited.name)
      .filter(Boolean);
    const titleFeature = String(raw.title).match(/(?:feat(?:uring)?|ft)\.?\s*([^\])]+)/i);
    const titleFeatureNames = titleFeature
      ? titleFeature[1].replace(/[\])]+$/g, "").split(/\s*(?:,|&| and )\s*/i).map((name) => name.trim()).filter(Boolean)
      : [];
    const featuredArtists = [...new Set([...creditedOthers, ...titleFeatureNames])];

    const candidate = {
      id: raw.id,
      title,
      artist: artist.displayName,
      artistId: artist.spotifyId,
      genres,
      genre: genres[0] || artist.defaultGenre,
      album: raw.album,
      albumType: raw.albumType,
      releaseDate: raw.releaseDate,
      year: parseSongHuntYear(raw.releaseDate),
      streamCount: null,
      durationMs: raw.durationMs,
      isFeatured: featuredArtists.length > 0,
      featuredArtists,
      spotifyUrl: raw.spotifyUrl,
      artworkUrl: raw.artworkUrl,
      explicit: raw.explicit
    };
    const key = artist.key + "|" + keyTitle;
    const previous = canonical.get(key);
    if (!previous || isBetterSongHuntRecording(candidate, previous)) canonical.set(key, candidate);
  }

  return [...canonical.values()];
}

async function enrichSongHuntStreamCounts(tracks) {
  let soundchartsUnavailable = false;
  return mapWithConcurrency(tracks, 5, async (track) => {
    if (soundchartsUnavailable) return { ...track, streamCount: null };
    try {
      const streamCount = await getSpotifyStreamCount(track.id);
      return { ...track, streamCount };
    } catch (error) {
      if (error.providerStatus === 403 || error.code === "SOUNDCHARTS_HTTP_403") {
        soundchartsUnavailable = true;
      } else if (error.providerStatus !== 404 && error.code !== "SOUNDCHARTS_HTTP_404") {
        console.warn("Song Hunt stream lookup failed for " + track.title + ":", error.message);
      }
      return { ...track, streamCount: null };
    }
  });
}

async function buildSongHuntCatalog() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw trackIdError(503, "SPOTIFY_NOT_CONFIGURED",
      "Spotify is not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the Render backend.");
  }
  if (!SOUNDCHARTS_CLIENT_ID || !SOUNDCHARTS_CLIENT_SECRET) {
    throw trackIdError(503, "SOUNDCHARTS_NOT_CONFIGURED",
      "Soundcharts is required to verify Song Hunt stream counts. Add SOUNDCHARTS_CLIENT_ID and SOUNDCHARTS_CLIENT_SECRET in the Render backend.");
  }

  const artistCatalogues = await Promise.all(SONG_HUNT_ARTISTS.map(async (artist) => ({
    artist,
    tracks: await buildSongHuntArtistCatalog(artist)
  })));

  const candidateTracks = artistCatalogues.flatMap((entry) => entry.tracks);
  if (!candidateTracks.length) {
    throw trackIdError(502, "SONG_HUNT_EMPTY_CATALOG", "Spotify returned no eligible original recordings for Song Hunt.");
  }

  const enriched = await enrichSongHuntStreamCounts(candidateTracks);
  const artistNames = new Set(SONG_HUNT_ARTISTS.map((artist) => artist.displayName));
  const filtered = enriched.filter((track) => {
    const artist = SONG_HUNT_ARTISTS.find((candidate) => candidate.displayName === track.artist);
    if (!artist) return false;
    if (artist.minimumStreams === null) return true;
    return Number.isFinite(track.streamCount) && track.streamCount >= artist.minimumStreams;
  });

  const byArtist = Object.fromEntries(SONG_HUNT_ARTISTS.map((artist) => [
    artist.displayName,
    filtered.filter((track) => track.artist === artist.displayName).length
  ]));
  if (!byArtist["Kanye West"]) {
    throw trackIdError(503, "SONG_HUNT_KANYE_STREAMS_UNAVAILABLE",
      "Song Hunt could not verify any Kanye West tracks at or above 50 million Spotify streams. Check Soundcharts access and try again; unverified tracks are intentionally excluded.");
  }

  const publicTracks = filtered.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    year: track.year,
    releaseDate: track.releaseDate,
    genres: track.genres,
    genre: track.genre,
    album: track.album,
    streamCount: Number.isFinite(track.streamCount) ? track.streamCount : null,
    durationMs: track.durationMs,
    isFeatured: track.isFeatured,
    featuredArtists: track.featuredArtists,
    spotifyUrl: track.spotifyUrl
  }));

  return {
    game: "Song Hunt",
    source: "Spotify metadata + Soundcharts cumulative Spotify stream counts",
    updatedAt: new Date().toISOString(),
    cacheDurationHours: 12,
    rules: {
      kanyeWestMinimumStreams: 50000000,
      alternateVersionsExcluded: ["live", "acoustic", "remix", "demo", "instrumental", "remaster", "deluxe/reissue album editions"],
      canonicalRecording: "Earliest eligible release for each normalized title and base artist"
    },
    counts: {
      totalTracks: publicTracks.length,
      byArtist,
      kanyeTracksRemovedByStreamCutoff: Math.max(0, enriched.filter((track) => track.artist === "Kanye West").length - byArtist["Kanye West"]),
      tracksWithoutVerifiedStreamCounts: publicTracks.filter((track) => track.streamCount === null).length
    },
    tracks: publicTracks
  };
}

app.get("/api/song-hunt/catalog", async (req, res) => {
  if (songHuntCatalogCache && songHuntCatalogCache.expiresAt > Date.now()) {
    return res.json({ ...songHuntCatalogCache.payload, cached: true });
  }
  try {
    if (!activeSongHuntCatalogBuild) activeSongHuntCatalogBuild = buildSongHuntCatalog();
    const payload = await activeSongHuntCatalogBuild;
    songHuntCatalogCache = { payload, expiresAt: Date.now() + SONG_HUNT_CACHE_MS };
    return res.json({ ...payload, cached: false });
  } catch (error) {
    console.error("Song Hunt catalogue failed:", error.code || "", error.message);
    return res.status(error.status || 502).json({
      error: error.code || "SONG_HUNT_CATALOG_FAILED",
      message: error.message || "The Song Hunt catalogue could not be loaded."
    });
  } finally {
    activeSongHuntCatalogBuild = null;
  }
});

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Use /health or /api/keys'
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(port, () => {
  console.log(`✅ WordShift API running on port ${port}`);
  console.log(`   Health check: http://localhost:${port}/health`);
  console.log(`   Get keys: http://localhost:${port}/api/keys`);
});
