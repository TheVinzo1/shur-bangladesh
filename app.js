/* Shur (সুর) — hear Bangladesh's climate.
   Data: NASA POWER (monthly + daily point API). Imagery: NASA GIBS WMS.
   No build step, no dependencies. */
"use strict";

// ---------------------------------------------------------------- places
const PLACES = [
  { id: "dhaka",      en: "Dhaka",      bn: "ঢাকা",      gen: "ঢাকার",       at: "ঢাকায়",       lat: 23.81, lon: 90.41 },
  { id: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম",  gen: "চট্টগ্রামের",  at: "চট্টগ্রামে",   lat: 22.36, lon: 91.78 },
  { id: "sylhet",     en: "Sylhet",     bn: "সিলেট",     gen: "সিলেটের",     at: "সিলেটে",      lat: 24.89, lon: 91.87 },
  { id: "rajshahi",   en: "Rajshahi",   bn: "রাজশাহী",   gen: "রাজশাহীর",    at: "রাজশাহীতে",    lat: 24.37, lon: 88.60 },
  { id: "khulna",     en: "Khulna",     bn: "খুলনা",     gen: "খুলনার",      at: "খুলনায়",      lat: 22.85, lon: 89.54 },
  { id: "barishal",   en: "Barishal",   bn: "বরিশাল",    gen: "বরিশালের",    at: "বরিশালে",     lat: 22.70, lon: 90.35 },
  { id: "rangpur",    en: "Rangpur",    bn: "রংপুর",     gen: "রংপুরের",     at: "রংপুরে",      lat: 25.74, lon: 89.25 },
  { id: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ", gen: "ময়মনসিংহের", at: "ময়মনসিংহে",  lat: 24.75, lon: 90.41 },
];

const FIRST_YEAR = 1981;
const LAST_YEAR = 2025;
const BASE = [1981, 2010]; // baseline for "normal"

const TRACKS = {
  years:   { ms: 480, en: ["45 years", "One note per year, 1981–2025"],              bn: ["৪৫ বছর", "প্রতি বছরে একটি সুর, ১৯৮১–২০২৫"] },
  months:  { ms: 120, en: ["Every month", "540 months, warmer or cooler than normal"], bn: ["প্রতিটি মাস", "৫৪০ মাস, স্বাভাবিকের চেয়ে গরম না ঠান্ডা"] },
  monsoon: { ms: 260, en: ["Monsoon 2026", "Day by day, June–September 2026"],        bn: ["বর্ষা ২০২৬", "দিন দিন করে, জুন–সেপ্টেম্বর ২০২৬"] },
};

// ---------------------------------------------------------------- i18n
const T = {
  en: {
    tagline: "NASA climate data for all eight divisions, played as music. Made for listening first: it speaks Bangla and English and works entirely from the keyboard.",
    eyebrow: "The Earth Information Jukebox", heroTitle: "Hear 45 years of Bangladesh's climate.", ctaStart: "Start listening", ctaHow: "How to listen",
    heroCredit: "Bangladesh and the Bay of Bengal from NASA's VIIRS instrument, 10 December 2024.",
    chooseHeading: "Choose what to hear", placeLegend: "1. Place", trackLegend: "2. Track", optionsLegend: "3. Options",
    speed: "Speed", narrate: "Speak details when paused", nowHeading: "Now playing", storyBtn: "Tell me the story",
    temp: "Temperature", rain: "Rain", factsHeading: "What the data says", satHeading: "From space",
    satTrue: "True colour", satFlood: "Water view", howHeading: "How to listen",
    lgPitch: "Higher note = hotter", lgRain: "Rain sound = how much it rained", lgThunder: "Thunder = one of the wettest", lgBell: "Bell = one of the hottest",
    keysHeading: "Keyboard", soundsHeading: "Sounds", dataHeading: "The numbers", storyHeading: "The story", kPlay: "play / pause", kStep: "step one note", kPlace: "choose a division", kStory: "tell the story", kRead: "read this note aloud",
    tableSummary: "Show the numbers as a table", csv: "Download CSV",
    credits: 'Data: <a href="https://power.larc.nasa.gov/">NASA POWER</a> (NASA Langley Research Center, built on NASA GMAO MERRA-2). Satellite imagery: <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a> (VIIRS NOAA-20, MODIS Terra).',
    team: "Built by Team Nyopus, BRAC University, for the NASA Space Apps Challenge 2026: The Earth Information Jukebox.",
    play: "Play", pause: "Pause", prev: "Previous note", next: "Next note",
    loading: (p) => `Loading NASA POWER data for ${p}…`,
    loadErr: "Couldn't reach NASA POWER. Check your internet connection.", retry: "Retry",
    done: "Finished. Press Space to play again.",
    ready: (p, tr, n) => `${p}, ${tr}: ${n} notes ready. Press Space to play.`,
    noData: "NASA POWER returned no data for this track yet.",
    aboveNormal: (d) => `${d} °C above normal`, belowNormal: (d) => `${d} °C below normal`, normal: "about normal",
    vsNormalRain: (p) => `${p}% of normal`,
    mmYear: "mm in the year", mmMonth: "mm in the month", mmDay: "mm that day",
    avg: "average", flagHot: "One of the hottest", flagWet: "One of the wettest", flagHeavy: "Very heavy rain (89 mm+)",
    capYears: (p) => `${p}: each year's average temperature as a note on the staff, the hottest years in red, with each year's total rain as blue stems below, 1981–2025. Dashed red line: the long-term trend.`,
    capMonths: (p) => `${p}: each month's temperature compared with its 1981–2010 normal (red line) and monthly rain (blue bars).`,
    capMonsoon: (p) => `${p}: daily temperature (red line) and daily rain (blue bars), June–September 2026.`,
    satNone: "No daily satellite colour images exist before the year 2000. Choose a later year to see Bangladesh from space.",
    satCap: (d, s) => `${s} image of Bangladesh, ${d}. The dot is the place you're listening to.`,
    satErr: "Satellite image unavailable for this date.",
    noBnVoice: "No Bangla voice found on this device, so narration is in English. Microsoft Edge or Chrome on Android have Bangla voices.",
    fWarm: "warmer per decade", fCool: "cooler per decade", modelNote: "A note on this trend: NASA POWER temperatures come from the MERRA-2 weather model, averaged over a grid square about 50 kilometres wide. Weather stations in Bangladesh have recorded warming over these same years, so this model trend differs from what thermometers on the ground show.", fWarmTotal: (d, y1, y2) => `about ${d} °C warmer in ${y2} than in ${y1}`,
    fSig: "statistically significant (95%)", fNotSig: "not statistically significant",
    fHottest: "hottest year", fWettestMonth: "wettest month", fRainTrend: "more rain per decade", fRainTrendLess: "less rain per decade",
    fMonsoonTotal: "rain, June–September 2026", fWettestDay: "wettest day", fHeavyDays: "days of very heavy rain (89 mm+)",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    noteYears: (p, s) => `${p}, ${s.label}. Average ${f1(s.t)} degrees. Rain ${fmtInt(s.r)} millimetres.`,
    noteMonths: (p, s) => `${p}, ${s.label}. ${f1(s.t)} degrees, ${anomWords(s.a, "en")}. Rain ${fmtInt(s.r)} millimetres.`,
    noteMonsoon: (p, s) => `${p}, ${s.label}. ${f1(s.t)} degrees. Rain ${fmtInt(s.r)} millimetres.`,
    storyYears: (x) => `From ${x.y1} to ${x.y2}, NASA data shows ${x.place} ${x.slope >= 0 ? "warming" : "cooling"} by ${f2(Math.abs(x.slope))} degrees per decade, about ${f1(Math.abs(x.total))} degrees in total. ${x.sig ? "This change is statistically significant." : "This change is not statistically significant."} The hottest year was ${x.hotYear}. The wettest month was ${x.wetMonth}, with ${fmtInt(x.wetMonthMm)} millimetres of rain.`,
    storyMonsoon: (x) => `From June to September 2026, ${x.place} received ${fmtInt(x.total)} millimetres of rain. The wettest day was ${x.wetDay}, with ${fmtInt(x.wetDayMm)} millimetres. There ${x.heavy === 1 ? "was 1 day" : `were ${x.heavy} days`} of very heavy rain, above 89 millimetres.`,
  },
  bn: {
    tagline: "আটটি বিভাগের নাসার জলবায়ু তথ্য, সুরে সুরে। শোনার জন্যই তৈরি: বাংলা ও ইংরেজিতে কথা বলে, পুরোটাই কিবোর্ড দিয়ে চলে।",
    eyebrow: "দ্য আর্থ ইনফরমেশন জুকবক্স", heroTitle: "বাংলাদেশের ৪৫ বছরের জলবায়ু শুনুন।", ctaStart: "শোনা শুরু করুন", ctaHow: "কীভাবে শুনবেন",
    heroCredit: "নাসার VIIRS যন্ত্রে তোলা বাংলাদেশ ও বঙ্গোপসাগর, ১০ ডিসেম্বর ২০২৪।",
    chooseHeading: "কী শুনবেন বেছে নিন", placeLegend: "১. জায়গা", trackLegend: "২. ট্র্যাক", optionsLegend: "৩. অপশন",
    speed: "গতি", narrate: "থামলে বিস্তারিত বলবে", nowHeading: "এখন বাজছে", storyBtn: "গল্পটা বলো",
    temp: "তাপমাত্রা", rain: "বৃষ্টি", factsHeading: "তথ্য কী বলছে", satHeading: "মহাকাশ থেকে",
    satTrue: "আসল রঙ", satFlood: "পানি দেখুন", howHeading: "কীভাবে শুনবেন",
    lgPitch: "উঁচু সুর = বেশি গরম", lgRain: "বৃষ্টির শব্দ = কতটা বৃষ্টি", lgThunder: "বজ্রপাত = সবচেয়ে বেশি বৃষ্টির একটি", lgBell: "ঘণ্টা = সবচেয়ে গরমের একটি",
    keysHeading: "কিবোর্ড", soundsHeading: "শব্দগুলো", dataHeading: "সংখ্যাগুলো", storyHeading: "গল্পটা", kPlay: "চালু / বন্ধ", kStep: "এক সুর আগে-পিছে", kPlace: "বিভাগ বাছাই", kStory: "গল্পটা শুনুন", kRead: "এই সুরটা পড়ে শোনাও",
    tableSummary: "সংখ্যাগুলো টেবিলে দেখুন", csv: "CSV ডাউনলোড",
    credits: 'তথ্য: <a href="https://power.larc.nasa.gov/">NASA POWER</a> (নাসা ল্যাংলি রিসার্চ সেন্টার, NASA GMAO MERRA-2 ভিত্তিক)। স্যাটেলাইট ছবি: <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a> (VIIRS NOAA-20, MODIS Terra)।',
    team: "তৈরি করেছে টিম নিয়োপাস, ব্র্যাক বিশ্ববিদ্যালয়, NASA Space Apps Challenge 2026: The Earth Information Jukebox-এর জন্য।",
    play: "চালু", pause: "থামাও", prev: "আগের সুর", next: "পরের সুর",
    loading: (p) => `${p}-এর জন্য NASA POWER তথ্য আনা হচ্ছে…`,
    loadErr: "NASA POWER-এ পৌঁছানো যায়নি। ইন্টারনেট সংযোগ দেখুন।", retry: "আবার চেষ্টা",
    done: "শেষ। আবার শুনতে স্পেস চাপুন।",
    ready: (p, tr, n) => `${p}, ${tr}: ${n}টি সুর তৈরি। শুনতে স্পেস চাপুন।`,
    noData: "এই ট্র্যাকের জন্য NASA POWER এখনো কোনো তথ্য দেয়নি।",
    aboveNormal: (d) => `স্বাভাবিকের চেয়ে ${d} °C বেশি`, belowNormal: (d) => `স্বাভাবিকের চেয়ে ${d} °C কম`, normal: "প্রায় স্বাভাবিক",
    vsNormalRain: (p) => `স্বাভাবিকের ${p}%`,
    mmYear: "মিমি, সারা বছরে", mmMonth: "মিমি, সারা মাসে", mmDay: "মিমি, সেদিন",
    avg: "গড়", flagHot: "সবচেয়ে গরমের একটি", flagWet: "সবচেয়ে বেশি বৃষ্টির একটি", flagHeavy: "অতি ভারী বৃষ্টি (৮৯ মিমি+)",
    capYears: (p) => `${p}: প্রতি বছরের গড় তাপমাত্রা স্বরলিপির একটি করে সুর, সবচেয়ে গরম বছরগুলো লাল; নিচে নীল দণ্ডে বছরের মোট বৃষ্টি, ১৯৮১–২০২৫। লাল ড্যাশ রেখা: দীর্ঘমেয়াদি ধারা।`,
    capMonths: (p) => `${p}: প্রতি মাসের তাপমাত্রা ১৯৮১–২০১০ সালের স্বাভাবিকের তুলনায় (লাল রেখা) আর মাসিক বৃষ্টি (নীল দণ্ড)।`,
    capMonsoon: (p) => `${p}: প্রতিদিনের তাপমাত্রা (লাল রেখা) আর বৃষ্টি (নীল দণ্ড), জুন–সেপ্টেম্বর ২০২৬।`,
    satNone: "২০০০ সালের আগে প্রতিদিনের রঙিন স্যাটেলাইট ছবি নেই। মহাকাশ থেকে বাংলাদেশ দেখতে পরের কোনো বছর বেছে নিন।",
    satCap: (d, s) => `${s} ছবি, বাংলাদেশ, ${d}। বিন্দুটি আপনি যে জায়গা শুনছেন।`,
    satErr: "এই তারিখের স্যাটেলাইট ছবি পাওয়া যায়নি।",
    noBnVoice: "এই ডিভাইসে বাংলা কণ্ঠ নেই, তাই ইংরেজিতে বলা হচ্ছে। Microsoft Edge বা Android-এর Chrome-এ বাংলা কণ্ঠ আছে।",
    fWarm: "উষ্ণতা বেড়েছে প্রতি দশকে", fCool: "তাপমাত্রা কমেছে প্রতি দশকে", modelNote: "এই ধারা সম্পর্কে একটি কথা: NASA POWER-এর তাপমাত্রা আসে MERRA-2 আবহাওয়া মডেল থেকে, প্রায় ৫০ কিলোমিটার চওড়া একটি এলাকার গড়। একই বছরগুলোতে বাংলাদেশের আবহাওয়া কেন্দ্রগুলো উষ্ণতা বৃদ্ধি রেকর্ড করেছে, তাই এই মডেলের ধারা মাটিতে থার্মোমিটারের মাপের সঙ্গে মেলে না।", fWarmTotal: (d, y1, y2) => `${y1}-এর তুলনায় ${y2}-এ প্রায় ${d} °C বেশি গরম`,
    fSig: "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ (৯৫%)", fNotSig: "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়",
    fHottest: "সবচেয়ে গরম বছর", fWettestMonth: "সবচেয়ে বেশি বৃষ্টির মাস", fRainTrend: "প্রতি দশকে বৃষ্টি বেড়েছে", fRainTrendLess: "প্রতি দশকে বৃষ্টি কমেছে",
    fMonsoonTotal: "বৃষ্টি, জুন–সেপ্টেম্বর ২০২৬", fWettestDay: "সবচেয়ে বেশি বৃষ্টির দিন", fHeavyDays: "দিন অতি ভারী বৃষ্টি (৮৯ মিমি+)",
    months: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
    noteYears: (p, s) => `${p}, ${s.label}। গড় তাপমাত্রা ${f1(s.t)} ডিগ্রি। বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`,
    noteMonths: (p, s) => `${p}, ${s.label}। ${f1(s.t)} ডিগ্রি, ${anomWords(s.a, "bn")}। বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`,
    noteMonsoon: (p, s) => `${p}, ${s.label}। ${f1(s.t)} ডিগ্রি। বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`,
    storyYears: (x) => `${x.y1} থেকে ${x.y2} সাল পর্যন্ত নাসার তথ্য বলছে, ${x.gen} তাপমাত্রা প্রতি দশকে ${f2(Math.abs(x.slope))} ডিগ্রি করে ${x.slope >= 0 ? "বেড়েছে" : "কমেছে"}, মোট প্রায় ${f1(Math.abs(x.total))} ডিগ্রি। ${x.sig ? "এই পরিবর্তন পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ।" : "এই পরিবর্তন পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়।"} সবচেয়ে গরম বছর ছিল ${x.hotYear}। সবচেয়ে বেশি বৃষ্টি হয়েছিল ${x.wetMonthBn}, ${fmtInt(x.wetMonthMm)} মিলিমিটার।`,
    storyMonsoon: (x) => `২০২৬ সালের জুন থেকে সেপ্টেম্বর পর্যন্ত ${x.at} বৃষ্টি হয়েছে ${fmtInt(x.total)} মিলিমিটার। সবচেয়ে বেশি বৃষ্টি হয়েছিল ${x.wetDay}, ${fmtInt(x.wetDayMm)} মিলিমিটার। ${x.heavy} দিন অতি ভারী বৃষ্টি হয়েছে, অর্থাৎ ৮৯ মিলিমিটারের বেশি।`,
  },
};

// ---------------------------------------------------------------- helpers
const $ = (id) => document.getElementById(id);
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBn = (s) => String(s).replace(/\d/g, (d) => BN_DIGITS[d]);
const loc = (s) => (state.lang === "bn" ? toBn(s) : String(s));
const f1 = (x) => (x == null ? "—" : x.toFixed(1));
const f2 = (x) => (x == null ? "—" : x.toFixed(2));
const fmtInt = (x) => (x == null ? "—" : Math.round(x).toLocaleString("en-US"));
const t = (k, ...a) => { const v = T[state.lang][k]; return typeof v === "function" ? v(...a) : v; };
const placeName = (p = place()) => p[state.lang];
function anomWords(a, lang) {
  const d = Math.abs(a).toFixed(1);
  if (Math.abs(a) < 0.15) return T[lang].normal;
  return a > 0 ? T[lang].aboveNormal(d) : T[lang].belowNormal(d);
}
function quantile(arr, q) {
  const s = arr.filter((v) => v != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
// Ordinary least squares with a t-test on the slope.
function linreg(xs, ys) {
  const pts = xs.map((x, i) => [x, ys[i]]).filter(([, y]) => y != null);
  const n = pts.length; if (n < 3) return null;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); }
  const slope = sxy / sxx, icept = my - slope * mx;
  let sse = 0; for (const [x, y] of pts) sse += (y - (icept + slope * x)) ** 2;
  const se = Math.sqrt(sse / (n - 2) / sxx);
  const tStat = slope / se;
  return { slope, icept, tStat, sig: Math.abs(tStat) > 2.02, n };
}

// ---------------------------------------------------------------- state
const state = {
  lang: "en", placeId: "dhaka", track: "years", speed: 1, i: 0, playing: false,
  steps: [], meta: null, satMode: "true", loadToken: 0,
};
const place = () => PLACES.find((p) => p.id === state.placeId);
const cache = new Map();

// ---------------------------------------------------------------- NASA POWER
const POWER = "https://power.larc.nasa.gov/api/temporal";
function powerUrl(kind, p, start, end, params) {
  return `${POWER}/${kind}/point?parameters=${params}&community=AG&longitude=${p.lon}&latitude=${p.lat}&start=${start}&end=${end}&format=JSON`;
}
async function getJSON(url, backup) {
  if (cache.has(url)) return cache.get(url);
  try { const hit = localStorage.getItem("shur:" + url); if (hit) { const j = JSON.parse(hit); cache.set(url, j); return j; } } catch (_) {}
  let j, fromBackup = false;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    j = await res.json();
    if (!j.properties || !j.properties.parameter) throw new Error("Unexpected response");
  } catch (err) {
    if (!backup) throw err;
    // Saved copy shipped with the site (see README), used if NASA POWER can't be reached.
    const res = await fetch(backup);
    if (!res.ok) throw err;
    j = await res.json();
    fromBackup = true;
  }
  cache.set(url, j);
  // Only remember live responses, so a saved backup never hides fresher NASA data later.
  if (!fromBackup) try { localStorage.setItem("shur:" + url, JSON.stringify(j)); } catch (_) {}
  return j;
}
const ok = (v) => (v == null || v <= -990 ? null : v);

async function loadMonthly(p) {
  const j = await getJSON(powerUrl("monthly", p, FIRST_YEAR, LAST_YEAR, "T2M,PRECTOTCORR"), `data/${p.id}-monthly.json`);
  const P = j.properties.parameter;
  const months = [], annualT = {};
  for (const key of Object.keys(P.T2M).sort()) {
    const y = +key.slice(0, 4), m = +key.slice(4, 6);
    if (m === 13) { annualT[y] = ok(P.T2M[key]); continue; }
    const days = new Date(y, m, 0).getDate();
    const rd = ok(P.PRECTOTCORR[key]);
    months.push({ y, m, t: ok(P.T2M[key]), r: rd == null ? null : rd * days });
  }
  // 1981–2010 normal for each calendar month
  const norm = Array.from({ length: 12 }, (_, k) => {
    const v = months.filter((x) => x.m === k + 1 && x.y >= BASE[0] && x.y <= BASE[1] && x.t != null).map((x) => x.t);
    const r = months.filter((x) => x.m === k + 1 && x.y >= BASE[0] && x.y <= BASE[1] && x.r != null).map((x) => x.r);
    return { t: v.reduce((a, b) => a + b, 0) / v.length, r: r.reduce((a, b) => a + b, 0) / r.length };
  });
  for (const x of months) x.a = x.t == null ? null : x.t - norm[x.m - 1].t;
  const years = [];
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    const ms = months.filter((x) => x.y === y);
    const tv = ms.filter((x) => x.t != null), rv = ms.filter((x) => x.r != null);
    const tMean = annualT[y] ?? (tv.length === 12 ? tv.reduce((s, x) => s + x.t, 0) / 12 : null);
    const rSum = rv.length === 12 ? rv.reduce((s, x) => s + x.r, 0) : null;
    years.push({ y, t: tMean, r: rSum });
  }
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const baseYears = years.filter((x) => x.y >= BASE[0] && x.y <= BASE[1]);
  const normT = mean(baseYears.map((x) => x.t).filter((v) => v != null));
  const normR = mean(baseYears.map((x) => x.r).filter((v) => v != null));
  for (const x of years) { x.a = x.t == null || normT == null ? null : x.t - normT; x.rp = x.r == null || !normR ? null : (x.r / normR) * 100; }
  for (const x of months) x.rp = x.r == null || !norm[x.m - 1].r ? null : (x.r / norm[x.m - 1].r) * 100;
  return { months, years };
}

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
async function loadMonsoon(p) {
  const start = "20260601";
  let end = "20260930";
  const latest = new Date(Date.now() - 6 * 864e5);
  if (ymd(latest) < end) end = ymd(latest);
  let j;
  try { j = await getJSON(powerUrl("daily", p, start, end, "T2M,PRECTOTCORR"), `data/${p.id}-monsoon2026.json`); }
  catch (e) {
    const earlier = ymd(new Date(Date.now() - 14 * 864e5));
    j = await getJSON(powerUrl("daily", p, start, earlier < end ? earlier : end, "T2M,PRECTOTCORR"));
  }
  const P = j.properties.parameter, days = [];
  for (const key of Object.keys(P.T2M).sort()) {
    const tv = ok(P.T2M[key]), rv = ok(P.PRECTOTCORR[key]);
    if (tv == null && rv == null) continue;
    days.push({ y: +key.slice(0, 4), m: +key.slice(4, 6), d: +key.slice(6, 8), t: tv, r: rv });
  }
  return days;
}

// ---------------------------------------------------------------- build steps
function labelFor(s) {
  const mn = T[state.lang].months;
  if (state.track === "years") return loc(s.y);
  if (state.track === "months") return `${mn[s.m - 1]} ${loc(s.y)}`;
  return `${loc(s.d)} ${mn[s.m - 1]}`;
}
function isoDate(s) {
  const mm = String(s.m || 2).padStart(2, "0"), dd = String(s.d || 15).padStart(2, "0");
  return `${s.y}-${mm}-${dd}`;
}

async function build() {
  const token = ++state.loadToken;
  stop(true);
  setStatus(t("loading", placeName()));
  try {
    let steps, meta;
    if (state.track === "monsoon") {
      const days = await loadMonsoon(place());
      steps = days.map((x) => ({ ...x }));
      const wet95 = quantile(steps.map((x) => x.r), 0.95), hot95 = quantile(steps.map((x) => x.t), 0.95);
      for (const s of steps) { s.wet = s.r != null && (s.r >= wet95 || s.r >= 89); s.heavy = s.r != null && s.r >= 89; s.hot = s.t != null && s.t >= hot95; s.pitchVal = s.t; }
      meta = { kind: "monsoon" };
    } else {
      const data = await loadMonthly(place());
      if (state.track === "years") {
        steps = data.years.map((x) => ({ ...x }));
        const byT = [...steps].filter((x) => x.t != null).sort((a, b) => b.t - a.t).slice(0, 5);
        const byR = [...steps].filter((x) => x.r != null).sort((a, b) => b.r - a.r).slice(0, 3);
        for (const s of steps) { s.hot = byT.includes(s); s.wet = byR.includes(s); s.pitchVal = s.t; }
      } else {
        steps = data.months.map((x) => ({ ...x }));
        const hot = quantile(steps.map((x) => x.a), 0.97), wet = quantile(steps.map((x) => x.r), 0.97);
        for (const s of steps) { s.hot = s.a != null && s.a >= hot; s.wet = s.r != null && s.r >= wet; s.pitchVal = s.a; }
      }
      meta = { kind: "power", data };
    }
    if (token !== state.loadToken) return;
    if (!steps.length) throw new Error("No data");
    const pv = steps.map((s) => s.pitchVal).filter((v) => v != null);
    const rv = steps.map((s) => s.r).filter((v) => v != null);
    meta.pmin = Math.min(...pv); meta.pmax = Math.max(...pv);
    meta.rmax = Math.max(...rv); meta.rmin = Math.min(...rv);
    state.steps = steps; state.meta = meta; state.i = 0;
    setStatus("");
    relabel(); renderChart(); renderFacts(); renderTable(); show(0, { quiet: true });
    announce(t("ready", placeName(), TRACKS[state.track][state.lang][0], loc(steps.length)));
  } catch (e) {
    if (token !== state.loadToken) return;
    console.error(e);
    setStatus(e.message === "No data" ? t("noData") : t("loadErr"), true);
  }
}
function relabel() { for (const s of state.steps) s.label = labelFor(s); }

// ---------------------------------------------------------------- audio
let ctx, master, noiseBuf, rainGain;
const SCALE = (() => { // major pentatonic (Bhupali), G3 upward, 3 octaves
  const out = [], root = 196, steps = [0, 2, 4, 7, 9];
  for (let o = 0; o < 3; o++) for (const s of steps) out.push(root * 2 ** (o + s / 12));
  out.push(root * 8);
  return out;
})();
function initAudio() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor();
  master = ctx.createGain(); master.gain.value = 0.85;
  master.connect(comp).connect(ctx.destination);
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.5;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 600;
  rainGain = ctx.createGain(); rainGain.gain.value = 0;
  src.connect(hp).connect(bp).connect(rainGain).connect(master); src.start();
}
function note(freq, bright, when, dur) {
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  o1.type = "triangle"; o2.type = "sine"; o1.frequency.value = freq; o2.frequency.value = freq * 2;
  const g2 = ctx.createGain(); g2.gain.value = 0.22;
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700 + bright * 3800; f.Q.value = 0.8;
  const g = ctx.createGain();
  const tail = Math.max(0.18, dur * 1.5);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.32, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + tail);
  o1.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(master);
  o1.start(when); o2.start(when); o1.stop(when + tail + 0.05); o2.stop(when + tail + 0.05);
}
function burst(when, { freq, type, peak, attack, decay }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  src.playbackRate.value = 0.5 + Math.random();
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  src.connect(fl).connect(g).connect(master);
  src.start(when, Math.random()); src.stop(when + attack + decay + 0.05);
}
function bell(freq, when) {
  for (const [mult, amp] of [[4, 0.12], [5.4, 0.05]]) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(amp, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    o.connect(g).connect(master); o.start(when); o.stop(when + 1.5);
  }
}
function sonify(s, dur) {
  const when = ctx.currentTime + 0.02;
  const m = state.meta;
  if (s.pitchVal != null) {
    const n = (s.pitchVal - m.pmin) / (m.pmax - m.pmin || 1);
    const freq = SCALE[Math.round(n * (SCALE.length - 1))];
    note(freq, n, when, dur);
    if (s.hot) bell(freq, when);
  }
  const rn = s.r == null ? 0 : Math.sqrt((s.r - m.rmin) / (m.rmax - m.rmin || 1));
  rainGain.gain.setTargetAtTime(rn * 0.22, when, Math.min(0.08, dur / 3));
  const drops = Math.round(rn * 7);
  for (let k = 0; k < drops; k++) burst(when + Math.random() * dur, { freq: 3500 + Math.random() * 3000, type: "highpass", peak: 0.08 + rn * 0.1, attack: 0.002, decay: 0.03 });
  if (s.wet) burst(when, { freq: 140, type: "lowpass", peak: 0.9, attack: 0.12, decay: 1.6 });
}

// ---------------------------------------------------------------- playback
let timer = null, lastSat = 0;
const stepMs = () => TRACKS[state.track].ms / state.speed;
function play() {
  if (!state.steps.length) return;
  initAudio();
  if (state.i >= state.steps.length - 1) state.i = 0;
  state.playing = true; window.speechSynthesis?.cancel();
  updatePlayBtn(); tick();
}
function tick() {
  if (!state.playing) return;
  sonify(state.steps[state.i], stepMs() / 1000);
  show(state.i, { quiet: true, playing: true });
  if (state.i >= state.steps.length - 1) {
    timer = setTimeout(() => { stop(true); announce(t("done")); }, stepMs());
    return;
  }
  timer = setTimeout(() => { state.i++; tick(); }, stepMs());
}
function stop(silent) {
  clearTimeout(timer); timer = null;
  const was = state.playing;
  state.playing = false;
  if (rainGain) rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  updatePlayBtn();
  if (was && !silent && state.steps.length) show(state.i, { quiet: false });
}
function toggle() { state.playing ? stop() : play(); }
function step(d) {
  if (!state.steps.length) return;
  if (state.playing) stop(true);
  initAudio();
  state.i = Math.min(state.steps.length - 1, Math.max(0, state.i + d));
  const s = state.steps[state.i];
  sonify(s, 0.5);
  setTimeout(() => { if (rainGain && !state.playing) rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1); }, 600);
  show(state.i, { quiet: false });
}
function updatePlayBtn() {
  const b = $("play");
  b.dataset.playing = state.playing;
  b.setAttribute("aria-label", t(state.playing ? "pause" : "play"));
}

// ---------------------------------------------------------------- render
function show(i, { quiet, playing } = {}) {
  const s = state.steps[i]; if (!s) return;
  $("r-when").textContent = s.label;
  $("r-temp").textContent = s.t == null ? "—" : `${loc(f1(s.t))} °C`;
  $("r-anom").textContent = state.track === "monsoon" ? "" : (s.a == null ? "" : loc(anomWords(s.a, state.lang)));
  $("r-rain").textContent = s.r == null ? "—" : `${loc(fmtInt(s.r))}`;
  const unit = state.track === "years" ? t("mmYear") : state.track === "months" ? t("mmMonth") : t("mmDay");
  $("r-rainsub").textContent = unit + (s.rp != null && state.track !== "monsoon" ? ` · ${loc(t("vsNormalRain", Math.round(s.rp)))}` : "");
  const flags = [];
  if (s.hot) flags.push(`<span class="flag hot">${t("flagHot")}</span>`);
  if (s.heavy) flags.push(`<span class="flag extreme">${t("flagHeavy")}</span>`);
  else if (s.wet) flags.push(`<span class="flag wet">${t("flagWet")}</span>`);
  $("r-flags").innerHTML = flags.join("");
  moveCursor(i);
  const now = performance.now();
  if (!playing || now - lastSat > 1500) { lastSat = now; renderSat(s); }
  if (!quiet) {
    const text = noteText(s);
    announce(text);
    if ($("narrate").checked) speak(text);
  }
}
function noteText(s) {
  const k = state.track === "years" ? "noteYears" : state.track === "months" ? "noteMonths" : "noteMonsoon";
  return loc(t(k, placeName(), s));
}

// chart ---------------------------------------------------------------
const CW = 1000, CH = 360, PAD = { l: 72, r: 24, t: 30, b: 34 };
let xAt = () => 0, yT = () => 0;
function renderChart() {
  const S = state.steps, m = state.meta, n = S.length;
  const iw = CW - PAD.l - PAD.r, ih = CH - PAD.t - PAD.b;
  const bw = iw / n;
  xAt = (i) => PAD.l + bw * (i + 0.5);
  const tv = S.map((s) => s.pitchVal).filter((v) => v != null);
  const tmin = Math.min(...tv), tmax = Math.max(...tv), tpad = (tmax - tmin) * 0.12 || 1;
  yT = (v) => PAD.t + ih * 0.62 * (1 - (v - (tmin - tpad)) / (tmax - tmin + 2 * tpad));
  const rH = ih * 0.36, rBase = PAD.t + ih;
  const bars = S.map((s, i) => s.r == null ? "" :
    `<rect class="bar${s.wet ? " wet" : ""}" x="${(PAD.l + bw * i + bw * (n <= 60 ? 0.38 : 0.12)).toFixed(2)}" width="${Math.max(0.6, bw * (n <= 60 ? 0.24 : 0.76)).toFixed(2)}" y="${(rBase - rH * (s.r / (m.rmax || 1))).toFixed(2)}" height="${(rH * (s.r / (m.rmax || 1))).toFixed(2)}"/>`).join("");
  const pts = S.map((s, i) => s.pitchVal == null ? null : `${xAt(i).toFixed(2)},${yT(s.pitchVal).toFixed(2)}`).filter(Boolean).join(" ");
  // The temperature sits on a five-line staff, like the melody it plays.
  const staffTop = PAD.t + ih * 0.62 * 0.08, staffGap = (ih * 0.62 * 0.84) / 4;
  const staff = [0, 1, 2, 3, 4].map((k) => `<line x1="${PAD.l}" x2="${CW - PAD.r}" y1="${(staffTop + k * staffGap).toFixed(2)}" y2="${(staffTop + k * staffGap).toFixed(2)}"/>`).join("");
  const heads = n <= 60 ? S.map((s, i) => s.pitchVal == null ? "" :
    `<ellipse class="head${s.hot ? " hot" : ""}" cx="${xAt(i).toFixed(2)}" cy="${yT(s.pitchVal).toFixed(2)}" rx="7.5" ry="5.4"/>`).join("") : "";
  // trend (years only)
  let trend = "";
  if (state.track === "years") {
    const lr = linreg(S.map((s) => s.y), S.map((s) => s.t));
    if (lr) trend = `<line class="trend" x1="${xAt(0)}" x2="${xAt(n - 1)}" y1="${yT(lr.icept + lr.slope * S[0].y)}" y2="${yT(lr.icept + lr.slope * S[n - 1].y)}"/>`;
  }
  // x ticks
  const ticks = [];
  S.forEach((s, i) => {
    let lab = null;
    if (state.track === "years" && s.y % 5 === 0) lab = loc(s.y);
    if (state.track === "months" && s.m === 1 && s.y % 5 === 0) lab = loc(s.y);
    if (state.track === "monsoon" && s.d === 1) lab = T[state.lang].months[s.m - 1].slice(0, state.lang === "bn" ? 4 : 3);
    if (lab) ticks.push(`<text x="${xAt(i)}" y="${CH - 8}" text-anchor="middle">${lab}</text><line x1="${xAt(i)}" x2="${xAt(i)}" y1="${PAD.t}" y2="${rBase}"/>`);
  });
  const unitT = state.track === "months" ? "±°C" : "°C";
  const yl = [tmin, (tmin + tmax) / 2, tmax].map((v) => `<text x="${PAD.l - 6}" y="${yT(v) + 4}" text-anchor="end">${loc(v.toFixed(state.track === "months" ? 1 : 1))}</text>`).join("");
  $("chart").innerHTML =
    `<svg viewBox="0 0 ${CW} ${CH}" aria-hidden="true">
      <g class="grid">${ticks.map((x) => x.replace(/<text[^>]*>[^<]*<\/text>/, "")).join("")}</g>
      <g class="staff">${staff}</g>
      ${bars}${trend}
      <polyline class="tline${n <= 60 ? " slur" : ""}" points="${pts}"/>
      <g class="heads">${heads}</g>
      <g class="axis">${ticks.map((x) => x.replace(/<line[^>]*\/>/, "")).join("")}${yl}<text x="${PAD.l - 6}" y="${PAD.t - 2}" text-anchor="end">${unitT}</text></g>
      <line class="cursor" id="cursor" x1="0" x2="0" y1="${PAD.t}" y2="${rBase}"/>
      <ellipse class="dot" id="cdot" rx="10" ry="7.2" cx="0" cy="0"/>
    </svg>`;
  const k = state.track === "years" ? "capYears" : state.track === "months" ? "capMonths" : "capMonsoon";
  $("chart-cap").textContent = t(k, placeName());
}
function moveCursor(i) {
  const c = $("cursor"), d = $("cdot"); if (!c) return;
  const s = state.steps[i], x = xAt(i);
  c.setAttribute("x1", x); c.setAttribute("x2", x);
  if (s.pitchVal != null) { d.setAttribute("cx", x); d.setAttribute("cy", yT(s.pitchVal)); d.style.display = ""; } else d.style.display = "none";
}

// facts ---------------------------------------------------------------
let story = "";
function renderFacts() {
  const L = state.lang, ul = $("facts"), m = state.meta;
  const li = (big, cls, lbl) => `<li><span class="big ${cls}">${big}</span><span class="lbl">${lbl}</span></li>`;
  if (m.kind === "monsoon") {
    const S = state.steps;
    if (!S.length) { ul.innerHTML = ""; story = ""; return; }
    const total = S.reduce((a, s) => a + (s.r || 0), 0);
    const wd = S.reduce((a, s) => (s.r != null && (a == null || s.r > a.r) ? s : a), null);
    const heavy = S.filter((s) => s.heavy).length;
    const wetDay = `${loc(wd.d)} ${T[L].months[wd.m - 1]}`;
    ul.innerHTML =
      li(`${loc(fmtInt(total))} ${L === "bn" ? "মিমি" : "mm"}`, "rain", t("fMonsoonTotal")) +
      li(wetDay, "rain", `${t("fWettestDay")} · ${loc(fmtInt(wd.r))} ${L === "bn" ? "মিমি" : "mm"}`) +
      li(loc(heavy), "", t("fHeavyDays"));
    story = loc(t("storyMonsoon", { place: placeName(), gen: place().gen, at: place().at, total, wetDay, wetDayMm: wd.r, heavy }));
    $("story-text").textContent = story;
    return;
  }
  const Y = m.data.years, M = m.data.months;
  const lr = linreg(Y.map((x) => x.y), Y.map((x) => x.t));
  const rr = linreg(Y.map((x) => x.y), Y.map((x) => x.r));
  const hot = Y.reduce((a, x) => (x.t != null && (!a || x.t > a.t) ? x : a), null);
  const wm = M.reduce((a, x) => (x.r != null && (!a || x.r > a.r) ? x : a), null);
  const slope = lr.slope * 10, total = lr.slope * (LAST_YEAR - FIRST_YEAR);
  const wetMonth = `${T[L].months[wm.m - 1]} ${loc(wm.y)}`;
  const sign = (v) => (v >= 0 ? "+" : "−");
  ul.innerHTML =
    li(`${sign(slope)}${loc(Math.abs(slope).toFixed(2))} °C`, "heat", `${t(slope >= 0 ? "fWarm" : "fCool")} · ${lr.sig ? t("fSig") : t("fNotSig")}`) +
    li(loc(hot.y), "heat", `${t("fHottest")} · ${loc(f1(hot.t))} °C ${t("avg")}`) +
    li(wetMonth, "rain", `${t("fWettestMonth")} · ${loc(fmtInt(wm.r))} ${L === "bn" ? "মিমি" : "mm"}`) +
    li(`${sign(rr.slope)}${loc(fmtInt(Math.abs(rr.slope * 10)))} ${L === "bn" ? "মিমি" : "mm"}`, "rain",
      `${rr.slope >= 0 ? t("fRainTrend") : t("fRainTrendLess")} · ${rr.sig ? t("fSig") : t("fNotSig")}`);
  story = loc(t("storyYears", { y1: FIRST_YEAR, y2: LAST_YEAR, place: placeName(), gen: place().gen, at: place().at, slope, total, sig: lr.sig, hotYear: hot.y, wetMonth, wetMonthBn: `${wm.y} সালের ${T.bn.months[wm.m - 1]} মাসে`, wetMonthMm: wm.r }));
  if (slope < 0) story += " " + t("modelNote");
  $("story-text").textContent = story;
}

// table + csv --------------------------------------------------------
function renderTable() {
  const S = state.steps, L = state.lang;
  const head = state.track === "monsoon"
    ? [L === "bn" ? "তারিখ" : "Date", "°C", L === "bn" ? "বৃষ্টি (মিমি)" : "Rain (mm)"]
    : [L === "bn" ? "সময়" : "When", "°C", L === "bn" ? "স্বাভাবিক থেকে (°C)" : "vs normal (°C)", L === "bn" ? "বৃষ্টি (মিমি)" : "Rain (mm)"];
  const rows = S.map((s) => {
    const cells = [s.label, loc(f1(s.t))];
    if (state.track !== "monsoon") cells.push(s.a == null ? "—" : loc((s.a >= 0 ? "+" : "") + s.a.toFixed(2)));
    cells.push(loc(fmtInt(s.r)));
    return `<tr>${cells.map((c, k) => (k === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`;
  }).join("");
  $("table").innerHTML = `<table><caption class="visually-hidden">${$("chart-cap").textContent}</caption><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}
function downloadCSV() {
  const S = state.steps, p = place();
  const lines = state.track === "monsoon"
    ? ["date,temperature_c,rain_mm", ...S.map((s) => `${isoDate(s)},${s.t ?? ""},${s.r == null ? "" : s.r.toFixed(2)}`)]
    : ["period,temperature_c,anomaly_vs_1981_2010_c,rain_mm",
       ...S.map((s) => `${state.track === "years" ? s.y : `${s.y}-${String(s.m).padStart(2, "0")}`},${s.t == null ? "" : s.t.toFixed(2)},${s.a == null ? "" : s.a.toFixed(3)},${s.r == null ? "" : s.r.toFixed(1)}`)];
  lines.unshift(`# Source: NASA POWER (power.larc.nasa.gov), ${p.en} ${p.lat},${p.lon}`);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  a.download = `shur-${p.id}-${state.track}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// satellite (NASA GIBS WMS) --------------------------------------------
const BBOX = { s: 20.55, w: 87.95, n: 26.75, e: 92.75 };
function satLayer(date) {
  if (date >= "2018-01-05") return { id: state.satMode === "true" ? "VIIRS_NOAA20_CorrectedReflectance_TrueColor" : "VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1", name: "VIIRS NOAA-20" };
  if (date >= "2000-02-24") return { id: state.satMode === "true" ? "MODIS_Terra_CorrectedReflectance_TrueColor" : "MODIS_Terra_CorrectedReflectance_Bands721", name: "MODIS Terra" };
  return null;
}
function renderSat(s) {
  const date = isoDate(s), L = satLayer(date), img = $("sat-img"), empty = $("sat-empty");
  const p = place(), pin = $("sat-pin");
  pin.style.left = `${((p.lon - BBOX.w) / (BBOX.e - BBOX.w)) * 100}%`;
  pin.style.top = `${((BBOX.n - p.lat) / (BBOX.n - BBOX.s)) * 100}%`;
  pin.hidden = !L;
  if (!L) { img.hidden = true; empty.hidden = false; empty.textContent = t("satNone"); $("sat-cap").textContent = ""; return; }
  const url = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${L.id}&STYLES=&CRS=EPSG:4326&BBOX=${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}&WIDTH=480&HEIGHT=620&FORMAT=image/jpeg&TIME=${date}`;
  const shown = `${s.d ? loc(s.d) + " " : (state.track === "years" ? loc(15) + " " : loc(15) + " ")}${T[state.lang].months[(s.m || 2) - 1]} ${loc(s.y)}`;
  img.hidden = false; empty.hidden = true;
  img.alt = t("satCap", shown, L.name);
  img.onerror = () => { img.hidden = true; pin.hidden = true; empty.hidden = false; empty.textContent = t("satErr"); };
  if (img.dataset.src !== url) { img.dataset.src = url; img.src = url; }
  $("sat-cap").textContent = t("satCap", shown, L.name);
}

// ---------------------------------------------------------------- speech + announce
let annTimer;
function announce(text) {
  clearTimeout(annTimer);
  annTimer = setTimeout(() => { $("announcer").textContent = ""; requestAnimationFrame(() => ($("announcer").textContent = text)); }, 150);
}
let warnedVoice = false;
function speak(text) {
  const synth = window.speechSynthesis; if (!synth) return;
  synth.cancel();
  const voices = synth.getVoices();
  let lang = state.lang, say = text;
  const bnVoice = voices.find((v) => /^bn/i.test(v.lang));
  if (lang === "bn" && voices.length && !bnVoice) {
    if (!warnedVoice) { setStatus(T.bn.noBnVoice); warnedVoice = true; }
    lang = "en"; say = englishOf();
  }
  const u = new SpeechSynthesisUtterance(say);
  u.lang = lang === "bn" ? "bn-BD" : "en-US";
  const voice = lang === "bn" ? bnVoice : voices.find((v) => /^en/i.test(v.lang));
  if (voice) u.voice = voice;
  u.rate = 0.95;
  synth.speak(u);
}
// Re-render the same sentence in English when no Bangla voice is available.
function englishOf() {
  const prev = state.lang; state.lang = "en"; relabel();
  const s = state.steps[state.i];
  const out = speakingStory ? (renderFacts(), story) : noteText(s);
  state.lang = prev; relabel(); renderFacts();
  return out;
}
let speakingStory = false;
function tellStory() {
  if (!story) return;
  if (state.playing) stop(true);
  announce(story);
  speakingStory = true; speak(story); speakingStory = false;
}

function setStatus(msg, err) {
  const el = $("status");
  el.className = "status" + (err ? " err" : "");
  el.textContent = msg;
  if (err) { const b = document.createElement("button"); b.type = "button"; b.textContent = t("retry"); b.onclick = build; el.append(b); }
}

// ---------------------------------------------------------------- UI wiring
function renderControls() {
  $("places").innerHTML = PLACES.map((p, k) =>
    `<button type="button" class="chip" data-id="${p.id}" aria-pressed="${p.id === state.placeId}"><span class="n" aria-hidden="true">${loc(k + 1)}</span><span lang="${state.lang === "bn" ? "bn" : "en"}">${p[state.lang]}</span></button>`).join("");
  $("tracks").innerHTML = Object.entries(TRACKS).map(([id, tr]) =>
    `<button type="button" class="track" data-id="${id}" aria-pressed="${id === state.track}"><b>${tr[state.lang][0]}</b><small>${tr[state.lang][1]}</small></button>`).join("");
}
function applyLang() {
  document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $("lang-en").setAttribute("aria-pressed", state.lang === "en");
  $("lang-bn").setAttribute("aria-pressed", state.lang === "bn");
  $("prev").setAttribute("aria-label", t("prev")); $("next").setAttribute("aria-label", t("next"));
  updatePlayBtn(); renderControls();
  $("speed-out").textContent = loc(state.speed) + "×";
  if (state.steps.length) { relabel(); renderChart(); renderFacts(); renderTable(); show(state.i, { quiet: true }); }
}
function choosePlace(id) { if (id === state.placeId) return; state.placeId = id; renderControls(); build(); }
function chooseTrack(id) { if (id === state.track) return; state.track = id; renderControls(); build(); }

document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip"); if (chip) return choosePlace(chip.dataset.id);
  const tr = e.target.closest(".track"); if (tr) return chooseTrack(tr.dataset.id);
});
$("play").addEventListener("click", toggle);
$("start").addEventListener("click", (e) => {
  e.preventDefault();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $("player").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  $("play").focus({ preventScroll: true });
  if (!state.playing) play();
});
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
$("story").addEventListener("click", tellStory);
$("csv").addEventListener("click", downloadCSV);
$("lang-en").addEventListener("click", () => { state.lang = "en"; applyLang(); });
$("lang-bn").addEventListener("click", () => { state.lang = "bn"; applyLang(); });
$("speed").addEventListener("input", (e) => { state.speed = +e.target.value; $("speed-out").textContent = loc(state.speed) + "×"; });
$("sat-true").addEventListener("click", () => setSat("true"));
$("sat-flood").addEventListener("click", () => setSat("flood"));
function setSat(mode) {
  state.satMode = mode;
  $("sat-true").setAttribute("aria-pressed", mode === "true");
  $("sat-flood").setAttribute("aria-pressed", mode === "flood");
  if (state.steps.length) renderSat(state.steps[state.i]);
}
document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const onButton = tag === "BUTTON" || tag === "SUMMARY" || tag === "A";
  if (e.key === " " && !onButton) { e.preventDefault(); toggle(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  else if (/^[1-8]$/.test(e.key)) choosePlace(PLACES[+e.key - 1].id);
  else if (e.key === "s" || e.key === "S") tellStory();
  else if (e.key === "r" || e.key === "R") { const s = state.steps[state.i]; if (s) { const x = noteText(s); announce(x); speak(x); } }
});
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => {};

applyLang();
build();
