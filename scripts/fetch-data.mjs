// Saves NASA POWER responses into data/ so Shur still works when the API is down.
// Run with Node 18+: node scripts/fetch-data.mjs
// The places and URLs must match PLACES and powerUrl() in app.js.
import { writeFile, mkdir } from "node:fs/promises";

const PLACES = [
  ["dhaka", 23.81, 90.41], ["chattogram", 22.36, 91.78], ["sylhet", 24.89, 91.87], ["rajshahi", 24.37, 88.60],
  ["khulna", 22.85, 89.54], ["barishal", 22.70, 90.35], ["rangpur", 25.74, 89.25], ["mymensingh", 24.75, 90.41],
];
const POWER = "https://power.larc.nasa.gov/api/temporal";
const url = (kind, lat, lon, start, end) =>
  `${POWER}/${kind}/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");

let end = "20260930";
const latest = ymd(new Date(Date.now() - 6 * 864e5));
if (latest < end) end = latest;

async function save(file, u) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      if (!j.properties?.parameter?.T2M) throw new Error("Unexpected response");
      await writeFile(file, JSON.stringify(j));
      console.log("saved", file);
      return;
    } catch (e) {
      console.warn(`${file}: attempt ${attempt} failed (${e.message})`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error("Could not fetch " + file);
}

await mkdir("data", { recursive: true });
for (const [id, lat, lon] of PLACES) {
  await save(`data/${id}-monthly.json`, url("monthly", lat, lon, 1981, 2025));
  if (latest >= "20260601") await save(`data/${id}-monsoon2026.json`, url("daily", lat, lon, "20260601", end));
}
