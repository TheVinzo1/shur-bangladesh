# Use of AI in Shur

Space Apps allows AI tools as long as teams name them, explain how they were used, and show their own work. This file is our record.

> **Team: check before submission.** Fill in the parts marked "confirm", and match the wording of the official Space Apps submission guide when it is published (13 November 2026).

## Tools

- **Claude (Anthropic), used through Claude Code**: an AI coding assistant. We used it to write and fix code, check our data, and draft documents.
- No AI runs inside Shur itself. The app has no language model: every sound, number and sentence it speaks comes from fixed rules and NASA data in `app.js`.

## What the AI did

- **Code:** drafted and revised parts of `app.js`, `index.html`, `style.css` and `scripts/fetch-data.mjs`, including compare mode, the Decades track, the shared sound scale, the NASA IMERG and station-temperature data, the trend significance test, the voice-key fixes, the on-screen sound rules and the offline demo mode. *(Confirm: how much of the first version, from 10 October, was AI-assisted.)*
- **Data checks:** recalculated trends from our NASA files, which is how we found that NASA POWER's temperature trend disagrees with station records and that its rainfall jumps around 1997.
- **Documents:** helped draft our answers to our mentor, the README, and our reports, and suggested corrections to claims we couldn't back up.

## Our prompts (summarised)

We asked in plain language, for example:

- "Turn 45 years of NASA climate data for Bangladesh into sound that a blind person can use." *(confirm wording)*
- "Fix and push the changes we promised our mentor in our answers."
- "Fix the data sources too and tell us what changed."
- "The R and S keys don't work. Fix them."
- "Follow the Space Apps build guide: licence, AI disclosure, show the sound rules, offline demo."

## Our own work

- **The idea and who it's for:** Shur comes from our work on Dristi.ai, an AI assistant for blind people. We chose blind and low-vision people in Bangladesh as the main users, and decided the app must work fully without seeing it.
- **Decisions:** which data to trust, what to fix after mentor feedback, what Shur should say when sources disagree, and the before/after test design.
- **Checking and testing:** we reviewed and tested every change, and we run the sessions with blind and low-vision users ourselves.
- **Outreach and media:** contacting associations, training their staff, filming and editing our videos.
- **Bangla:** *(confirm: who wrote or checked the Bangla text)*

## Data

Every number comes from NASA POWER, NASA GPM IMERG (via POWER), NOAA GHCN-Monthly station records (the archive NASA GISTEMP is built from), and NASA GIBS imagery. See the README for dataset names and links.
