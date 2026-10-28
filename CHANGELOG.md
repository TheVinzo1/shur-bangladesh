# Changelog

## Mentor follow-ups, round 2 (October 2026)

- **Fairer significance test.** Trends are now tested with an effective number of years that allows for neighbouring years being related (lag-1 autocorrelation), as our mentor answers admitted the old test didn't. NASA POWER's cooling is now significant in 4 divisions (Dhaka, Rajshahi, Khulna, Rangpur) instead of 7. The station warming stays significant everywhere it exists.
- **One live-site link everywhere:** https://thevinzo1.github.io/shur-bangladesh/.

## Data sources fix (October 2026)

- **Rain now comes from NASA GPM IMERG satellite data (2001–2025) by default.** NASA POWER's rain jumps around 1997 in every division, so it's no longer the default. You can still switch back under Options → Rain data.
- **Station thermometers added as a temperature cross-check.** These are records from the nearest Bangladesh weather station in NOAA GHCN-Monthly v4, the archive NASA GISTEMP is built from. They show warming (+0.19 to +0.42 °C per decade) where POWER shows cooling. You can also play them under Options → Temperature data.
- **The story names its sources.** It says which source each number comes from, reads out what the other source shows, and explains why the model and the thermometers disagree.
- **New facts:** the cross-check trend with how many years of data it has, the IMERG rain trend, and the POWER rain jump.
- **The caption, table and CSV name the source** of the temperature and rain being played.
- **Missing rain is now spoken as "No rain data"** instead of a blank number.
- **The fetch script** (`scripts/fetch-data.mjs`) also saves `data/<division>-imerg.json` and `data/<division>-gistemp.json`. It tries NASA GISS first and falls back to GHCN.

Known limits: Sylhet has no usable station record within 150 km, so it uses POWER only. Station records have gaps, mostly 1991–2010. Three stations cover seven divisions, up to 145 km away. NASA GISS's server couldn't be reached from GitHub's runners.

## Mentor follow-ups (October 2026)

- Compare two divisions (left and right ear, with the difference spoken), a Decades track and the warmest decade, one shared sound scale, smooth pitch, spoken data warnings, a screen-reader mode, the T key for tracks, and no more claims that the voice speaks Bangla.
