/**
 * String replacement utilities
 */

export interface Replacement {
  original: string;
  formatted: string;
  position?: number;
  lineNumber?: number;
}

/**
 * Find replacements based on diff
 * Attempts to match removed and added entries
 */
export function findReplacements(
  original: string[],
  formatted: string[],
  removedIndices: number[],
  addedIndices: number[],
): Replacement[] {
  const replacements: Replacement[] = [];

  // Try to match consecutive removed and added entries
  let removeIdx = 0;
  let addIdx = 0;

  while (removeIdx < removedIndices.length && addIdx < addedIndices.length) {
    const origIdx = removedIndices[removeIdx];
    const formIdx = addedIndices[addIdx];

    // Check similarity (simple heuristic: similar length)
    const origLen = original[origIdx].length;
    const formLen = formatted[formIdx].length;
    const similarity = 1 - Math.abs(origLen - formLen) / Math.max(origLen, formLen);

    if (similarity > 0.3) {
      // Likely a replacement
      replacements.push({
        original: original[origIdx],
        formatted: formatted[formIdx],
        position: origIdx,
        lineNumber: origIdx + 1,
      });
      removeIdx++;
      addIdx++;
    } else {
      // No match
      if (origLen < formLen) {
        removeIdx++;
      } else {
        addIdx++;
      }
    }
  }

  return replacements;
}

/**
 * Apply replacements to text
 */
export function applyReplacementToText(
  text: string,
  replacements: Replacement[],
): string {
  let result = text;

  // Sort replacements by position (descending) to avoid index shifting
  const sorted = [...replacements].sort(
    (a, b) => (b.position || 0) - (a.position || 0),
  );

  for (const replacement of sorted) {
    // Find and replace the original string
    const idx = result.indexOf(replacement.original);
    if (idx !== -1) {
      result = result.substring(0, idx) + replacement.formatted + result.substring(idx + replacement.original.length);
    }
  }

  return result;
}
