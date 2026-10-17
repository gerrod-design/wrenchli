export interface UnsplashCandidateLike {
  alt_description?: string | null;
  description?: string | null;
  tags?: Array<{ title?: string | null } | string> | null;
}

export interface PhotoMatchContext {
  make: string;
  model: string;
  trim?: string | null;
  bodyType?: string | null;
}

function buildHaystack(candidate: UnsplashCandidateLike): string {
  const parts: string[] = [];
  if (candidate.alt_description) parts.push(candidate.alt_description);
  if (candidate.description) parts.push(candidate.description);
  if (candidate.tags) {
    for (const tag of candidate.tags) {
      if (typeof tag === "string") {
        parts.push(tag);
      } else if (tag && tag.title) {
        parts.push(tag.title);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

function getModelTokens(model: string): string[] {
  const stopWords = new Set(["class", "series", "car"]);
  return model
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !stopWords.has(t));
}

function hasModelMatch(haystack: string, ctx: PhotoMatchContext): boolean {
  const modelTokens = getModelTokens(ctx.model);
  return modelTokens.some((token) => haystack.includes(token));
}

export function scorePhotoCandidate(
  candidate: UnsplashCandidateLike,
  ctx: PhotoMatchContext
): number {
  const haystack = buildHaystack(candidate);
  let score = 0;

  if (hasModelMatch(haystack, ctx)) {
    score += 10;
  }

  const makeToken = ctx.make.toLowerCase().split(/[^a-z0-9]+/)[0];
  if (makeToken && haystack.includes(makeToken)) {
    score += 2;
  }

  const trimAndModel = `${ctx.trim ?? ""} ${ctx.model}`;
  const isGranCoupeContext = /gran\s*coupe|gran\s*coupé|\bGC\b/i.test(trimAndModel);
  if (isGranCoupeContext) {
    if (haystack.includes("gran coupe") || haystack.includes("gran coupé")) {
      score += 8;
    } else if (haystack.includes("coupe") || haystack.includes("coupé")) {
      score -= 6;
    }
  }

  if (ctx.bodyType === "suv") {
    if (haystack.includes("suv")) score += 6;
    if (haystack.includes("sedan")) score -= 6;
    if (haystack.includes("coupe") || haystack.includes("coupé")) score -= 4;
  }

  return score;
}

export type BodyClass =
  | "suv" | "gran-coupe" | "coupe" | "sedan" | "hatchback"
  | "convertible" | "truck" | "minivan" | "wagon" | "unknown";

export function getVehicleBodyClass(ctx: PhotoMatchContext): BodyClass {
  const trimAndModel = `${ctx.trim ?? ""} ${ctx.model}`;
  if (/gran\s*coupe|gran\s*coupé|\bGC\b/i.test(trimAndModel)) {
    return "gran-coupe";
  }

  const normalized = (ctx.bodyType ?? "").toLowerCase();
  if (!normalized) return "unknown";

  if (normalized.includes("gran coupe") || normalized.includes("gran coupé")) {
    return "gran-coupe";
  }
  if (/suv|sport utility|\bmpv\b|crossover/.test(normalized)) {
    return "suv";
  }
  if (/coupe|coupé/.test(normalized)) {
    return "coupe";
  }
  if (/convertible|cabriolet|roadster|spyder/.test(normalized)) {
    return "convertible";
  }
  if (/hatch/.test(normalized)) {
    return "hatchback";
  }
  if (/truck|pickup/.test(normalized)) {
    return "truck";
  }
  if (/minivan/.test(normalized)) {
    return "minivan";
  }
  if (/wagon|estate/.test(normalized)) {
    return "wagon";
  }
  if (/sedan|saloon/.test(normalized)) {
    return "sedan";
  }

  return "unknown";
}

export function classifyCandidateBody(candidate: UnsplashCandidateLike): BodyClass {
  const haystack = buildHaystack(candidate);
  if (!haystack) return "unknown";

  if (/gran\s*coupe|gran\s*coupé/.test(haystack)) {
    return "gran-coupe";
  }

  const withoutGranCoupe = haystack.replace(/gran\s*coupé?/gi, "");
  if (/\bcoupe\b|\bcoupé\b/.test(withoutGranCoupe)) {
    return "coupe";
  }

  if (/\bsuv\b|sport utility|\bcrossover\b/.test(haystack)) {
    return "suv";
  }
  if (/\bconvertible\b|\bcabriolet\b|\broadster\b/.test(haystack)) {
    return "convertible";
  }
  if (/\bhatchback\b/.test(haystack)) {
    return "hatchback";
  }
  if (/\bpickup\b/.test(haystack)) {
    return "truck";
  }
  if (/\bminivan\b/.test(haystack)) {
    return "minivan";
  }
  if (/\bwagon\b/.test(haystack)) {
    return "wagon";
  }
  if (/\bsedan\b|\bsaloon\b/.test(haystack)) {
    return "sedan";
  }

  return "unknown";
}

export function pickBestPhoto<T extends UnsplashCandidateLike>(
  candidates: T[],
  ctx: PhotoMatchContext
): T | null {
  if (!candidates || candidates.length === 0) return null;

  // Scoring alone could still pick a photo of the wrong body style if it happened
  // to score well on make/model text (e.g. a sedan winning for an SUV listing).
  // So before scoring, hard-exclude any candidate whose detected body class
  // conflicts with the vehicle's known body class. Unknown-signal candidates
  // (badge close-ups, etc.) are kept since they aren't a confirmed mismatch.
  const vehicleClass = getVehicleBodyClass(ctx);

  let pool: T[] = candidates;
  if (vehicleClass !== "unknown") {
    const classified = candidates.map((c) => classifyCandidateBody(c));
    const hasMatch = classified.some((cls) => cls === vehicleClass);
    if (hasMatch) {
      pool = candidates.filter(
        (_, i) => classified[i] === vehicleClass || classified[i] === "unknown"
      );
    }
    // If nothing matches the vehicle's body class, fall back to the full pool
    // rather than returning no photo at all.
  }

  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < pool.length; i++) {
    const score = scorePhotoCandidate(pool[i], ctx);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return pool[bestIndex];
}
