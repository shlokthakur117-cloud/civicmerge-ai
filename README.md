# CivicMerge AI

AI-powered civic complaint deduplication for smart-city workflows.

## What it does

CivicMerge AI turns repeated citizen complaints into evidence for one master issue.

```text
Citizen report
   ↓
Supabase gte-small embedding
   ↓
300 m geographic candidate filter
   ↓
pgvector semantic matching
   ↓
Hybrid duplicate score
   ↓
Merge into master issue OR create a new issue
```

## Hackathon MVP

- Semantic duplicate detection
- Geographic proximity filtering
- Master issue clustering
- Supporting-report count
- Priority escalation when duplicates accumulate
- Optional citizen photo evidence
- Live OpenStreetMap issue map
- Admin queue with Open / Assigned / Resolved controls
- Status-history timeline
- Supabase-native embeddings; no OpenAI API key required

## Stack

- Next.js + TypeScript
- Supabase PostgreSQL + pgvector
- Supabase Storage
- Supabase Edge Functions
- Supabase built-in gte-small model
- Leaflet + OpenStreetMap
- Vercel
- GitHub

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Keep SUPABASE_SECRET_KEY server-only.

## Duplicate scoring

- 55% semantic similarity
- 25% geographic proximity
- 15% category match
- 5% time relevance
- Candidates farther than 300 m are rejected before scoring

Hackathon thresholds:

- 85%+ → merge automatically
- 70–84% → possible duplicate
- below 70% → create a new master issue

See DEMO.md for the 90-second judging flow.
