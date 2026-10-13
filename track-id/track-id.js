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
  const challengeButton = $("challenge-button");
  const playbackStartButton = $("playback-start");
  const playbackStartLabel = $("playback-start-label");
  const startStageOptions = [...document.querySelectorAll("[data-start-stage]")];
  const volumeSlider = $("volume-slider");
  const volumeValue = $("volume-value");
  const mixSummary = $("mix-summary");
  const poolSummary = $("pool-summary");
  const toast = $("toast");

  const ITUNES_SEARCH = "https://itunes.apple.com/search";
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
    {name:"Dolly Parton", query:"Dolly Parton", genre:"Country", hits:["9 to 5","jolene","i will always love you"]}
  ];
  const DEFAULT_ARTISTS = ["Taylor Swift","Kanye West","Imagine Dragons","Michael Jackson","Rihanna","Drake","The Weeknd","Queen","Coldplay","Billie Eilish","Bruno Mars","Eminem"];
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
    previewTimer:null,
    suggestionIndex:-1,
    currentOffset:0
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
  }

  function renderAllControls() {
    difficultyContainer.querySelectorAll("[data-difficulty]").forEach((button)=>{
      const active=button.dataset.difficulty===state.difficulty;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
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
    stageCounter.textContent="CLIP "+String(state.stage+1).padStart(2,"0")+" / "+String(CLIPS.length).padStart(2,"0");
    clipDuration.textContent=durationLabel(state.stage);
    clipLabels.forEach((label,index)=>label.classList.toggle("active",index===state.stage));
    const pct=[1,3.5,13.5,53.5,100][state.stage]||1;
    clipProgress.style.width=pct+"%";
  }

  function artistNamesForFilters() {
    if(state.filters.artist!=="Any artist")return [state.filters.artist];
    const genre=state.filters.genre;
    const era=state.filters.era;
    let names=genre!=="Any genre"?(GENRE_ARTISTS[genre]||DEFAULT_ARTISTS):DEFAULT_ARTISTS.slice();
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

  async function fetchCatalogForFilters() {
    const names=artistNamesForFilters();
    const selectedArtist=state.filters.artist!=="Any artist";
    const limit=selectedArtist?200:65;
    const terms=selectedArtist?[names[0]||state.filters.artist]:names.slice(0,12);
    const requests=terms.map((name,index)=>searchCatalog(name,limit,index));
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

  function knownHit(track) {
    const cfg=getArtist(state.filters.artist);
    if(!cfg||!cfg.hits)return false;
    const key=titleKey(track.title);
    return cfg.hits.some((hit)=>titleKey(hit)===key);
  }

  function difficultyPool(catalog) {
    const tracks=catalog.slice().sort((a,b)=>a.rank-b.rank||a.queryIndex-b.queryIndex);
    const n=tracks.length;
    if(!n)return [];
    let selected;
    if(state.difficulty==="easy") {
      const hits=tracks.filter(knownHit);
      selected=hits.length>=8?hits:tracks.slice(0,Math.max(8,Math.ceil(n*.4)));
    } else if(state.difficulty==="medium") {
      selected=tracks.slice(0,Math.max(10,Math.ceil(n*.68)));
    } else if(state.difficulty==="hard") {
      selected=tracks.slice(Math.floor(n*.22),Math.max(Math.floor(n*.22)+8,Math.ceil(n*.82)));
    } else if(state.difficulty==="expert") {
      selected=tracks.slice(Math.floor(n*.42));
    } else {
      selected=tracks.slice(Math.floor(n*.62));
    }
    if(selected.length<8) selected=tracks;
    return shuffle([...new Map(selected.map((track)=>[track.id,track])).values()]);
  }

  function shuffle(array) {
    const copy=array.slice();
    for(let i=copy.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function setTimeline() {
    clipLabels.forEach((label,index)=>label.classList.toggle("active",index===state.stage));
    clipProgress.style.width=([1,3.5,13.5,53.5,100][state.stage]||1)+"%";
    clipDuration.textContent=durationLabel(state.stage);
    stageCounter.textContent="CLIP "+String(state.stage+1).padStart(2,"0")+" / 05";
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
    state.previewTimer=null;
    audio.pause();
    state.isPlaying=false;
    mainPlay.classList.remove("is-playing");
  }

  function waitForTrack(track) {
    return new Promise((resolve,reject)=>{
      if(!track||!track.previewUrl){reject(new Error("No playable preview for this recording."));return;}
      if(audio.src!==track.previewUrl){
        audio.src=track.previewUrl;
        audio.load();
      }
      audio.volume=Number(volumeSlider.value)/100;
      if(audio.readyState>=2 && Number.isFinite(audio.duration)&&audio.duration>0){
        resolve();
        return;
      }
      let settled=false;
      const timeout=window.setTimeout(()=>finish(new Error("The preview took too long to load. Try the next track.")),12000);
      const clean=()=>{
        audio.removeEventListener("loadedmetadata",onReady);
        audio.removeEventListener("canplay",onReady);
        audio.removeEventListener("error",onError);
        window.clearTimeout(timeout);
      };
      const finish=(error)=>{
        if(settled)return;
        settled=true;clean();
        if(error)reject(error);else resolve();
      };
      const onReady=()=>{if(audio.duration>0)finish();};
      const onError=()=>finish(new Error("This audio preview is unavailable. Skip to another track."));
      audio.addEventListener("loadedmetadata",onReady);
      audio.addEventListener("canplay",onReady);
      audio.addEventListener("error",onError);
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
    state.used.add("__loading__");
    resultActions.hidden=true;
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
        poolSummary.textContent="No playable songs match these filters.";
        setMainPlayState("No tracks found","!",true);
        guessInput.disabled=true;
        skipButton.disabled=true;
        setFeedback("No previewable tracks match this mix. Try a different genre, era, or artist.","error");
        return;
      }
      poolSummary.textContent=state.pool.length+" playable tracks";
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
    if(state.round===0 || !initial)state.round++;
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
      setFeedback("Listen closely. The first clue is "+durationLabel(state.stage)+".");
    } catch(error) {
      if(token!==state.requestToken||state.currentTrack!==track)return;
      state.loadingPreview=false;
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
    const multipliers={easy:1,medium:1.15,hard:1.35,expert:1.6,impossible:2};
    const points=won?Math.round([1000,750,500,250,100][state.stage]*multipliers[state.difficulty]):0;
    if(won){state.score+=points;state.streak++;}
    else{state.streak=0;}
    scoreLabel.textContent=String(state.score);
    streakLabel.textContent=String(state.streak);
    roundStatus.textContent=won?"CORRECT":"TRACK REVEALED";
    setFeedback(won?"+"+points+" points · "+durationLabel(state.stage)+" clue":"The answer is revealed. Ready for another?",won?"success":"");
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
    revealKicker.textContent=won?"YOU GOT IT!":"TRACK REVEALED";
    revealTitle.hidden=false;revealTitle.textContent=track.title;
    revealArtist.hidden=false;revealArtist.textContent=track.artist;
    revealAlbum.hidden=false;revealAlbum.textContent=track.album||"";
    resultMessage.hidden=false;resultMessage.textContent=won?"Clean ears. Can you do it again?":"Keep the streak alive on the next one.";
    mainPlay.hidden=true;
    timeline.hidden=true;
    guessRow.hidden=true;
    resultActions.hidden=false;
    challengeButton.textContent="♧ Challenge your friend";
    nextButton.textContent="Next  ▷|";
    guessInput.value="";
    closeSuggestions();
  }

  function playSnippet() {
    if(!state.currentTrack||state.loadingPreview||state.revealed||!state.currentTrack.previewUrl)return;
    stopTimers();
    state.roundActive=true;
    state.isPlaying=true;
    const token=state.playbackToken;
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
      setMainPlayState("Replay "+durationLabel(state.stage),"▶",false);
      roundStatus.textContent="READY TO GUESS";
      setFeedback("Make a guess or skip for a longer clue.");
    };
    if(playback&&typeof playback.catch==="function"){
      playback.catch(()=>{
        if(token!==state.playbackToken)return;
        state.isPlaying=false;mainPlay.classList.remove("is-playing");
        setMainPlayState("Try again","▶",false);
        roundStatus.textContent="PLAYBACK ERROR";
        setFeedback("The browser couldn't play this preview. Try again or skip.","error");
      });
    }
    state.previewTimer=window.setTimeout(stopAtEnd,Math.max(120,seconds*1000));
  }

  function advanceClue(autoPlay=true) {
    if(!state.currentTrack||state.revealed)return;
    stopTimers();
    if(state.stage>=CLIPS.length-1){showAnswer(false);return;}
    state.stage++;
    setTimeline();
    renderAllControls();
    roundStatus.textContent="CLIP REVEALED";
    setFeedback("Now you can hear "+durationLabel(state.stage)+".");
    setMainPlayState("Play "+durationLabel(state.stage),"▶",false);
    if(autoPlay)playSnippet();
  }

  function submitGuess(value) {
    if(!state.currentTrack||state.revealed||state.loadingPreview)return;
    const raw=String(value||guessInput.value).trim();
    if(!raw){setFeedback("Type a song title first.","error");guessInput.focus();return;}
    closeSuggestions();
    guessInput.value=raw;
    if(titleKey(raw)===titleKey(state.currentTrack.title)){
      showAnswer(true);
      return;
    }
    setFeedback("Not quite — revealing the next clue…","error");
    advanceClue(true);
  }

  async function settingsChanged(key) {
    if(state.roundActive&&!state.revealed){
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
    if(state.roundActive&&!state.revealed){setFeedback("Difficulty changes will apply to the next track.");return;}
    prepareTrack({reload:true,initial:state.round===0});
  }

  function initControls() {
    difficultyContainer.querySelectorAll("[data-difficulty]").forEach((button)=>{
      button.addEventListener("click",()=>setDifficulty(button.dataset.difficulty));
    });
    renderChipGroup(genreContainer,GENRES,"genre","genre");
    renderChipGroup(eraContainer,ERAS,"era","era");
    renderChipGroup(artistContainer,ARTISTS,"artist","artist");

    startStageOptions.forEach((button)=>{
      button.addEventListener("click",()=>{
        state.startStage=Number(button.dataset.startStage);
        renderAllControls();
        if(state.roundActive&&!state.revealed){setFeedback("Starting clue changes will apply to the next track.");return;}
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
      const anyOr= (items)=>items[Math.floor(Math.random()*items.length)];
      state.filters.genre=anyOr(GENRES);
      state.filters.era=anyOr(ERAS);
      state.filters.artist=anyOr(ARTISTS).name;
      state.difficulty=anyOr(["easy","medium","hard","expert","impossible"]);
      renderAllControls();
      showToast("Your mix has been rerolled");
      prepareTrack({reload:true,initial:state.round===0});
    });

    mainPlay.addEventListener("click",playSnippet);
    skipButton.addEventListener("click",()=>advanceClue(true));
    nextButton.addEventListener("click",()=>prepareTrack({reload:state.poolKey!==currentFilterKey(),initial:false}));
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
  }

  function renderAllControls() {
    difficultyContainer.querySelectorAll("[data-difficulty]").forEach((button)=>{
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