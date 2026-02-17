# Phase 3: Automated Cloud Scraper

You are a background Claude instance executing Phase 3 of the Fusion Vault cloud migration. Read this entire file before writing a single line of code. Your job is to implement, test, and deploy a complete automated scraper to Google Cloud Functions.

## Your Working Directory

```
/Users/rccurtrightjr./Documents/GitHub/fusion-vault
```

Start by running:
```bash
git status
git log --oneline -5
cat .ai-project/bulletin/STATUS.md
```

Understand where the project is before you do anything.

---

## What Already Exists

- **Firebase project:** `fusion-vault-1771312693` (Blaze plan, us-central1)
- **Firestore:** Live, 4 collections (articles, vectors, config, jobs), 1,330 articles already uploaded
- **Cloud Functions:** 4 deployed (healthCheck, searchArticles, enrichNext, scrapeNext)
- **scrapeNext:** Currently a placeholder stub — this is what you are replacing
- **Local scraping logic:** Was in exjw-librarian — port the HTML parsing logic
- **Publications config:** `brain/config/publications.json` (14 publication types)
- **Article schema:** See `library/watchtower/2013/study-edition/april-15/2013282.json` for exact structure

Production endpoints:
- healthCheck: `https://us-central1-fusion-vault-1771312693.cloudfunctions.net/healthCheck`
- scrapeNext: `https://us-central1-fusion-vault-1771312693.cloudfunctions.net/scrapeNext`

---

## What You Are Building

### 5 Components (build in this order)

---

### Component 1: `functions/src/discovery.js`

Crawls jw.org WOL index to find what publications/years/issues exist. Populates Firestore so the scraper has a map to walk.

**WOL URL patterns:**
- Publication index: `https://wol.jw.org/en/wol/lv/r1/lp-e/0/{publicationSlug}`
- Year index: `https://wol.jw.org/en/wol/library/r1/lp-e/{publicationSlug}/{year}`
- Issue index (JSON): `https://wol.jw.org/en/wol/library/r1/lp-e/{publicationSlug}/{year}/{issue}/_index.json`

**What to store in Firestore:**
```
discovery/{publicationId}/years/{year}/issues/{issueSlug}
{
  issueSlug: "study-edition/april-15",
  articleIds: ["2013282", "2013283", "2013284"],
  articleCount: 3,
  discoveredAt: Timestamp
}
```

**Function signature:**
```javascript
export const discoverIssues = functions.https.onRequest(async (req, res) => {
  // Optional: req.body.publication to re-index one publication
  // Default: index all publications from brain/config/publications.json
  // Rate limit: 1 request/second to wol.jw.org
  // Idempotent: safe to run multiple times
})
```

**Gotcha:** WOL returns HTML, not JSON, for most pages. Use cheerio to parse. Only `_index.json` endpoints return JSON directly.

**Gotcha:** Some publications have no years (books are listed by title not year). Check `hasYears` field in publications.json before assuming year structure.

---

### Component 2: `functions/src/scraper-helpers.js`

HTML parsing utilities. Port the logic from the original exjw-librarian scraper.

**What it needs to do:**
- Fetch HTML from wol.jw.org with proper User-Agent and timeout
- Parse article title, content paragraphs, headings from WOL article page
- Build article JSON matching existing schema (see `library/watchtower/2013/study-edition/april-15/2013282.json`)
- Return structured object with `metadata` and `chunks` arrays

**Article URL pattern:**
`https://wol.jw.org/en/wol/d/r1/lp-e/{articleId}`

**Cheerio selectors for WOL articles:**
- Title: `h1` or `.docSubTitle`
- Paragraphs: `#article p` — each gets its own chunk with id `p{n}`
- Headings: `#article h2, #article h3`

**Rate limiting:** Add 2-second delay between fetches. Respect 429 responses — if you get one, throw a retriable error (don't advance the pointer).

**User-Agent:** `"Fusion Vault Research Tool / Educational Use"`

---

### Component 3: `functions/src/scraper.js`

The state machine. Walks publications → years → issues → articles using discovery data.

**State document in Firestore `config/scraper-state`:**
```javascript
{
  status: "running" | "paused" | "complete" | "idle",
  nextTarget: {
    publication: "watchtower",
    year: "2013",
    issue: "study-edition/april-15",
    articleIndex: 4
  },
  lastScrapedPublication: "watchtower",
  lastScrapedYear: "2013",
  lastScrapedIssue: "study-edition/april-15",
  lastScrapedArticleId: "2013282",
  totalArticlesScraped: 1330,
  totalArticlesFailed: 0,
  lastRunAt: Timestamp
}
```

**Traversal logic:**
```
For each publication in publications.json (by priority):
  For each year (ascending, from discovery data):
    For each issue (from discovery data):
      For each articleId (from discovery data):
        → scrape it
        → advance pointer
```

**Pointer advance rules:**
- Success → advance to next articleId
- If last article in issue → advance to next issue
- If last issue in year → advance to next year
- If last year in publication → advance to next publication
- If last publication → set status = "complete"

**Never advance pointer on:**
- Network errors (retry next invocation)
- 429 rate limit responses (retry next invocation)
- Firestore write errors (retry next invocation)

**Always advance pointer on:**
- Parse errors (mark article failed, move on — don't get stuck)
- 404 not found (article doesn't exist, move on)

---

### Component 4: Replace `scrapeNext` in `functions/src/index.js`

Replace the placeholder with the real implementation:

```javascript
export const scrapeNext = functions.https.onRequest(async (req, res) => {
  // 1. Read config/scraper-state
  // 2. Guard: status == "paused" → exit 200 (not an error)
  // 3. Guard: status == "complete" → exit 200
  // 4. Guard: no nextTarget → initialize from discovery, set status running
  // 5. Check if article already in Firestore (skip if exists, advance pointer)
  // 6. Fetch + parse article via scraper-helpers.js
  // 7. Upload JSON to Cloud Storage: json/{publication}/{year}/{articleId}.json
  // 8. Write Firestore document to articles/{articleId}
  // 9. Advance pointer in config/scraper-state
  // 10. Write job log to jobs/{jobId}
  // 11. Return result
})
```

Also add `discoverIssues` and `controlScraper` exports to index.js.

**controlScraper:**
```javascript
export const controlScraper = functions.https.onRequest(async (req, res) => {
  // POST { action: "pause" }  → status = "paused"
  // POST { action: "resume" } → status = "running"
  // POST { action: "skip" }   → advance pointer without scraping
  // POST { action: "status" } → return current state (GET also works)
  // Always return current state after action
})
```

---

### Component 5: `scripts/scheduler/create-jobs.sh`

Bash script to create the two Cloud Scheduler jobs.

```bash
#!/bin/bash
PROJECT="fusion-vault-1771312693"
REGION="us-central1"
API_KEY=$(gcloud secrets versions access latest --secret=LIBRARIAN_API_KEY --project=$PROJECT 2>/dev/null || echo "NOT_SET")

# Job 1: Scraper every 1 minute
gcloud scheduler jobs create http fusion-vault-scrape-next \
  --location=$REGION \
  --schedule="* * * * *" \
  --uri="https://$REGION-$PROJECT.cloudfunctions.net/scrapeNext" \
  --http-method=POST \
  --headers="x-api-key=$API_KEY,Content-Type=application/json" \
  --message-body="{}" \
  --time-zone="America/Chicago" \
  --project=$PROJECT

# Job 2: Discovery weekly (Sundays midnight)
gcloud scheduler jobs create http fusion-vault-discover-issues \
  --location=$REGION \
  --schedule="0 0 * * 0" \
  --uri="https://$REGION-$PROJECT.cloudfunctions.net/discoverIssues" \
  --http-method=POST \
  --headers="x-api-key=$API_KEY,Content-Type=application/json" \
  --message-body="{}" \
  --time-zone="America/Chicago" \
  --project=$PROJECT

echo "✅ Cloud Scheduler jobs created"
```

---

## Firestore Article Schema

Every article document in `articles/{articleId}` must have these fields:

```javascript
{
  articleId: "2013282",
  title: "They Offered Themselves Willingly—In Mexico",
  publication: "watchtower",          // lowercase, matches publications.json id
  type: "magazine",                   // magazine | book | brochure | workbook
  year: "2013",
  issue: "w13 4/15 pp. 3-6",
  sourceUrl: "https://wol.jw.org/en/wol/d/r1/lp-e/2013282",
  scrapedAt: Timestamp,
  extractionStatus: "success" | "failed",
  enrichmentStatus: "pending",
  chunkCount: 6,
  storagePath: "json/watchtower/2013/2013282.json",
  hasManipulationPatterns: false,
  manipulationPatternCount: 0,
  highSeverityCount: 0
}
```

**Note the `type` field** — this is new and must be set on every scraped article. Derive it from publication:
- watchtower, awake → "magazine"
- books → "book"
- brochures-and-booklets → "brochure"
- meeting-workbooks, kingdom-ministry → "workbook"

---

## Dependencies to Add

In `functions/package.json`, add:
```json
"cheerio": "^1.0.0"
```

Run `npm install` in the `functions/` directory after adding.

---

## Testing Order

**Do not skip testing. Do not deploy untested code.**

### Step 1: Test discovery locally
```bash
cd functions
npm install
firebase emulators:start --only functions,firestore
# In another terminal:
curl -X POST http://localhost:5001/fusion-vault-1771312693/us-central1/discoverIssues \
  -H "Content-Type: application/json" \
  -d '{"publication": "watchtower"}'
# Verify: Firestore emulator shows discovery/watchtower/... documents
```

### Step 2: Test scraper locally
```bash
# With emulators still running:
curl -X POST http://localhost:5001/fusion-vault-1771312693/us-central1/scrapeNext \
  -H "Content-Type: application/json" \
  -d '{}'
# Verify: 
# - New article appears in Firestore emulator articles collection
# - config/scraper-state shows updated nextTarget
# - jobs collection has new job log
# Run 5 more times, verify pointer advances correctly
```

### Step 3: Test control function
```bash
curl -X POST http://localhost:5001/fusion-vault-1771312693/us-central1/controlScraper \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'
# Verify: scraper-state.status == "paused"

curl -X POST http://localhost:5001/fusion-vault-1771312693/us-central1/scrapeNext \
  -H "Content-Type: application/json" \
  -d '{}'
# Verify: returns immediately without scraping (paused)

curl -X POST http://localhost:5001/fusion-vault-1771312693/us-central1/controlScraper \
  -H "Content-Type: application/json" \
  -d '{"action": "resume"}'
# Verify: scraper-state.status == "running"
```

### Step 4: Deploy to production
```bash
cd functions
firebase deploy --only functions --project=fusion-vault-1771312693
```

### Step 5: Smoke test production
```bash
# Test health check first
curl https://us-central1-fusion-vault-1771312693.cloudfunctions.net/healthCheck

# Run one scrape manually
curl -X POST https://us-central1-fusion-vault-1771312693.cloudfunctions.net/scrapeNext \
  -H "Content-Type: application/json" \
  -d '{}'

# Verify new article in Firestore (check Firebase console or query)
```

### Step 6: Create Cloud Scheduler jobs
```bash
bash scripts/scheduler/create-jobs.sh
```

---

## Known Gotchas

- **WOL rate limiting:** If you get 429, stop and implement exponential backoff before continuing. Do not hammer the site.
- **Cheerio in Node 20:** Works fine, just install it first.
- **Cloud Storage bucket:** Should already exist. If not, create it: `firebase-storage-fusion-vault-1771312693`
- **Admin SDK init:** Already handled with lazy `getDb()` pattern in existing code — follow the same pattern.
- **Firestore batch size:** Max 500 writes per batch. If writing multiple documents, batch them.
- **Discovery before scraping:** The scraper depends on discovery data. Run `discoverIssues` for watchtower first, verify it populated Firestore, then test `scrapeNext`.
- **Existing 1,330 articles:** The scraper should check if an article already exists before scraping. Skip and advance pointer if it does.

---

## When You Are Done

Update `.ai-project/bulletin/STATUS.md` with:
```
## YYYY-MM-DD HH:MM - Claude (Background: Phase 3)
**What I did:** [summary]
**What worked:** [wins]
**What didn't:** [issues]
**Commits:** [hashes]
**Status:** complete | blocked
**Blockers:** [if any]
**Next steps:** Phase 4 - Enrichment Pipeline
```

Commit everything with:
```bash
git add -A
git commit -m "feat: phase 3 - automated cloud scraper with state machine and cloud scheduler"
```

If you get blocked and cannot continue, commit what you have, mark status as BLOCKED in STATUS.md, and explain exactly what stopped you and what needs to happen next.
