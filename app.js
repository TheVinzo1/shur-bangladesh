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
  years:   { ms: 480,  en: ["45 years", "One note per year, 1981–2025"],              bn: ["৪৫ বছর", "প্রতি বছরে একটি সুর, ১৯৮১–২০২৫"] },
  decades: { ms: 1100, en: ["Decades", "One long note per decade, 1981–2025"],       bn: ["দশক", "প্রতি দশকে একটি লম্বা সুর, ১৯৮১–২০২৫"] },
  months:  { ms: 120,  en: ["Every month", "540 months, warmer or cooler than normal"], bn: ["প্রতিটি মাস", "৫৪০ মাস, স্বাভাবিকের চেয়ে গরম না ঠান্ডা"] },
  monsoon: { ms: 260,  en: ["Monsoon 2026", "Day by day, June–September 2026"],        bn: ["বর্ষা ২০২৬", "দিন দিন করে, জুন–সেপ্টেম্বর ২০২৬"] },
};
const DECADES = [[1981, 1990], [1991, 2000], [2001, 2010], [2011, 2020], [2021, 2025]];

// One shared scale for all eight divisions, so a note means the same temperature
// (and a rain sound the same rainfall) whichever division is playing.
// Ranges cover every division in the NASA POWER data with a little room; values outside are clamped.
const SHARED = {
  years:   { p: [24, 28],     r: [0, 7500] }, // annual mean °C, annual rain mm
  decades: { p: [24, 28],     r: [0, 7500] },
  months:  { p: [-4.5, 4.5],  r: [0, 2100] }, // °C vs the month's 1981–2010 normal, monthly rain mm
  monsoon: { p: [25, 32],     r: [0, 190] },  // daily mean °C, daily rain mm
};

// ---------------------------------------------------------------- i18n
const T = {
  en: {
    tagline: "NASA climate data for all eight divisions, played as music. Made for listening first: it reads the numbers aloud and works entirely from the keyboard.",
    eyebrow: "The Earth Information Jukebox", heroTitle: "Hear 45 years of Bangladesh's climate.", ctaStart: "Start listening", ctaHow: "How to listen",
    heroCredit: "Bangladesh and the Bay of Bengal from NASA's VIIRS instrument, 10 December 2024.",
    chooseHeading: "Choose what to hear", placeLegend: "1. Place", trackLegend: "2. Track", cmpLegend: "3. Compare", optionsLegend: "4. Options",
    cmpLabel: "Compare with another division", cmpNone: "No comparison", cmpHint: "Your division plays in the left ear, the other in the right, on the same scale.",
    stretch: "Stretch the notes to this division only (more detail, but notes no longer match other divisions)",
    musical: "Snap to the raga scale (16 notes: more tuneful, less exact)",
    srMode: "I use a screen reader (Shur's own voice stays quiet)",
    tempSrcLabel: "Temperature data", optTempPower: "NASA POWER model (grid average)", optTempStation: "Weather station thermometers (GISTEMP record)",
    rainSrcLabel: "Rain data", optRainPower: "NASA POWER (1981–2025)", optRainImerg: "NASA IMERG satellite (2001–2025)",
    srcMissing: (p) => `Some of the chosen data isn't saved for ${p} yet, so Shur uses NASA POWER there.`,
    srcPowerT: "NASA POWER's model data", srcStationT: (n, ds, km) => `${ds}'s thermometer record from the ${n} station${km != null ? `, ${km} kilometres away,` : ""}`,
    srcPowerR: "NASA POWER's rain data", srcImergR: "NASA's IMERG satellite rain data",
    shortPowerT: "NASA POWER model", shortStation: (n, km, ds) => `${ds}, ${n} station${km != null ? `, ${km} km away` : ""}`,
    shortPowerR: "NASA POWER", shortImerg: "NASA IMERG satellite",
    capSrc: (a, b) => ` Temperature: ${a}. Rain: ${b}.`,
    fCrossT: (src) => `per decade in ${src}`, fImerg: (y1, y2) => `rain per decade, NASA IMERG satellite ${y1}–${y2}`,
    playerLabel: "Shur player. Space: play or pause. Arrows: step. S: story. R: read note. T: change track.",
    srHint: "Using NVDA or JAWS? The keys work while focus is on the player buttons. If they don't, switch to focus mode (NVDA+Space in NVDA, Insert+Z in JAWS).",
    kTrack: "change track", kCmp: "compare with a division", kCmpOff: "stop comparing",
    lgEars: "Compare mode: left ear = your division, right ear = the other",
    speed: "Speed", narrate: "Speak details when paused", nowHeading: "Now playing", storyBtn: "Tell me the story",
    temp: "Temperature", rain: "Rain", factsHeading: "What the data says", satHeading: "From space",
    satTrue: "True colour", satFlood: "Water view", howHeading: "How to listen",
    lgPitch: "Higher note = hotter, on the same scale in every division", lgRain: "Rain sound = how much it rained", lgThunder: "Thunder = one of the wettest", lgBell: "Bell = one of the hottest",
    keysHeading: "Keyboard", soundsHeading: "Sounds", dataHeading: "The numbers", storyHeading: "The story", kPlay: "play / pause", kStep: "step one note", kPlace: "choose a division", kStory: "tell the story", kRead: "read this note aloud",
    tableSummary: "Show the numbers as a table", csv: "Download CSV",
    credits: 'Data: <a href="https://power.larc.nasa.gov/">NASA POWER</a> (NASA Langley Research Center, built on NASA GMAO MERRA-2), <a href="https://gpm.nasa.gov/data/imerg">NASA GPM IMERG</a> rain (via POWER) and <a href="https://data.giss.nasa.gov/gistemp/">NASA GISTEMP</a> station temperatures. Satellite imagery: <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a> (VIIRS NOAA-20, MODIS Terra).',
    team: "Built by Team Nyopus, BRAC University, for the NASA Space Apps Challenge 2026: The Earth Information Jukebox.",
    play: "Play", pause: "Pause", prev: "Previous note", next: "Next note",
    loading: (p) => `Loading NASA POWER data for ${p}…`,
    loadErr: "Couldn't reach NASA POWER. Check your internet connection.", retry: "Retry",
    done: "Finished. Press Space to play again.",
    ready: (p, tr, n) => `${p}, ${tr}: ${n} notes ready. Press Space to play.`,
    readyCmp: (p, c, tr, n) => `${p} compared with ${c}, ${tr}: ${n} notes ready. ${p} plays in your left ear, ${c} in your right. Press Space to play.`,
    cmpOff: "Comparison off.", cmpErr: (c) => `Couldn't load ${c} to compare, so it plays on its own.`,
    noData: "NASA POWER returned no data for this track yet.",
    aboveNormal: (d) => `${d} °C above normal`, belowNormal: (d) => `${d} °C below normal`, normal: "about normal",
    vsNormalRain: (p) => `${p}% of normal`,
    mmYear: "mm in the year", mmDecade: "mm a year, on average", mmMonth: "mm in the month", mmDay: "mm that day",
    avg: "average", flagHot: "One of the hottest", flagWet: "One of the wettest", flagHeavy: "Very heavy rain (89 mm+)",
    capYears: (p) => `${p}: each year's average temperature as a note on the staff, the hottest years in red, with each year's total rain as blue stems below, 1981–2025. Dashed red line: the long-term trend.`,
    capDecades: (p) => `${p}: each decade's average temperature as a note on the staff, with average yearly rain as blue stems below. The last decade, 2021–2025, has only 5 years.`,
    capCmp: (c) => ` Grey dashed line: ${c}'s temperature.`,
    capMonths: (p) => `${p}: each month's temperature compared with its 1981–2010 normal (red line) and monthly rain (blue bars).`,
    capMonsoon: (p) => `${p}: daily temperature (red line) and daily rain (blue bars), June–September 2026.`,
    satNone: "No daily satellite colour images exist before the year 2000. Choose a later year to see Bangladesh from space.",
    satCap: (d, s) => `${s} image of Bangladesh, ${d}. The dot is the place you're listening to.`,
    satErr: "Satellite image unavailable for this date.",
    noBnVoice: "This device has no Bangla voice, so Shur speaks in English. The text on screen stays in Bangla.",
    fWarm: "warmer per decade", fCool: "cooler per decade", modelNote: "A warning about temperature: NASA POWER temperatures come from the MERRA-2 weather model, averaged over a grid square about 50 kilometres wide. Over these same years, Bangladesh Meteorological Department weather stations recorded warming, and 2011 to 2020 was their warmest decade on record. So this model trend differs from what thermometers on the ground show.",
    fModel: "weather stations show warming", fWarmestDecade: "warmest decade",
    fRainJump: (b, a) => `rain jump in 1997 · ${b} → ${a} mm a year. Weather stations don't show it, so treat rain trends with care.`,
    fCmp: (a, b) => `average temperature, ${a} minus ${b}, 1981–2025`, fCmpHeavy: (a, b) => `days of very heavy rain (89 mm+), ${a} vs ${b}`, fWarmTotal: (d, y1, y2) => `about ${d} °C warmer in ${y2} than in ${y1}`,
    fSig: "statistically significant (95%)", fNotSig: "not statistically significant",
    fHottest: "hottest year", fWettestMonth: "wettest month", fRainTrend: "more rain per decade", fRainTrendLess: "less rain per decade",
    fMonsoonTotal: "rain, June–September 2026", fWettestDay: "wettest day", fHeavyDays: "days of very heavy rain (89 mm+)",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    noteYears: (p, s) => `${p}, ${s.label}. Average ${f1(s.t)} degrees. ${s.r == null ? "No rain data." : `Rain ${fmtInt(s.r)} millimetres.`}`,
    noteDecades: (p, s) => `${p}, ${s.say}. Average ${f1(s.t)} degrees, ${anomWords(s.a, "en")}. ${s.r == null ? "No rain data." : `Rain ${fmtInt(s.r)} millimetres in an average year.`}`,
    noteMonths: (p, s) => `${p}, ${s.label}. ${f1(s.t)} degrees, ${anomWords(s.a, "en")}. ${s.r == null ? "No rain data." : `Rain ${fmtInt(s.r)} millimetres.`}`,
    noteCmp: (p, s, anom) => `${p}: ${f1(s.t)} degrees${anom ? ", " + anomWords(s.a, "en") : ""}. ${s.r == null ? "No rain data." : `Rain ${fmtInt(s.r)} millimetres.`}`,
    noteDiff: (w, d) => (d < 0.05 ? "About the same temperature." : `${w} was ${f1(d)} degrees warmer.`),
    jumpHere: "Note: from 1997 on, NASA POWER's rainfall jumps sharply in every division. Weather stations don't show this jump, so treat the extra rain with care.",
    decadeSay: (y1, y2) => `${y1} to ${y2}`,
    noteMonsoon: (p, s) => `${p}, ${s.label}. ${f1(s.t)} degrees. ${s.r == null ? "No rain data." : `Rain ${fmtInt(s.r)} millimetres.`}`,
    storyYears: (x) => `From ${x.y1} to ${x.y2}, ${x.src} shows ${x.place} ${x.slope >= 0 ? "warming" : "cooling"} by ${f2(Math.abs(x.slope))} degrees per decade, about ${f1(Math.abs(x.total))} degrees in total. ${x.sig ? "This change is statistically significant." : "This change is not statistically significant."} The hottest year was ${x.hotYear}. The wettest month was ${x.wetMonth}, with ${fmtInt(x.wetMonthMm)} millimetres of rain.`,
    storyDecade: (x) => `The warmest decade in this data was ${x.hot}, averaging ${f1(x.hotT)} degrees${x.partial ? ", though it only has 5 years so far" : ""}. The coolest was ${x.cool}, at ${f1(x.coolT)} degrees.`,
    storyRain: (x) => `In ${x.src}, ${x.y1} to ${x.y2}, rainfall ${x.slope >= 0 ? "rose" : "fell"} by about ${fmtInt(Math.abs(x.slope))} millimetres a year per decade, ${x.sig ? "a statistically significant change" : "which is not statistically significant"}.`,
    rainNote: (x) => `A warning about rain: in NASA POWER, rainfall here jumps around 1997, from about ${fmtInt(x.before)} millimetres a year in 1981 to 1996 to about ${fmtInt(x.after)} from 1997 on, ${f1(x.ratio)} times as much. The same jump happens in all eight divisions at once, and weather station records don't show it, so this rain trend is probably not real.`,
    rainCheck: "It needs checking against another source, such as NASA's GPM IMERG satellite rainfall.",
    rainImerg: (x) => `NASA's IMERG satellite rain, which starts in 2001, averages ${fmtInt(x.im)} millimetres a year here, against ${fmtInt(x.pw)} in NASA POWER over the same years, and its trend is ${x.slope >= 0 ? "up" : "down"} ${fmtInt(Math.abs(x.slope))} millimetres per decade${x.sig ? "" : ", which is not statistically significant"}. You can switch the rain sound to IMERG in the options.`,
    imergNote: "The rain sound uses NASA's IMERG satellite record, which starts in 2001, so earlier years have no rain sound. NASA POWER's longer rain record jumps around 1997 in every division, which weather stations don't show, so Shur doesn't use it here.",
    storyCrossT: (x) => `For comparison, ${x.src} has ${x.n} years of data between ${x.y1} and ${x.y2}. It shows ${x.slope >= 0 ? "warming" : "cooling"} of ${f2(Math.abs(x.slope))} degrees per decade, ${x.sig ? "a statistically significant change" : "which is not statistically significant"}${x.dec ? `, and its warmest decade was ${x.dec}` : ""}.`,
    fYears: (n, y1, y2) => `${n} years of data, ${y1}–${y2}`,
    whyDiffer: "The two disagree because NASA POWER's temperature comes from the MERRA-2 weather model, averaged over a grid square about 50 kilometres wide, while the station record is thermometer readings from the ground.",
    storyCmp: (x) => `Comparing ${x.a} with ${x.b}, ${x.y1} to ${x.y2}: ${x.a} averaged ${f1(x.ta)} degrees and ${x.b} ${f1(x.tb)} degrees, ${x.d < 0.05 ? "about the same" : `so ${x.warmer} was about ${f1(x.d)} degrees warmer`}. ${x.a}'s temperature ${x.sa >= 0 ? "rose" : "fell"} ${f2(Math.abs(x.sa))} degrees per decade, and ${x.b}'s ${x.sb >= 0 ? "rose" : "fell"} ${f2(Math.abs(x.sb))}. In an average year, ${x.a} got ${fmtInt(x.ra)} millimetres of rain and ${x.b} ${fmtInt(x.rb)}.`,
    storyCmpMonsoon: (x) => `Comparing ${x.a} with ${x.b}, June to September 2026: ${x.a} received ${fmtInt(x.ta)} millimetres of rain and ${x.b} ${fmtInt(x.tb)}. ${x.a} had ${x.ha} ${x.ha === 1 ? "day" : "days"} of very heavy rain and ${x.b} had ${x.hb}, ${x.ha === x.hb ? "the same number" : `so ${x.more} had more`}.`,
    storyMonsoon: (x) => `From June to September 2026, ${x.place} received ${fmtInt(x.total)} millimetres of rain. The wettest day was ${x.wetDay}, with ${fmtInt(x.wetDayMm)} millimetres. There ${x.heavy === 1 ? "was 1 day" : `were ${x.heavy} days`} of very heavy rain, above 89 millimetres.`,
  },
  bn: {
    tagline: "আটটি বিভাগের নাসার জলবায়ু তথ্য, সুরে সুরে। শোনার জন্যই তৈরি: সংখ্যাগুলো জোরে পড়ে শোনায়, পুরোটাই কিবোর্ড দিয়ে চলে।",
    eyebrow: "দ্য আর্থ ইনফরমেশন জুকবক্স", heroTitle: "বাংলাদেশের ৪৫ বছরের জলবায়ু শুনুন।", ctaStart: "শোনা শুরু করুন", ctaHow: "কীভাবে শুনবেন",
    heroCredit: "নাসার VIIRS যন্ত্রে তোলা বাংলাদেশ ও বঙ্গোপসাগর, ১০ ডিসেম্বর ২০২৪।",
    chooseHeading: "কী শুনবেন বেছে নিন", placeLegend: "১. জায়গা", trackLegend: "২. ট্র্যাক", cmpLegend: "৩. তুলনা", optionsLegend: "৪. অপশন",
    cmpLabel: "অন্য একটি বিভাগের সঙ্গে তুলনা", cmpNone: "তুলনা নয়", cmpHint: "আপনার বিভাগ বাঁ কানে, অন্যটি ডান কানে বাজে, একই মাপে।",
    stretch: "সুরগুলো শুধু এই বিভাগের মাপে ছড়াও (বেশি খুঁটিনাটি, তবে অন্য বিভাগের সুরের সঙ্গে আর মিলবে না)",
    musical: "রাগের স্কেলে বাজাও (১৬টি সুর: বেশি সুরেলা, কম নিখুঁত)",
    srMode: "আমি স্ক্রিন রিডার ব্যবহার করি (সুর নিজে কথা বলবে না)",
    tempSrcLabel: "তাপমাত্রার তথ্য", optTempPower: "NASA POWER মডেল (এলাকার গড়)", optTempStation: "আবহাওয়া কেন্দ্রের থার্মোমিটার (GISTEMP রেকর্ড)",
    rainSrcLabel: "বৃষ্টির তথ্য", optRainPower: "NASA POWER (১৯৮১–২০২৫)", optRainImerg: "NASA IMERG স্যাটেলাইট (২০০১–২০২৫)",
    srcMissing: (p) => `বেছে নেওয়া কিছু তথ্য ${p}-এর জন্য এখনো সংরক্ষিত নেই, তাই সেখানে NASA POWER ব্যবহার হচ্ছে।`,
    srcPowerT: "NASA POWER-এর মডেল তথ্য", srcStationT: (n, ds, km) => `${ds}-এর ${n} আবহাওয়া কেন্দ্রের${km != null ? ` (${km} কিলোমিটার দূরে)` : ""} থার্মোমিটার রেকর্ড`,
    srcPowerR: "NASA POWER-এর বৃষ্টির তথ্য", srcImergR: "নাসার IMERG স্যাটেলাইটের বৃষ্টির তথ্য",
    shortPowerT: "NASA POWER মডেল", shortStation: (n, km, ds) => `${ds}, ${n} কেন্দ্র${km != null ? `, ${km} কিমি দূরে` : ""}`,
    shortPowerR: "NASA POWER", shortImerg: "NASA IMERG স্যাটেলাইট",
    capSrc: (a, b) => ` তাপমাত্রা: ${a}। বৃষ্টি: ${b}।`,
    fCrossT: (src) => `প্রতি দশকে, ${src}`, fImerg: (y1, y2) => `প্রতি দশকে বৃষ্টি, NASA IMERG স্যাটেলাইট ${y1}–${y2}`,
    playerLabel: "সুর প্লেয়ার। স্পেস: চালু বা বন্ধ। তীর: আগে-পিছে। S: গল্প। R: সুরটা পড়ো। T: ট্র্যাক বদলাও।",
    srHint: "NVDA বা JAWS ব্যবহার করছেন? ফোকাস প্লেয়ারের বোতামে থাকলে কি-গুলো কাজ করে। না করলে ফোকাস মোড চালু করুন (NVDA-তে NVDA+Space, JAWS-এ Insert+Z)।",
    kTrack: "ট্র্যাক বদলাও", kCmp: "কোনো বিভাগের সঙ্গে তুলনা", kCmpOff: "তুলনা বন্ধ",
    lgEars: "তুলনায়: বাঁ কান = আপনার বিভাগ, ডান কান = অন্যটি",
    speed: "গতি", narrate: "থামলে বিস্তারিত বলবে", nowHeading: "এখন বাজছে", storyBtn: "গল্পটা বলো",
    temp: "তাপমাত্রা", rain: "বৃষ্টি", factsHeading: "তথ্য কী বলছে", satHeading: "মহাকাশ থেকে",
    satTrue: "আসল রঙ", satFlood: "পানি দেখুন", howHeading: "কীভাবে শুনবেন",
    lgPitch: "উঁচু সুর = বেশি গরম, সব বিভাগে একই মাপে", lgRain: "বৃষ্টির শব্দ = কতটা বৃষ্টি", lgThunder: "বজ্রপাত = সবচেয়ে বেশি বৃষ্টির একটি", lgBell: "ঘণ্টা = সবচেয়ে গরমের একটি",
    keysHeading: "কিবোর্ড", soundsHeading: "শব্দগুলো", dataHeading: "সংখ্যাগুলো", storyHeading: "গল্পটা", kPlay: "চালু / বন্ধ", kStep: "এক সুর আগে-পিছে", kPlace: "বিভাগ বাছাই", kStory: "গল্পটা শুনুন", kRead: "এই সুরটা পড়ে শোনাও",
    tableSummary: "সংখ্যাগুলো টেবিলে দেখুন", csv: "CSV ডাউনলোড",
    credits: 'তথ্য: <a href="https://power.larc.nasa.gov/">NASA POWER</a> (নাসা ল্যাংলি রিসার্চ সেন্টার, NASA GMAO MERRA-2 ভিত্তিক), <a href="https://gpm.nasa.gov/data/imerg">NASA GPM IMERG</a> বৃষ্টি (POWER-এর মাধ্যমে) ও <a href="https://data.giss.nasa.gov/gistemp/">NASA GISTEMP</a> আবহাওয়া কেন্দ্রের তাপমাত্রা। স্যাটেলাইট ছবি: <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api">NASA GIBS</a> (VIIRS NOAA-20, MODIS Terra)।',
    team: "তৈরি করেছে টিম নিয়োপাস, ব্র্যাক বিশ্ববিদ্যালয়, NASA Space Apps Challenge 2026: The Earth Information Jukebox-এর জন্য।",
    play: "চালু", pause: "থামাও", prev: "আগের সুর", next: "পরের সুর",
    loading: (p) => `${p}-এর জন্য NASA POWER তথ্য আনা হচ্ছে…`,
    loadErr: "NASA POWER-এ পৌঁছানো যায়নি। ইন্টারনেট সংযোগ দেখুন।", retry: "আবার চেষ্টা",
    done: "শেষ। আবার শুনতে স্পেস চাপুন।",
    ready: (p, tr, n) => `${p}, ${tr}: ${n}টি সুর তৈরি। শুনতে স্পেস চাপুন।`,
    readyCmp: (p, c, tr, n, cGen) => `${p} আর ${cGen} তুলনা, ${tr}: ${n}টি সুর তৈরি। বাঁ কানে ${p}, ডান কানে ${c}। শুনতে স্পেস চাপুন।`,
    cmpOff: "তুলনা বন্ধ।", cmpErr: (c, cGen) => `তুলনার জন্য ${cGen} তথ্য আনা যায়নি, তাই একাই বাজছে।`,
    noData: "এই ট্র্যাকের জন্য NASA POWER এখনো কোনো তথ্য দেয়নি।",
    aboveNormal: (d) => `স্বাভাবিকের চেয়ে ${d} °C বেশি`, belowNormal: (d) => `স্বাভাবিকের চেয়ে ${d} °C কম`, normal: "প্রায় স্বাভাবিক",
    vsNormalRain: (p) => `স্বাভাবিকের ${p}%`,
    mmYear: "মিমি, সারা বছরে", mmDecade: "মিমি, বছরে গড়ে", mmMonth: "মিমি, সারা মাসে", mmDay: "মিমি, সেদিন",
    avg: "গড়", flagHot: "সবচেয়ে গরমের একটি", flagWet: "সবচেয়ে বেশি বৃষ্টির একটি", flagHeavy: "অতি ভারী বৃষ্টি (৮৯ মিমি+)",
    capYears: (p) => `${p}: প্রতি বছরের গড় তাপমাত্রা স্বরলিপির একটি করে সুর, সবচেয়ে গরম বছরগুলো লাল; নিচে নীল দণ্ডে বছরের মোট বৃষ্টি, ১৯৮১–২০২৫। লাল ড্যাশ রেখা: দীর্ঘমেয়াদি ধারা।`,
    capDecades: (p) => `${p}: প্রতি দশকের গড় তাপমাত্রা স্বরলিপির একটি করে সুর; নিচে নীল দণ্ডে বছরে গড় বৃষ্টি। শেষ দশক ২০২১–২০২৫-এ মাত্র ৫ বছর।`,
    capCmp: (c, cGen) => ` ধূসর ড্যাশ রেখা: ${cGen} তাপমাত্রা।`,
    capMonths: (p) => `${p}: প্রতি মাসের তাপমাত্রা ১৯৮১–২০১০ সালের স্বাভাবিকের তুলনায় (লাল রেখা) আর মাসিক বৃষ্টি (নীল দণ্ড)।`,
    capMonsoon: (p) => `${p}: প্রতিদিনের তাপমাত্রা (লাল রেখা) আর বৃষ্টি (নীল দণ্ড), জুন–সেপ্টেম্বর ২০২৬।`,
    satNone: "২০০০ সালের আগে প্রতিদিনের রঙিন স্যাটেলাইট ছবি নেই। মহাকাশ থেকে বাংলাদেশ দেখতে পরের কোনো বছর বেছে নিন।",
    satCap: (d, s) => `${s} ছবি, বাংলাদেশ, ${d}। বিন্দুটি আপনি যে জায়গা শুনছেন।`,
    satErr: "এই তারিখের স্যাটেলাইট ছবি পাওয়া যায়নি।",
    noBnVoice: "এই ডিভাইসে বাংলা কণ্ঠ নেই, তাই সুর ইংরেজিতে কথা বলবে। পর্দার লেখা বাংলাতেই থাকবে।",
    fWarm: "উষ্ণতা বেড়েছে প্রতি দশকে", fCool: "তাপমাত্রা কমেছে প্রতি দশকে", modelNote: "তাপমাত্রা নিয়ে একটি সতর্কতা: NASA POWER-এর তাপমাত্রা আসে MERRA-2 আবহাওয়া মডেল থেকে, প্রায় ৫০ কিলোমিটার চওড়া একটি এলাকার গড়। একই বছরগুলোতে বাংলাদেশ আবহাওয়া অধিদপ্তরের কেন্দ্রগুলো উষ্ণতা বৃদ্ধি রেকর্ড করেছে, আর তাদের মাপে ২০১১ থেকে ২০২০ ছিল সবচেয়ে গরম দশক। তাই এই মডেলের ধারা মাটিতে থার্মোমিটারের মাপের সঙ্গে মেলে না।",
    fModel: "আবহাওয়া কেন্দ্রে উষ্ণতা বেড়েছে", fWarmestDecade: "সবচেয়ে গরম দশক",
    fRainJump: (b, a) => `১৯৯৭-এ বৃষ্টির লাফ · বছরে ${b} → ${a} মিমি। আবহাওয়া কেন্দ্রে এটা দেখা যায় না, তাই বৃষ্টির ধারা সাবধানে দেখুন।`,
    fCmp: (a, b) => `গড় তাপমাত্রা, ${a} বিয়োগ ${b}, ১৯৮১–২০২৫`, fCmpHeavy: (a, b) => `অতি ভারী বৃষ্টির দিন (৮৯ মিমি+), ${a} বনাম ${b}`, fWarmTotal: (d, y1, y2) => `${y1}-এর তুলনায় ${y2}-এ প্রায় ${d} °C বেশি গরম`,
    fSig: "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ (৯৫%)", fNotSig: "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়",
    fHottest: "সবচেয়ে গরম বছর", fWettestMonth: "সবচেয়ে বেশি বৃষ্টির মাস", fRainTrend: "প্রতি দশকে বৃষ্টি বেড়েছে", fRainTrendLess: "প্রতি দশকে বৃষ্টি কমেছে",
    fMonsoonTotal: "বৃষ্টি, জুন–সেপ্টেম্বর ২০২৬", fWettestDay: "সবচেয়ে বেশি বৃষ্টির দিন", fHeavyDays: "দিন অতি ভারী বৃষ্টি (৮৯ মিমি+)",
    months: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
    noteYears: (p, s) => `${p}, ${s.label}। গড় তাপমাত্রা ${f1(s.t)} ডিগ্রি। ${s.r == null ? "বৃষ্টির তথ্য নেই।" : `বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`}`,
    noteDecades: (p, s) => `${p}, ${s.say}। গড় তাপমাত্রা ${f1(s.t)} ডিগ্রি, ${anomWords(s.a, "bn")}। ${s.r == null ? "বৃষ্টির তথ্য নেই।" : `গড়ে বছরে ${s.r == null ? "বৃষ্টির তথ্য নেই।" : `বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`}`}`,
    noteMonths: (p, s) => `${p}, ${s.label}। ${f1(s.t)} ডিগ্রি, ${anomWords(s.a, "bn")}। ${s.r == null ? "বৃষ্টির তথ্য নেই।" : `বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`}`,
    noteCmp: (p, s, anom) => `${p}: ${f1(s.t)} ডিগ্রি${anom ? ", " + anomWords(s.a, "bn") : ""}। ${s.r == null ? "বৃষ্টির তথ্য নেই।" : `বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`}`,
    noteDiff: (w, d) => (d < 0.05 ? "তাপমাত্রা প্রায় সমান।" : `${w} ${f1(d)} ডিগ্রি বেশি গরম।`),
    jumpHere: "লক্ষ করুন: ১৯৯৭ সাল থেকে NASA POWER-এর বৃষ্টি সব বিভাগে হঠাৎ অনেক বেড়ে যায়। আবহাওয়া কেন্দ্রে এই লাফ দেখা যায় না, তাই বাড়তি বৃষ্টি সাবধানে দেখুন।",
    decadeSay: (y1, y2) => `${y1} থেকে ${y2}`,
    noteMonsoon: (p, s) => `${p}, ${s.label}। ${f1(s.t)} ডিগ্রি। ${s.r == null ? "বৃষ্টির তথ্য নেই।" : `বৃষ্টি ${fmtInt(s.r)} মিলিমিটার।`}`,
    storyYears: (x) => `${x.y1} থেকে ${x.y2} সাল পর্যন্ত ${x.src} বলছে, ${x.gen} তাপমাত্রা প্রতি দশকে ${f2(Math.abs(x.slope))} ডিগ্রি করে ${x.slope >= 0 ? "বেড়েছে" : "কমেছে"}, মোট প্রায় ${f1(Math.abs(x.total))} ডিগ্রি। ${x.sig ? "এই পরিবর্তন পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ।" : "এই পরিবর্তন পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়।"} সবচেয়ে গরম বছর ছিল ${x.hotYear}। সবচেয়ে বেশি বৃষ্টি হয়েছিল ${x.wetMonthBn}, ${fmtInt(x.wetMonthMm)} মিলিমিটার।`,
    storyDecade: (x) => `এই তথ্যে সবচেয়ে গরম দশক ছিল ${x.hot}, গড়ে ${f1(x.hotT)} ডিগ্রি${x.partial ? "; তবে এই দশকের এখন পর্যন্ত মাত্র ৫ বছর" : ""}। সবচেয়ে ঠান্ডা ছিল ${x.cool}, ${f1(x.coolT)} ডিগ্রি।`,
    storyRain: (x) => `${x.src} অনুযায়ী, ${x.y1} থেকে ${x.y2} সালে বৃষ্টি প্রতি দশকে বছরে প্রায় ${fmtInt(Math.abs(x.slope))} মিলিমিটার করে ${x.slope >= 0 ? "বেড়েছে" : "কমেছে"}, ${x.sig ? "যা পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ" : "যা পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়"}।`,
    rainNote: (x) => `বৃষ্টি নিয়ে একটি সতর্কতা: NASA POWER-এর তথ্যে এখানে ১৯৯৭ সালের দিকে বৃষ্টি হঠাৎ লাফিয়ে বাড়ে, ১৯৮১ থেকে ১৯৯৬ সালে বছরে প্রায় ${fmtInt(x.before)} মিলিমিটার থেকে ১৯৯৭ সালের পর প্রায় ${fmtInt(x.after)} মিলিমিটার, প্রায় ${f1(x.ratio)} গুণ। একই লাফ আটটি বিভাগেই একসঙ্গে দেখা যায়, অথচ আবহাওয়া কেন্দ্রের রেকর্ডে তা নেই, তাই এই বৃষ্টির ধারা সম্ভবত সত্যি নয়।`,
    rainCheck: "অন্য কোনো উৎস, যেমন নাসার GPM IMERG স্যাটেলাইট বৃষ্টির তথ্যের সঙ্গে এটি মিলিয়ে দেখা দরকার।",
    rainImerg: (x) => `নাসার IMERG স্যাটেলাইটের বৃষ্টির তথ্য শুরু ২০০১ থেকে; এখানে তার গড় বছরে ${fmtInt(x.im)} মিলিমিটার, একই বছরগুলোতে NASA POWER-এ ${fmtInt(x.pw)} মিলিমিটার, আর তার ধারা প্রতি দশকে ${fmtInt(Math.abs(x.slope))} মিলিমিটার ${x.slope >= 0 ? "বাড়ছে" : "কমছে"}${x.sig ? "" : ", যা পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়"}। অপশনে বৃষ্টির শব্দ IMERG-এ বদলাতে পারেন।`,
    imergNote: "বৃষ্টির শব্দ আসছে নাসার IMERG স্যাটেলাইট রেকর্ড থেকে, যা শুরু ২০০১ সালে, তাই আগের বছরগুলোতে বৃষ্টির শব্দ নেই। NASA POWER-এর লম্বা বৃষ্টির রেকর্ড ১৯৯৭ সালের দিকে সব বিভাগে হঠাৎ লাফিয়ে বাড়ে, যা আবহাওয়া কেন্দ্রে দেখা যায় না, তাই এখানে সেটি ব্যবহার করা হচ্ছে না।",
    storyCrossT: (x) => `তুলনার জন্য: ${x.src}। ${x.y1} থেকে ${x.y2} সালের মধ্যে এর ${x.n} বছরের তথ্য আছে। তাতে তাপমাত্রা প্রতি দশকে ${f2(Math.abs(x.slope))} ডিগ্রি করে ${x.slope >= 0 ? "বেড়েছে" : "কমেছে"}, ${x.sig ? "যা পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ" : "যা পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়"}${x.dec ? `, আর সবচেয়ে গরম দশক ছিল ${x.dec}` : ""}।`,
    fYears: (n, y1, y2) => `${n} বছরের তথ্য, ${y1}–${y2}`,
    whyDiffer: "দুটি মেলে না, কারণ NASA POWER-এর তাপমাত্রা আসে MERRA-2 আবহাওয়া মডেল থেকে, প্রায় ৫০ কিলোমিটার চওড়া এলাকার গড়, আর কেন্দ্রের রেকর্ড হলো মাটিতে থার্মোমিটারের মাপ।",
    storyCmp: (x) => `${x.a} আর ${x.bGen} তুলনা, ${x.y1} থেকে ${x.y2}: ${x.aGen} গড় তাপমাত্রা ${f1(x.ta)} ডিগ্রি আর ${x.bGen} ${f1(x.tb)} ডিগ্রি, ${x.d < 0.05 ? "প্রায় সমান" : `অর্থাৎ ${x.warmer} প্রায় ${f1(x.d)} ডিগ্রি বেশি গরম`}। ${x.aGen} তাপমাত্রা প্রতি দশকে ${f2(Math.abs(x.sa))} ডিগ্রি করে ${x.sa >= 0 ? "বেড়েছে" : "কমেছে"}, ${x.bGen} ${f2(Math.abs(x.sb))} ডিগ্রি করে ${x.sb >= 0 ? "বেড়েছে" : "কমেছে"}। গড় একটি বছরে ${x.aAt} বৃষ্টি হয়েছে ${fmtInt(x.ra)} মিলিমিটার আর ${x.bAt} ${fmtInt(x.rb)} মিলিমিটার।`,
    storyCmpMonsoon: (x) => `২০২৬ সালের জুন থেকে সেপ্টেম্বরে ${x.a} আর ${x.bGen} তুলনা: ${x.aAt} বৃষ্টি হয়েছে ${fmtInt(x.ta)} মিলিমিটার, ${x.bAt} ${fmtInt(x.tb)} মিলিমিটার। অতি ভারী বৃষ্টির দিন ${x.aAt} ${x.ha}টি, ${x.bAt} ${x.hb}টি, ${x.ha === x.hb ? "সমান সমান" : `অর্থাৎ ${x.moreAt} বেশি`}।`,
    storyMonsoon: (x) => `২০২৬ সালের জুন থেকে সেপ্টেম্বর পর্যন্ত ${x.at} বৃষ্টি হয়েছে ${fmtInt(x.total)} মিলিমিটার। সবচেয়ে বেশি বৃষ্টি হয়েছিল ${x.wetDay}, ${fmtInt(x.wetDayMm)} মিলিমিটার। ${x.heavy} দিন অতি ভারী বৃষ্টি হয়েছে, অর্থাৎ ৮৯ মিলিমিটারের বেশি।`,
  },
};

// ---------------------------------------------------------------- helpers
const $ = (id) => document.getElementById(id);
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
// Bangla digits, except inside names like "MERRA-2".
const toBn = (s) => String(s).replace(/MERRA-2|\d/g, (d) => (d.length > 1 ? d : BN_DIGITS[d]));
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
// Two-sided 95% critical value of Student's t (close approximation, within 0.01 for df >= 4).
const tCrit95 = (df) => 1.95996 + 2.37 / df + 2.8 / df ** 2;
// Ordinary least squares with a t-test on the slope.
// Neighbouring years in climate data are related, so the test uses an "effective" number of years
// that shrinks when the leftovers from the fitted line are correlated from one year to the next.
function linreg(xs, ys) {
  const pts = xs.map((x, i) => [x, ys[i]]).filter(([, y]) => y != null).sort((a, b) => a[0] - b[0]);
  const n = pts.length; if (n < 3) return null;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); }
  const slope = sxy / sxx, icept = my - slope * mx;
  const res = pts.map(([x, y]) => y - (icept + slope * x));
  const sse = res.reduce((s, e) => s + e * e, 0);
  // Lag-1 autocorrelation of the residuals (only across back-to-back years).
  let num = 0; for (let i = 1; i < n; i++) if (pts[i][0] - pts[i - 1][0] === 1) num += res[i] * res[i - 1];
  const r1 = sse ? Math.max(0, num / sse) : 0;
  const nEff = Math.min(n, n * (1 - r1) / (1 + r1));
  const df = nEff - 2;
  const se = Math.sqrt(sse / (n - 2) / sxx) * Math.sqrt(df > 0 ? (n - 2) / df : Infinity);
  const tStat = slope / se;
  return { slope, icept, tStat, r1, nEff, sig: df >= 2 && Math.abs(tStat) > tCrit95(df), n };
}
const avg = (a) => { const v = a.filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
// Average the annual values into decades (the last one, 2021–2025, has only 5 years).
function decadesOf(years) {
  return DECADES.map(([y1, y2]) => {
    const ys = years.filter((x) => x.y >= y1 && x.y <= y2);
    return { y1, y2, y: y2, n: ys.filter((x) => x.t != null).length, t: avg(ys.map((x) => x.t)), r: avg(ys.map((x) => x.r)), a: avg(ys.map((x) => x.a)), rp: avg(ys.map((x) => x.rp)), partial: y2 - y1 < 9 };
  });
}
// NASA POWER's rainfall steps up around 1997 in every division. Measure that step so Shur can warn about it.
function rainJump(years) {
  const before = avg(years.filter((x) => x.y <= 1996).map((x) => x.r));
  const after = avg(years.filter((x) => x.y >= 1997).map((x) => x.r));
  const ratio = before && after ? after / before : null;
  return { before, after, ratio, big: ratio != null && ratio >= 1.5 };
}

// ---------------------------------------------------------------- state
const state = {
  lang: "en", placeId: "dhaka", cmpId: null, track: "years", speed: 1, i: 0, playing: false,
  steps: [], meta: null, satMode: "true", loadToken: 0,
  stretch: false, musical: false, sr: false, tempSrc: "power", rainSrc: "imerg",
};
try { state.sr = localStorage.getItem("shur:sr") === "1"; } catch (_) {}
const place = () => PLACES.find((p) => p.id === state.placeId);
const cmpPlace = () => PLACES.find((p) => p.id === state.cmpId) || null;
const cmpName = () => cmpPlace()?.[state.lang];
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

// Extra NASA sources prepared by scripts/fetch-data.mjs (too heavy to fetch live):
// GISTEMP station thermometer records and GPM IMERG satellite rain. Missing files just mean "not available".
async function loadExtra(p, kind) {
  const u = `data/${p.id}-${kind}.json`;
  if (cache.has(u)) return cache.get(u);
  let j = null;
  try { const res = await fetch(u); if (res.ok) j = await res.json(); } catch (_) {}
  cache.set(u, j);
  return j;
}
const RAIN_BASE_IMERG = [2001, 2020]; // IMERG starts in 2001, so its "normal" is 2001–2020

// Turn monthly temperature and rain into notes for months and years, with normals and anomalies.
function assemble(months, annualT, rainBase) {
  const meanOf = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const inT = (x) => x.y >= BASE[0] && x.y <= BASE[1], inR = (x) => x.y >= rainBase[0] && x.y <= rainBase[1];
  const norm = Array.from({ length: 12 }, (_, k) => ({
    t: meanOf(months.filter((x) => x.m === k + 1 && inT(x) && x.t != null).map((x) => x.t)),
    r: meanOf(months.filter((x) => x.m === k + 1 && inR(x) && x.r != null).map((x) => x.r)),
  }));
  for (const x of months) x.a = x.t == null || norm[x.m - 1].t == null ? null : x.t - norm[x.m - 1].t;
  const years = [];
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    const ms = months.filter((x) => x.y === y);
    const tv = ms.filter((x) => x.t != null), rv = ms.filter((x) => x.r != null);
    const tMean = annualT[y] ?? (tv.length === 12 ? tv.reduce((s, x) => s + x.t, 0) / 12 : null);
    const rSum = rv.length === 12 ? rv.reduce((s, x) => s + x.r, 0) : null;
    years.push({ y, t: tMean, r: rSum });
  }
  const normT = meanOf(years.filter(inT).map((x) => x.t).filter((v) => v != null));
  const normR = meanOf(years.filter(inR).map((x) => x.r).filter((v) => v != null));
  for (const x of years) { x.a = x.t == null || normT == null ? null : x.t - normT; x.rp = x.r == null || !normR ? null : (x.r / normR) * 100; }
  for (const x of months) x.rp = x.r == null || !norm[x.m - 1].r ? null : (x.r / norm[x.m - 1].r) * 100;
  return { months, years };
}

async function loadMonthly(p) {
  const [j, st, im] = await Promise.all([
    getJSON(powerUrl("monthly", p, FIRST_YEAR, LAST_YEAR, "T2M,PRECTOTCORR"), `data/${p.id}-monthly.json`),
    loadExtra(p, "gistemp"), loadExtra(p, "imerg"),
  ]);
  const P = j.properties.parameter;
  const pm = [], pAnnualT = {};
  for (const key of Object.keys(P.T2M).sort()) {
    const y = +key.slice(0, 4), m = +key.slice(4, 6);
    if (m === 13) { pAnnualT[y] = ok(P.T2M[key]); continue; }
    const days = new Date(y, m, 0).getDate();
    const rd = ok(P.PRECTOTCORR[key]);
    pm.push({ y, m, t: ok(P.T2M[key]), r: rd == null ? null : rd * days });
  }
  const key = (x) => `${x.y}${String(x.m).padStart(2, "0")}`;
  const useSt = state.tempSrc === "station" && !!st, useIm = state.rainSrc === "imerg" && !!im;
  const months = pm.map((x) => ({
    y: x.y, m: x.m,
    t: useSt ? (st.monthly?.[key(x)] ?? null) : x.t,
    r: useIm ? (im.monthly[key(x)] ?? null) : x.r,
  }));
  const chosen = assemble(months, useSt ? st.annual : pAnnualT, useIm ? RAIN_BASE_IMERG : BASE);
  // Plain yearly series from each source, for the spoken cross-checks.
  const power = assemble(pm.map((x) => ({ ...x })), pAnnualT, BASE).years;
  const station = st ? assemble(pm.map((x) => ({ y: x.y, m: x.m, t: st.monthly?.[key(x)] ?? null, r: null })), st.annual, BASE).years : null;
  const imerg = im ? assemble(pm.map((x) => ({ y: x.y, m: x.m, t: null, r: im.monthly[key(x)] ?? null })), {}, RAIN_BASE_IMERG).years : null;
  return { ...chosen, src: { temp: useSt ? "station" : "power", rain: useIm ? "imerg" : "power" }, st, power, station, imerg };
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
  if (state.track === "decades") return loc(`${s.y1}–${s.y2}`);
  if (state.track === "months") return `${mn[s.m - 1]} ${loc(s.y)}`;
  return `${loc(s.d)} ${mn[s.m - 1]}`;
}
function isoDate(s) {
  const mm = String(s.m || 2).padStart(2, "0"), dd = String(s.d || 15).padStart(2, "0");
  return `${s.y}-${mm}-${dd}`;
}
// The same moment in two divisions shares a key, so compare mode can line them up.
function stepKey(s) {
  if (state.track === "years") return s.y;
  if (state.track === "decades") return s.y1;
  if (state.track === "months") return s.y * 100 + s.m;
  return s.m * 100 + s.d;
}

// Load one division's notes for the current track, with its own bell and thunder marks.
async function trackSteps(p) {
  if (state.track === "monsoon") {
    const steps = (await loadMonsoon(p)).map((x) => ({ ...x }));
    const wet95 = quantile(steps.map((x) => x.r), 0.95), hot95 = quantile(steps.map((x) => x.t), 0.95);
    for (const s of steps) { s.wet = s.r != null && (s.r >= wet95 || s.r >= 89); s.heavy = s.r != null && s.r >= 89; s.hot = s.t != null && s.t >= hot95; s.pitchVal = s.t; }
    return { steps, data: null };
  }
  const data = await loadMonthly(p);
  let steps;
  if (state.track === "years" || state.track === "decades") {
    steps = state.track === "years" ? data.years.map((x) => ({ ...x })) : decadesOf(data.years);
    const nHot = state.track === "years" ? 5 : 1, nWet = state.track === "years" ? 3 : 1;
    const byT = [...steps].filter((x) => x.t != null).sort((a, b) => b.t - a.t).slice(0, nHot);
    const byR = [...steps].filter((x) => x.r != null).sort((a, b) => b.r - a.r).slice(0, nWet);
    for (const s of steps) { s.hot = byT.includes(s); s.wet = byR.includes(s); s.pitchVal = s.t; }
  } else {
    steps = data.months.map((x) => ({ ...x }));
    const hot = quantile(steps.map((x) => x.a), 0.97), wet = quantile(steps.map((x) => x.r), 0.97);
    for (const s of steps) { s.hot = s.a != null && s.a >= hot; s.wet = s.r != null && s.r >= wet; s.pitchVal = s.a; }
  }
  return { steps, data };
}

async function build() {
  const token = ++state.loadToken;
  stop(true);
  setStatus(t("loading", placeName()));
  try {
    const main = await trackSteps(place());
    let cmp = null, cmpFailed = false;
    if (state.cmpId) {
      try { cmp = await trackSteps(cmpPlace()); } catch (e) { console.error(e); cmpFailed = true; }
    }
    if (token !== state.loadToken) return;
    const steps = main.steps;
    if (!steps.length) throw new Error("No data");
    if (cmp) {
      const byKey = new Map(cmp.steps.map((c) => [stepKey(c), c]));
      for (const s of steps) s.c = byKey.get(stepKey(s)) || null;
    }
    const meta = { kind: state.track === "monsoon" ? "monsoon" : "power", data: main.data, cmp };
    if (main.data) meta.jump = rainJump(main.data.power);
    state.steps = steps; state.meta = meta; state.i = 0;
    setRanges();
    const sd = main.data?.src;
    const missing = sd && ((state.tempSrc === "station" && sd.temp !== "station") || (state.rainSrc === "imerg" && sd.rain !== "imerg"));
    setStatus(cmpFailed ? t("cmpErr", cmpName(), cmpPlace().gen) : missing ? t("srcMissing", placeName()) : "");
    relabel(); renderChart(); renderFacts(); renderTable(); show(0, { quiet: true });
    const tr = TRACKS[state.track][state.lang][0];
    announce(cmp ? t("readyCmp", placeName(), cmpName(), tr, loc(steps.length), cmpPlace().gen) : t("ready", placeName(), tr, loc(steps.length)));
  } catch (e) {
    if (token !== state.loadToken) return;
    console.error(e);
    setStatus(e.message === "No data" ? t("noData") : t("loadErr"), true);
  }
}
function relabel() {
  for (const s of state.steps) {
    s.label = labelFor(s);
    if (s.y1) s.say = loc(t("decadeSay", s.y1, s.y2));
    if (s.c) { s.c.label = s.label; s.c.say = s.say; }
  }
}
// Pitch and rain ranges: shared by all divisions unless the listener asks to stretch them.
function setRanges() {
  const m = state.meta; if (!m) return;
  if (!state.stretch) {
    const R = SHARED[state.track];
    [m.pmin, m.pmax] = R.p; [m.rmin, m.rmax] = R.r;
    return;
  }
  const all = state.steps.flatMap((s) => (s.c ? [s, s.c] : [s]));
  const pv = all.map((s) => s.pitchVal).filter((v) => v != null);
  const rv = all.map((s) => s.r).filter((v) => v != null);
  m.pmin = Math.min(...pv); m.pmax = Math.max(...pv);
  m.rmin = Math.min(...rv); m.rmax = Math.max(...rv);
}

// ---------------------------------------------------------------- audio
let ctx, master, noiseBuf;
let outs = [], pans = [], rainGains = [];
const ROOT = 196; // G3
const SCALE = (() => { // major pentatonic (Bhupali), G3 upward, 3 octaves
  const out = [], steps = [0, 2, 4, 7, 9];
  for (let o = 0; o < 3; o++) for (const s of steps) out.push(ROOT * 2 ** (o + s / 12));
  out.push(ROOT * 8);
  return out;
})();
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// Precise mode glides smoothly over three octaves, so every 0.1 °C sounds different.
// Raga mode snaps to the 16 notes of the scale.
function pitchOf(v) {
  const m = state.meta;
  const n = clamp01((v - m.pmin) / (m.pmax - m.pmin || 1));
  const freq = state.musical ? SCALE[Math.round(n * (SCALE.length - 1))] : ROOT * 2 ** (3 * n);
  return { n, freq };
}
function rainLevel(r) {
  const m = state.meta;
  return r == null ? 0 : Math.sqrt(clamp01((r - m.rmin) / (m.rmax - m.rmin || 1)));
}
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
  // Two voices: 0 is the chosen division, 1 the comparison. Each has its own place in stereo and its own rain.
  for (let k = 0; k < 2; k++) {
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    pan.connect(master); pans[k] = pan; outs[k] = pan;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.5;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 600;
    const rg = ctx.createGain(); rg.gain.value = 0; rainGains[k] = rg;
    src.connect(hp).connect(bp).connect(rg).connect(pan); src.start(0, k * 0.7);
  }
}
function setPans() {
  const on = !!state.cmpId;
  if (pans[0]?.pan) pans[0].pan.value = on ? -0.75 : 0;
  if (pans[1]?.pan) pans[1].pan.value = on ? 0.75 : 0;
}
function note(freq, bright, when, dur, out, k) {
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  // Voice 0 is a plucked triangle; voice 1 (comparison) is a hollow, reed-like tone.
  o1.type = k ? "sine" : "triangle"; o2.type = "sine";
  o1.frequency.value = freq; o2.frequency.value = freq * (k ? 3 : 2);
  const g2 = ctx.createGain(); g2.gain.value = k ? 0.3 : 0.22;
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700 + bright * 3800; f.Q.value = 0.8;
  const g = ctx.createGain();
  const tail = Math.max(0.18, dur * 1.5);
  const attack = k ? 0.04 : 0.012;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.32, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + tail);
  o1.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(out);
  o1.start(when); o2.start(when); o1.stop(when + tail + 0.05); o2.stop(when + tail + 0.05);
}
function burst(when, { freq, type, peak, attack, decay }, out) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  src.playbackRate.value = 0.5 + Math.random();
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  src.connect(fl).connect(g).connect(out);
  src.start(when, Math.random()); src.stop(when + attack + decay + 0.05);
}
function bell(freq, when, out) {
  for (const [mult, amp] of [[4, 0.12], [5.4, 0.05]]) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(amp, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    o.connect(g).connect(out); o.start(when); o.stop(when + 1.5);
  }
}
function voice(s, k, dur, when) {
  const out = outs[k];
  if (s.pitchVal != null) {
    const { n, freq } = pitchOf(s.pitchVal);
    note(freq, n, when, dur, out, k);
    if (s.hot) bell(freq, when, out);
  }
  const rn = rainLevel(s.r);
  rainGains[k].gain.setTargetAtTime(rn * (state.cmpId ? 0.16 : 0.22), when, Math.min(0.08, dur / 3));
  const drops = Math.round(rn * 7);
  for (let j = 0; j < drops; j++) burst(when + Math.random() * dur, { freq: 3500 + Math.random() * 3000, type: "highpass", peak: 0.08 + rn * 0.1, attack: 0.002, decay: 0.03 }, out);
  if (s.wet) burst(when, { freq: 140, type: "lowpass", peak: 0.9, attack: 0.12, decay: 1.6 }, out);
}
function sonify(s, dur) {
  const when = ctx.currentTime + 0.02;
  setPans();
  voice(s, 0, dur, when);
  if (state.cmpId && s.c) voice(s.c, 1, dur, when);
  else rainGains[1].gain.setTargetAtTime(0, when, 0.05);
}
function hushRain(tc) { for (const g of rainGains) g.gain.setTargetAtTime(0, ctx.currentTime, tc); }

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
  if (ctx) hushRain(0.08);
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
  sonify(s, state.track === "decades" ? 0.9 : 0.5);
  setTimeout(() => { if (ctx && !state.playing) hushRain(0.1); }, 600);
  show(state.i, { quiet: false });
}
function updatePlayBtn() {
  const b = $("play");
  b.dataset.playing = state.playing;
  b.setAttribute("aria-label", t(state.playing ? "pause" : "play"));
}

// ---------------------------------------------------------------- render
const unitKey = () => ({ years: "mmYear", decades: "mmDecade", months: "mmMonth", monsoon: "mmDay" })[state.track];
function show(i, { quiet, playing } = {}) {
  const s = state.steps[i]; if (!s) return;
  $("r-when").textContent = s.label;
  $("r-temp").textContent = s.t == null ? "—" : `${loc(f1(s.t))} °C`;
  $("r-anom").textContent = state.track === "monsoon" ? "" : (s.a == null ? "" : loc(anomWords(s.a, state.lang)));
  $("r-rain").textContent = s.r == null ? "—" : `${loc(fmtInt(s.r))}`;
  $("r-rainsub").textContent = t(unitKey()) + (s.rp != null && state.track !== "monsoon" ? ` · ${loc(t("vsNormalRain", Math.round(s.rp)))}` : "");
  const c = s.c;
  $("r-cmp").hidden = !c;
  $("r-cmp").textContent = c ? `${cmpName()}: ${c.t == null ? "—" : loc(f1(c.t)) + " °C"} · ${loc(fmtInt(c.r))} ${state.lang === "bn" ? "মিমি" : "mm"}` : "";
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
// The 1997 rain jump is spoken where it happens, so a listener knows not to trust the rise.
function jumpAt(s) {
  const j = state.meta?.jump;
  if (!j?.big || state.meta.data?.src?.rain !== "power") return false;
  return (state.track === "years" && s.y === 1997) || (state.track === "months" && s.y === 1997 && s.m === 1);
}
function noteText(s) {
  const k = { years: "noteYears", decades: "noteDecades", months: "noteMonths", monsoon: "noteMonsoon" }[state.track];
  let out = t(k, placeName(), s);
  if (s.c) {
    const anom = state.track === "months" || state.track === "decades";
    out += " " + t("noteCmp", cmpName(), s.c, anom);
    if (s.t != null && s.c.t != null) out += " " + t("noteDiff", s.t >= s.c.t ? placeName() : cmpName(), Math.abs(s.t - s.c.t));
  }
  if (jumpAt(s)) out += " " + t("jumpHere");
  return loc(out);
}

// chart ---------------------------------------------------------------
const CW = 1000, CH = 360, PAD = { l: 72, r: 24, t: 30, b: 34 };
let xAt = () => 0, yT = () => 0;
function renderChart() {
  const S = state.steps, m = state.meta, n = S.length;
  const iw = CW - PAD.l - PAD.r, ih = CH - PAD.t - PAD.b;
  const bw = iw / n;
  xAt = (i) => PAD.l + bw * (i + 0.5);
  const tv = S.flatMap((s) => [s.pitchVal, s.c?.pitchVal]).filter((v) => v != null);
  const tmin = Math.min(...tv), tmax = Math.max(...tv), tpad = (tmax - tmin) * 0.12 || 1;
  yT = (v) => PAD.t + ih * 0.62 * (1 - (v - (tmin - tpad)) / (tmax - tmin + 2 * tpad));
  const rH = ih * 0.36, rBase = PAD.t + ih;
  const rFrac = (r) => clamp01(r / (m.rmax || 1));
  const bars = S.map((s, i) => s.r == null ? "" :
    `<rect class="bar${s.wet ? " wet" : ""}" x="${(PAD.l + bw * i + bw * (n <= 60 ? 0.38 : 0.12)).toFixed(2)}" width="${Math.max(0.6, bw * (n <= 60 ? 0.24 : 0.76)).toFixed(2)}" y="${(rBase - rH * rFrac(s.r)).toFixed(2)}" height="${(rH * rFrac(s.r)).toFixed(2)}"/>`).join("");
  const pts = S.map((s, i) => s.pitchVal == null ? null : `${xAt(i).toFixed(2)},${yT(s.pitchVal).toFixed(2)}`).filter(Boolean).join(" ");
  const cpts = S.map((s, i) => s.c?.pitchVal == null ? null : `${xAt(i).toFixed(2)},${yT(s.c.pitchVal).toFixed(2)}`).filter(Boolean).join(" ");
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
    if (state.track === "decades") lab = s.label;
    if (state.track === "months" && s.m === 1 && s.y % 5 === 0) lab = loc(s.y);
    if (state.track === "monsoon" && s.d === 1) lab = T[state.lang].months[s.m - 1].slice(0, state.lang === "bn" ? 4 : 3);
    if (lab) ticks.push(`<text x="${xAt(i)}" y="${CH - 8}" text-anchor="middle">${lab}</text><line x1="${xAt(i)}" x2="${xAt(i)}" y1="${PAD.t}" y2="${rBase}"/>`);
  });
  const unitT = state.track === "months" ? "±°C" : "°C";
  const yl = [tmin, (tmin + tmax) / 2, tmax].map((v) => `<text x="${PAD.l - 6}" y="${yT(v) + 4}" text-anchor="end">${loc(v.toFixed(1))}</text>`).join("");
  $("chart").innerHTML =
    `<svg viewBox="0 0 ${CW} ${CH}" aria-hidden="true">
      <g class="grid">${ticks.map((x) => x.replace(/<text[^>]*>[^<]*<\/text>/, "")).join("")}</g>
      <g class="staff">${staff}</g>
      ${bars}${trend}
      ${cpts ? `<polyline class="cline" points="${cpts}"/>` : ""}
      <polyline class="tline${n <= 60 ? " slur" : ""}" points="${pts}"/>
      <g class="heads">${heads}</g>
      <g class="axis">${ticks.map((x) => x.replace(/<line[^>]*\/>/, "")).join("")}${yl}<text x="${PAD.l - 6}" y="${PAD.t - 2}" text-anchor="end">${unitT}</text></g>
      <line class="cursor" id="cursor" x1="0" x2="0" y1="${PAD.t}" y2="${rBase}"/>
      <ellipse class="dot" id="cdot" rx="10" ry="7.2" cx="0" cy="0"/>
    </svg>`;
  const k = { years: "capYears", decades: "capDecades", months: "capMonths", monsoon: "capMonsoon" }[state.track];
  $("chart-cap").textContent = t(k, placeName()) + (m.cmp ? t("capCmp", cmpName(), cmpPlace().gen) : "") + srcCaption();
}
// Which source each sound comes from, said in the caption so the table and chart are honest about it.
function srcCaption() {
  const d = state.meta?.data;
  if (!d) return "";
  const tName = d.src.temp === "station" ? t("shortStation", titleCase(d.st.name), d.st.km, dsName(d.st)) : t("shortPowerT");
  const rName = d.src.rain === "imerg" ? t("shortImerg") : t("shortPowerR");
  return loc(t("capSrc", tName, rName));
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
  const mm = L === "bn" ? "মিমি" : "mm";
  const li = (big, cls, lbl) => `<li><span class="big ${cls}">${big}</span><span class="lbl">${lbl}</span></li>`;
  const a = placeName(), cp = cmpPlace();
  if (m.kind === "monsoon") {
    const S = state.steps;
    if (!S.length) { ul.innerHTML = ""; story = ""; return; }
    const total = S.reduce((acc, s) => acc + (s.r || 0), 0);
    const wd = S.reduce((acc, s) => (s.r != null && (acc == null || s.r > acc.r) ? s : acc), null);
    const heavy = S.filter((s) => s.heavy).length;
    const wetDay = `${loc(wd.d)} ${T[L].months[wd.m - 1]}`;
    let html =
      li(`${loc(fmtInt(total))} ${mm}`, "rain", t("fMonsoonTotal")) +
      li(wetDay, "rain", `${t("fWettestDay")} · ${loc(fmtInt(wd.r))} ${mm}`) +
      li(loc(heavy), "", t("fHeavyDays"));
    story = t("storyMonsoon", { place: a, gen: place().gen, at: place().at, total, wetDay, wetDayMm: wd.r, heavy });
    if (m.cmp && cp) {
      const C = m.cmp.steps;
      const tb = C.reduce((acc, s) => acc + (s.r || 0), 0), hb = C.filter((s) => s.heavy).length;
      html += li(`${loc(heavy)} / ${loc(hb)}`, "rain", t("fCmpHeavy", a, cp[L]));
      story += " " + t("storyCmpMonsoon", { a, b: cp[L], aAt: place().at, bAt: cp.at, bGen: cp.gen, ta: total, tb, ha: heavy, hb,
        more: heavy > hb ? a : cp[L], moreAt: heavy > hb ? place().at : cp.at });
    }
    ul.innerHTML = html;
    story = loc(story);
    $("story-text").textContent = story;
    return;
  }
  const Dt = m.data, Y = Dt.years, M = Dt.months, srcs = Dt.src;
  const sign = (v) => (v >= 0 ? "+" : "−");
  const sayDecade = (x) => t("decadeSay", x.y1, x.y2);
  const stName = Dt.st ? titleCase(Dt.st.name) : "";
  const tSrc = (k, long) => k === "station" ? (long ? t("srcStationT", stName, dsName(Dt.st), Dt.st.km) : t("shortStation", stName, Dt.st.km, dsName(Dt.st))) : (long ? t("srcPowerT") : t("shortPowerT"));
  const rSrc = (k, long) => k === "imerg" ? (long ? t("srcImergR") : t("shortImerg")) : (long ? t("srcPowerR") : t("shortPowerR"));
  // Trend, span and warmest decade of one yearly temperature series.
  const tStats = (years) => {
    const v = years.filter((x) => x.t != null);
    if (v.length < 10) return null;
    const lr = linreg(v.map((x) => x.y), v.map((x) => x.t));
    // A decade only counts if it has at least 5 years of data (station records have gaps).
    const D = decadesOf(years).filter((x) => x.t != null && x.n >= 5);
    return { lr, n: v.length, slope: lr.slope * 10, y1: v[0].y, y2: v[v.length - 1].y, total: lr.slope * (v[v.length - 1].y - v[0].y),
      hotD: D.reduce((acc, x) => (!acc || x.t > acc.t ? x : acc), null), coolD: D.reduce((acc, x) => (!acc || x.t < acc.t ? x : acc), null) };
  };
  const rStats = (years) => {
    const v = years.filter((x) => x.r != null);
    if (v.length < 10) return null;
    const lr = linreg(v.map((x) => x.y), v.map((x) => x.r));
    return { lr, slope: lr.slope * 10, y1: v[0].y, y2: v[v.length - 1].y, mean: avg(v.map((x) => x.r)) };
  };
  const ts = tStats(Y), rs = rStats(Y);
  const hot = Y.reduce((acc, x) => (x.t != null && (!acc || x.t > acc.t) ? x : acc), null);
  const wm = M.reduce((acc, x) => (x.r != null && (!acc || x.r > acc.r) ? x : acc), null);
  const { hotD, coolD, slope } = ts;
  const wetMonth = `${T[L].months[wm.m - 1]} ${loc(wm.y)}`;
  const jump = m.jump;
  // The other temperature source, for a cross-check.
  const otherT = srcs.temp === "station" ? "power" : Dt.station ? "station" : null;
  const ots = otherT ? tStats(otherT === "power" ? Dt.power : Dt.station) : null;
  const im = Dt.imerg ? rStats(Dt.imerg) : null;
  let html =
    li(`${sign(slope)}${loc(Math.abs(slope).toFixed(2))} °C`, "heat", `${t(slope >= 0 ? "fWarm" : "fCool")} · ${loc(tSrc(srcs.temp))} · ${ts.lr.sig ? t("fSig") : t("fNotSig")}${slope < 0 && !ots ? " · " + t("fModel") : ""}`);
  if (ots) html += li(`${sign(ots.slope)}${loc(Math.abs(ots.slope).toFixed(2))} °C`, "heat", `${loc(t("fCrossT", tSrc(otherT)))} · ${loc(t("fYears", ots.n, ots.y1, ots.y2))} · ${ots.lr.sig ? t("fSig") : t("fNotSig")}${ots.hotD ? ` · ${t("fWarmestDecade")} ${loc(`${ots.hotD.y1}–${ots.hotD.y2}`)}` : ""}`);
  if (hotD) html += li(loc(`${hotD.y1}–${hotD.y2}`), "heat", `${t("fWarmestDecade")} · ${loc(f1(hotD.t))} °C ${t("avg")}`);
  html +=
    li(loc(hot.y), "heat", `${t("fHottest")} · ${loc(f1(hot.t))} °C ${t("avg")}`) +
    li(wetMonth, "rain", `${t("fWettestMonth")} · ${loc(fmtInt(wm.r))} ${mm}`) +
    li(`${sign(rs.slope)}${loc(fmtInt(Math.abs(rs.slope)))} ${mm}`, "rain",
      `${rs.slope >= 0 ? t("fRainTrend") : t("fRainTrendLess")} · ${loc(`${rSrc(srcs.rain)} ${rs.y1}–${rs.y2}`)} · ${rs.lr.sig ? t("fSig") : t("fNotSig")}`);
  if (im && srcs.rain !== "imerg") html += li(`${sign(im.slope)}${loc(fmtInt(Math.abs(im.slope)))} ${mm}`, "rain", `${loc(t("fImerg", im.y1, im.y2))} · ${im.lr.sig ? t("fSig") : t("fNotSig")}`);
  if (jump.big) html += li(`×${loc(f1(jump.ratio))}`, "rain", loc(t("fRainJump", fmtInt(jump.before), fmtInt(jump.after))));

  story = t("storyYears", { y1: ts.y1, y2: ts.y2, src: tSrc(srcs.temp, true), place: a, gen: place().gen, at: place().at, slope, total: ts.total, sig: ts.lr.sig, hotYear: hot.y, wetMonth, wetMonthBn: `${wm.y} সালের ${T.bn.months[wm.m - 1]} মাসে`, wetMonthMm: wm.r });
  if (hotD) story += " " + t("storyDecade", { hot: sayDecade(hotD), hotT: hotD.t, partial: hotD.partial, cool: sayDecade(coolD), coolT: coolD.t });
  if (ots) {
    const stFile = Dt.st;
    story += " " + t("storyCrossT", { src: tSrc(otherT, true), km: otherT === "station" ? stFile.km : null, n: ots.n, place: a, gen: place().gen, slope: ots.slope, sig: ots.lr.sig, y1: ots.y1, y2: ots.y2, dec: ots.hotD ? sayDecade(ots.hotD) : null });
    // Say why when the model and the thermometers point different ways.
    if (Math.sign(ots.slope) !== Math.sign(slope) || (ots.hotD && hotD && ots.hotD.y1 !== hotD.y1)) story += " " + t("whyDiffer");
  } else if (slope < 0 || (hotD && hotD.y1 < 2011)) {
    // No station record saved: warn whenever the model disagrees with BMD stations.
    story += " " + t("modelNote");
  }
  story += " " + t("storyRain", { src: rSrc(srcs.rain, true), y1: rs.y1, y2: rs.y2, slope: rs.slope, sig: rs.lr.sig });
  if (srcs.rain === "imerg") story += " " + t("imergNote");
  else if (jump.big) {
    story += " " + t("rainNote", jump);
    if (im) {
      const pw = avg(Dt.power.filter((x) => x.y >= im.y1 && x.y <= im.y2).map((x) => x.r));
      story += " " + t("rainImerg", { im: im.mean, pw, slope: im.slope, sig: im.lr.sig });
    } else story += " " + t("rainCheck");
  }
  if (m.cmp && cp) {
    const CY = m.cmp.data.years;
    const cr = linreg(CY.map((x) => x.y), CY.map((x) => x.t));
    const ta = avg(Y.map((x) => x.t)), tb = avg(CY.map((x) => x.t));
    const d = Math.abs(ta - tb);
    html += li(`${sign(ta - tb)}${loc(d.toFixed(1))} °C`, "heat", t("fCmp", a, cp[L]));
    story += " " + t("storyCmp", { a, b: cp[L], aGen: place().gen, bGen: cp.gen, aAt: place().at, bAt: cp.at, y1: FIRST_YEAR, y2: LAST_YEAR,
      ta, tb, d, warmer: ta >= tb ? a : cp[L], sa: slope, sb: cr.slope * 10, ra: avg(Y.map((x) => x.r)), rb: avg(CY.map((x) => x.r)) });
  }
  ul.innerHTML = html;
  story = loc(story);
  $("story-text").textContent = story;
}
// Name of the station archive a file came from (GISS directly, or the NOAA GHCN archive GISTEMP is built on).
const dsName = (st) => (st?.dataset === "ghcnm" ? "NOAA GHCN" : "NASA GISTEMP");
// Station names come in capitals ("DHAKA"); say them as names.
const titleCase = (n) => String(n || "").replace(/_/g, " ").toLowerCase().replace(/(^|[\s\-\/(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

// table + csv --------------------------------------------------------
function renderTable() {
  const S = state.steps, L = state.lang, cp = state.meta.cmp ? cmpName() : null;
  const rainH = L === "bn" ? "বৃষ্টি (মিমি)" : "Rain (mm)";
  const head = state.track === "monsoon"
    ? [L === "bn" ? "তারিখ" : "Date", "°C", rainH]
    : [L === "bn" ? "সময়" : "When", "°C", L === "bn" ? "স্বাভাবিক থেকে (°C)" : "vs normal (°C)", rainH];
  if (cp) head.push(`${cp} °C`, `${cp} ${rainH}`);
  const rows = S.map((s) => {
    const cells = [s.label, loc(f1(s.t))];
    if (state.track !== "monsoon") cells.push(s.a == null ? "—" : loc((s.a >= 0 ? "+" : "") + s.a.toFixed(2)));
    cells.push(loc(fmtInt(s.r)));
    if (cp) cells.push(loc(f1(s.c?.t)), loc(fmtInt(s.c?.r)));
    return `<tr>${cells.map((c, k) => (k === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`;
  }).join("");
  $("table").innerHTML = `<table><caption class="visually-hidden">${$("chart-cap").textContent}</caption><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}
function downloadCSV() {
  const S = state.steps, p = place(), cp = state.meta?.cmp ? cmpPlace() : null;
  const period = (s) => state.track === "years" ? s.y : state.track === "decades" ? `${s.y1}-${s.y2}` : `${s.y}-${String(s.m).padStart(2, "0")}`;
  const extraH = cp ? `,${cp.id}_temperature_c,${cp.id}_rain_mm` : "";
  const extra = (s) => (cp ? `,${s.c?.t == null ? "" : s.c.t.toFixed(2)},${s.c?.r == null ? "" : s.c.r.toFixed(1)}` : "");
  const lines = state.track === "monsoon"
    ? ["date,temperature_c,rain_mm" + extraH, ...S.map((s) => `${isoDate(s)},${s.t ?? ""},${s.r == null ? "" : s.r.toFixed(2)}${extra(s)}`)]
    : ["period,temperature_c,anomaly_vs_1981_2010_c,rain_mm" + extraH,
       ...S.map((s) => `${period(s)},${s.t == null ? "" : s.t.toFixed(2)},${s.a == null ? "" : s.a.toFixed(3)},${s.r == null ? "" : s.r.toFixed(1)}${extra(s)}`)];
  const d = state.meta?.data;
  const srcLine = !d ? "NASA POWER (power.larc.nasa.gov)"
    : `temperature: ${d.src.temp === "station" ? `${dsName(d.st)} station ${d.st.station} ${d.st.name}` : "NASA POWER T2M (power.larc.nasa.gov)"}; rain: ${d.src.rain === "imerg" ? "NASA GPM IMERG via NASA POWER (IMERG_PRECTOT)" : "NASA POWER PRECTOTCORR"}`;
  lines.unshift(`# Source: ${srcLine}. ${p.en} ${p.lat},${p.lon}${cp ? `; compared with ${cp.en} ${cp.lat},${cp.lon}` : ""}`);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  a.download = `shur-${p.id}${cp ? "-vs-" + cp.id : ""}-${state.track}.csv`; a.click();
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
  const shown = `${loc(s.d || 15)} ${T[state.lang].months[(s.m || 2) - 1]} ${loc(s.y)}`;
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
  // Screen-reader users already hear every announcement, so Shur's own voice stays quiet.
  if (state.sr) return;
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
  $("compare").innerHTML = `<option value="">${t("cmpNone")}</option>` + PLACES.filter((p) => p.id !== state.placeId)
    .map((p) => `<option value="${p.id}"${p.id === state.cmpId ? " selected" : ""}>${p[state.lang]}</option>`).join("");
}
function applyLang() {
  document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $("lang-en").setAttribute("aria-pressed", state.lang === "en");
  $("lang-bn").setAttribute("aria-pressed", state.lang === "bn");
  $("prev").setAttribute("aria-label", t("prev")); $("next").setAttribute("aria-label", t("next"));
  $("player-app").setAttribute("aria-label", t("playerLabel"));
  updatePlayBtn(); renderControls();
  $("speed-out").textContent = loc(state.speed) + "×";
  if (state.steps.length) { relabel(); renderChart(); renderFacts(); renderTable(); show(state.i, { quiet: true }); }
}
function choosePlace(id) {
  if (id === state.placeId) return;
  state.placeId = id;
  if (state.cmpId === id) state.cmpId = null;
  renderControls(); build();
}
function chooseTrack(id) { if (id === state.track) return; state.track = id; renderControls(); build(); }
function setCompare(id) {
  id = id || null;
  if (id === state.placeId || id === state.cmpId) { renderControls(); return; }
  state.cmpId = id;
  renderControls(); build();
  if (!id) announce(t("cmpOff"));
}
function nextTrack() {
  const ids = Object.keys(TRACKS);
  chooseTrack(ids[(ids.indexOf(state.track) + 1) % ids.length]);
}

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
$("compare").addEventListener("change", (e) => setCompare(e.target.value));
$("stretch").addEventListener("change", (e) => { state.stretch = e.target.checked; setRanges(); if (state.steps.length) { renderChart(); moveCursor(state.i); } });
$("musical").addEventListener("change", (e) => { state.musical = e.target.checked; });
$("temp-src").addEventListener("change", (e) => { state.tempSrc = e.target.value; if (state.track !== "monsoon") build(); });
$("rain-src").addEventListener("change", (e) => { state.rainSrc = e.target.value; if (state.track !== "monsoon") build(); });
$("sr").checked = state.sr;
$("sr").addEventListener("change", (e) => {
  state.sr = e.target.checked;
  if (state.sr) window.speechSynthesis?.cancel();
  try { localStorage.setItem("shur:sr", state.sr ? "1" : "0"); } catch (_) {}
});
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
  const digit = /^Digit([0-8])$/.exec(e.code);
  if (e.shiftKey && digit && digit[1] !== "0") { e.preventDefault(); setCompare(PLACES[+digit[1] - 1].id); }
  else if (e.key === " " && !onButton) { e.preventDefault(); toggle(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  else if (/^[1-8]$/.test(e.key)) choosePlace(PLACES[+e.key - 1].id);
  else if (e.key === "0") setCompare(null);
  else if (e.key === "s" || e.key === "S") tellStory();
  else if (e.key === "t" || e.key === "T") nextTrack();
  else if (e.key === "r" || e.key === "R") { const s = state.steps[state.i]; if (s) { const x = noteText(s); announce(x); speak(x); } }
});
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => {};

applyLang();
build();
