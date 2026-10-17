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

export function pickBestPhoto<T extends UnsplashCandidateLike>(
  candidates: T[],
  ctx: PhotoMatchContext
): T | null {
  if (!candidates || candidates.length === 0) return null;

  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const score = scorePhotoCandidate(candidates[i], ctx);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return candidates[bestIndex];
}