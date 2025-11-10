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
