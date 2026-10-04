# SweatShell

SweatShell is a **motorised roller** mounted at the top of a shed or roof, holding a food-grade, biodegradable sheet that works like skin:
- A **reflective eggshell coating** on top bounces sunlight away
- A **seaweed hydrogel layer** underneath holds water and evaporates it, actively pulling heat out of the roof, the way sweat cools skin

Once the sheet is rolled out and soaked, it keeps cooling with **no electricity**, so it still works through the blackout-plus-heatwave combination that causes the most harm.

An ESP32 sensor system runs the whole cycle:
- **Rolls out** when it gets hot, and **rolls away** when it cools down, so there's no winter penalty like permanent paint
- **Auto top-up:** while the sheet is out, a moisture sensor tops up the gel with short pulses of water whenever it starts to dry out, never running continuously like a sprinkler
---

## Who it is for

Livestock sheds are our first market, because heat stress costs farmers real money. The same sheet protects people in heat-vulnerable buildings, such as older, isolated residents, school demountables and aged care, making it a dual-impact solution built on one low-cost mechanism.

Why not the existing fixes:

| | Problem |
|---|---|
| Wetting roofs by hand | Needs someone there all day |
| Fixed sprinklers | Need constant power and water; stop in a blackout |
| Cool-roof paint | Permanent, so it keeps the building cold in winter too |

Cool-roof paint is a levee: always on. SweatShell is a sandbag: out for the heatwave,
packed away after.

---

## What we built and what it did

Two identical model houses — craft wood walls, aluminium foil single-slope roofs
(15–20°, like a shed) — side by side, same orientation. House 1 bare; House 2 with
the roller, sheet, pump and sensors. Positions swapped and the run repeated, so it is
the sheet being measured and not the spot.

Three DS18B20 probes: inside House 1, inside House 2, and outside air in the shade.

**Result: when the air passed the set threshold the sheet rolled out by itself, and
the SweatShell house stayed about 1–1.5 °C cooler inside than the bare house.**

A DS18B20 reads to about ±0.5 °C, so that gap is real but not large — and these are
model houses under sun and a heat lamp, not a shed in February.

---

## What you see in the app

One screen, built for a phone, because that is what a farmer checks.

- **The temperature inside**, in the middle — the number the product exists to change.
- **Manual or Auto**, as a two-way switch. Auto hands the decision to the roof unit's
  own thresholds. It watches the air *outside*, which warms before the building does,
  so the sheet is already out when the heat arrives.
- **Where the sheet is**, in words, taken from the device's own report — so it stays
  true when nobody has pressed anything.
- **Roll out / Roll up / Water now**. Touching any of them takes control back.
- **Auto top-up**: while the sheet is out, the moisture sensor triggers short pulses
  of water when the gel dries past a threshold. Short pulses, not a running sprinkler.
- **A schedule**, if you want hours instead of temperatures — daily, weekly, monthly.
- **Rough-weather roll-up**, so the sheet is not out in a storm that would tear it.
  This runs off a **wind-gust forecast**, not a wind sensor. There is no wind or rain
  sensor on the rig yet.

---

## Running it

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

`--reload` matters. The browser picks up a `git pull` by itself; the backend does
not. Without it you get a new page talking to an old API, buttons that do nothing,
and no clue why.

### Connecting to the roof unit

The device prints its address on the serial monitor at boot. Open that address in a
browser first — the firmware serves its own page there. If that page does not load,
the problem is wifi, not this backend.

The address is editable in the app under **Automatic → Connection**. If you do not know it:

```bash
cd backend && .venv/bin/python find_device.py --set
```

That knocks on every address on the subnets this laptop is already on, and reports
which one answers with a SweatShell reading.

**Both have to be on the same wifi.** On a phone hotspot the phone is `172.20.10.1`
and hands out `.2` upward to everything that joins, laptop included — so an address
read off the laptop's own network settings looks exactly like the unit's and will
never answer.

### Without the hardware

`backend/fake_esp.py` serves the firmware's JSON shape on a local port, so the whole
app runs with no rig on the bench. `backend/simulate.py` fills the charts.

Every reading the simulator writes is tagged `sim`, and the app's main screen never
charts it — but the app does not announce that the data is invented, so say it out
loud.

---

## Showing it to other people

### A live link, while the rig is running

Judges are not on your hotspot. Nothing has to move: the roof unit stays where it is,
the laptop stays on the hotspot polling it, and a tunnel gives the backend's port a
public HTTPS address.

```bash
cd frontend && npm run build
./share.sh
```

It prints a `https://….trycloudflare.com` link. Free, no account; `cloudflared` is
the only thing to install. `share.sh` checks whether the roof unit is answering
*before* anyone looks — a tunnel to a backend that lost its device shows a frozen
screen, which is worse than no demo.

The laptop has to stay awake with that window open, and the URL changes every run.

### A link that works with nothing running

For a judge opening the link at midnight, the app also builds in **demo mode**:
`frontend/src/demo.js` answers the same calls, out of a model running inside the
page. Every button works, the numbers move, the chart fills. Static hosting — nothing
to keep awake and nothing to reach.

```bash
cd frontend && npm run dev:demo      # look at it locally, on :5173
cd frontend && npm run build:demo    # dist/ is then self-contained
```

Use `dev:demo`, not `dev`. `npm run dev` is the *live* build and has none of this in
it — checking the demo with `dev` looks exactly like the demo being broken.

The numbers are invented and the app says so: a **DEMO DATA** badge sits in the
header on every screen with no way to dismiss it.

**Pushing the air outside.** Auto is a thermostat, and a thermostat does nothing
until the air crosses a number. So in the demo build the **Outside** reading has a
`−` and a `+` beside it. Each tap moves the air 1.5 °C and holds it there. Warm it
past **Roll out above** and the sheet goes out by itself.

What runs is the roof unit's own rule, reading the thresholds in the Automatic
column. Set **Roll out above** to 35 and the same taps do nothing until the air
reaches 35 — which is the part worth showing, because it is the part that is real.

**The clip.** On the desktop layout the left panel plays footage of the hardware
doing whatever the roof unit is doing right now — roll out, roll up, pump. Drop the
files in and they appear; the names are the wiring:

```
frontend/public/clips/roll-out.mp4
frontend/public/clips/roll-up.mp4
frontend/public/clips/water.mp4
frontend/public/clips/idle.mp4
```

### Deploying the demo to Vercel

1. **Add New → Project**, import the repository.
2. **Root Directory: `frontend`.** This is the only setting that matters and the one
   people get wrong — Vercel otherwise looks at the repo root, finds no
   `package.json`, and fails.
3. Leave everything else alone. `frontend/vercel.json` already sets the demo build.
4. Deploy. Every push to `main` redeploys.

**Live data cannot be deployed, by any host.** The roof unit sits on a phone hotspot
with a private address; no server on the internet has a route to it. It would mean
inverting the firmware so the device pushes outward — `/api/reading` and
`/api/sheet/command` are there for exactly that — and a host that runs a process
continuously, which Vercel does not.

---

## How the pieces fit

```
   ESP32 (HTTP server)  ──/data──►  bridge.py  ──►  SQLite  ──►  /api/home  ──►  app
         on the roof    ◄──/cmd───   polling
```

The firmware is a **server**: it holds the sensors and the motor and answers
requests. The app is a **client** that wants to be told things. `backend/bridge.py`
is the only file that speaks both vocabularies. Everything else on either side is
written as if the other did not exist.

Polling, not sockets. A dropped poll is two seconds of staleness; a dropped socket on
venue wifi is a dead screen.

### One controller, not two

The roof unit's thresholds and the app's schedule are **alternatives, not layers**.
While the device is deciding, the schedule stands down entirely — otherwise the clock
rolls the sheet out at 8am and the thermostat rolls it straight back up because the
morning is still cool, and neither of them is wrong.

Thresholds live on the roof unit, so they survive the app being closed. The app
writes them through and then **checks the device's own readback**, because a setting
that reads as saved and is not is worse than one that refuses.

---

## What is measured, and what is not

Judges ask this, and the honest answer is short.

**Measured, by a sensor:**

| On screen | Source |
|---|---|
| Temperature inside | DS18B20 |
| Outside | DS18B20 |
| Sheet out / rolled up | the firmware's roller state |
| Watering | the firmware's pump state |

**Not measured — derived from constants nobody has calibrated yet:**

- **Water percent.** The moisture sensor is real; turning its raw reading into a
  percentage depends on `moist_dry_raw` / `moist_wet_raw` in the firmware, which need
  calibrating in actual gel.
- **Litres used today.** Water percent converted to a gel mass against
  `gel_full_mass_g` / `gel_dry_mass_g`, which ship as defaults. Until someone weighs
  the pad wet and dry, this and everything from it is a placeholder.
- **Days to next check.** A 90-day countdown, not the result of a durability test.
- **The forecast.** Live from Open-Meteo when `forecast_source` says `live`. When it
  says `sample`, the weather is a built-in sample and the storm warning means nothing.
  The app says which.

Calibrate the gel mass with your two weighings:

```bash
curl -X PATCH localhost:8000/api/config -H 'Content-Type: application/json' \
  -d '{"gel_dry_mass_g": 0, "gel_full_mass_g": 0}'
```

A DS18B20 reads to about ±0.5 °C. Any claim resting on a smaller difference than that
is the sensors disagreeing, not the product working.

---

## Repository

```
backend/
  main.py          API, schedule, protective roll-up, serves the built frontend
  bridge.py        the only file that speaks both the device's and the app's dialects
  db.py            SQLite, one locked connection, readings tagged by source
  forecast.py      Open-Meteo, with cache and sample fallback
  fake_esp.py      stand-in for the roof unit, speaking its exact JSON
  simulate.py      invented data for a dead bench, tagged "sim"
  find_device.py   finds the roof unit on the local subnets
frontend/
  src/api.js       every call the app makes, live or demo
  src/demo.js      the model that answers them when there is no backend
  src/components/  React, hand-drawn SVG charts, no chart library
  public/clips/    the footage the desktop panel plays
firmware/          Arduino sketches (see note below)
tests/             schedule logic, device settings, the home window, db concurrency
share.sh           puts the live rig on a public URL
```

```bash
cd backend
.venv/bin/python ../tests/test_schedule.py
.venv/bin/python ../tests/test_device_settings.py
.venv/bin/python ../tests/test_home_window.py
.venv/bin/python ../tests/test_db_concurrency.py
```

**Note on `firmware/`.** The sketches in here are from an earlier design — eight
temperature probes, a load cell and a humidity sensor, with the device POSTing to the
backend. The rig that was actually tested runs the opposite way: the ESP32 is an HTTP
server, with one probe per house plus one outside, and no load cell or humidity
sensor. Read `backend/bridge.py` for the shape the device actually speaks.

---

## Hardware, software and AI tools

**Hardware**

| Part | What it is |
|---|---|
| ESP32 | NodeMCU-32S, run off a USB power bank |
| Temperature | 3 × Jaycar **XC3700** (DS18B20) — inside House 1, inside House 2, outside in shade |
| Gel water level | Jaycar **XC4604** Duinotech soil-moisture module, on House 2's roof under the sheet |
| Roller motor | Jaycar **XC4458** — 28BYJ-48 5 V geared stepper + ULN2003 driver |
| Pump | Small 3–6 V submersible pump on its own battery box, switched by a relay module; drip tube along the top edge |
| Roller core | A4 paper rolled tight inside a wide bubble-tea straw, taped waterproof; bamboo-skewer axle in a support block |
| Houses | Two identical models — craft wood walls, aluminium foil roofs, single slope |
| Also | Heat lamp, breadboard, jumper wires |

Stepper wiring (ULN2003 → ESP32): IN1 → GPIO 25, IN2 → GPIO 26, IN3 → GPIO 27,
IN4 → GPIO 14, + → 5V, − → GND. 2048 steps is one full turn; keep the speed between
5 and 12 RPM, and drive all four pins LOW after each move so the coils stop heating.

The motor is weak — about 3 N·cm. A thin roller core is deliberate: less torque
needed, at the cost of bending the gel harder.

**Materials**

- Sodium alginate (seaweed) powder — 2% solution
- Glycerol, so the gel flexes instead of cracking on the roller
- Calcium chloride, sprayed on to set each layer
- Eggshell powder (calcium carbonate) — the reflective top coat
- White cloth base

**Software**

| Part | Built with |
|---|---|
| Backend | Python, FastAPI, Uvicorn, Pydantic, httpx, SQLite |
| App | React 18, Vite |
| Charts | Hand-drawn SVG — no chart library |
| Firmware | Arduino IDE with the Espressif ESP32 board package. Libraries: OneWire, DallasTemperature, WiFi, WebServer, Preferences |
| Weather | Open-Meteo (free, no key) |
| Hosting | Vercel for the demo build; Cloudflare quick tunnels for the live rig |

`WebServer` is why the ESP32 is the server in the diagram above, and `Preferences` is
why thresholds survive a reboot: they are written to the device's own flash, not held
in the app.

**AI tools**

- **Claude (Anthropic)** — used to help write and debug the ESP32 firmware, plan the
  wiring, troubleshoot hardware faults, and generate the web app.

**References**

Research references and sources are in a separate PDF with the submission.

---

## What's next

- Full-size trials on a real shed, not model houses.
- **Limit switches on the roller.** Not built yet, and the first thing to add: a motor
  that does not know where the end is will tear the sheet off its mounting.
- Rain and wind *sensing*, so it rolls away before a storm instead of trusting a
  forecast.
- A winter "black layer" that absorbs heat in cold months.
- Calibrating the gel mass and the moisture sensor, so the water figures mean
  something.

---

## Safety

Water and electricity share a roof here. Nothing on this rig touches mains voltage:
the stepper runs at 5 V off the ESP32's power bank, and the pump at 3–6 V from its
own battery box. Keep the ESP32, the battery box and the power bank in a sealed
plastic box, well away from the drip tube.

**The roller has no limit switches.** It counts steps from a home position you set by
hand — roll the sheet fully up before each run. Until limit switches exist, do not
leave it driving unattended: a motor that does not know where the end is will tear
the sheet off its mounting.

The gel is sodium alginate and calcium chloride — food-industry chemistry, not a
hazard. But a wet sheet is heavy and a roof is a roof: fix the mounting to the
structure, not to the tiles.

---

## Team
We're a cross-disciplinary team of university students from Australia and New Zealand, combining IT, IoT and biochemistry.

- **Triet (Tony) Le** (IT, Melbourne): project coordination. Tony kept the team on track across time zones, planned the build and testing schedule.
- **Thao (Iris) Huynh** (IT, Melbourne): roller mechanism. Iris built and mounted the motorised roller, wired the stepper motor to the ESP32, and tuned the roll-out length, speed and strength so the sheet deploys reliably.
- **Tam (Oliver) Tran**: web app. Oliver built the live dashboard with a React frontend and Python backend, hosted on Vercel, showing temperatures, gel water level and the event log.
- **Vacha Patel** (biochemistry, New Zealand): seaweed gel recipe. Vacha developed the gel formula, testing ratios of sodium alginate, calcium chloride and glycerol until the gel set firmly, held water and stayed flexible enough to roll.

Tony, Iris and Oliver built the IoT system together, wiring the sensors, relay and pump, and made the sheet by hand, applying the gel layers and the eggshell coating.
