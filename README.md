# Shur (সুর) · Hear Bangladesh's climate

**NASA Space Apps Challenge 2026 · Challenge: The Earth Information Jukebox · Team Nyopus (BRAC University, Dhaka)**

Shur turns 45 years of NASA climate data for Bangladesh into sound. Pick one of the eight divisions and press play: every note is a year (or a month, or a day), higher notes mean hotter, and the sound of rain grows with how much it rained. The hottest years ring a bell, and the wettest months bring thunder.

Most climate data reaches people as charts, and a chart is useless to someone who can't see it. Bangladesh has more than half a million blind people (national surveys: about 650,000 blind adults aged 30+ in 2000, and 1% of adults over 40 in 2013) and millions more with low vision. Shur is built so they can hear the climate changing: it speaks in Bangla and English, works entirely from the keyboard, and every number is also available as a table and a CSV file.

## Tracks

| Track | What each note is | What you hear |
|---|---|---|
| **45 years** | One year, 1981–2025 | The melody follows each year's average temperature. A dashed trend line and a statistical test show whether there is a real long-term trend. |
| **Every month** | One month, 1981–2025 (540 notes) | Pitch is the month's temperature *compared with its 1981–2010 normal*, so you hear change instead of seasons. Rain pulses with every monsoon. |
| **Monsoon 2026** | One day, June–September 2026 | The 2026 monsoon, day by day. Days with very heavy rain (89 mm or more, the Bangladesh Meteorological Department threshold) bring thunder. |

## How to use it

- **Space** play / pause · **← →** step one note · **1–8** choose a division · **S** tell the story · **R** read the current note aloud
- **Tell me the story** reads a plain-language summary: the temperature trend per decade, whether it's statistically significant, the hottest year, the wettest month.
- **From space** shows a NASA satellite image of Bangladesh for the date you're on. **Water view** switches to a false-colour band combination where flood water shows up dark.

## NASA data used

- **NASA POWER** (Prediction Of Worldwide Energy Resources), NASA Langley Research Center, built on NASA GMAO's MERRA-2 reanalysis.
  - Monthly point API, 1981–2025: `T2M` (air temperature at 2 m), `PRECTOTCORR` (bias-corrected precipitation)
  - Daily point API, June–September 2026: `T2M`, `PRECTOTCORR`
  - https://power.larc.nasa.gov/
- **NASA GIBS** (Global Imagery Browse Services) WMS:
  - `VIIRS_NOAA20_CorrectedReflectance_TrueColor` and `VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1` (2018 onward)
  - `MODIS_Terra_CorrectedReflectance_TrueColor` and `MODIS_Terra_CorrectedReflectance_Bands721` (2000–2017)
  - https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api

## How the sound is made

- **Pitch:** temperature mapped onto a five-note scale (the major pentatonic, the same notes as Raga Bhupali) across three octaves. The scale is stretched to the range of the place and track you've chosen, so small changes are audible. Warmer notes are also brighter in tone.
- **Rain:** filtered noise plus raindrop clicks, louder and denser as rainfall rises (square-root scaled so dry months are still audible).
- **Bell:** the 5 hottest years, or the hottest 3% of months / 5% of days.
- **Thunder:** the 3 wettest years, the wettest 3% of months, or very heavy rain days.
- Built with the Web Audio API and the Web Speech API. No libraries.

## Method notes and limits

- "Normal" is the 1981–2010 average for the same place (and the same calendar month, for the monthly track).
- The temperature trend per decade is an ordinary least-squares slope on annual mean temperature. "Statistically significant" means the slope's t-statistic is above 2.02 (two-sided, 95%, 43 degrees of freedom).
- POWER values are averages over a grid cell about 50 km wide, not readings from a single rain gauge. Local stations can record higher rainfall extremes than these figures show.
- **POWER's temperatures trend downward for Bangladesh.** Over 1981–2025, NASA POWER's `T2M` falls in all eight divisions (for example Dhaka, about −0.23 °C per decade), while Bangladesh's weather stations have recorded warming over the same period. `T2M` comes from the MERRA-2 reanalysis model rather than from thermometers, so its long-term trend here differs from station records. Shur plays and reports the data as NASA POWER gives it, and says so in the story whenever the trend is a cooling one.
- Bangla narration needs a Bangla text-to-speech voice. Microsoft Edge and Chrome on Android have one. Without it, Shur speaks in English and says so.

## Run it

**Live site:** https://thevinzo1.github.io/shur-bangladesh/

It's a static site with no build step: `index.html`, `style.css`, `app.js`. Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`). It loads data live from NASA POWER and NASA GIBS.

**Backup data:** if NASA POWER can't be reached, Shur falls back to saved copies in `data/`, named `<division>-monthly.json` and `<division>-monsoon2026.json` (for example `data/dhaka-monthly.json`). The **Refresh NASA backup data** GitHub Action (`.github/workflows/refresh-data.yml`) downloads them every Monday and can be run by hand from the Actions tab. To refresh locally instead, run `node scripts/fetch-data.mjs` (Node 18+).

## Team

Team Nyopus, BRAC University, Dhaka.
