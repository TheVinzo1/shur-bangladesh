# Shur (সুর) · Hear Bangladesh's climate

**NASA Space Apps Challenge 2026 · Challenge: The Earth Information Jukebox · Team Nyopus (BRAC University, Dhaka)**

Shur turns 45 years of NASA climate data for Bangladesh into sound. Pick one of the eight divisions and press play: every note is a year (or a month, or a day), higher notes mean hotter, and the sound of rain grows with how much it rained. The hottest years ring a bell, and the wettest months bring thunder.

Most climate data reaches people as charts, and a chart is useless to someone who can't see it. Bangladesh has more than half a million blind people (national surveys: about 650,000 blind adults aged 30+ in 2000, and 1% of adults over 40 in 2013) and millions more with low vision. Shur is built so they can hear the climate changing: it reads the numbers aloud (in English; screen text can be English or Bangla), works entirely from the keyboard, and every number is also available as a table and a CSV file.

## Tracks

| Track | What each note is | What you hear |
|---|---|---|
| **45 years** | One year, 1981–2025 | The melody follows each year's average temperature. A dashed trend line and a statistical test show whether there is a real long-term trend. |
| **Decades** | One decade (1981–1990 … 2021–2025) | Five long notes, one per decade's average temperature, so the warmest decade is easy to pick out by ear. The last decade has only 5 years so far. |
| **Every month** | One month, 1981–2025 (540 notes) | Pitch is the month's temperature *compared with its 1981–2010 normal*, so you hear change instead of seasons. Rain pulses with every monsoon. |
| **Monsoon 2026** | One day, June–September 2026 | The 2026 monsoon, day by day. Days with very heavy rain (89 mm or more, the Bangladesh Meteorological Department threshold) bring thunder. |

## How to use it

- **Space** play / pause · **← →** step one note · **1–8** choose a division · **Shift+1–8** compare with a division · **0** stop comparing · **T** change track · **S** tell the story · **R** read the current note aloud
- **Tell me the story** reads a plain-language summary: the temperature trend per decade and whether it's statistically significant, the warmest and coolest decade, the hottest year, the wettest month and the rain trend. It also reads out data warnings (see Method notes).
- **Compare** two divisions: yours plays in the left ear, the other in the right (with a different instrument), on the same scale. The story says the difference in words, for example which division was warmer and by how much, or which had more very heavy rain days in the 2026 monsoon. Each note read aloud gives both values and the difference.
- **I use a screen reader** turns Shur's own voice off, so only your screen reader speaks. The player is marked as an application so screen readers pass the keys through; if they don't, switch to focus mode (NVDA+Space, or Insert+Z in JAWS).
- **From space** shows a NASA satellite image of Bangladesh for the date you're on. **Water view** switches to a false-colour band combination where flood water shows up dark.

## Data used

Shur now uses three sources, so the story can check one against another:

| What | Source | Period | Used for |
|---|---|---|---|
| Temperature | NASA POWER `T2M` (MERRA-2 model, ~50 km grid) | 1981–2025 | The default temperature sound, and the 2026 monsoon |
| Temperature | Station thermometers: NOAA GHCN-Monthly v4 adjusted, the archive NASA GISTEMP is built from | 1981–2025, with gaps | A cross-check in the story, and an optional temperature sound |
| Rain | NASA GPM IMERG satellite rain, via NASA POWER (`IMERG_PRECTOT`) | 2001–2025 | The default rain sound and rain trend |
| Rain | NASA POWER `PRECTOTCORR` | 1981–2025 | Optional rain sound, and the 2026 monsoon |

Pick the source under **Options → Temperature data / Rain data**. The story always says which source it is using and what the other one shows.

**What the cross-check shows** (trends per decade; rain is the 2001–2025 yearly average):

| Division | POWER temperature | Nearest station with a usable record | POWER rain | IMERG rain | IMERG rain trend |
|---|---|---|---|---|---|
| Dhaka | −0.23 °C | Jessore (145 km, 25 yrs): +0.19 °C | 2,259 mm | 2,118 mm | −51 mm |
| Chattogram | −0.09 °C | Chattogram airport (13 km, 32 yrs): +0.39 °C | 3,159 mm | 3,210 mm | −21 mm |
| Sylhet | −0.04 °C | none within 150 km | 3,956 mm | 3,531 mm | +16 mm |
| Rajshahi | −0.37 °C | Bogra (94 km, 25 yrs): +0.42 °C | 1,450 mm | 1,392 mm | −122 mm |
| Khulna | −0.24 °C | Jessore (54 km, 25 yrs): +0.19 °C | 1,850 mm | 1,926 mm | −51 mm |
| Barishal | −0.11 °C | Jessore (133 km, 25 yrs): +0.19 °C | 2,975 mm | 2,329 mm | −47 mm |
| Rangpur | −0.29 °C | Bogra (100 km, 25 yrs): +0.42 °C | 2,040 mm | 2,295 mm | −167 mm |
| Mymensingh | −0.15 °C | Bogra (106 km, 25 yrs): +0.42 °C | 2,903 mm | 2,404 mm | −66 mm |

So the station thermometers show warming where POWER shows cooling, as Bangladesh Meteorological Department records do. For 2001–2025 POWER and IMERG rain are close; POWER's problem is its very dry years before 1997. None of the IMERG rain trends are statistically significant.

Limits of the station data: Bangladesh's records in the GHCN archive have big gaps (1991–2010 is mostly missing), so only three stations have 25+ usable years since 1981, and several divisions share one. A year counts if it has at least 8 months. We wanted NASA GISTEMP's own station files, but GISS's server couldn't be reached from GitHub's runners, so the script uses the GHCN archive GISTEMP is built from; it tries GISS first each run.

### Source details

- **NASA POWER** (Prediction Of Worldwide Energy Resources), NASA Langley Research Center, built on NASA GMAO's MERRA-2 reanalysis.
  - Monthly point API, 1981–2025: `T2M` (air temperature at 2 m), `PRECTOTCORR` (bias-corrected precipitation)
  - Daily point API, June–September 2026: `T2M`, `PRECTOTCORR`
  - https://power.larc.nasa.gov/
  - Daily point API, 2001–2025: `IMERG_PRECTOT` (NASA GPM IMERG precipitation), in UTC days, summed to monthly totals in `data/<division>-imerg.json`
- **NOAA GHCN-Monthly v4 adjusted (qcf)**, the station archive behind NASA GISTEMP: nearest Bangladesh station with 20+ usable years, saved as `data/<division>-gistemp.json`. https://www.ncei.noaa.gov/products/land-based-station/global-historical-climatology-network-monthly
- **NASA GIBS** (Global Imagery Browse Services) WMS:
  - `VIIRS_NOAA20_CorrectedReflectance_TrueColor` and `VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1` (2018 onward)
  - `MODIS_Terra_CorrectedReflectance_TrueColor` and `MODIS_Terra_CorrectedReflectance_Bands721` (2000–2017)
  - https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api

## How the sound is made

- **One shared scale:** every division uses the same temperature and rain range for a track (for example 24–28 °C for the yearly track), so the same note means the same temperature in Dhaka and in Sylhet, and the same rain sound means the same rainfall. An option stretches the notes to one division instead, for more detail.
- **Pitch:** temperature glides smoothly across three octaves (G3 to G6), so every 0.1 °C sounds different. An option snaps it to the 16 notes of the major pentatonic (Raga Bhupali) instead, which is more tuneful but less exact. Warmer notes are also brighter in tone.
- **Rain:** filtered noise plus raindrop clicks, louder and denser as rainfall rises (square-root scaled so dry months are still audible).
- **Bell:** the 5 hottest years, the hottest decade, or the hottest 3% of months / 5% of days.
- **Thunder:** the 3 wettest years, the wettest decade, the wettest 3% of months, or very heavy rain days.
- **Compare mode:** the comparison division plays in the right ear with a softer, reed-like tone.
- Built with the Web Audio API and the Web Speech API. No libraries.

## Method notes and limits

- "Normal" is the 1981–2010 average for the same place (and the same calendar month, for the monthly track).
- The temperature trend per decade is an ordinary least-squares slope on annual mean temperature. "Statistically significant" means the slope passes a two-sided t-test at 95%. Because one year's value is related to the next, the test first measures how strongly the leftovers from the trend line carry over from year to year (lag-1 autocorrelation) and counts fewer "effective" years to match. For NASA POWER that cuts 45 years to about 13–27, so a trend has to be clearer to count as significant.
- POWER values are averages over a grid cell about 50 km wide, not readings from a single rain gauge. Local stations can record higher rainfall extremes than these figures show.
- **POWER's temperatures trend downward for Bangladesh.** Over 1981–2025, NASA POWER's `T2M` falls in all eight divisions (for example Dhaka, about −0.23 °C per decade), while Bangladesh's weather stations have recorded warming over the same period. `T2M` comes from the MERRA-2 reanalysis model rather than from thermometers, so its long-term trend here differs from station records. Bangladesh Meteorological Department stations put 2011–2020 as the warmest decade, while POWER puts 1981–1990 or 1991–2000 first. The story now reads out the nearest station record's trend next to POWER's and explains why they differ. Where no station record is saved (Sylhet), it falls back to the BMD warning.
- **POWER's rainfall jumps around 1997.** In every division, average yearly rain from 1997 on is about 1.8–2.7 times the 1981–1996 average. A step at the same time everywhere doesn't match station records, so the rain sound now uses NASA IMERG (2001–2025) by default, and Shur warns about the jump in the story and facts. If you switch the rain back to POWER, it also warns when you reach 1997.
- The voice speaks English. If the device has a Bangla text-to-speech voice, Shur uses it for the Bangla screen text, but we don't rely on that: without one, it speaks in English and says so.

## Run it

**Live site:** https://thevinzo1.github.io/shur-claude-/

It's a static site with no build step: `index.html`, `style.css`, `app.js`. Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`). It loads data live from NASA POWER and NASA GIBS.

**Backup data:** if NASA POWER can't be reached, Shur falls back to saved copies in `data/`, named `<division>-monthly.json` and `<division>-monsoon2026.json` (for example `data/dhaka-monthly.json`). The same script also writes the IMERG and station files (`<division>-imerg.json`, `<division>-gistemp.json`), which the app reads only from `data/`. The **Refresh NASA backup data** GitHub Action (`.github/workflows/refresh-data.yml`) downloads them every Monday and can be run by hand from the Actions tab. To refresh locally instead, run `node scripts/fetch-data.mjs` (Node 18+).

## Team

Team Nyopus, BRAC University, Dhaka.
