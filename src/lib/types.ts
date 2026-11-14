export const SUBJECTS = ["Math", "Reading and Writing"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const MATH_DOMAINS = [
  "Algebra",
  "Advanced Math",
  "Problem-Solving and Data Analysis",
  "Geometry and Trigonometry",
] as const;

export const EBRW_DOMAINS = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
] as const;

export const DOMAINS = [...MATH_DOMAINS, ...EBRW_DOMAINS] as const;

export type MathDomain = (typeof MATH_DOMAINS)[number];
export type EbrwDomain = (typeof EBRW_DOMAINS)[number];
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_SUBJECT: Record<Domain, Subject> = {
  Algebra: "Math",
  "Advanced Math": "Math",
  "Problem-Solving and Data Analysis": "Math",
  "Geometry and Trigonometry": "Math",
  "Information and Ideas": "Reading and Writing",
  "Craft and Structure": "Reading and Writing",
  "Expression of Ideas": "Reading and Writing",
  "Standard English Conventions": "Reading and Writing",
};

export function subjectOf(domain: Domain): Subject {
  return DOMAIN_SUBJECT[domain];
}

export const SKILLS: Record<Domain, readonly string[]> = {
  Algebra: [
    "Linear equations in one variable",
    "Linear functions",
    "Linear equations in two variables",
    "Systems of two linear equations in two variables",
    "Linear inequalities in one or two variables",
  ],
  "Advanced Math": [
    "Nonlinear functions",
    "Nonlinear equations in one variable and systems of equations in two variables",
    "Equivalent expressions",
  ],
  "Problem-Solving and Data Analysis": [
    "Ratios, rates, proportional relationships, and units",
    "Percentages",
    "One-variable data: Distributions and measures of center and spread",
    "Two-variable data: Models and scatterplots",
    "Probability and conditional probability",
    "Inference from sample statistics and margin of error",
    "Evaluating statistical claims: Observational studies and experiments",
  ],
  "Geometry and Trigonometry": [
    "Area and volume",
    "Lines, angles, and triangles",
    "Right triangles and trigonometry",
    "Circles",
  ],
  "Information and Ideas": [
    "Central Ideas and Details",
    "Command of Evidence",
    "Inferences",
  ],
  "Craft and Structure": [
    "Words in Context",
    "Text Structure and Purpose",
    "Cross-Text Connections",
  ],
  "Expression of Ideas": [
    "Rhetorical Synthesis",
    "Transitions",
  ],
  "Standard English Conventions": [
    "Boundaries",
    "Form, Structure, and Sense",
  ],
};

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type ChoiceLetter = "A" | "B" | "C" | "D";
export const LETTERS: ChoiceLetter[] = ["A", "B", "C", "D"];

/**
 * Text fields (stem, choices, explanation) use a small markup:
 * - `$...$` inline LaTeX, `$$...$$` display LaTeX, `\$` for a literal dollar sign
 * - blank line separates blocks, a single newline is a line break
 * - `![alt](src){w=320}` image block, `| a | b |` table rows (see rich.ts)
 * - `**bold**`
 */
export type Question = {
  id: string;
  source: string;
  sourceNumber: number;
  domain: Domain;
  skill: string;
  difficulty: Difficulty;
  type: "mcq" | "spr";
  stem: string;
  /** Four choices, A–D, for multiple-choice questions. */
  choices?: string[];
  /** Correct letter for multiple-choice questions. */
  answer?: ChoiceLetter;
  /** Accepted values for grid-in (student-produced response) questions. */
  gridAnswers?: string[];
  explanation: string;
  /** Page in the source document, for the review screen. */
  page?: number;
  /** Known problem with the source question; flagged questions are left out of exams. */
  flag?: string;
  /** Set for questions that came from an uploaded file (editable in the review screen). */
  uploadId?: string;
};

/** Per-question state inside a practice set or exam module. */
export type ItemState = {
  answer?: string;
  marked?: boolean;
  crossed?: ChoiceLetter[];
  /** Milliseconds spent on this question. */
  timeMs: number;
  /** Practice mode: the answer was checked. */
  checked?: boolean;
  /** When the answer was checked (ms since epoch). */
  checkedAt?: number;
};
