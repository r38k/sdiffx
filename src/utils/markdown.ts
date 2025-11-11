/**
 * Markdown parsing and stripping utilities
 */

/**
 * Remove markdown syntax from text
 * Handles: headers (#), bold (**), italic (*), code blocks, links, etc.
 */
export function stripMarkdown(text: string): string {
  let result = text;

  // Remove headers (# ## ### etc.)
  result = result.replace(/^#+\s+/gm, '');

  // Remove bold (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/__(.+?)__/g, '$1');

  // Remove italic (*text* or _text_)
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/_(.+?)_/g, '$1');

  // Remove inline code (`code`)
  result = result.replace(/`(.+?)`/g, '$1');

  // Remove code blocks (```code```)
  result = result.replace(/```[\s\S]*?```/g, '');

  // Remove links [text](url)
  result = result.replace(/\[(.+?)\]\(.+?\)/g, '$1');

  // Remove reference links [text][ref]
  result = result.replace(/\[(.+?)\]\[.+?\]/g, '$1');

  // Remove horizontal rules (---, ***, ___)
  result = result.replace(/^(\-\-\-|\*\*\*|___)\s*$/gm, '');

  // Remove list markers (-, *, +)
  result = result.replace(/^[\s]*[\-\*\+]\s+/gm, '');

  // Remove blockquote markers (>)
  result = result.replace(/^>\s*/gm, '');

  // Remove HTML tags
  result = result.replace(/<[^>]+>/g, '');

  // Remove multiple consecutive spaces
  result = result.replace(/  +/g, ' ');

  return result;
}

/**
 * Split text into sentences based on whitespace and newlines
 * Preserves the actual sentence content without delimiters
 */
export function splitBySentence(text: string): string[] {
  // Split by newlines first
  const lines = text.split('\n');

  const sentences: string[] = [];

  for (const line of lines) {
    if (line.trim().length === 0) {
      // Keep empty lines as separate entries to preserve structure
      if (sentences.length > 0 && sentences[sentences.length - 1] !== '') {
        sentences.push('');
      }
      continue;
    }

    // Split by multiple spaces or tabs
    const parts = line.split(/\s{2,}|\t+/);

    for (const part of parts) {
      if (part.trim().length > 0) {
        sentences.push(part.trim());
      }
    }
  }

  // Remove trailing empty lines
  while (sentences.length > 0 && sentences[sentences.length - 1] === '') {
    sentences.pop();
  }

  return sentences;
}

/**
 * Normalize text for comparison: strip markdown and normalize whitespace
 */
export function normalizeForComparison(text: string): string {
  let normalized = stripMarkdown(text);
  // Normalize whitespace but preserve newlines for structure
  normalized = normalized.replace(/[ \t]+/g, ' ').trim();
  return normalized;
}

/**
 * Prepare a document for diffing by collapsing soft line breaks and stripping markdown
 */
interface ParagraphBlock {
  normalized: string;
  display: string;
}

function splitIntoBlocks(text: string): string[] {
  const normalizedBreaks = text.replace(/\r\n?|\f/g, '\n');
  return normalizedBreaks.split(/\n{2,}/);
}

function cleanIntraLineWhitespace(block: string): string {
  return block.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildParagraphBlocks(text: string): ParagraphBlock[] {
  const blocks: ParagraphBlock[] = [];
  for (const rawBlock of splitIntoBlocks(text)) {
    const trimmed = rawBlock.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = cleanIntraLineWhitespace(stripMarkdown(trimmed));
    const display = cleanIntraLineWhitespace(trimmed);
    if (normalized.length === 0 && display.length === 0) {
      continue;
    }
    blocks.push({ normalized, display });
  }
  return blocks;
}

export function normalizeDocumentText(text: string): string {
  const blocks = buildParagraphBlocks(text);
  return blocks
    .map((block) => block.normalized)
    .filter((block) => block.length > 0)
    .join('\n');
}

export interface ParagraphMapping {
  normalized: string;
  display: string;
}

export function extractParagraphMappings(text: string): ParagraphMapping[] {
  return buildParagraphBlocks(text);
}

/**
 * Normalize a single line for better matching
 * Removes trailing punctuation and extra whitespace
 */
export function normalizeLine(line: string): string {
  let normalized = line.normalize('NFKC');
  // Normalize various whitespace characters (ideographic, non-breaking)
  normalized = normalized.replace(/[\u00A0\u2000-\u200B\u3000]/g, ' ');
  // Normalize dash-like characters to ASCII hyphen-minus
  normalized = normalized.replace(/[‐‑‒–—―−ー]/g, '-');
  // Normalize wave/tilda variants
  normalized = normalized.replace(/[〜～]/g, '~');
  normalized = normalized.trim();
  // Remove trailing punctuation (。, 、, etc.)
  normalized = normalized.replace(/[。、，：；？！]+$/, '');
  // Remove unintended single spaces between adjacent CJK/digit characters
  normalized = normalized.replace(/(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}0-9]) (?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}0-9])/gu, '');
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}
