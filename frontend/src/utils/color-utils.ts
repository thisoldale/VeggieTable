/**
 * Converts an HSL color string to an [h, s, l] array.
 * e.g., "hsl(210 40% 98%)" => [210, 40, 98]
 */
export function hslToNumbers(hslStr: string): [number, number, number] {
  const match = hslStr.match(/hsl\(\s*(\d+)\s+(\d+)%\s+(\d+)%\s*\)/);
  if (!match) {
    // Return a default or throw an error if the format is incorrect
    return [0, 0, 0];
  }
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Calculates the luminance of an HSL color.
 * The formula is based on the WCAG 2.0 definition.
 * It first converts HSL to RGB, then calculates luminance.
 * Returns a value between 0 (black) and 1 (white).
 */
export function getLuminance(hslStr: string): number {
  const [h, s, l] = hslToNumbers(hslStr);
  const s_norm = s / 100;
  const l_norm = l / 100;

  const a = s_norm * Math.min(l_norm, 1 - l_norm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l_norm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return color;
  };

  const r = f(0);
  const g = f(8);
  const b = f(4);

  const srgbToLinear = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
