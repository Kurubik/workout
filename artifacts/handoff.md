# WORKOUT//INDEX — handoff

Standalone public exercise catalogue, extracted from the exercise-library slice of the source
project and delivered as an independent static PWA.

- **Public URL:** <https://workout.xtr.sh>
- **Repository:** <https://github.com/Kurubik/workout> (branch `main`)
- **Release commit:** `e951e46f37ac821cfa606bd72fdb74e633d6c01d`
- **Verified:** 2026-09-25, UTC

---

## 1. Contracts

### Source (read-only reference)

`/root/.openclaw/workspace/cyber-gym` — inspected, never written to (`git status` clean before
and after; the tree was left byte-identical).

Audited source modules consumed:

| Source path | What was taken |
|---|---|
| `frontend/src/lib/exercises-data.js` | 1324 built-in exercises (`id,n,bp,eq,tg,mg,sm,img,gif`) |
| `frontend/src/lib/exercise-muscle-batch-1.json` + `exercise-muscle-olympic.json` + `exercise-muscle-batch-2.json` | 239 corrected muscle overlays (`bp`, `primaries`, `secondaries`) |
| `frontend/src/lib/exercises.js` | catalogue composition (raw + overlay), secondary-muscle additions, typo-tolerant search behaviour |
| `frontend/src/lib/muscles.js` | muscle alias vocabulary and display names |
| `frontend/src/locales/ru.js` | Russian facet/UI vocabulary (only the strings actually rendered) |
| `frontend/src/instr/ru.js` | complete Russian instruction pack, 1324 entries |
| `frontend/src/assets/fonts/*` | IBM Plex Sans + JetBrains Mono WOFF2 subsets and their OFL texts |
| `LICENSE`, `NOTICE.md` | licence and attribution contract |

Behaviour reference only (not copied): `frontend/src/views/Library.jsx`,
`frontend/src/components/Media.jsx`, the `ExerciseDetail` section of `frontend/src/sheets.jsx`.

Deliberately **not** taken: the full app shell, store, native/Capacitor code, API, MCP, coach,
QR/admin, body-map geometry, other locales, English instruction pack, media files.

### Target (created)

- New repository `/root/.openclaw/workspace/workout`, canonical branch `main`.
- Remote `git@github.com:Kurubik/workout.git`, `git ls-remote` **empty before the first write**
  (verified twice: at recon and again immediately before push). No `develop` branch exists —
  `git ls-remote --heads origin develop` returned nothing, so `main` is the canonical branch and
  no integration branch was required.

---

## 2. Architecture and deliberate exclusions

```
src/data/    exercises.json (1324) · muscle-overlays.json (239) · instructions.ru.json (1324) · facets.ru.json
src/lib/     catalogue.js · muscles.js · filters.js · media.js · i18n.js · meta.js · session.js · pwa.js
src/views/   Catalogue.jsx · Exercise.jsx
src/components/ Thumb.jsx · Media.jsx
src/styles/theme.css (DAEMON CRT)
scripts/     extract-source-data.mjs · build-sw.mjs · make-icons.py · verify-browser.mjs
deploy/      nginx.conf · workout.caddy
```

- **Deterministic data extraction.** `scripts/extract-source-data.mjs` reads the audited source
  modules and writes the four JSON packs. It is reproducible (byte-identical on re-run) and
  fails loudly on schema drift, on an exercise without Russian instructions, or on a facet
  without a Russian name.
- **Russian-first, English names.** The dataset has no Russian name pack; machine-transliterating
  1324 names would invent data, so names stay canonical English while body part, equipment,
  muscles, labels and all instructions are Russian.
- **Search** is multi-token, accent- and case-insensitive, with one-edit tolerance for long
  name tokens only. The corpus covers English names, Russian facets and Russian instructions.
  Ranking puts a name hit above a facet hit above an instruction-only hit.
- **URL contract:** `/?q=&body=&muscle=&equipment=`. Parsing validates every facet and drops
  stale values; filters push history, typing replaces, and list depth + scroll are restored from
  `sessionStorage` when coming back from an exercise.
- **Scope exclusions (by design, verified absent):** no plans, routines, sessions, history,
  records, favourites, profile, account, authentication, custom exercises, AI, payments, API,
  server-side database or admin surface. The only interactive state is search/filters, the media
  still/animation toggle and a copy-link control.
- **Media is not distributed.** Images/animations load from the pinned upstream CDN commit
  (`…exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/{images,videos}/`). Nothing is
  in Git, in the image, or in the service-worker cache (asserted by the SW shell list check).

---

## 3. Verification — exact commands and results

### 3.1 Unit / component tests

```
$ npm test
Test Files  5 passed (5)
     Tests  60 passed (60)
exit=0
```

Covers: overlay application and raw-dataset immutability, primaries/secondaries derivation,
instruction coverage for all 1324 ids, facet derivation and ordering, search (English name,
Russian facets, Russian instructions, typo tolerance, short-token non-loosening, ranking),
URL round-trip and invalid-value dropping, filter composition, media URL pinning, the media
state machine (no retry loop), media/thumb rendering including the no-media case.

### 3.2 Clean build

```
$ npm run build
dist/index.html                     1.32 kB │ gzip:   0.70 kB
dist/assets/index-U20x1tLj.css     11.00 kB │ gzip:   3.06 kB
dist/assets/index-CBsj4Vjj.js   1,612.95 kB │ gzip: 236.55 kB
build-sw: cache workout-index-917d67f1fbbb, 14 shell files
exit=0        (0 chunk-size warnings after the deliberate limit raise)
```

### 3.3 Fresh-checkout reproducibility

```
$ git clone <local workout repo> /tmp/wi-fresh2/repo && cd /tmp/wi-fresh2/repo
cloned HEAD=e951e46f37ac821cfa606bd72fdb74e633d6c01d   (clean tree)
$ npm ci     -> exit 0 (52 packages from lockfile)
$ npm test   -> exit 0   Test Files 5 passed (5) / Tests 60 passed (60)
$ npm run build -> exit 0
   build-sw: cache workout-index-917d67f1fbbb, 14 shell files
   assets: index-CBsj4Vjj.js index-U20x1tLj.css     <- identical filenames to the verified tree
```

The fresh clone produces the same asset hashes and the same service-worker fingerprint as the
deployed artifact.

### 3.4 Browser verification of the built artifact

`scripts/verify-browser.mjs` (Playwright 1.61.1 / chromium-1228, not a repository dependency).
Run twice — against the local preview of `dist/` and against the live public origin:

```
$ PLAYWRIGHT_MODULE=… BASE_URL=http://localhost:4173 node scripts/verify-browser.mjs
51/51 checks passed                                  exit=0
$ PLAYWRIGHT_MODULE=… BASE_URL=https://workout.xtr.sh node scripts/verify-browser.mjs
51/51 checks passed                                  exit=0
```

Recorded checks (all PASS):

| Area | Evidence |
|---|---|
| Catalogue 390/1440 | HTTP 200, 36 cards per page, count `1324`, thumbnails `loading=lazy` |
| Detail 390/1440 | direct deep link 200, title `3/4 sit-up — техника выполнения \| WORKOUT//INDEX`, 5 Russian steps, labelled `часть тела` / `инвентарь`, hard-refresh keeps route |
| 320 px | `scrollWidth === innerWidth` on catalogue and detail (no horizontal overflow) |
| Search / filter / back-forward | `?q=bench+press` → `&body=chest`, 33 results, selected chip `aria-pressed`, back restores URL **and** input text, forward returns, clear-all empties the query string |
| Missing media | CDN blocked → `Медиа недоступно`, instructions still render, 0 broken images left |
| Keyboard / a11y | Tab reaches input and chips, focused chip outline `solid 2px`, 57 chips with `aria-pressed` |
| Reduced motion | monitor sweep `display: none`, theme stays readable |
| Fonts (CDP) | `.steps li` painted by `IBM Plex Sans` (`isCustomFont: true`, 58 glyphs); `.fact dt` by `JetBrains Mono` (`isCustomFont: true`); both families loaded and `document.fonts.check` covers Cyrillic; mono advance width for `Мышцы` == `Muscl` (50 px) |
| Service worker | activates on warm visit (`/sw.js`), creates cache `workout-index-917d67f1fbbb` |
| Offline | with the network down, `/exercise/0001` resolves to the cached shell (200) and the catalogue renders |
| Scope | no tracker/account affordances found in the rendered text |

Screenshots captured and visually inspected; a representative set is committed under
`assets/screenshots/` and embedded in the README: `catalogue-mobile.png`, `catalogue-desktop.png`,
`detail-mobile.png`, `detail-desktop.png`, `catalogue-320.png`, `catalogue-reduced-motion.png`.

### 3.5 Docker

```
$ docker compose config -q          -> OK
$ docker compose build              -> OK
$ docker compose up -d              -> container recreated with the final image
$ docker ps                         -> workout-xtr-app  workout-xtr:1.0.0  Up (healthy)
image id                            sha256:eb3fbbc8…
inspect: read_only=true  cap_drop=[ALL]  no-new-privileges:true
         restart=unless-stopped  port bindings={}   (no host ports)
         networks: girl-xtr_girl_edge, aliases [workout-xtr-app, app, workout-app]
$ docker compose ps / healthcheck    http://127.0.0.1:8080/healthz
from the edge: docker exec girl-xtr-caddy-1 wget -qO- http://workout-app:8080/healthz  -> ok
```

Deep link and asset-404 behaviour, proven **from inside the shared proxy**:

```
http://workout-app:8080/exercise/0001  -> 200, SPA shell (id="root")
http://workout-app:8080/assets/nope.js -> 404 (the shell does NOT swallow real asset 404s)
```

Origin cache contract (verified from the edge container):
`/index.html` → `no-store`; `/manifest.json` and `/sw.js` → `no-cache` + `Service-Worker-Allowed: /`;
`/assets/*` and `/fonts/*` → `public, max-age=31536000, immutable`.

### 3.6 Container and shared edge

- Edge inspected read-only **before** any change: `girl-xtr-caddy-1`, external network
  `girl-xtr_girl_edge` (subnet `172.20.0.0/16`), sites glob `/opt/obsidian-livesync/caddy/*.caddy`
  imported via `import /etc/caddy/sites/*.caddy`, global `admin off` (so no in-place reload).
- The Cloudflare allowlist was copied **programmatically** from a live sibling
  (`grep -m1 'not remote_ip' mangal.caddy`), not retyped; it matches the live proxy's own list
  (22 entries, diff clean).
- Fragment written: `/opt/obsidian-livesync/caddy/workout.caddy`, mode `0644`, owner `root:root`,
  size 1398, sha256 `6429c4af83065ad3b061245f5a7018a5a2db1ead8f7b1cb8873aca7ce6a6ab01`.
  Matching version-controlled copy: `deploy/workout.caddy`. No basic auth (public app).
- Validation in a **throwaway** container of the same image on the same network, importing the
  whole sites directory: `Valid configuration` (exit 0), with the expected
  `Unnecessary header_up X-Forwarded-Proto` warning that the plan's fragment shape produces.
  The live proxy was untouched at that point (`restarts=0`, original start time).
- One controlled restart of **only** `girl-xtr-caddy-1`
  (`docker compose -f /root/.openclaw/workspace/girl-xtr/compose.yaml restart caddy`):
  `started 2026-09-23T09:20:29Z → 2026-09-25T12:44:15Z`, `restarts=0`. Sibling fragments kept their
  original mtimes and sibling containers were not restarted or recreated (see §3.8).

### 3.7 DNS and public HTTPS

Zone `xtr.sh` (id `97e4d0dd0608847cfa3f9463d2077557`) proven via the Cloudflare API using
`CLOUDFLARE_API_TOKEN` resolved from Infisical through
`/root/.openclaw/bin/infisical-secret-ref-resolver.mjs`. The token value was never printed,
logged, or passed on a command line.

Origin and proxy setting were read from the live sibling rather than assumed:
`girl.xtr.sh A → 89.167.56.86, proxied: true`.

Created exactly one record:

```
workout.xtr.sh  A  89.167.56.86  proxied=true  ttl=1  id=d79bdfc2a565be15eed9a97f1ac1df14
```

Public probes after the proxy restart:

```
https://workout.xtr.sh/                 HTTP 200  text/html
https://workout.xtr.sh/healthz          HTTP 200  text/plain  -> "ok"
https://workout.xtr.sh/exercise/0001    HTTP 200  text/html   (SPA shell)
https://workout.xtr.sh/manifest.json    HTTP 200  application/json
https://workout.xtr.sh/sw.js            HTTP 200  application/javascript
https://workout.xtr.sh/assets/index-CBsj4Vjj.js  HTTP 200
<title>WORKOUT//INDEX — каталог упражнений</title>
```

The origin refuses direct (non-Cloudflare) access by design: a direct TLS request to the origin
with `Host: workout.xtr.sh` is reset by the proxy, as the sibling sites are.

### 3.8 Sibling regression

All five sibling sites were healthy before and after, at their expected status:

| Host | Status | Meaning |
|---|---|---|
| `girl.xtr.sh` | HTTP 200 | unchanged |
| `fuel.xtr.sh` | HTTP 200 | unchanged |
| `mangal.xtr.sh` | HTTP 401 | basic-auth gate, unchanged |
| `look.xtr.sh` | HTTP 401 | basic-auth gate, unchanged |
| `livesync.xtr.sh` | HTTP 401 | CouchDB auth, unchanged |

Containers: `girl-xtr-app-1`, `fuel-xtr-app`, `mangal-xtr-app`, `livesync-couchdb`,
`look-scanner-preview-gateway-1`, `look-scanner-preview-sidecar-1` — all `running`, with unchanged
start times and `restarts=0` before and after. No sibling container was restarted or recreated;
no sibling volume, fragment or DNS record was touched.

### 3.9 Tree scrub

- Stale product names appear **only** in the legally required attribution paragraph of
  `NOTICE.md`; nowhere in product UI, README copy, metadata, icons or screenshots.
- No secrets, tokens or credentials in the tree (scan clean).
- No images/animations/databases in the tree or the image; 0 media files found.
- No build caches, coverage or test artefacts committed; `node_modules/`, `dist/`,
  `artifacts/scratch/` are ignored.
- Staged set was exactly the repository zone (60 files, 0 scratch/node_modules/dist entries).

---

## 4. Legal and media limitations

- **Licence:** AGPL-3.0-or-later (see `LICENSE`). This is a modified work derived from an
  AGPL-licensed source project; the mandatory attribution and corresponding-source reference are
  the minimum legal paragraph in `NOTICE.md`.
- **Exercise metadata & instructions:** MIT, via `hasaneyldrm/exercises-dataset`
  (originating from ExerciseDB v1 / AscendAPI). MIT text reproduced in `NOTICE.md`.
- **Russian instructions and interface strings:** derivative works, remain AGPL.
- **Images and animations:** **not** MIT and **not** AGPL; ownership is unresolved upstream
  (Gym visual vs ExerciseDB/AscendAPI make contradictory claims). They are not redistributed by
  this project and are loaded at runtime from a pinned CDN commit. The notice says this plainly
  and tells a reuser to clear rights with the holder first.
- **Fonts:** IBM Plex Sans and JetBrains Mono under SIL OFL 1.1, unmodified, reserved names kept;
  full licence texts in `public/fonts/`.

---

## 5. Honest remaining gaps and deviations

1. **Cloudflare rewrites the `/sw.js` cache header at the public edge.** The origin correctly
   serves `/sw.js` (and `/manifest.json`) as `no-cache`, but Cloudflare's zone policy for static
   file extensions returns `cache-control: max-age=14400`. It revalidates with the origin on every
   request (`cf-cache-status: REVALIDATED`, confirmed on consecutive requests), so a deploy is not
   actually stale — but the header a browser sees differs from the origin's intent. The same zone
   policy applies to every sibling app; changing it would be a zone-wide configuration change
   outside this task's stated scope, so it was left as-is and reported instead.
2. **The Russian instruction pack ships in the initial bundle** (~236 kB gzip total for the app).
   This is deliberate: the detail route must render steps without a loading state and search
   covers instruction text, so code-splitting it would either delay the detail render or silently
   narrow search. The build's chunk-size limit was raised with a comment rather than leaving an
   unexplained warning. The shell is service-worker cached after the first visit.
3. **No Russian exercise names.** By instruction. Names are canonical English; everything else is
   Russian. `full body` (a body part that only arrives through the muscle overlay and is missing
   from the source locale pack) was given the Russian name `всё тело` — the single vocabulary
   addition, declared explicitly in the extraction script so it cannot drift silently.
4. **Media quality is third-party and unverified.** CDN availability, image contents and animation
   correctness are outside this project's control; the app proves only that a failure degrades
   gracefully.
5. **Browser tests ran on headless Chromium only.** Real iOS/Android PWA installation, real-device
   gestures and actual device font rendering were not exercised; the offline shell and font
   painting were proven in Chromium (including CDP platform-font inspection).
6. **Search relevance is not a quality claim.** The typo tolerance and ranking are covered by unit
   tests against fixed expectations; no user-relevance study was performed.

---

## 6. Delivery state

- Branch: `main` (canonical; no `develop` existed).
- Release commit: `e951e46f37ac821cfa606bd72fdb74e633d6c01d` — `main` → pushed without force,
  remote ref equals local HEAD.
- Rollback for the ingress change: delete `/opt/obsidian-livesync/caddy/workout.caddy` and restart
  `girl-xtr-caddy-1`. The app container can be stopped independently (`docker compose down` in
  this repository only).

**Completion state:** clean target repository, verified build, normal push, public
`https://workout.xtr.sh` serving the app, and regression proof for the shared edge.
