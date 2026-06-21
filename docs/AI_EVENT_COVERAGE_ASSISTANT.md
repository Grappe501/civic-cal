# AI Event Coverage Assistant

## Role

The AI coverage assistant helps operators **discover, score, verify, summarize, and prioritize** event-lane coverage. It is **advisory only** — it cannot publish events or verify without source support.

## Components

| File | Purpose |
|------|---------|
| `src/lib/ai/recurrenceExtractor.ts` | Rule-based recurrence parsing from raw page text |
| `src/lib/ai/sourceVerifier.ts` | Confirms which fields are supported by source text |
| `src/lib/ai/eventCoverageAssistant.ts` | Lane gap analysis and admin batch summaries |
| `netlify/functions/ai-event-coverage.js` | HTTP endpoint (OpenAI when `OPENAI_API_KEY` set, rules fallback) |

## Prompts and schemas

- `data/ai/prompts/event-coverage-assistant.json`
- `data/ai/schemas/recurrence-extraction.schema.json`
- `data/ai/schemas/source-verification.schema.json`

## Capabilities

### A. Recurrence extraction

Given raw page text, returns JSON with recurrence rule, time, venue, address, county, uncertainty, missing fields, and suggested future dates (only when unambiguous).

### B. Source verification

Given a candidate + source URL/raw text:

- Does the source support this event?
- Confirmed vs inferred fields
- Missing fields, confidence score, warning flags

### C. Lane gap assistant

Given county + lane coverage:

- Thin lanes
- Recommended searches (no invented events)

### D. Admin batch summary

Given staged candidates:

- Ready to approve
- Needs human review
- Possible duplicates
- High-confidence recurring meetings

## Hard limits

1. **AI cannot publish** — admin approval required
2. **AI cannot verify without source support**
3. **AI must label uncertainty** and separate facts from inference
4. **No partisan preference or ranking** — equal treatment across parties
5. **No invented events or dates** when recurrence is ambiguous

## API usage

```http
POST /.netlify/functions/ai-event-coverage
Content-Type: application/json

{
  "task": "recurrence_extraction",
  "rawText": "4th Thursday 6:00 PM at County GOP HQ"
}
```

Tasks: `recurrence_extraction`, `source_verification`, `lane_gap`, `admin_batch_summary`

When `OPENAI_API_KEY` is absent, the function uses deterministic rule-based fallbacks.
