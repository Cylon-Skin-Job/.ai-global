# Decision: LLM for Article Tagging (BITE Model Enrichment)

**Date:** 2026-02-17
**Status:** Decided
**Applies to:** Fusion Vault Phase 4 — Cloud Enrichment Pipeline

---

## The Task

Tag scraped JW articles with BITE model manipulation patterns from `brain/config/taxonomy.json`. For each article, the LLM reads the content and identifies which patterns are present — fear induction, authority claims, information control, loaded language, thought-stopping clichés, etc.

**Why this is hard:** Watchtower content rarely states manipulation directly. It uses:
- Loaded language with specific connotations ("worldly", "faithful", "apostate")
- Implied consequences rather than explicit threats
- Emotional framing disguised as spiritual encouragement
- Authority appeals embedded in doctrinal language

A weak model pattern-matches keywords. A strong model understands what's actually being communicated beneath the surface.

---

## Options Considered

| Model | Provider | Cost/article | Reasoning | Notes |
|-------|----------|-------------|-----------|-------|
| Llama 3.3 70B | DeepInfra | ~$0.001-0.003 | Strong | Already configured ✅ |
| Llama 3.1 8B | DeepInfra | ~$0.0001 | Weak | Too small for nuanced text |
| Gemini 1.5 Flash | Google Vertex AI | ~$0.001 | Good | Not proven on this task |
| Claude Sonnet | Anthropic | ~$0.01-0.03 | Best | Expensive at scale |

---

## Decision: Llama 3.3 70B via DeepInfra

**Rationale:**
- 70B parameters provides the reasoning depth needed to detect subtle manipulation patterns — not just keyword matching but understanding implication, framing, and subtext
- Already proven: local tagging pipeline used this model and produced good results
- API key already in GCP Secret Manager (`DEEPINFRA_API_KEY`)
- Cost is acceptable: ~$3-15 to enrich the full current library (5,000 articles)
- No new service setup required

**Why not 8B:** Insufficient reasoning capacity for nuanced text analysis. Would miss implicit patterns and produce low-quality tags.

**Why not Claude:** Best quality, but 5-10x more expensive. Reserve for a quality-check pass on a sample, or for re-tagging high-priority articles if 70B output is unsatisfactory.

**Why not Gemini:** Not proven on this task. DeepInfra is working. Don't introduce a new service without a reason.

---

## Escape Hatch

If tagging quality from 70B is poor after running on a 100-article sample:
1. Pull the sample, manually review 10-20 articles
2. If patterns are being missed: run Claude API on those specific articles only
3. If systemic: reconsider model choice, document findings here

---

## Cost Projection

| Articles | Cost (low) | Cost (high) |
|----------|-----------|-------------|
| 1,330 (current) | ~$1.30 | ~$4.00 |
| 5,000 | ~$5.00 | ~$15.00 |
| 20,000 | ~$20.00 | ~$60.00 |

Acceptable at all scales. Set a DeepInfra usage cap at $50/month as a safeguard.

---

## Related Files

- `brain/config/taxonomy.json` — BITE model pattern definitions
- `functions/src/embeddings.js` — Current DeepInfra integration (tagging + embeddings)
- `CLOUD_MIGRATION_ROADMAP.md` Phase 4 — Full enrichment pipeline spec
