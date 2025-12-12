/**
 * Recolor (fill/stroke) of a Lottie JSON by replacing any color arrays `k: [r,g,b,a]` (0..1)
 * found under keys `c` (commonly used by `fl`/`st` items).
 *
 * This is a best-effort transform that keeps the animation structure intact.
 */
export function recolorLottie(animationData: unknown, hexColor: string): unknown {
  const rgba = hexToLottieRGBA(hexColor);
  const cloned = deepClone(animationData);
  walk(cloned, (node) => {
    // Lottie colors usually appear as: { c: { a: 0, k: [r,g,b,a] } }
    // or: { c: { k: [r,g,b,a] } }
    const maybeColor = (node as Record<string, unknown>)?.c as
      | { k?: unknown; a?: unknown }
      | undefined;

    if (!maybeColor || typeof maybeColor !== "object") return;
    const k = (maybeColor as { k?: unknown }).k;
    if (isLottieColorArray(k)) {
      (maybeColor as { k: number[] }).k = rgba;
    }
  });
  return cloned;
}

/**
 * Recolor using a 2-tone palette to match the project's style:
 * - "neutral" strokes/fills (near-grayscale) -> neutralHex (default: #7c7c8a)
 * - everything else -> accentHex (default: #8257e5)
 *
 * This preserves the dual-tone look seen in existing animations like `grafico-de-barras.json` and `html.json`.
 */
export function recolorLottiePalette(
  animationData: unknown,
  opts: { accentHex: string; neutralHex?: string }
): unknown {
  const accent = hexToLottieRGBA(opts.accentHex);
  const neutral = hexToLottieRGBA(opts.neutralHex ?? "#7c7c8a");

  const cloned = deepClone(animationData);
  walk(cloned, (node) => {
    const maybeColor = (node as Record<string, unknown>)?.c as
      | { k?: unknown; a?: unknown }
      | undefined;
    if (!maybeColor || typeof maybeColor !== "object") return;

    const k = (maybeColor as { k?: unknown }).k;
    if (!isLottieColorArray(k)) return;

    const current = k;
    (maybeColor as { k: number[] }).k = isNeutralColor(current) ? neutral : accent;
  });
  return cloned;
}

function hexToLottieRGBA(hex: string): number[] {
  const cleaned = hex.trim().replace(/^#/, "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  if (full.length !== 6) {
    // Fallback to rocket primary if invalid
    return [0.5098, 0.3412, 0.898, 1]; // #8257e5
  }

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r / 255, g / 255, b / 255, 1];
}

function isLottieColorArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((n) => typeof n === "number") &&
    value[0] >= 0 &&
    value[0] <= 1 &&
    value[1] >= 0 &&
    value[1] <= 1 &&
    value[2] >= 0 &&
    value[2] <= 1 &&
    value[3] >= 0 &&
    value[3] <= 1
  );
}

function isNeutralColor(rgba: number[]): boolean {
  const [r, g, b] = rgba;
  // Near-grayscale heuristic: keep the "stroke gray" as neutral.
  // Tolerance chosen to match the typical Lottie gray used across our animations.
  const tol = 0.035;
  return Math.abs(r - g) <= tol && Math.abs(g - b) <= tol && Math.abs(r - b) <= tol;
}

function deepClone<T>(value: T): T {
  // Prefer structuredClone when available (browser / modern runtimes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sc = (globalThis as any)?.structuredClone as ((v: T) => T) | undefined;
  if (typeof sc === "function") return sc(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function walk(value: unknown, visitor: (node: unknown) => void): void {
  if (!value || typeof value !== "object") return;
  visitor(value);

  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    walk((value as Record<string, unknown>)[key], visitor);
  }
}


