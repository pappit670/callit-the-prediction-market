// src/lib/marketValidator.ts
// Pure-TypeScript market validation engine for Callit.
//
// Provides:
//   normalizeQuestion()  — rewrites to "Will [event] happen by [date]?"
//   scoreQuestion()      — clarity / specificity / resolvability scores
//   detectDuplicate()    — fuzzy similarity against existing questions
//   categorizeQuestion() — keyword-based topic auto-assignment
//   validateMarket()     — full validation pipeline

// ── Types ──────────────────────────────────────────────────────
export interface ValidationScore {
  clarity: number;       // 0–10: how clear and unambiguous the question is
  specificity: number;   // 0–10: how specific (has date, named entity, measurable outcome)
  resolvability: number; // 0–10: can it be objectively resolved?
  total: number;         // 0–10: weighted average
}

export interface ValidationResult {
  passed: boolean;
  normalized: string;
  score: ValidationScore;
  category: string;
  categorySlug: string;
  errors: string[];
  warnings: string[];
  duplicateOf?: string; // ID of similar existing question
  duplicateSimilarity?: number;
}

// ── Category definitions ────────────────────────────────────────
const CATEGORIES = [
  {
    name: "Politics — Kenya", slug: "politics-kenya",
    keywords: ["kenya", "ruto", "raila", "odinga", "nairobi", "parliament", "mp", "senator", "bbi", "jubilee", "odm"],
  },
  {
    name: "Politics — USA", slug: "politics-usa",
    keywords: ["trump", "biden", "harris", "congress", "senate", "election", "democrat", "republican", "white house", "us president"],
  },
  {
    name: "Politics — Elections", slug: "politics-elections",
    keywords: ["election", "vote", "ballot", "polling", "candidate", "primary", "runoff", "referendum"],
  },
  {
    name: "Football — EPL", slug: "epl",
    keywords: ["premier league", "epl", "arsenal", "chelsea", "manchester", "liverpool", "tottenham", "city"],
  },
  {
    name: "Football — UCL", slug: "ucl",
    keywords: ["champions league", "ucl", "europa", "real madrid", "barcelona", "juventus", "psg", "bayern"],
  },
  {
    name: "Football — KPL", slug: "kpl",
    keywords: ["kpl", "gor mahia", "afc leopards", "tusker", "bandari", "sofapaka", "kenya premier"],
  },
  {
    name: "Basketball — NBA", slug: "nba",
    keywords: ["nba", "lakers", "warriors", "celtics", "lebron", "curry", "nba finals", "basketball"],
  },
  {
    name: "Crypto — Bitcoin", slug: "crypto-bitcoin",
    keywords: ["bitcoin", "btc", "satoshi", "block halving", "bitcoin etf"],
  },
  {
    name: "Crypto — Ethereum", slug: "crypto-ethereum",
    keywords: ["ethereum", "eth", "vitalik", "ether", "erc"],
  },
  {
    name: "Crypto — General", slug: "crypto-altcoins",
    keywords: ["crypto", "token", "defi", "nft", "blockchain", "solana", "sol", "binance", "altcoin", "web3"],
  },
  {
    name: "Technology — AI", slug: "tech-ai",
    keywords: ["ai", "artificial intelligence", "openai", "gpt", "chatgpt", "gemini", "claude", "llm", "machine learning"],
  },
  {
    name: "Technology — General", slug: "tech-startups",
    keywords: ["startup", "ipo", "funding", "valuation", "tech", "software", "app", "saas"],
  },
  {
    name: "Business — Economy", slug: "business-kenya",
    keywords: ["gdp", "inflation", "shilling", "economy", "recession", "interest rate", "cbk", "central bank"],
  },
  {
    name: "Entertainment", slug: "entertainment-film",
    keywords: ["movie", "film", "oscar", "grammy", "album", "music", "artist", "celebrity", "award"],
  },
  {
    name: "World Affairs", slug: "world-conflict",
    keywords: ["war", "conflict", "ceasefire", "ukraine", "russia", "israel", "gaza", "nato", "sanctions"],
  },
  {
    name: "Climate", slug: "world-climate",
    keywords: ["climate", "carbon", "emissions", "renewable", "solar", "netzer", "paris agreement", "cop"],
  },
  {
    name: "General", slug: "general",
    keywords: [],
  },
];

// ── Normalizer ─────────────────────────────────────────────────
const DATE_PATTERNS = [
  /\bby\s+(end of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i,
  /\bby\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i,
  /\bby\s+Q[1-4]\s+\d{4}\b/i,
  /\bby\s+\d{4}\b/i,
  /\bbefore\s+.{3,30}\b/i,
  /\bin\s+\d{4}\b/i,
];

function extractDate(q: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = q.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function extractEvent(q: string): string {
  // Remove question marks, common prefixes
  let event = q
    .replace(/\?+$/, "")
    .replace(/^(will\s+|is\s+|does\s+|did\s+|can\s+|could\s+|would\s+|shall\s+)/i, "")
    .replace(/\bby\s+.+$/i, "") // remove date tail
    .trim();

  // Ensure it ends properly
  if (!event.endsWith(".")) event = event;
  return event.charAt(0).toUpperCase() + event.slice(1).toLowerCase();
}

export function normalizeQuestion(raw: string): string {
  const trimmed = raw.trim().replace(/\?+$/, "").trim();
  const date = extractDate(trimmed);

  // If already in "Will X happen by Y?" format, clean it up
  if (/^will\s+/i.test(trimmed)) {
    const clean = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return date ? `${clean}?` : `${clean}?`;
  }

  // Extract event and build normalized form
  const event = extractEvent(trimmed);

  if (date) {
    return `Will ${event} happen ${date}?`;
  }

  // Try to infer a reasonable deadline clause
  return `Will ${event} happen?`;
}

// ── Scorer ─────────────────────────────────────────────────────
export function scoreQuestion(q: string): ValidationScore {
  const lower = q.toLowerCase();
  let clarity = 5;
  let specificity = 5;
  let resolvability = 5;

  // Clarity signals
  if (/^will\s+/i.test(q)) clarity += 2; // proper prediction form
  if (q.length > 30 && q.length < 200) clarity += 1;
  if (/\?$/.test(q)) clarity += 1;
  if (/\b(maybe|perhaps|possibly|might|could)\b/i.test(q)) clarity -= 2; // vague
  if (/\b(good|bad|best|worst|great|terrible)\b/i.test(q)) clarity -= 1; // subjective
  if (q.length < 20) clarity -= 2; // too short
  if (q.length > 300) clarity -= 1; // too long

  // Specificity signals
  if (extractDate(q)) specificity += 2; // has date
  if (/\b\d+\b/.test(q)) specificity += 1; // has number
  if (/\b(percent|%|\$|million|billion|trillion|usd|ksh)\b/i.test(q)) specificity += 1;
  if (/\b(president|prime minister|ceo|chairman|governor)\b/i.test(q)) specificity += 1;
  if (/\b(who|what|where|when)\b/i.test(lower)) specificity += 1;
  if (/\b(someone|someplace|somehow|something)\b/i.test(lower)) specificity -= 2;

  // Resolvability signals
  if (/\b(announced|confirmed|signed|launched|released|published|elected|approved|rejected)\b/i.test(lower))
    resolvability += 2;
  if (/\b(source|data|verified|official|report|via)\b/i.test(lower)) resolvability += 1;
  if (extractDate(q)) resolvability += 1; // has deadline
  if (/\b(feel|believe|think|opinion|subjective)\b/i.test(lower)) resolvability -= 3;
  if (/\b(ever|never|always|forever)\b/i.test(lower)) resolvability -= 1;

  // Clamp all scores to 0–10
  clarity = Math.min(10, Math.max(0, clarity));
  specificity = Math.min(10, Math.max(0, specificity));
  resolvability = Math.min(10, Math.max(0, resolvability));

  const total = Math.round((clarity * 0.3 + specificity * 0.35 + resolvability * 0.35) * 10) / 10;

  return { clarity, specificity, resolvability, total };
}

// ── Duplicate Detection ────────────────────────────────────────
// Jaccard similarity on trigrams — no external API needed
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const trigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    trigrams.add(`${words[i]}_${words[i + 1]}`);
    if (i < words.length - 2) trigrams.add(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
  }
  return trigrams;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export interface DuplicateCandidate {
  id: string;
  question: string;
}

export function detectDuplicate(
  newQuestion: string,
  existing: DuplicateCandidate[],
  threshold = 0.45
): { isDuplicate: boolean; duplicateOf?: string; similarity?: number } {
  let maxSimilarity = 0;
  let duplicateId: string | undefined;

  for (const candidate of existing) {
    const similarity = jaccardSimilarity(newQuestion, candidate.question);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      duplicateId = candidate.id;
    }
  }

  return {
    isDuplicate: maxSimilarity >= threshold,
    duplicateOf: maxSimilarity >= threshold ? duplicateId : undefined,
    similarity: Math.round(maxSimilarity * 100) / 100,
  };
}

// ── Resolution Validator ────────────────────────────────────────
export interface ResolutionInfo {
  hasDeadline: boolean;
  hasClearCondition: boolean;
  hasDataSource: boolean;
  deadline?: string;
}

export function validateResolution(
  question: string,
  resolutionCondition?: string,
  endTime?: string,
  sourceUrl?: string
): ResolutionInfo {
  const hasDeadline = !!(endTime && new Date(endTime) > new Date());
  const hasClearCondition = !!(
    resolutionCondition && resolutionCondition.length > 10
  ) || /\b(announced|confirmed|elected|reaches|exceeds|drops|wins|loses)\b/i.test(question);
  const hasDataSource = !!(sourceUrl && sourceUrl.startsWith("http"));

  const deadline = extractDate(question) || (endTime ? new Date(endTime).toLocaleDateString() : undefined);

  return { hasDeadline, hasClearCondition, hasDataSource, deadline };
}

// ── Categorizer ──────────────────────────────────────────────────
export function categorizeQuestion(q: string): { name: string; slug: string } {
  const lower = q.toLowerCase();

  let bestMatch = CATEGORIES[CATEGORIES.length - 1]; // default: General
  let bestScore = 0;

  for (const category of CATEGORIES.slice(0, -1)) {
    const score = category.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return { name: bestMatch.name, slug: bestMatch.slug };
}

// ── Full Validation Pipeline ───────────────────────────────────
export function validateMarket(
  raw: string,
  options: {
    existingQuestions?: DuplicateCandidate[];
    resolutionCondition?: string;
    endTime?: string;
    sourceUrl?: string;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Basic sanity
  if (!raw || raw.trim().length < 10) {
    return {
      passed: false,
      normalized: raw,
      score: { clarity: 0, specificity: 0, resolvability: 0, total: 0 },
      category: "General",
      categorySlug: "general",
      errors: ["Question is too short or empty"],
      warnings: [],
    };
  }

  // 2. Normalize
  const normalized = normalizeQuestion(raw.trim());

  // 3. Score
  const score = scoreQuestion(normalized);
  if (score.total < 3) {
    errors.push(`Quality score too low (${score.total}/10). Improve clarity, specificity, or resolvability.`);
  } else if (score.total < 5) {
    warnings.push(`Quality score is borderline (${score.total}/10). Consider adding a date or clearer outcome.`);
  }

  // 4. Duplicate detection
  let duplicateOf: string | undefined;
  let duplicateSimilarity: number | undefined;
  if (options.existingQuestions?.length) {
    const dup = detectDuplicate(normalized, options.existingQuestions);
    if (dup.isDuplicate) {
      errors.push(`Possible duplicate detected (${Math.round((dup.similarity || 0) * 100)}% similar to an existing market).`);
      duplicateOf = dup.duplicateOf;
      duplicateSimilarity = dup.similarity;
    }
  }

  // 5. Resolution validation
  const resolution = validateResolution(
    normalized,
    options.resolutionCondition,
    options.endTime,
    options.sourceUrl
  );

  if (!resolution.hasDeadline) {
    warnings.push("No clear deadline detected. Markets with deadlines perform better.");
  }
  if (!resolution.hasClearCondition) {
    warnings.push("Resolution condition unclear. How will this market be decided?");
  }
  if (!resolution.hasDataSource) {
    warnings.push("No data source provided. Add a source URL for better trust.");
  }

  // 6. Future-only check
  if (options.endTime && new Date(options.endTime) <= new Date()) {
    errors.push("Deadline must be in the future.");
  }

  // 7. Categorize
  const category = categorizeQuestion(normalized);

  const passed = errors.length === 0 && score.total >= 3;

  return {
    passed,
    normalized,
    score,
    category: category.name,
    categorySlug: category.slug,
    errors,
    warnings,
    duplicateOf,
    duplicateSimilarity,
  };
}

// ── Score badge color ──────────────────────────────────────────
export function scoreColor(score: number): string {
  if (score >= 7) return "#22C55E";
  if (score >= 5) return "#F5C518";
  return "#DC2626";
}

export function scoreLabel(score: number): string {
  if (score >= 7) return "High Quality";
  if (score >= 5) return "Acceptable";
  return "Low Quality";
}
