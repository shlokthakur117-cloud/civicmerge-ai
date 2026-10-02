# CivicMerge AI

AI-powered smart-city complaint deduplication and issue fusion for a 24-hour hackathon.

## Problem

Citizens often report the same pothole, broken streetlight, garbage pile, water leak, or drainage issue multiple times. Traditional systems create separate tickets, which creates administrative noise and fragments evidence.

CivicMerge AI converts duplicate reports into supporting evidence for one **Master Issue**.

## Core flow

```text
Citizen report
   ↓
Generate text embedding
   ↓
Find semantically similar issues with pgvector
   ↓
Combine semantic + location + category + time signals
   ↓
High confidence → merge into existing Master Issue
Medium confidence → flag possible duplicate
Low confidence → create new Master Issue
```

## Stack

- Next.js + TypeScript
- Supabase PostgreSQL
- Supabase pgvector
- Supabase Storage/Auth ready
- OpenAI embeddings
- Vercel deployment
- GitHub source control

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

4. In Supabase SQL Editor, run:

```text
supabase/schema.sql
```

5. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## MVP routes

- `/` — product landing page
- `/report` — citizen complaint form
- `/admin` — municipal command center
- `/issues/[id]` — master issue details
- `/api/complaints` — AI duplicate-detection endpoint

## Duplicate score

The MVP currently uses:

- 55% semantic similarity
- 25% geographic similarity
- 15% category match
- 5% time similarity

Thresholds:

- 85%+ → auto-merge
- 70–84% → possible duplicate
- below 70% → create a new issue

These thresholds are hackathon defaults and should be tuned with real municipal data before production use.

## 24-hour scope

Build and demo the duplicate-fusion workflow first. Avoid adding chatbots, native mobile apps, blockchain, microservices, or custom model training until the core workflow is stable.
