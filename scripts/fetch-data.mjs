// Saves NASA data into data/ so Shur still works when the APIs are down,
// and prepares the two cross-check sources that are too heavy to fetch live in the browser.
// Run with Node 18+: node scripts/fetch-data.mjs
// The places and URLs must match PLACES and powerUrl() in app.js.
import { writeFile, mkdir } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const PLACES = [
  ["dhaka", 23.81, 90.41], ["chattogram", 22.36, 91.78], ["sylhet", 24.89, 91.87], ["rajshahi", 24.37, 88.60],
  ["khulna", 22.85, 89.54], ["barishal", 22.70, 90.35], ["rangpur", 25.74, 89.25], ["mymensingh", 24.75, 90.41],
];
const POWER = "https://power.larc.nasa.gov/api/temporal";
const url = (kind, lat, lon, start, end, params = "T2M,PRECTOTCORR") =>
  `${POWER}/${kind}/point?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let end = "20260930";
const latest = ymd(new Date(Date.now() - 6 * 864e5));
if (latest < end) end = latest;

async function getWithRetry(u, parse) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await parse(res);
    } catch (e) {
      last = e;
      console.warn(`${u}: attempt ${attempt} failed (${e.message}${e.cause ? ": " + (e.cause.code || e.cause.message) : ""})`);
      await sleep(2000 * attempt);
    }
  }
  throw last;
}

async function save(file, u) {
  const j = await getWithRetry(u, (r) => r.json());
  if (!j.properties?.parameter?.T2M) throw new Error("Unexpected response for " + file);
  await writeFile(file, JSON.stringify(j));
  console.log("saved", file);
}

// ---------------------------------------------------------------- NASA GPM IMERG rain (via POWER)
// POWER serves IMERG daily rain (mm/day) from mid-2000. Sum it into monthly totals, 2001–2025.
async function saveImerg(id, lat, lon) {
  // IMERG is only served in UTC days, not POWER's default local solar time.
  const u = url("daily", lat, lon, "20010101", "20251231", "IMERG_PRECTOT") + "&time-standard=UTC";
  const j = await getWithRetry(u, (r) => r.json());
  const P = j.properties?.parameter?.IMERG_PRECTOT;
  if (!P) throw new Error("No IMERG_PRECTOT in response: " + JSON.stringify(j).slice(0, 300));
  const sums = {}, counts = {};
  for (const [k, v] of Object.entries(P)) {
    const ym = k.slice(0, 6);
    counts[ym] ??= 0; sums[ym] ??= 0;
    if (v == null || v <= -990) continue;
    sums[ym] += v; counts[ym]++;
  }
  const valid = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!valid) throw new Error("IMERG_PRECTOT is all fill values. Header: " + JSON.stringify(j.header ?? {}).slice(0, 400) + " Messages: " + JSON.stringify(j.messages ?? []).slice(0, 400));
  console.log(`IMERG ${id}: ${valid} valid days, first ${Object.keys(P).find((k) => P[k] > -990)}`);
  const monthly = {};
  for (const ym of Object.keys(sums).sort()) {
    const days = new Date(+ym.slice(0, 4), +ym.slice(4, 6), 0).getDate();
    // Keep a month only if most days are present; scale up the few missing days.
    monthly[ym] = counts[ym] >= days - 3 ? Math.round((sums[ym] / counts[ym]) * days * 10) / 10 : null;
  }
  const out = { source: "NASA GPM IMERG daily precipitation via NASA POWER (IMERG_PRECTOT), summed to monthly mm", lat, lon, monthly };
  await writeFile(`data/${id}-imerg.json`, JSON.stringify(out));
  console.log("saved", `data/${id}-imerg.json`, Object.keys(monthly).length, "months");
}

// ---------------------------------------------------------------- NASA GISTEMP station temperature
// GISTEMP v4 uses thermometer records (GHCN). Find the nearest Bangladesh station to each division
// and save its yearly mean temperature (homogenized, "adjusted" series).
const GISS = "https://data.giss.nasa.gov";
const text = (r) => r.text();
const km = (a, b, c, d) => {
  const R = 6371, rad = Math.PI / 180;
  const x = Math.sin(((c - a) * rad) / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
let stationList = null;
async function stations() {
  if (stationList) return stationList;
  // GHCN-v4 station inventory, as used by GISTEMP.
  const inv = await getWithRetry(`${GISS}/gistemp/station_data_v4_globe/v4.temperature.inv.txt`, text).catch(() => null);
  stationList = [];
  if (inv) {
    for (const line of inv.split("\n")) {
      const id = line.slice(0, 11).trim();
      if (!id.startsWith("BG")) continue;
      const lat = parseFloat(line.slice(12, 20)), lon = parseFloat(line.slice(21, 30));
      const name = line.slice(38, 68).trim() || line.slice(30).trim();
      if (!isNaN(lat) && !isNaN(lon)) stationList.push({ id, lat, lon, name });
    }
  }
  console.log("Bangladesh stations in inventory:", stationList.length);
  return stationList;
}
function parseStationCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const head = lines[0].split(",").map((s) => s.trim().toUpperCase());
  const yi = head.indexOf("YEAR"), ai = head.indexOf("METANN");
  if (yi < 0 || ai < 0) throw new Error("Unexpected station CSV header: " + lines[0]);
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].map((m) => head.indexOf(m));
  const annual = {}, monthly = {};
  for (const l of lines.slice(1)) {
    const c = l.split(",");
    const y = +c[yi], v = parseFloat(c[ai]);
    if (!y) continue;
    if (!isNaN(v) && v < 900) annual[y] = v;
    MONTHS.forEach((ci, k) => {
      const mv = ci < 0 ? NaN : parseFloat(c[ci]);
      if (!isNaN(mv) && mv < 900) monthly[`${y}${String(k + 1).padStart(2, "0")}`] = mv;
    });
  }
  return { annual, monthly };
}
async function stationAnnual(id) {
  // The show page writes the station's CSV into a temporary folder and links to it.
  const page = await getWithRetry(`${GISS}/cgi-bin/gistemp/stdata_show_v4.cgi?id=${id}&ds=14&dt=1`, text);
  const m = page.match(/href="([^"]*station\.csv)"/i);
  const csvUrl = m ? new URL(m[1], `${GISS}/cgi-bin/gistemp/`).href : `${GISS}/tmp/gistemp/STATIONS_v4/tmp_${id}_14_0_1/station.csv`;
  return parseStationCsv(await getWithRetry(csvUrl, text));
}
// Candidate stations near a point: GISS's own station finder first, then the GHCN inventory.
async function nearStations(lat, lon) {
  const found = [];
  try {
    const html = await getWithRetry(`${GISS}/cgi-bin/gistemp/find_station.cgi?lat=${lat}&lon=${lon}&ds=14&dt=1`, text);
    for (const m of html.matchAll(/id=(BG[A-Z0-9]{9})[^>]*>([^<]*)</g)) {
      if (!found.some((s) => s.id === m[1])) found.push({ id: m[1], name: m[2].trim() });
    }
    if (!found.length) console.warn("find_station gave no BG stations; first 400 chars:", html.slice(0, 400));
  } catch (e) { console.warn("find_station failed:", e.message); }
  const inv = (await stations()).map((s) => ({ ...s, km: km(lat, lon, s.lat, s.lon) })).sort((a, b) => a.km - b.km);
  for (const s of found) { const hit = inv.find((x) => x.id === s.id); if (hit) Object.assign(s, hit); }
  for (const s of inv) if (!found.some((x) => x.id === s.id)) found.push(s);
  return found;
}
let gissDown = false;
async function saveGistemp(id, lat, lon) {
  if (gissDown) throw new Error("GISS unreachable");
  for (const s of (await nearStations(lat, lon)).slice(0, 5)) {
    try {
      const { annual, monthly } = await stationAnnual(s.id);
      const recent = Object.keys(annual).filter((y) => y >= 1981 && y <= 2025).length;
      if (recent < 30) { console.warn(`${s.id} ${s.name}: only ${recent} years 1981–2025, trying the next station`); continue; }
      const out = { dataset: "gistemp", source: "NASA GISTEMP v4 station record (GHCN-v4, adjusted), annual (metANN, Dec–Nov) and monthly mean °C", station: s.id, name: s.name,
        lat: s.lat ?? null, lon: s.lon ?? null, km: s.km == null ? null : Math.round(s.km), annual, monthly };
      await writeFile(`data/${id}-gistemp.json`, JSON.stringify(out));
      console.log("saved", `data/${id}-gistemp.json`, s.id, s.name, s.km == null ? "" : Math.round(s.km) + " km", recent, "years");
      return;
    } catch (e) {
      console.warn(`${s.id}: ${e.message}`);
    }
  }
  if (!(await stations()).length) gissDown = true;
  throw new Error("No usable GISTEMP station near " + id);
}

// Fallback when GISS can't be reached: NOAA GHCN-Monthly v4, adjusted. It is the same thermometer
// archive GISTEMP is built from, so the station records match.
let ghcn = null;
async function loadGhcn() {
  if (ghcn) return ghcn;
  const buf = Buffer.from(await getWithRetry("https://www.ncei.noaa.gov/pub/data/ghcn/v4/ghcnm.tavg.latest.qcf.tar.gz", (r) => r.arrayBuffer()));
  const tar = gunzipSync(buf);
  let inv = "", dat = "";
  for (let off = 0; off + 512 <= tar.length;) {
    const name = tar.subarray(off, off + 100).toString().replace(/\0.*$/s, "");
    if (!name) break;
    const size = parseInt(tar.subarray(off + 124, off + 136).toString().replace(/\0.*$/s, "").trim() || "0", 8);
    const body = tar.subarray(off + 512, off + 512 + size);
    if (name.endsWith(".inv")) inv = body.toString();
    if (name.endsWith(".dat")) dat = body.toString();
    off += 512 + Math.ceil(size / 512) * 512;
  }
  const list = [], series = {};
  for (const line of inv.split("\n")) {
    if (!line.startsWith("BG")) continue;
    list.push({ id: line.slice(0, 11), lat: parseFloat(line.slice(12, 20)), lon: parseFloat(line.slice(21, 30)), name: line.slice(38, 68).trim() });
  }
  for (const line of dat.split("\n")) {
    if (!line.startsWith("BG")) continue;
    const id = line.slice(0, 11), y = +line.slice(11, 15);
    series[id] ??= {};
    for (let k = 0; k < 12; k++) {
      const v = parseInt(line.slice(19 + k * 8, 24 + k * 8), 10), qc = line[25 + k * 8];
      if (v !== -9999 && (!qc || qc === " ")) series[id][`${y}${String(k + 1).padStart(2, "0")}`] = v / 100;
    }
  }
  console.log(`GHCN-M: ${list.length} Bangladesh stations`);
  return (ghcn = { list, series });
}
// Bangladesh station records have gaps, so a year counts if it has at least 8 months. Its mean is the
// station's monthly normals plus that year's average departure from them, so a missing month doesn't bias it.
function yearlyFromMonthly(monthly) {
  const normals = Array.from({ length: 12 }, (_, k) => {
    const v = Object.entries(monthly).filter(([key]) => +key.slice(4) === k + 1 && +key.slice(0, 4) >= 1981 && +key.slice(0, 4) <= 2010).map(([, x]) => x);
    return v.length >= 5 ? v.reduce((a, b) => a + b, 0) / v.length : null;
  });
  if (normals.some((x) => x == null)) return {};
  const base = normals.reduce((a, b) => a + b, 0) / 12, annual = {};
  for (let y = 1950; y <= 2025; y++) {
    const dep = [];
    for (let k = 0; k < 12; k++) { const v = monthly[`${y}${String(k + 1).padStart(2, "0")}`]; if (v != null) dep.push(v - normals[k]); }
    if (dep.length >= 8) annual[y] = Math.round((base + dep.reduce((a, b) => a + b, 0) / dep.length) * 100) / 100;
  }
  return annual;
}
async function saveGhcn(id, lat, lon) {
  const g = await loadGhcn();
  const near = g.list.map((s) => ({ ...s, km: km(lat, lon, s.lat, s.lon) })).filter((s) => s.km <= 150).sort((a, b) => a.km - b.km);
  const scored = near.map((s) => {
    const monthly = g.series[s.id] || {};
    const annual = yearlyFromMonthly(monthly);
    const yrs = Object.keys(annual).map(Number).filter((y) => y >= 1981);
    return { ...s, monthly, annual, n: yrs.length, last: yrs.length ? Math.max(...yrs) : null };
  });
  for (const s of scored) console.log(`GHCN ${id}: ${s.id} ${s.name} ${Math.round(s.km)} km, ${s.n} usable years since 1981, last ${s.last}`);
  // Nearest station with a good record; otherwise the best-covered one within 150 km.
  const good = (s) => s.n >= 25 && s.last >= 2015;
  const pick = scored.find(good) ?? [...scored].filter((s) => s.n >= 20 && s.last >= 2010).sort((a, b) => b.n - a.n)[0];
  if (!pick) throw new Error("No GHCN station within 150 km with 20+ usable years since 1981");
  const out = { source: "NOAA GHCN-Monthly v4 adjusted (qcf) station record, the thermometer data NASA GISTEMP is built from; monthly °C, and yearly means for years with 8+ months",
    dataset: "ghcnm", station: pick.id, name: pick.name, lat: pick.lat, lon: pick.lon, km: Math.round(pick.km), annual: pick.annual, monthly: pick.monthly };
  await writeFile(`data/${id}-gistemp.json`, JSON.stringify(out));
  console.log("saved", `data/${id}-gistemp.json`, "(GHCN)", pick.id, pick.name, Math.round(pick.km), "km", pick.n, "years");
}

await mkdir("data", { recursive: true });
const problems = [];
// List POWER's IMERG parameters, so a renamed parameter shows up in the log.
try {
  const meta = await (await fetch("https://power.larc.nasa.gov/api/system/manager/parameters?community=AG&temporal=daily")).json();
  const names = Object.entries(meta).filter(([k, v]) => /IMERG/i.test(k + JSON.stringify(v).slice(0, 300)));
  console.log("POWER IMERG parameters:", JSON.stringify(names).slice(0, 1500));
} catch (e) { console.warn("Couldn't list POWER parameters:", e.message); }
for (const [id, lat, lon] of PLACES) {
  await save(`data/${id}-monthly.json`, url("monthly", lat, lon, 1981, 2025));
  if (latest >= "20260601") await save(`data/${id}-monsoon2026.json`, url("daily", lat, lon, "20260601", end));
  // The cross-check sources are extras: a failure is reported but doesn't stop the main refresh.
  try { await saveImerg(id, lat, lon); } catch (e) { problems.push(`IMERG ${id}: ${e.message}`); }
  try { await saveGistemp(id, lat, lon); } catch (e) {
    console.warn(`GISTEMP ${id}: ${e.message}; trying GHCN`);
    try { await saveGhcn(id, lat, lon); } catch (e2) { problems.push(`station ${id}: ${e2.message}`); }
  }
}
if (problems.length) console.warn("Cross-check sources with problems:\n" + problems.join("\n"));
