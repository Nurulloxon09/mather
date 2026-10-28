# mather

A personal Digital SAT Math practice app that looks and behaves like the real test in Bluebook:
same layout, tools, timer and pressure. Single user, no accounts.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # grid-in answer rules + question bank checks
npm run build      # production build
```

Optional: set `NEXT_PUBLIC_DESMOS_API_KEY` in `.env.local` to use your own Desmos key.
Without it, the app uses Desmos's public demo key, which is fine for personal use.

## Database

Every attempt and finished test is saved to a SQLite database (libSQL).

- **Locally** nothing to set up: it's a file at `.data/mather.db`, created on first use.
- **On Vercel** use a free [Turso](https://turso.tech) database:
  1. Sign up at turso.tech (GitHub login works) and create a database.
  2. Copy its URL (`libsql://…`) and create a token for it.
  3. In Vercel → your project → Settings → Environment Variables, add
     `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
  4. Redeploy (Deployments → ⋯ → Redeploy). Tables are created automatically.

  Connecting Turso from Vercel's Storage tab also works; prefixed variable names such as
  `STORAGE_TURSO_DATABASE_URL` are picked up.

Until a database is connected, the home page shows a notice and progress stays in the browser.
Writes always go to a queue in the browser first (`src/lib/outbox.ts`) and are uploaded in the
background, so nothing is lost if the network or database is briefly unavailable. Results from before
the database existed are uploaded the first time you open the app with one connected.

Tables (`src/server/db.ts`):
- `attempts`: one row per question per test or set: answer, correct, time spent, mode, marked.
- `sessions`: each finished practice set, timed set or exam, with its full state for the results page.

## What's here (Phase 1)

- **Bluebook UI** (`src/components/bluebook/`)
  - Top bar: section title, Directions dropdown, countdown with Hide/Show (locked visible with a warning at 5:00), Calculator, Reference, Fullscreen, More.
  - Desmos graphing calculator and reference sheet in draggable, resizable panels.
  - Question header: number box, Mark for Review, "ABC" answer elimination.
  - Multiple-choice answer boxes, and a grid-in answer box with live Answer Preview. The grid-in entry rules are in the Directions dropdown.
  - Bottom bar: your name, a "Question X of Y" navigator, Back/Next.
  - A "Check Your Work" page at the end of each module.
- **Practice mode** (`/practice`): click Check to see Correct/Incorrect, the correct answer, the explanation and your time on the question.
- **Exam mode** (`/exam`): 2 modules × 22 questions × 35 minutes. No feedback during the test. Optional adaptive Module 2 (harder or easier based on Module 1). Auto-submits at 0:00. Results page with raw score, accuracy by domain and skill, and every question with its explanation.
- **Grid-in checking** (`src/lib/grid.ts`) follows SAT entry rules:
  - Max 5 characters, or 6 with a negative sign.
  - Fractions and decimals both count, as do equivalent forms (3/4 = .75 = 0.75).
  - Long decimals are accepted only when truncated or rounded to fill the box.
  - Questions can have several correct answers.

## Question bank (Phase 2)

`/bank` lists every question with filters for status (unanswered, incorrect, correct, marked for
review), domain, skill, difficulty, type and source. Filters combine (OR inside a group, AND across
groups) and live in the URL, so `/bank?status=incorrect&domain=Advanced+Math&difficulty=Hard` is a
link to "hard Advanced Math questions I got wrong".

From any filter, start a set of N questions:
- **Practice**: Check after each question, as above.
- **Timed**: one module with Bluebook timing (35 min per 22 questions, rounded up), no feedback until
  you submit, then a results page.

Status uses your most recent attempt: "Incorrect" means you got it wrong the last time you answered it.
Click a question to see it in full, reveal the answer and explanation, and see every attempt.

## Question data

Questions live in `src/data/` as TypeScript, using a small markup that the review screen will reuse later:

- `$...$` for inline LaTeX and `$$...$$` for display LaTeX (rendered with KaTeX)
- `\$` for a dollar sign, `**bold**`
- `- item` lines for bullet lists
- `| a | b |` rows for tables
- `![alt](/figures/x.png){w=300}` for figures

Figures are cropped from the source PDF with the watermark removed (`public/figures/mhb/`).

### Math Hard Book (Algebra + Advanced Math)

150 questions: 37 Algebra and 113 Advanced Math, all tagged Hard. Every question has a written explanation. The book only had answer keys, so each answer was re-derived and checked, with SymPy for the algebra-heavy ones.

**Answer key corrections:**
- Algebra: #31 (key D, correct B)
- Advanced Math:
  - #22 (B → D)
  - #50 (−47 → 23)
  - #53 (173 → 171)
  - #58 (B → A)
  - #59 (A → C)
  - #60 (162 → 4)
  - #61 (D → C)
  - #65 (C → B)
  - #82 (D → C)
  - #83 (C → A)
  - #88 (10 → 12)
- #47, #97 and #99 had letter keys but no answer choices. They're grid-ins with answers −32, −11 and 10.

Each correction is explained in the question's explanation.

**Repaired from the printed version** (each one says so in its explanation):
- Algebra #32 (Website P's pricing was missing)
- Advanced Math:
  - #25 (no choices printed, so it's a grid-in)
  - #51 and #79 (equation missing)
  - #57 ("months" vs "years")
  - #71 (garbled)
  - #84 (wording)
  - #89 (typesetting)

**Flagged** because they can't be fixed confidently: Algebra #14 and Advanced Math #11, #22, #76 and #108. They show a "source issue" note and are never used in exams.

**Skipped duplicates:** Advanced Math #6, #38, #95, #96, #117 and #119–123 repeat earlier questions.

## Roadmap

1. ~~Bluebook exam UI with book questions, both modes~~
2. ~~Database (SQLite/libSQL locally, Turso when deployed), question bank with filters, custom sets, attempt saving~~
3. Upload PDF/image/DOCX → extraction (Gemini) → side-by-side review → publish
4. Full results history and stats page (accuracy by domain/skill, weakest areas)
