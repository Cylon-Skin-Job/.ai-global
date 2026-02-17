# Task Template

Copy this template into your project's `.ai-project/bulletin/STATUS.md` when defining a new task for background Claude execution.

---

## TASK: [Your Task Name]
**Objective:** [One-sentence goal — what is the end state?]
**Status:** READY FOR EXECUTION
**Assigned to:** Background Claude instance
**Created:** [ISO date, e.g., 2026-02-17]

### Overview
[Context: What exists now? What's the starting point?]

**Current State:**
- ✅ [What's working]
- ✅ [What's in place]
- ⚠️ [What's missing/broken]

### What Needs to Be Built

#### Component 1: [Name]
- **Purpose:** [What does it do?]
- **Input/Output:** [Data flow]
- **Key logic:** [Algorithm or flow description]
- **Testing:** [How to verify it works]

#### Component 2: [Name]
[Same structure]

### Files to Create/Modify

**New Files:**
- `path/to/file1.js` — [What it does]
- `path/to/file2.mjs` — [What it does]

**Modified Files:**
- `path/to/existing.js` — [What changes and why]
- `path/to/config.json` — [What fields to add]

### Implementation Steps

1. [Discrete step]
2. [Next step]
3. [Continue...]
4. [Final step: commit and update STATUS.md]

### Implementation Checklist

**Local Testing:**
- [ ] Emulator test 1
- [ ] Emulator test 2
- [ ] Manual verification

**Production Ready:**
- [ ] All files created/modified
- [ ] Tests passing
- [ ] Documentation updated
- [ ] No console errors

**Monitoring:**
- [ ] Metrics show expected behavior
- [ ] No alerts triggered
- [ ] Logs look healthy

### Success Metrics

All of these must be true:
- ✅ [Metric 1]
- ✅ [Metric 2]
- ✅ [Metric 3]

### Blockers / Unknowns

**Known issues:**
- [ ] [Potential blocker 1 — how to handle]
- [ ] [Potential blocker 2 — how to handle]

**Unknowns to resolve:**
- [ ] [Unknown 1 — where to get answer]
- [ ] [Unknown 2 — where to get answer]

### Pass-off Notes

[Optional: Specific guidance for the background instance]

---

## Example

Here's a filled-in example:

---

## TASK: Phase 3 — Automated Cloud Scraper
**Objective:** Implement scraper state machine with Cloud Scheduler to scrape 1 article/minute
**Status:** READY FOR EXECUTION
**Assigned to:** Background Claude instance
**Created:** 2026-02-17

### Overview
The scraper currently exists locally in exjw-librarian as a Python/Node script. We need to port it to Google Cloud Functions and wire it to Cloud Scheduler for continuous, unattended operation. The system should:
- Resume from where it left off (state machine)
- Handle network failures gracefully (retry next invocation)
- Respect rate limits (backoff on 429)
- Log all activity to Firestore and Cloud Logging

**Current State:**
- ✅ Firebase project created, Firestore ready
- ✅ 1,330 articles already uploaded
- ✅ Cloud Functions deployed (4 functions)
- ✅ Local scraping logic exists (cheerio-based HTML parsing)
- ⚠️ scrapeNext function is placeholder only
- ⚠️ No Cloud Scheduler jobs configured
- ⚠️ No discovery indexing (catalog of what exists on jw.org)

### What Needs to Be Built

#### 3.1 Discovery Function
Crawl jw.org index to find all publications/years/issues that exist.

Input: (optional) specific publication to re-index
Output: Firestore collection `discovery/{pub}/{year}/{issue}` with article lists
Logic:
- Use publication list from exjw-librarian config
- For each pub, fetch year by year from WOL
- For each year, fetch issue index
- Extract article IDs from _index.json
- Store in Firestore

Testing:
- Run in emulator
- Verify one publication indexes correctly
- Check Firestore has correct structure

#### 3.2 Scraper Function Complete
Replace placeholder with full implementation.

Logic flow (13 steps):
1. Read config/scraper-state → get nextTarget
2. Guard: if status == "paused", exit
3. Guard: if no nextTarget, set status = "complete"
4. Query discovery → find article ID at position
5. Check if already exists in Firestore (skip if yes)
6. Fetch HTML from jw.org (with retry)
7. Parse with cheerio
8. Build article JSON
9. Upload to Cloud Storage
10. Create Firestore document
11. Advance nextTarget pointer
12. Log job to jobs/ collection
13. Return result

Error handling:
- Network errors → log, don't advance pointer (retry next run)
- Parse errors → mark failed, advance pointer
- Firestore errors → log, retry (no pointer advance)

Testing:
- Run in emulator
- Scrape 5-10 articles
- Verify Firestore + Cloud Storage

#### 3.3 State Machine
Define traversal order: publications → years → issues → articles.

Config structure in Firestore `config/scraper-state`:
```javascript
{
  status: "running" | "paused" | "complete",
  lastScrapedPublication: "watchtower",
  lastScrapedYear: "2013",
  nextTarget: { publication, year, issue, articleIndex },
  totalArticlesScraped: 1330,
  totalArticlesFailed: 0,
  lastRunAt: Timestamp
}
```

#### 3.4 Control Function
HTTP endpoint for pause/resume/skip/reset.

Endpoints:
- POST /control { action: "pause" }
- POST /control { action: "resume" }
- POST /control { action: "skip" }
- POST /control { action: "reset", target: {...} }

#### 3.5 Cloud Scheduler
Two cron jobs:

Job 1: Scraper every 1 minute
```yaml
schedule: "* * * * *"
uri: "https://us-central1-PROJECT.cloudfunctions.net/scrapeNext"
headers: { x-api-key: "${LIBRARIAN_API_KEY}" }
```

Job 2: Discovery weekly
```yaml
schedule: "0 0 * * 0"
uri: "https://us-central1-PROJECT.cloudfunctions.net/discoverIssues"
headers: { x-api-key: "${LIBRARIAN_API_KEY}" }
```

### Files to Create/Modify

**New Files:**
- `functions/src/scraper.js` — State machine, traversal
- `functions/src/discovery.js` — Index crawler
- `functions/src/scraper-helpers.js` — HTML parsing (ported)
- `functions/src/rate-limiter.js` — Backoff logic
- `scripts/scheduler/create-jobs.sh` — Scheduler setup

**Modified Files:**
- `functions/src/index.js` — Replace placeholder, add functions
- `functions/src/firestore-helpers.js` — Add discovery queries
- `.env.example` — Document LIBRARIAN_API_KEY

### Implementation Steps

1. Create `discovery.js` with WOL crawler
2. Create `scraper.js` with state machine
3. Create `scraper-helpers.js` with HTML parsing logic
4. Create `rate-limiter.js` with backoff
5. Update `index.js` to export all functions + add control endpoint
6. Update `firestore-helpers.js` with discovery queries
7. Test discovery in emulator (index 1 publication)
8. Test scraper in emulator (scrape 5 articles)
9. Create `create-jobs.sh` for Cloud Scheduler
10. Deploy to production
11. Run for 24h, verify 1,400+ articles added
12. Update STATUS.md with results

### Implementation Checklist

**Emulator Testing:**
- [ ] Discovery finds 1 publication
- [ ] Scraper advances through 10 articles
- [ ] State machine tracks nextTarget
- [ ] Rate limiting respects 429
- [ ] Failed articles don't advance pointer
- [ ] Cloud Storage uploads verified

**Production Deployment:**
- [ ] API key in Cloud Functions environment
- [ ] Cloud Scheduler jobs created
- [ ] Manual test: scrapeNext works
- [ ] Manual test: discoverIssues works
- [ ] 24h test: 1,400+ articles
- [ ] Cloud Logging shows activity

**Monitoring:**
- [ ] Cloud Logging shows scraper
- [ ] Jobs collection tracks failures
- [ ] Firestore metrics show growth

### Success Metrics

All of these must be true:
- ✅ Scraper runs autonomously (no manual intervention)
- ✅ 1,400+ articles added per 24 hours
- ✅ Failed articles auto-retry on next run
- ✅ Can pause/resume via control function
- ✅ Discovery updates weekly
- ✅ No errors in Cloud Logging (or <5/day)

### Blockers / Unknowns

**Known challenges:**
- [ ] jw.org HTML structure — assume it matches exjw-librarian expectations
- [ ] Rate limiting at 1/min — monitor first week, unlikely to be issue
- [ ] Cheerio in Cloud Functions — Node 20 runtime, should work

**How to handle:**
- If HTML parsing fails: fall back to original exjw-librarian scripts for reference
- If rate limited: implement exponential backoff in rate-limiter.js
- If Node issues: test locally before deploying

### Pass-off Notes

- Test discovery first (isolated)
- Then test scraper with discovery data (5 articles)
- Validate Firestore + Cloud Storage before deploying scheduler
- Deploy scheduler, monitor hourly for 6 hours
- Then daily after that

---

*Template ends here.*
