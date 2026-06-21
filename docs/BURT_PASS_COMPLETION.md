# Burt pass completion (civic-cal)

Every build pass on **civic-cal** ends with:

```powershell
cd H:\SOSWebsite\civic-call
git status
git fetch origin
git branch
git add .
git commit -m "<pass description>"
git push origin main
```

## Required completion report

| Field | Example |
|-------|---------|
| **Current commit hash** | `abc1234` |
| **Branch** | `main` |
| **Build result** | pass / fail |
| **Typecheck result** | pass / fail |
| **Routes added/changed** | `/organizers`, `/admin` tab |
| **Files added** | list key paths |
| **Netlify impact** | new env vars? migration? functions? |
| **Next recommended pass** | one concrete sentence |

## Intelligence layers (product north star)

1. **Government** — civic duty, often low attendance  
2. **Community identity** — fairs, festivals (500–5,000+)  
3. **Community church events** — meals & fundraisers (trust)  
4. **School ecosystem** — stadium as town square  
5. **Relationship** — Rotary, Farm Bureau, VFD (50–300 influencers)

Score both **Political Opportunity (PO)** and **Relationship Density (RD)**.

## Recurring registry

`data/ingestion/recurring-events-registry.json` — traditions, not one-offs.  
Sync: `npm run harvest:registry`
