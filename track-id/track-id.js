(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const audio = $("song-audio");
  const difficultyContainer = $("difficulty-options");
  const genreContainer = $("genre-options");
  const eraContainer = $("era-options");
  const artistContainer = $("artist-options");
  const mainPlay = $("main-play");
  const mainPlayIcon = $("main-play-icon");
  const playCaption = $("play-caption");
  const clipDuration = $("clip-duration");
  const stageCounter = $("stage-counter");
  const roundStatus = $("round-status");
  const guessInput = $("guess-input");
  const suggestionBox = $("song-suggestions");
  const skipButton = $("skip-button");
  const feedback = $("feedback");
  const roundNumberLabel = $("round-number");
  const scoreLabel = $("score");
  const streakLabel = $("streak");
  const clipProgress = $("clip-progress");
  const clipLabels = [...document.querySelectorAll(".clip-labels [data-stage]")];
  const trackArtShell = $("track-art-shell");
  const trackArt = $("track-art");
  const trackArtFallback = $("track-art-fallback");
  const revealKicker = $("reveal-kicker");
  const revealTitle = $("reveal-title");
  const revealArtist = $("reveal-artist");
  const revealAlbum = $("reveal-album");
  const resultMessage = $("result-message");
  const resultActions = $("result-actions");
  const mainStage = $("stage-shell");
  const filterReels = $("filter-reels");
  const timeline = $("clip-timeline");
  const guessRow = $("guess-row");
  const nextButton = $("next-button");
  const playbackStartButton = $("playback-start");
  const playbackStartLabel = $("playback-start-label");
  const startStageOptions = [...document.querySelectorAll("[data-start-stage]")];
  const volumeSlider = $("volume-slider");
  const volumeValue = $("volume-value");
  const mixSummary = $("mix-summary");
  const poolSummary = $("pool-summary");
  const toast = $("toast");

  const ITUNES_SEARCH = "https://itunes.apple.com/search";
  const WORDSHIFT_API = "https://wordshift-api.onrender.com";
  const MAX_ROUNDS = 10;
  const POINTS_PER_WIN = 10;
  const ANSWER_PREVIEW_MS = 7000;
  const STREAM_THRESHOLDS = {
    easyMin: 250000000,
    mediumMin: 75000000,
    hardMin: 10000000
  };
  const CLIPS = [
    {label:"0.1s", seconds:0.1},
    {label:"0.5s", seconds:0.5},
    {label:"2s", seconds:2},
    {label:"8s", seconds:8},
    {label:"15s", seconds:15}
  ];
  const GENRES = ["Any genre","Pop","Rock","Hip-Hop","R&B","K-Pop","Country","Metal","Electronic"];
  const ERAS = ["Any era","Classic","1980s","1990s","2000s","2010s","2020s"];
  const ARTISTS = [
    {name:"Any artist", query:""},
    {name:"Imagine Dragons", query:"Imagine Dragons", genre:"Rock", hits:["believer","thunder","radioactive","demons","it's time","whatever it takes","bones","enemy","natural","on top of the world","bad liar","follow you","sharks","wrecked","zero","birds"]},
    {name:"Kanye West", query:"Kanye West", genre:"Hip-Hop", aliases:["Kanye West","Ye"], hits:["stronger","heartless","gold digger","power","flashing lights","good life","all falls down","through the wire","jesus walks","can't tell me nothing","homecoming","runaway","bound 2","black skinhead","famous","all of the lights","touch the sky","i wonder","love lockdown"]},
    {name:"Taylor Swift", query:"Taylor Swift", genre:"Pop", hits:["love story","you belong with me","blank space","shake it off","anti hero","cruel summer","style","lover","wildest dreams","cardigan"]},
    {name:"Michael Jackson", query:"Michael Jackson", genre:"Pop", hits:["billie jean","beat it","thriller","bad","smooth criminal","black or white","man in the mirror","rock with you"]},
    {name:"Rihanna", query:"Rihanna", genre:"R&B", hits:["umbrella","diamonds","we found love","only girl","stay","work","don't stop the music","disturbia"]},
    {name:"Drake", query:"Drake", genre:"Hip-Hop", hits:["god's plan","hotline bling","one dance","in my feelings","nice for what","started from the bottom"]},
    {name:"Eminem", query:"Eminem", genre:"Hip-Hop", hits:["lose yourself","without me","the real slim shady","stan","not afraid","love the way you lie"]},
    {name:"Justin Bieber", query:"Justin Bieber", genre:"Pop", hits:["sorry","love yourself","what do you mean","baby","peaches","ghost"]},
    {name:"The Weeknd", query:"The Weeknd", genre:"R&B", hits:["blinding lights","starboy","save your tears","the hills","can't feel my face","die for you"]},
    {name:"Linkin Park", query:"Linkin Park", genre:"Rock", hits:["in the end","numb","what i've done","crawling","faint","somewhere i belong"]},
    {name:"Coldplay", query:"Coldplay", genre:"Rock", hits:["yellow","clocks","fix you","viva la vida","the scientist","paradise","a sky full of stars"]},
    {name:"Ariana Grande", query:"Ariana Grande", genre:"Pop", hits:["thank u next","7 rings","no tears left to cry","positions","into you"]},
    {name:"Billie Eilish", query:"Billie Eilish", genre:"Pop", hits:["bad guy","birds of a feather","when the party's over","everything i wanted","ocean eyes"]},
    {name:"Bruno Mars", query:"Bruno Mars", genre:"Pop", hits:["just the way you are","grenade","locked out of heaven","uptown funk","that's what i like"]},
    {name:"Adele", query:"Adele", genre:"Pop", hits:["rolling in the deep","someone like you","hello","easy on me","set fire to the rain"]},
    {name:"Beyoncé", query:"Beyoncé", genre:"R&B", aliases:["Beyoncé","Beyonce"], hits:["crazy in love","halo","single ladies","formation","break my soul"]},
    {name:"Bad Bunny", query:"Bad Bunny", genre:"Hip-Hop", hits:["dakiti","titi me pregunto","monaco","callaita","yonaguni"]},
    {name:"Lady Gaga", query:"Lady Gaga", genre:"Pop", hits:["bad romance","poker face","just dance","shallow","paparazzi"]},
    {name:"Ed Sheeran", query:"Ed Sheeran", genre:"Pop", hits:["shape of you","perfect","thinking out loud","photograph","bad habits"]},
    {name:"Queen", query:"Queen", genre:"Rock", hits:["bohemian rhapsody","another one bites the dust","we will rock you","don't stop me now","under pressure"]},
    {name:"ABBA", query:"ABBA", genre:"Pop", hits:["dancing queen","mamma mia","gimme gimme gimme","waterloo","the winner takes it all"]},
    {name:"Nirvana", query:"Nirvana", genre:"Rock", hits:["smells like teen spirit","come as you are","lithium","heart shaped box"]},
    {name:"Katy Perry", query:"Katy Perry", genre:"Pop", hits:["firework","teenage dream","dark horse","roar","hot n cold"]},
    {name:"BTS", query:"BTS", genre:"K-Pop", hits:["dynamite","butter","mic drop","fake love","boy with luv"]},
    {name:"BLACKPINK", query:"BLACKPINK", genre:"K-Pop", hits:["how you like that","pink venom","shut down","kill this love"]},
    {name:"Daft Punk", query:"Daft Punk", genre:"Electronic", hits:["one more time","get lucky","harder better faster stronger","around the world"]},
    {name:"Avicii", query:"Avicii", genre:"Electronic", hits:["wake me up","the nights","levels","hey brother"]},
    {name:"Metallica", query:"Metallica", genre:"Metal", hits:["enter sandman","nothing else matters","one","master of puppets"]},
    {name:"Morgan Wallen", query:"Morgan Wallen", genre:"Country", hits:["last night","you proof","wasted on you"]},
    {name:"Dolly Parton", query:"Dolly Parton", genre:"Country", hits:["9 to 5","jolene","i will always love you"]},
    {name:"The Killers", query:"The Killers", genre:"Rock"},
    {name:"Green Day", query:"Green Day", genre:"Rock"},
    {name:"Foo Fighters", query:"Foo Fighters", genre:"Rock"},
    {name:"Travis Scott", query:"Travis Scott", genre:"Hip-Hop"},
    {name:"Kendrick Lamar", query:"Kendrick Lamar", genre:"Hip-Hop"},
    {name:"Post Malone", query:"Post Malone", genre:"Hip-Hop"},
    {name:"JAY-Z", query:"Jay-Z", genre:"Hip-Hop", aliases:["JAY-Z","Jay-Z"]},
    {name:"Alicia Keys", query:"Alicia Keys", genre:"R&B"},
    {name:"SZA", query:"SZA", genre:"R&B"},
    {name:"Usher", query:"Usher", genre:"R&B"},
    {name:"Frank Ocean", query:"Frank Ocean", genre:"R&B"},
    {name:"TWICE", query:"TWICE", genre:"K-Pop"},
    {name:"NewJeans", query:"NewJeans", genre:"K-Pop"},
    {name:"Stray Kids", query:"Stray Kids", genre:"K-Pop"},
    {name:"Luke Combs", query:"Luke Combs", genre:"Country"},
    {name:"Carrie Underwood", query:"Carrie Underwood", genre:"Country"},
    {name:"Shania Twain", query:"Shania Twain", genre:"Country"},
    {name:"Slipknot", query:"Slipknot", genre:"Metal"},
    {name:"Black Sabbath", query:"Black Sabbath", genre:"Metal"},
    {name:"Iron Maiden", query:"Iron Maiden", genre:"Metal"},
    {name:"System of a Down", query:"System of a Down", genre:"Metal"},
    {name:"Calvin Harris", query:"Calvin Harris", genre:"Electronic"},
    {name:"The Chainsmokers", query:"The Chainsmokers", genre:"Electronic"},
    {name:"David Guetta", query:"David Guetta", genre:"Electronic"},
    {name:"Swedish House Mafia", query:"Swedish House Mafia", genre:"Electronic"},
    {name:"Fleetwood Mac", query:"Fleetwood Mac", genre:"Rock"},
    {name:"Elton John", query:"Elton John", genre:"Pop"},
    {name:"David Bowie", query:"David Bowie", genre:"Rock"},
    {name:"Madonna", query:"Madonna", genre:"Pop"},
    {name:"Bon Jovi", query:"Bon Jovi", genre:"Rock"},
    {name:"Whitney Houston", query:"Whitney Houston", genre:"Pop"},
    {name:"Prince", query:"Prince", genre:"Pop"},
    {name:"Mariah Carey", query:"Mariah Carey", genre:"Pop"},
    {name:"Dr. Dre", query:"Dr. Dre", genre:"Hip-Hop"},
    {name:"Oasis", query:"Oasis", genre:"Rock"},
    {name:"Radiohead", query:"Radiohead", genre:"Rock"},
    {name:"Spice Girls", query:"Spice Girls", genre:"Pop"},
    {name:"Justin Timberlake", query:"Justin Timberlake", genre:"Pop"},
    {name:"G-Dragon", query:"G-Dragon", genre:"K-Pop"}
  ];
  const DEFAULT_ARTISTS = ["Taylor Swift","Kanye West","Imagine Dragons","Michael Jackson","Rihanna","Drake","The Weeknd","Queen","Coldplay","Billie Eilish","BTS","Metallica"];
  const GENRE_ARTISTS = {
    "Pop":["Taylor Swift","Michael Jackson","Rihanna","Justin Bieber","The Weeknd","Ariana Grande","Billie Eilish","Bruno Mars","Adele","Lady Gaga","Katy Perry","ABBA"],
    "Rock":["Imagine Dragons","Queen","Linkin Park","Coldplay","Nirvana","Metallica","The Killers","Green Day","Foo Fighters"],
    "Hip-Hop":["Kanye West","Drake","Eminem","Bad Bunny","Travis Scott","Kendrick Lamar","Post Malone","Jay-Z"],
    "R&B":["Rihanna","The Weeknd","Beyoncé","Bruno Mars","Alicia Keys","SZA","Usher","Frank Ocean"],
    "K-Pop":["BTS","BLACKPINK","G-Dragon","TWICE","NewJeans","Stray Kids"],
    "Country":["Morgan Wallen","Dolly Parton","Taylor Swift","Luke Combs","Carrie Underwood","Shania Twain"],
    "Metal":["Metallica","Linkin Park","Slipknot","Black Sabbath","Iron Maiden","System of a Down"],
    "Electronic":["Daft Punk","Avicii","Calvin Harris","The Chainsmokers","David Guetta","Swedish House Mafia"]
  };
  const ERA_ARTISTS = {
    "Classic":["Queen","ABBA","Michael Jackson","Dolly Parton","Fleetwood Mac","Elton John","David Bowie","Black Sabbath","Bee Gees"],
    "1980s":["Michael Jackson","Queen","Madonna","ABBA","Bon Jovi","Whitney Houston","Prince","Metallica"],
    "1990s":["Nirvana","Eminem","Mariah Carey","Dr. Dre","Oasis","Radiohead","Metallica","Spice Girls"],
    "2000s":["Kanye West","Rihanna","Coldplay","Linkin Park","Eminem","Beyoncé","Justin Timberlake","The Killers"],
    "2010s":["Drake","Taylor Swift","Imagine Dragons","The Weeknd","Ed Sheeran","Adele","BTS","Bruno Mars"],
    "2020s":["Taylor Swift","The Weeknd","Bad Bunny","Billie Eilish","BTS","BLACKPINK","Drake","Morgan Wallen"]
  };
  const GENRE_MAP = {
    "Pop":["pop"],
    "Rock":["rock","alternative"],
    "Hip-Hop":["hip-hop","hip hop","rap"],
    "R&B":["r&b","rnb","soul"],
    "K-Pop":["k-pop","k pop"],
    "Country":["country"],
    "Metal":["metal"],
    "Electronic":["dance","electronic","house","techno"]
  };
  const ERA_RANGES = {
    "Classic":[0,1979],"1980s":[1980,1989],"1990s":[1990,1999],
    "2000s":[2000,2009],"2010s":[2010,2019],"2020s":[2020,2029]
  };

  const state = {
    filters:{genre:"Any genre",era:"Any era",artist:"Any artist"},
    difficulty:"impossible",
    startStage:0,
    fromStart:true,
    catalog:[],
    pool:[],
    used:new Set(),
    currentTrack:null,
    stage:0,
    round:0,
    score:0,
    streak:0,
    revealed:false,
    roundActive:false,
    isPlaying:false,
    loadingPool:false,
    loadingPreview:false,
    poolKey:"",
    requestToken:0,
    playbackToken:0,
    startedOnce:false,
    previewTimer:null,
    suggestionIndex:-1,
    currentOffset:0,
    catalogSource:"legacy",
    catalogNotice:"",
    catalogInfo:null,
    answerTimer:null,
    transitionTimer:null
  };

  const normalize = (value) => String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g," ")
    .trim().replace(/\s+/g," ");
  const titleKey = (title) => normalize(String(title || "").replace(/\b(remastered|radio edit|single version|explicit)\b/gi,""));
  const getArtist = (name) => ARTISTS.find((a) => normalize(a.name) === normalize(name));
  const currentFilterKey = () => JSON.stringify([state.filters.genre,state.filters.era,state.filters.artist,state.difficulty]);

  function setFeedback(message, type="") {
    feedback.textContent=message;
    feedback.className="feedback"+(type?" "+type:"");
  }

  function showToast(message) {
    toast.textContent=message;
    toast.hidden=false;
    window.clearTimeout(showToast.timer);
    showToast.timer=window.setTimeout(()=>{toast.hidden=true;},2300);
  }

  function durationLabel(index) { return CLIPS[Math.max(0,Math.min(CLIPS.length-1,index))].label; }

  function updateCarouselProgress(container) {
    if(!container)return;
    const name=container.id.replace("-options","");
    const progress=document.getElementById(name+"-progress");
    if(!progress)return;
    const maxScroll=Math.max(0,container.scrollWidth-container.clientWidth);
    const thumbWidth=container.scrollWidth>0
      ? Math.min(100,Math.max(14,container.clientWidth/container.scrollWidth*100))
      : 100;
    const left=maxScroll>0?(container.scrollLeft/maxScroll)*(100-thumbWidth):0;
    progress.style.width=thumbWidth+"%";
    progress.style.left=left+"%";
    const root=container.closest(".filter-carousel");
    root?.classList.toggle("is-scrollable",maxScroll>2);
  }

  function centerActiveChip(container) {
    const active=container.querySelector(".active");
    if(!active)return;
    const left=active.offsetLeft-(container.clientWidth-active.offsetWidth)/2;
    container.scrollTo({left:Math.max(0,Math.min(left,container.scrollWidth-container.clientWidth)),behavior:"smooth"});
    window.setTimeout(()=>updateCarouselProgress(container),220);
  }

  function renderChipGroup(container, options, key, dataName) {
    container.replaceChildren();
    for(const option of options) {
      const value=typeof option==="string"?option:option.name;
      const button=document.createElement("button");
      button.type="button";
      button.textContent=value;
      button.dataset[dataName]=value;
      button.classList.toggle("active",state.filters[key]===value);
      button.setAttribute("aria-pressed",String(state.filters[key]===value));
      button.addEventListener("click",()=>{
        if(state.filters[key]===value)return;
        state.filters[key]=value;
        renderAllControls();
        settingsChanged(key);
      });
      container.append(button);
    }
    centerActiveChip(container);
    updateCarouselProgress(container);
  }

  function artistNamesForFilters() {
    if(state.filters.artist!=="Any artist")return [state.filters.artist];
    const genre=state.filters.genre;
    const era=state.filters.era;
    let names=genre!=="Any genre"
      ? (GENRE_ARTISTS[genre]||DEFAULT_ARTISTS)
      : (era==="Any era"
          ? shuffle(ARTISTS.filter((artist)=>artist.query).map((artist)=>artist.name)).slice(0,12)
          : DEFAULT_ARTISTS.slice());
    if(era!=="Any era") {
      const eraNames=ERA_ARTISTS[era]||[];
      names=[...new Set([...eraNames,...names])];
    }
    return names.map((name)=>ARTISTS.find((a)=>normalize(a.name)===normalize(name))?.name).filter(Boolean);
  }

  function eraMatches(track) {
    const era=state.filters.era;
    if(era==="Any era")return true;
    const year=Number(String(track.releaseDate||"").slice(0,4));
    if(!year)return false;
    const range=ERA_RANGES[era];
    return Boolean(range&&year>=range[0]&&year<=range[1]);
  }

  function genreMatches(track) {
    const genre=state.filters.genre;
    if(genre==="Any genre")return true;
    const source=normalize(track.genre||"");
    const accepted=GENRE_MAP[genre]||[normalize(genre)];
    return accepted.some((part)=>source.includes(normalize(part)));
  }

  function artistMatches(track) {
    const selected=state.filters.artist;
    if(selected==="Any artist")return true;
    const cfg=getArtist(selected);
    const accepted=(cfg?.aliases||[selected]).map(normalize);
    return accepted.some((name)=>normalize(track.artist).includes(name));
  }

  async function searchCatalog(term, limit=70, queryIndex=0) {
    const url=new URL(ITUNES_SEARCH);
    url.searchParams.set("term",term);
    url.searchParams.set("entity","song");
    url.searchParams.set("country","ca");
    url.searchParams.set("limit",String(limit));
    const response=await fetch(url.toString(),{mode:"cors"});
    if(!response.ok)throw new Error("The music catalogue is unavailable right now.");
    const json=await response.json();
    return (Array.isArray(json.results)?json.results:[]).map((raw,index)=>({
      id:String(raw.trackId||""),
      title:String(raw.trackName||"").trim(),
      artist:String(raw.artistName||"").trim(),
      album:String(raw.collectionName||"").trim(),
      genre:String(raw.primaryGenreName||"").trim(),
      releaseDate:String(raw.releaseDate||""),
      previewUrl:String(raw.previewUrl||""),
      artworkUrl:enhanceArtwork(raw.artworkUrl100||raw.artworkUrl60||""),
      storeUrl:String(raw.trackViewUrl||raw.collectionViewUrl||""),
      rank:index,
      queryIndex,
      duration:Number(raw.trackTimeMillis||0)
    })).filter((track)=>track.id&&track.title&&track.previewUrl);
  }

  function enhanceArtwork(url) {
    return String(url||"").replace(/\b100x100bb\b/i,"600x600bb").replace(/\b100x100\b/i,"600x600");
  }

  async function fetchLegacyCatalogForFilters() {
    const names=artistNamesForFilters();
    const selectedArtist=state.filters.artist!=="Any artist";
    const limit=selectedArtist?200:65;
    const terms=selectedArtist?[names[0]||state.filters.artist]:names.slice(0,12);
    const requests=terms.map((name,index)=>searchCatalog(name,limit,index).catch(()=>[]));
    const batches=await Promise.all(requests);
    const deduped=new Map();
    batches.forEach((batch)=>{
      batch.forEach((track)=>{
        const key=track.id;
        if(!deduped.has(key)||track.rank<deduped.get(key).rank)deduped.set(key,track);
      });
    });
    const queryTracks=[...deduped.values()];
    // Interleave the top result from each queried artist before lower-ranked tracks,
    // so a mixed-artist pool feels like a playlist rather than one artist at a time.
    queryTracks.sort((a,b)=>a.rank-b.rank||a.queryIndex-b.queryIndex);
    const filtered=queryTracks.filter((track)=>genreMatches(track)&&eraMatches(track)&&artistMatches(track));
    if(filtered.length<10 && state.filters.era!=="Any era") {
      // Retry a wider, era-related query only when the initial artist set has too few
      // previewable recordings; still apply every selected filter to this fallback.
      const eraTerm=state.filters.era==="Classic"?"classic hit songs":state.filters.era+" hit songs";
      const genreTerm=state.filters.genre==="Any genre"?"":state.filters.genre+" ";
      const extra=await searchCatalog(genreTerm+eraTerm,200,99).catch(()=>[]);
      const union=new Map(queryTracks.map((track)=>[track.id,track]));
      extra.forEach((track)=>{if(!union.has(track.id))union.set(track.id,track);});
      return [...union.values()].filter((track)=>genreMatches(track)&&eraMatches(track)&&artistMatches(track));
    }
    return filtered;
  }

  async function fetchCatalogForFilters() {
    const isImagineDragons = normalizeTrackTextForClient(state.filters.artist) === "imagine dragons";
    if (!isImagineDragons) {
      state.catalogSource = "legacy";
      state.catalogInfo = null;
      state.catalogNotice = "";
      return fetchLegacyCatalogForFilters();
    }

    try {
      const url = new URL(WORDSHIFT_API + "/api/track-id/catalog");
      url.searchParams.set("artist", "Imagine Dragons");
      const response = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.message || "Spotify/Soundcharts catalogue is unavailable.");
        error.code = payload.error || "TRACK_ID_CATALOG_FAILED";
        throw error;
      }

      state.catalogSource = payload.source || "spotify+soundcharts";
      state.catalogInfo = payload;
      state.catalogNotice = "";
      const tracks = (Array.isArray(payload.tracks) ? payload.tracks : []).map((track, index) => ({
        ...track,
        id: String(track.id || ""),
        title: String(track.title || "").trim(),
        artist: String(track.artist || "Imagine Dragons").trim(),
        album: String(track.album || "").trim(),
        genre: String(track.genre || "Rock"),
        releaseDate: String(track.releaseDate || ""),
        previewUrl: String(track.previewUrl || ""),
        artworkUrl: String(track.artworkUrl || ""),
        storeUrl: String(track.spotifyUrl || ""),
        rank: index,
        queryIndex: 0,
        duration: Number(track.duration || 0),
        streamCount: Number.isFinite(Number(track.streamCount)) ? Number(track.streamCount) : null
      })).filter((track) => track.id && track.title && track.previewUrl);

      return tracks.filter((track) => genreMatches(track) && eraMatches(track) && artistMatches(track));
    } catch (error) {
      state.catalogSource = "itunes-fallback";
      state.catalogInfo = null;
      state.catalogNotice = "Spotify stream catalogue unavailable: " + (error.message || "using fallback results");
      console.warn("Track ID streaming catalogue fallback:", error);
      return fetchLegacyCatalogForFilters();
    }
  }

  function normalizeTrackTextForClient(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\\s+/g, " ");
  }

  function knownHit(track) {
    const cfg=getArtist(state.filters.artist);
    if(!cfg||!cfg.hits)return false;
    const key=titleKey(track.title);
    return cfg.hits.some((hit)=>titleKey(hit)===key);
  }

  function difficultyPool(catalog) {
    const tracks = catalog.slice();
    if (!tracks.length) return [];

    if (state.catalogSource === "spotify+soundcharts" &&
        normalizeTrackTextForClient(state.filters.artist) === "imagine dragons") {
      // These are explicit cumulative Spotify-stream bands, not search-rank bands.
      // Missing counts are excluded instead of being silently treated as zero.
      const withMetrics = tracks.filter((track) => Number.isFinite(track.streamCount));
      let selected = [];
      if (state.difficulty === "easy") {
        selected = withMetrics.filter((track) => track.streamCount >= STREAM_THRESHOLDS.easyMin);
      } else if (state.difficulty === "medium") {
        selected = withMetrics.filter((track) =>
          track.streamCount >= STREAM_THRESHOLDS.mediumMin &&
          track.streamCount < STREAM_THRESHOLDS.easyMin);
      } else if (state.difficulty === "hard") {
        selected = withMetrics.filter((track) =>
          track.streamCount >= STREAM_THRESHOLDS.hardMin &&
          track.streamCount < STREAM_THRESHOLDS.mediumMin);
      } else {
        selected = withMetrics.filter((track) => track.streamCount < STREAM_THRESHOLDS.hardMin);
      }
      return shuffle([...new Map(selected.map((track) => [track.id, track])).values()]);
    }

    const ranked = tracks.sort((a,b) => (a.rank || 0) - (b.rank || 0) || (a.queryIndex || 0) - (b.queryIndex || 0));
    const n = ranked.length;
    let selected;
    if (state.difficulty === "easy") {
      const hits = ranked.filter(knownHit);
      selected = hits.length >= 8 ? hits : ranked.slice(0, Math.max(8, Math.ceil(n * .4)));
    } else if (state.difficulty === "medium") {
      selected = ranked.slice(0, Math.max(10, Math.ceil(n * .68)));
    } else if (state.difficulty === "hard") {
      selected = ranked.slice(Math.floor(n * .22), Math.max(Math.floor(n * .22) + 8, Math.ceil(n * .82)));
    } else {
      selected = ranked.slice(Math.floor(n * .62));
    }
    if (selected.length < 8) selected = ranked;
    return shuffle([...new Map(selected.map((track) => [track.id, track])).values()]);
  }

  function shuffle(array) {
    const copy=array.slice();
    for(let i=copy.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function setTimeline({playing=false}={}) {
    clipLabels.forEach((label,index)=>label.classList.toggle("active",index===state.stage));
    clipProgress.style.transition=playing
      ? "width "+Math.max(0.1,CLIPS[state.stage].seconds)+"s linear"
      : "none";
    clipProgress.style.width="0%";
    clipDuration.textContent=durationLabel(state.stage);
    stageCounter.textContent="CLIP "+String(state.stage+1).padStart(2,"0")+" / 05";
    if(playing){
      const token=state.playbackToken;
      requestAnimationFrame(()=>{
        if(token===state.playbackToken&&state.isPlaying)clipProgress.style.width="100%";
      });
    }
  }

  function closeSuggestions() {
    suggestionBox.hidden=true;
    guessInput.setAttribute("aria-expanded","false");
    state.suggestionIndex=-1;
  }

  function renderSuggestions() {
    const query=normalize(guessInput.value);
    suggestionBox.replaceChildren();
    state.suggestionIndex=-1;
    if(!query||query.length<2||guessInput.disabled||state.revealed||!state.pool.length) {
      closeSuggestions();
      return;
    }
    const matches=state.pool
      .filter((track)=>normalize(track.title).includes(query)||normalize(track.artist).includes(query))
      .sort((a,b)=>{
        const aStarts=normalize(a.title).startsWith(query)?0:1;
        const bStarts=normalize(b.title).startsWith(query)?0:1;
        return aStarts-bStarts||a.title.localeCompare(b.title);
      }).slice(0,7);
    if(!matches.length){closeSuggestions();return;}
    matches.forEach((track)=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="song-suggestion";
      button.setAttribute("role","option");
      button.dataset.trackId=track.id;
      const image=document.createElement("img");
      image.className="suggestion-art";
      image.alt="";
      image.loading="lazy";
      image.src=track.artworkUrl;
      image.onerror=()=>{image.hidden=true;};
      const copy=document.createElement("span");
      copy.className="suggestion-copy";
      const title=document.createElement("strong");
      title.textContent=track.title;
      const artist=document.createElement("small");
      artist.textContent=track.artist+" · "+track.album;
      copy.append(title,artist);
      button.append(image,copy);
      button.addEventListener("click",()=>submitGuess(track.title));
      suggestionBox.append(button);
    });
    suggestionBox.hidden=false;
    guessInput.setAttribute("aria-expanded","true");
  }

  function moveSuggestionSelection(direction) {
    const options=[...suggestionBox.querySelectorAll(".song-suggestion")];
    if(!options.length)return false;
    state.suggestionIndex=(state.suggestionIndex+direction+options.length)%options.length;
    options.forEach((button,index)=>{
      const active=index===state.suggestionIndex;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",String(active));
    });
    options[state.suggestionIndex].scrollIntoView({block:"nearest"});
    return true;
  }

  function setMainPlayState(label,icon,disabled=false) {
    playCaption.textContent=label;
    mainPlayIcon.textContent=icon;
    mainPlay.disabled=disabled;
  }

  function stopTimers() {
    state.playbackToken++;
    if(state.previewTimer)window.clearTimeout(state.previewTimer);
    if(state.answerTimer)window.clearTimeout(state.answerTimer);
    if(state.transitionTimer)window.clearTimeout(state.transitionTimer);
    state.previewTimer=null;
    state.answerTimer=null;
    state.transitionTimer=null;
    audio.pause();
    state.isPlaying=false;
    mainPlay.classList.remove("is-playing");
    setTimeline();
  }

  function waitForTrack(track) {
    return new Promise((resolve,reject)=>{
      if(!track||!track.previewUrl){
        reject(new Error("No playable preview for this recording."));
        return;
      }
      const sourceChanged=audio.src!==track.previewUrl;
      audio.volume=Number(volumeSlider.value)/100;
      let settled=false;
      let timeout=null;
      const clean=()=>{
        audio.removeEventListener("loadedmetadata",onReady);
        audio.removeEventListener("canplay",onReady);
        audio.removeEventListener("error",onError);
        if(timeout)window.clearTimeout(timeout);
      };
      const finish=(error)=>{
        if(settled)return;
        settled=true;
        clean();
        if(error)reject(error);else resolve();
      };
      const onReady=()=>{
        if(audio.readyState>=2&&Number.isFinite(audio.duration)&&audio.duration>0)finish();
      };
      const onError=()=>finish(new Error("This audio preview is unavailable. Skip to another track."));
      if(!sourceChanged&&audio.readyState>=2&&Number.isFinite(audio.duration)&&audio.duration>0){
        resolve();
        return;
      }
      // Attach listeners before initiating a source load, so a quick cache hit
      // cannot race past the ready/error handlers.
      audio.addEventListener("loadedmetadata",onReady);
      audio.addEventListener("canplay",onReady);
      audio.addEventListener("error",onError);
      timeout=window.setTimeout(()=>finish(new Error("The preview took too long to load. Try the next track.")),12000);
      if(sourceChanged)audio.src=track.previewUrl;
      audio.load();
      onReady();
    });
  }
  function chooseOffset(track) {
    if(state.fromStart){state.currentOffset=0;return;}
    const maximum=Math.max(0,Math.min(18,(Number(audio.duration)||30)-CLIPS[state.stage].seconds-0.2));
    state.currentOffset=Math.random()*maximum;
  }

  async function prepareTrack({reload=false,initial=false}={}) {
    const token=++state.requestToken;
    stopTimers();
    closeSuggestions();
    state.revealed=false;
    state.roundActive=false;
    state.loadingPool=true;
    state.loadingPreview=false;
    state.currentTrack=null;
    resultActions.hidden=true;
    hideAnswerDetails();
    guessInput.value="";
    guessInput.disabled=true;
    skipButton.disabled=true;
    revealAndGuessMode(false);
    setMainPlayState("Finding tracks…","◌",true);
    roundStatus.textContent="BUILDING MIX";
    setFeedback("Loading songs that match your mix…");
    poolSummary.textContent="Building a fresh selection…";
    try {
      const key=currentFilterKey();
      if(reload||!state.pool.length||state.poolKey!==key) {
        const tracks=await fetchCatalogForFilters();
        if(token!==state.requestToken)return;
        state.catalog=tracks;
        state.pool=difficultyPool(tracks);
        state.poolKey=key;
        state.used.clear();
      }
      if(token!==state.requestToken)return;
      if(!state.pool.length) {
        state.loadingPool=false;
        state.currentTrack=null;
        roundStatus.textContent="NO TRACKS";
        setMainPlayState("No tracks found","!",true);
        guessInput.disabled=true;
        skipButton.disabled=true;
        if(state.catalogSource==="spotify+soundcharts") {
          if(!state.catalogInfo || Number(state.catalogInfo.tracksWithStreamCounts||0)===0) {
            poolSummary.textContent="Stream data unavailable";
            setFeedback("Soundcharts did not return Spotify stream counts for this catalogue. Check API credentials and plan access; unknown counts are not assigned a difficulty.", "error");
          } else {
            poolSummary.textContent="No tracks in this stream range";
            setFeedback("No playable tracks fall inside the selected stream-count range. Try another difficulty.", "error");
          }
        } else {
          poolSummary.textContent="Fallback catalogue";
          setFeedback(state.catalogNotice || "No playable songs match these filters. Try a different artist, genre, or era.", "error");
        }
        return;
      }
      const trackedCount=state.catalog.filter((track)=>Number.isFinite(track.streamCount)).length;
      if(state.catalogSource==="spotify+soundcharts") {
        poolSummary.textContent=state.pool.length+" tracks in this stream tier · "+trackedCount+" with stream data";
      } else {
        poolSummary.textContent=state.pool.length+" playable tracks"+(state.catalogNotice?" · fallback source":"");
      }
      state.loadingPool=false;
      await assignTrack(token,initial);
    } catch(error) {
      if(token!==state.requestToken)return;
      state.loadingPool=false;
      roundStatus.textContent="LOAD ERROR";
      setMainPlayState("Try again","↻",false);
      guessInput.disabled=true;skipButton.disabled=true;
      setFeedback(error.message||"Could not load songs. Please retry.","error");
      poolSummary.textContent="Could not load tracks.";
    }
  }

  async function assignTrack(token,initial=false) {
    stopTimers();
    closeSuggestions();
    resultActions.hidden=true;
    state.revealed=false;
    state.roundActive=false;
    state.stage=state.startStage;
    const unused=state.pool.filter((track)=>!state.used.has(track.id));
    const choices=unused.length?unused:state.pool;
    const track=choices[Math.floor(Math.random()*choices.length)];
    if(!track)throw new Error("No playable tracks are available.");
    state.used.add(track.id);
    state.currentTrack=track;
    if(state.round===0)state.round=1;
    else if(state.startedOnce)state.round++;
    roundNumberLabel.textContent=String(state.round).padStart(2,"0");
    trackArtShell.hidden=true;
    trackArt.src="";
    trackArtFallback.hidden=true;
    hideAnswerDetails();
    guessInput.value="";
    guessInput.disabled=true;
    skipButton.disabled=true;
    state.loadingPreview=true;
    setMainPlayState("Preparing track…","◌",true);
    roundStatus.textContent="PREPARING TRACK";
    setTimeline();
    setFeedback("Preparing audio preview…");
    try {
      await waitForTrack(track);
      if(token!==state.requestToken||state.currentTrack!==track)return;
      chooseOffset(track);
      state.loadingPreview=false;
      guessInput.disabled=false;
      skipButton.disabled=false;
      setMainPlayState("Ready","▶",false);
      roundStatus.textContent="READY";
      setFeedback(state.catalogNotice || ("Listen closely. The clip is "+durationLabel(state.stage)+"."));
    } catch(error) {
      if(token!==state.requestToken||state.currentTrack!==track)return;
      state.loadingPreview=false;
      state.pool=state.pool.filter((item)=>item.id!==track.id);
      poolSummary.textContent=state.pool.length+" playable tracks left in this mix";
      setMainPlayState("Skip track","↻",false);
      skipButton.disabled=false;
      guessInput.disabled=false;
      roundStatus.textContent="PREVIEW UNAVAILABLE";
      setFeedback(error.message||"This preview could not be loaded. Skip to continue.","error");
    }
    renderAllControls();
  }

  function hideAnswerDetails() {
    revealKicker.hidden=true;
    revealTitle.hidden=true;
    revealArtist.hidden=true;
    revealAlbum.hidden=true;
    resultMessage.hidden=true;
    trackArtShell.hidden=true;
    mainPlay.hidden=false;
    timeline.hidden=false;
    guessRow.hidden=false;
    guessInput.placeholder="Name that track";
  }

  function revealAndGuessMode(isReveal) {
    filterReels.classList.toggle("is-muted",Boolean(isReveal));
  }

  function showAnswer(won) {
    if(state.revealed||!state.currentTrack)return;
    stopTimers();
    state.revealed=true;
    revealAndGuessMode(true);
    const track=state.currentTrack;
    const points=won?POINTS_PER_WIN:0;
    if(won){state.score=Math.min(MAX_ROUNDS*POINTS_PER_WIN,state.score+points);state.streak++;}
    else{state.streak=0;}
    const runComplete=state.round>=MAX_ROUNDS;
    scoreLabel.textContent=String(state.score);
    streakLabel.textContent=String(state.streak);
    roundStatus.textContent=runComplete?"RUN COMPLETE":(won?"CORRECT":"TRACK REVEALED");
    setFeedback(won?"+"+points+" points · "+durationLabel(state.stage)+" clue":(runComplete?"Run complete. Your final score is "+state.score+"/100.":"The answer is revealed. Ready for another?"),won?"success":"");
    hideAnswerDetails();
    trackArtShell.hidden=false;
    trackArt.alt="Cover artwork for "+track.title;
    trackArtFallback.hidden=true;
    if(track.artworkUrl){
      trackArt.src=track.artworkUrl;
      trackArt.onerror=()=>{trackArt.hidden=true;trackArtFallback.hidden=false;};
      trackArt.hidden=false;
    }else{
      trackArt.hidden=true;trackArtFallback.hidden=false;
    }
    revealKicker.hidden=false;
    revealKicker.textContent=runComplete?"RUN COMPLETE":(won?"YOU GOT IT!":"TRACK REVEALED");
    revealTitle.hidden=false;revealTitle.textContent=track.title;
    revealArtist.hidden=false;revealArtist.textContent=track.artist;
    revealAlbum.hidden=false;revealAlbum.textContent=track.album||"";
    resultMessage.hidden=false;
    resultMessage.textContent=runComplete
      ?"Final score: "+state.score+"/100 · Best possible: 100."
      :(won?"Clean ears. Can you do it again?":"Keep the streak alive on the next one.");
    mainPlay.hidden=true;
    timeline.hidden=true;
    guessRow.hidden=true;
    resultActions.hidden=false;
    challengeButton.textContent="♧ Challenge your friend";
    nextButton.textContent=runComplete?"Play again ↻":"Next  ▷|";
    guessInput.value="";
    closeSuggestions();
  }

  function playSnippet() {
    if(!state.currentTrack||state.loadingPreview||state.revealed||!state.currentTrack.previewUrl)return;
    stopTimers();
    state.roundActive=true;
    state.startedOnce=true;
    state.isPlaying=true;
    const token=state.playbackToken;
    setTimeline({playing:true});
    const seconds=CLIPS[state.stage].seconds;
    const duration=Number(audio.duration)||30;
    const maximumOffset=Math.max(0,Math.min(18,duration-seconds-0.1));
    if(state.fromStart)state.currentOffset=0;
    else state.currentOffset=Math.min(state.currentOffset,maximumOffset);
    try{audio.currentTime=Math.min(state.currentOffset,Math.max(0,duration-0.2));}catch(_){}
    audio.volume=Number(volumeSlider.value)/100;
    mainPlay.classList.add("is-playing");
    setMainPlayState("Playing "+durationLabel(state.stage),"Ⅱ",false);
    roundStatus.textContent="LISTENING";
    setFeedback("Listening…");
    const playback=audio.play();
    const stopAtEnd=()=>{
      if(token!==state.playbackToken)return;
      audio.pause();
      state.isPlaying=false;
      state.previewTimer=null;
      mainPlay.classList.remove("is-playing");
      setTimeline();
      setMainPlayState("Replay "+durationLabel(state.stage),"▶",false);
      roundStatus.textContent="READY TO GUESS";
      setFeedback("Make a guess or skip for a longer clue.");
    };
    if(playback&&typeof playback.catch==="function"){
      playback.catch(()=>{
        if(token!==state.playbackToken)return;
        state.isPlaying=false;mainPlay.classList.remove("is-playing");
        setTimeline();
        setMainPlayState("Try again","▶",false);
        roundStatus.textContent="PLAYBACK ERROR";
        setFeedback("The browser couldn't play this preview. Try again or skip.","error");
      });
    }
    state.previewTimer=window.setTimeout(stopAtEnd,Math.max(120,seconds*1000));
  }

  function advanceClue(autoPlay=true, messagePrefix="") {
    if(!state.currentTrack||state.revealed)return;
    state.roundActive=true;
    state.startedOnce=true;
    stopTimers();
    if(state.stage>=CLIPS.length-1){showAnswer(false);return;}
    state.stage++;
    setTimeline();
    renderAllControls();
    roundStatus.textContent="CLIP REVEALED";
    setFeedback(messagePrefix?messagePrefix+" now you can hear "+durationLabel(state.stage)+".":"Now you can hear "+durationLabel(state.stage)+".",messagePrefix?"error":"");
    setMainPlayState("Play "+durationLabel(state.stage),"▶",false);
    if(autoPlay)playSnippet();
  }

  function submitGuess(value) {
    if(!state.currentTrack||state.revealed||state.loadingPreview)return;
    state.roundActive=true;
    state.startedOnce=true;
    const raw=String(value||guessInput.value).trim();
    if(!raw){setFeedback("Type a song title first.","error");guessInput.focus();return;}
    closeSuggestions();
    guessInput.value=raw;
    if(titleKey(raw)===titleKey(state.currentTrack.title)){
      showAnswer(true);
      return;
    }
    guessInput.value="";
    setFeedback("Not quite — revealing the next clue…","error");
    advanceClue(true,"Not quite —");
  }

  async function settingsChanged(key) {
    if(state.roundActive){
      setFeedback("Mix changes will apply to the next track.");
      return;
    }
    await prepareTrack({reload:true,initial:state.round===0});
  }

  function setDifficulty(value) {
    if(!["easy","medium","hard","expert","impossible"].includes(value))return;
    if(state.difficulty===value)return;
    state.difficulty=value;
    renderAllControls();
    if(state.roundActive){setFeedback("Difficulty changes will apply to the next track.");return;}
    prepareTrack({reload:true,initial:state.round===0});
  }

  function resetRun() {
    state.round=0;
    state.score=0;
    state.streak=0;
    state.startedOnce=false;
    state.used.clear();
    scoreLabel.textContent="0";
    streakLabel.textContent="0";
    roundNumberLabel.textContent="01";
  }

  function nextRound() {
    const runComplete=state.revealed&&state.round>=MAX_ROUNDS;
    const reload=state.poolKey!==currentFilterKey();
    if(runComplete){
      resetRun();
      prepareTrack({reload,initial:true});
      return;
    }
    prepareTrack({reload,initial:false});
  }

  function initControls() {
    document.querySelectorAll("[data-difficulty]").forEach((button)=>{
      button.addEventListener("click",()=>setDifficulty(button.dataset.difficulty));
    });
    renderChipGroup(genreContainer,GENRES,"genre","genre");
    renderChipGroup(eraContainer,ERAS,"era","era");
    renderChipGroup(artistContainer,ARTISTS,"artist","artist");

    startStageOptions.forEach((button)=>{
      button.addEventListener("click",()=>{
        state.startStage=Number(button.dataset.startStage);
        renderAllControls();
        if(state.roundActive){setFeedback("Starting clue changes will apply to the next track.");return;}
        state.stage=state.startStage;
        setTimeline();
        if(state.currentTrack){
          stopTimers();
          setMainPlayState("Play "+durationLabel(state.stage),"▶",false);
          roundStatus.textContent="READY";
          setFeedback("Starting clue set to "+durationLabel(state.stage)+".");
        }
      });
    });

    playbackStartButton.addEventListener("click",()=>{
      state.fromStart=!state.fromStart;
      playbackStartButton.setAttribute("aria-pressed",String(state.fromStart));
      playbackStartLabel.textContent=state.fromStart?"From the start":"Random section";
      playbackStartButton.querySelector("span").textContent=state.fromStart?"▷":"⤨";
      setFeedback(state.fromStart?"Clips will start from the beginning.":"Clips will start at a random point.");
      if(state.currentTrack&&!state.roundActive)chooseOffset(state.currentTrack);
    });

    volumeSlider.addEventListener("input",()=>{
      const value=Number(volumeSlider.value);
      audio.volume=value/100;
      volumeValue.textContent=value+"%";
    });

    $("reroll-button").addEventListener("click",()=>{
      const wasAtRunLimit=state.round>=MAX_ROUNDS;
      if(wasAtRunLimit)resetRun();
      const anyOr= (items)=>items[Math.floor(Math.random()*items.length)];
      state.filters.genre=anyOr(GENRES);
      state.filters.era=anyOr(ERAS);
      state.filters.artist=anyOr(ARTISTS).name;
      state.difficulty=anyOr(["easy","medium","hard","expert","impossible"]);
      renderAllControls();
      showToast("Your mix has been rerolled");
      prepareTrack({reload:true,initial:state.round===0});
    });

    mainPlay.addEventListener("click",()=>{
      if(!state.currentTrack){
        prepareTrack({reload:true,initial:state.round===0});
        return;
      }
      if(roundStatus.textContent==="PREVIEW UNAVAILABLE"){
        prepareTrack({reload:state.poolKey!==currentFilterKey(),initial:false});
        return;
      }
      playSnippet();
    });
    skipButton.addEventListener("click",()=>{
      if(roundStatus.textContent==="PREVIEW UNAVAILABLE"){
        prepareTrack({reload:state.poolKey!==currentFilterKey(),initial:false});
        return;
      }
      advanceClue(true);
    });
    nextButton.addEventListener("click",nextRound);
    challengeButton.addEventListener("click",async()=>{
      const track=state.currentTrack;
      if(!track)return;
      const challenge="I just guessed "+track.title+" by "+track.artist+" on WordShift Track ID. Can you beat me? "+window.location.origin+"/track-id/";
      try{
        await navigator.clipboard.writeText(challenge);
        showToast("Challenge copied — send it to a friend");
      }catch(_){
        showToast(challenge);
      }
    });

    guessInput.addEventListener("input",renderSuggestions);
    guessInput.addEventListener("keydown",(event)=>{
      if(event.key==="ArrowDown"){event.preventDefault();moveSuggestionSelection(1);}
      else if(event.key==="ArrowUp"){event.preventDefault();moveSuggestionSelection(-1);}
      else if(event.key==="Escape"){closeSuggestions();}
      else if(event.key==="Enter"){
        event.preventDefault();
        const options=[...suggestionBox.querySelectorAll(".song-suggestion")];
        if(!suggestionBox.hidden&&state.suggestionIndex>=0&&options[state.suggestionIndex]){
          const track=state.pool.find((item)=>item.id===options[state.suggestionIndex].dataset.trackId);
          if(track)submitGuess(track.title);
        }else submitGuess(guessInput.value);
      }
    });
    document.addEventListener("click",(event)=>{
      if(!event.target.closest(".song-search"))closeSuggestions();
    });
    audio.addEventListener("ended",()=>{
      if(state.previewTimer)window.clearTimeout(state.previewTimer);
      state.previewTimer=null;
      if(state.isPlaying){
        state.isPlaying=false;mainPlay.classList.remove("is-playing");
        setMainPlayState("Replay "+durationLabel(state.stage),"▶",false);
        roundStatus.textContent="READY TO GUESS";
      }
    });
    audio.addEventListener("volumechange",()=>{volumeSlider.value=String(Math.round(audio.volume*100));volumeValue.textContent=volumeSlider.value+"%";});

    document.querySelectorAll("[data-carousel]").forEach((button)=>{
      button.addEventListener("click",()=>{
        const container=document.getElementById(button.dataset.carousel+"-options");
        if(!container)return;
        const direction=Number(button.dataset.direction)||1;
        container.scrollBy({left:direction*Math.max(120,container.clientWidth*.72),behavior:"smooth"});
        window.setTimeout(()=>updateCarouselProgress(container),220);
      });
    });
    ["genre-options","era-options","artist-options"].forEach((id)=>{
      const container=document.getElementById(id);
      container.addEventListener("scroll",()=>updateCarouselProgress(container),{passive:true});
    });
    window.addEventListener("resize",()=>{
      ["genre-options","era-options","artist-options"].forEach((id)=>updateCarouselProgress(document.getElementById(id)));
    });
  }

  function renderAllControls() {
    document.querySelectorAll("[data-difficulty]").forEach((button)=>{
      const active=button.dataset.difficulty===state.difficulty;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    // Re-render the reels to keep selected state, pressed state and options in sync.
    renderChipGroup(genreContainer,GENRES,"genre","genre");
    renderChipGroup(eraContainer,ERAS,"era","era");
    renderChipGroup(artistContainer,ARTISTS,"artist","artist");
    startStageOptions.forEach((button)=>{
      const active=Number(button.dataset.startStage)===state.startStage;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    document.body.dataset.difficulty=state.difficulty;
    mixSummary.textContent=state.filters.genre+" · "+state.filters.era+" · "+state.filters.artist;
    roundNumberLabel.textContent=String(Math.max(1,state.round)).padStart(2,"0");
    scoreLabel.textContent=String(state.score);
    streakLabel.textContent=String(state.streak);
    setTimeline();
  }

  // Load a playable track before the large Play button is enabled, avoiding a dead
  // click or a "play" action while the actual audio source is still unresolved.
  initControls();
  renderAllControls();
  audio.volume=Number(volumeSlider.value)/100;
  volumeValue.textContent=volumeSlider.value+"%";
  prepareTrack({reload:true,initial:true});
})();