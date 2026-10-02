# CivicMerge AI

AI-powered smart-city complaint deduplication and issue fusion for a 24-hour hackathon.

## Core flow

```text
Citizen report
   ↓
Supabase gte-small embedding
   ↓
pgvector similarity search
   ↓
Semantic + location + category + time scoring
   ↓
Merge duplicate or create Master Issue
```

## Stack

- Next.js + TypeScript
- Supabase PostgreSQL
- Supabase pgvector
- Supabase Edge Functions
- Supabase built-in `gte-small` embeddings
- Vercel
- GitHub

No OpenAI API key is required for duplicate detection.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Keep `SUPABASE_SECRET_KEY` server-only.

## MVP routes

- `/` — landing page
- `/report` — citizen complaint submission
- `/admin` — municipal dashboard
- `/issues/[id]` — master issue details
- `/api/complaints` — duplicate-detection API

## Duplicate score

- 55% semantic similarity
- 25% geographic proximity
- 15% category match
- 5% time relevance

Hackathon thresholds:

- 85%+ → merge automatically
- 70–84% → possible duplicate
- below 70% → create a new Master Issue
