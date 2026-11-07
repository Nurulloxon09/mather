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

## Look

Minimal on purpose: white pages, no boxes, black and white with blue only for the main button and
the charts (green and red only for right and wrong). The menu is **Practice · Stats · Upload**; the
wordmark goes home. Pages follow the device's light or dark setting (`src/app/globals.css` holds both
sets of colors). The test screen is the exception: it always looks like Bluebook, in light mode.

The home page's two big actions, **Start full exam** (blue) and **Practice** (slate), are 3D cards
(`src/components/ui/animated-3d-card.tsx`) that tilt toward the pointer and slide in a short label on
hover. They're focusable and open with Enter or Space. The exam card is dimmed and inactive when the
bank has fewer than 44 questions. The card uses `cn` from `src/lib/utils.ts`, the usual shadcn/ui
class helper (clsx + tailwind-merge).

## Database

Every attempt and finished test is saved to a database. Any of these works:

- **Neon (Postgres)**, the easiest on Vercel: your project → Storage → Create Database → Neon → free
  plan → connect it to this project. Vercel adds `DATABASE_URL` itself. Then Deployments → ⋯ → Redeploy.
  Any variable holding a `postgres://` address is found; the pooled `DATABASE_URL` is preferred.
- **Turso (libSQL)**: connect it from Storage the same way, or create one at turso.tech and add
  `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Settings → Environment Variables. Any variable
  holding a `libsql://` address is found, with the token from its sibling variable.
- **Locally**, nothing to set up: a SQLite file at `.data/mather.db`, created on first use.

Tables are created automatically on first use. Queries are written once in SQLite's dialect and
translated for Postgres (`src/server/sql.ts`); the connection lives in `src/server/db.ts` and the
setting names are worked out in `src/server/db-env.ts`.

Until a database is connected, the home page shows a notice and progress stays in the browser.
Writes always go to a queue in the browser first (`src/lib/outbox.ts`) and are uploaded in the
background, so nothing is lost if the network or database is briefly unavailable. Results from before
the database existed are uploaded the first time you open the app with one connected.

Tables (`src/server/db.ts`):
- `attempts`: one row per question per test or set: answer, correct, time spent, mode, marked.
- `sessions`: each finished practice set, timed set or exam, with its full state for the results page.
- `uploads`, `upload_pages`, `answer_keys`, `uploaded_questions`: uploaded files and the questions read from them.
- `files`: page images and cropped figures (served by `/api/files/<id>`), so no separate file storage is needed.

## Uploads (Phase 3)

`/upload` turns a prep book into questions:

1. **Upload** a PDF (choose a page range, and include the answer key pages), a Word `.docx` file, or
   photos of pages. The browser does the heavy lifting: PDF pages are rendered to images with pdf.js,
   Word files are converted to the question markup (equations become LaTeX, list numbers are written
   out, tables and pictures are kept), and the results are uploaded page by page.
2. **Reading**: a few pages at a time (4 pages, overlapping by 1 so questions that cross a page break
   are seen whole) go to Gemini, which returns each question's number, section, text, choices, answer
   if printed, explanation if printed, figure locations, and its domain, skill and difficulty, plus any
   answer-key entries. Answer keys are matched to questions by section and number. Figures are cropped
   out of the page in the browser. Rate limits are waited out automatically; reading can be paused and
   continued later.
3. **Review**: each question is shown next to its original page, with figure boxes highlighted. Edit any
   field with a live preview, drag on the page to crop a missed figure, ask the AI for a second opinion
   (it solves the question, which catches wrong answer keys and drafts an explanation), then Publish.
   Nothing reaches the bank until it's published, and publishing checks that the question is complete:
   4 choices and an answer letter, valid grid-in answers, LaTeX that renders, no uncropped figures.

Published questions show up in the bank, practice sets and exams like the built-in ones.

### Setup

1. Create a free API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. In Vercel → Settings → Environment Variables, add `GEMINI_API_KEY`, then redeploy.
   Locally, put it in `.env.local`.

The default model is `gemini-flash-latest` (set `GEMINI_MODEL` to use another). The upload screen also
offers `gemini-flash-lite-latest`, which allows many more requests per day on the free tier; switch to it
if the daily limit runs out mid-book.

### Passcode

Uploads use your API key, so on a public URL you'll want a lock. Set `APP_PASSCODE` (any phrase) in
Vercel and redeploy: every page and API then asks for it once per browser (`src/proxy.ts`).
Leave it unset to keep the app open.

## What's here (Phase 1)

- **Bluebook UI** (`src/components/bluebook/`)
  - Top bar: section title, Directions dropdown, countdown with Hide/Show (locked visible with a warning at 5:00), Calculator, Reference, Fullscreen, More.
  - Desmos graphing calculator docked on the left: the question moves over instead of being covered,
    the right edge drags to resize (the width is remembered), Expand makes it wide, and graphs stay
    between questions. It loads in the background when a test opens, so it's ready when you press it.
  - Reference sheet in a draggable, resizable window that always stays on screen.
  - Question header: number box, Mark for Review, "ABC" answer elimination.
  - Multiple-choice answer boxes, and a grid-in answer box with live Answer Preview. The grid-in entry rules are in the Directions dropdown.
  - Bottom bar: your name (entered on the start screen before an exam or timed set), a "Question X of Y" navigator, Back/Next.
  - A "Check Your Work" page at the end of each module.
- **Practice mode** (`/practice`): click Check to see Correct/Incorrect, the correct answer, the explanation and your time on the question.
- **Exam mode** (`/exam`): 2 modules × 22 questions × 35 minutes. No feedback during the test. Optional adaptive Module 2 (harder or easier based on Module 1). Auto-submits at 0:00. Results page with raw score, accuracy by domain and skill, and every question with its explanation.
- **Grid-in checking** (`src/lib/grid.ts`) follows SAT entry rules:
  - Max 5 characters, or 6 with a negative sign.
  - Fractions and decimals both count, as do equivalent forms (3/4 = .75 = 0.75).
  - Long decimals are accepted only when truncated or rounded to fill the box.
  - Questions can have several correct answers.

## Question bank (Phase 2)

`/bank` (**Practice** in the menu) opens on the four sections, **Algebra, Advanced Math, Geometry and
Problem Solving**, each drawn as a glass folder (`src/components/ui/glass-folder-cards.tsx`). Hover one
and its glass leans forward. Click it, or press Enter, and its sheets fan out: the biggest topics, with
"All N topics" at the front. Pick a sheet to open that topic's list. **Sections** at the top of the list
(or the browser's Back) returns to the folders, and **All N questions** (`/bank?all`) skips them. Links
with filters, such as Redo missed or a Stats "Practice" link, go straight to the list.

The list has one row of filter menus: status
(unanswered, incorrect, correct, marked for review), topic (domain and skill), type, and difficulty and
source once there's more than one of them. Filters combine (OR inside a group, AND across groups) and
live in the URL, so `/bank?status=incorrect&domain=Advanced+Math&difficulty=Hard` is a
link to "hard Advanced Math questions I got wrong".

From any filter, start a set of N questions:
- **Practice**: Check after each question, as above.
- **Timed**: one module with Bluebook timing (35 min per 22 questions, rounded up), no feedback until
  you submit, then a results page.

**By number:** type question numbers in the `#` box, like `10-20`, `34`, or `1-5, 12`, to practice just
those, in book order. Numbers restart in each chapter, so pick a Topic (Algebra or Advanced Math) to
choose one; otherwise the list shows both, under chapter headings. The numbers go in the URL too
(`/bank?domain=Algebra&num=10-20`).

Status uses your most recent attempt: "Incorrect" means you got it wrong the last time you answered it.
Click a question to see its skill, the full question, the answer and explanation, and every attempt.

## Progress (Phase 4)

- **Stats** (`/stats`), scoped by one period filter (all time, last 30 days, last 7 days):
  - estimated SAT Math score from the latest full exam, with its range and the change since the exam before
  - questions answered, accuracy, and time per question against SAT pace (35 min / 22 questions ≈ 1:35)
  - one chart with a switch: accuracy or questions answered per day or week, or the score estimate per
    exam (with a "Show as table" view)
  - weakest skills (at least 3 answers each), each with a "Practice" link to the bank filtered to that
    skill's missed and unanswered questions
  - under "More detail": days practiced and streak, questions not tried yet, accuracy by domain, every
    skill, difficulty, practice vs tests, and the slowest questions
- **History** (the second tab under Stats, `/history`): every finished exam, timed set and practice set,
  filterable, linking to results.
- **Results** pages lead with the score (and the estimate for full exams), then the questions you missed;
  the breakdown by domain and skill is folded below. Slow questions are marked, and there are links to
  practice the missed ones or drill the skill missed most.

**Score estimate** (`src/lib/score.ts`): College Board doesn't publish a raw-to-scaled table for the
adaptive test, so the estimate follows typical Bluebook practice-test ranges, scaled to 44 questions.
The harder Module 2 can reach 800; the easier one tops out near 650. Shown with a ±30 range.

## Question data

Built-in questions live in `src/data/` as TypeScript; uploaded ones are stored in the database. Both use the same small markup:

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
3. ~~Upload PDF/image/DOCX → extraction (Gemini) → side-by-side review → publish~~
4. ~~Full results history and stats page (accuracy by domain/skill, weakest areas)~~
