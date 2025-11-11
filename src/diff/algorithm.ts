import diffSequencesImport from 'diff-sequences';
import { DiffEntry, DiffResult, DiffType } from './types.js';

type DiffSequencesFn = (
  aLength: number,
  bLength: number,
  isCommon: (aIndex: number, bIndex: number) => boolean,
  foundSubsequence: (nCommon: number, aCommon: number, bCommon: number) => void,
) => void;

const diffSequences: DiffSequencesFn = (() => {
  if (typeof diffSequencesImport === 'function') {
    return diffSequencesImport as DiffSequencesFn;
  }
  const maybeDefault = (diffSequencesImport as { default?: unknown }).default;
  if (typeof maybeDefault === 'function') {
    return maybeDefault as DiffSequencesFn;
  }
  if (maybeDefault && typeof (maybeDefault as { default?: unknown }).default === 'function') {
    return (maybeDefault as { default: DiffSequencesFn }).default;
  }
  throw new Error('Unable to resolve diff-sequences export');
})();

type RawOpType = 'equal' | 'insert' | 'delete';

interface RawOp {
  type: RawOpType;
  text: string;
}

interface LineCounter {
  current: number;
}

function toGraphemes(text: string): string[] {
  return Array.from(text);
}

function joinRange(chars: string[], start: number, end?: number): string {
  return chars.slice(start, end).join('');
}

function diffStrings(original: string, formatted: string): RawOp[] {
  if (original.length === 0 && formatted.length === 0) {
    return [];
  }

  const originalChars = toGraphemes(original);
  const formattedChars = toGraphemes(formatted);
  const isCommon = (aIndex: number, bIndex: number) => originalChars[aIndex] === formattedChars[bIndex];

  let aIndex = 0;
  let bIndex = 0;
  const diffs: RawOp[] = [];

  const push = (type: RawOpType, text: string) => {
    if (text.length > 0) {
      diffs.push({ type, text });
    }
  };

  const handleSubsequence = (nCommon: number, aCommon: number, bCommon: number) => {
    if (aIndex !== aCommon) {
      push('delete', joinRange(originalChars, aIndex, aCommon));
    }
    if (bIndex !== bCommon) {
      push('insert', joinRange(formattedChars, bIndex, bCommon));
    }
    if (nCommon > 0) {
      push('equal', joinRange(formattedChars, bCommon, bCommon + nCommon));
    }
    aIndex = aCommon + nCommon;
    bIndex = bCommon + nCommon;
  };

  diffSequences(originalChars.length, formattedChars.length, isCommon, handleSubsequence);

  if (aIndex < originalChars.length) {
    push('delete', joinRange(originalChars, aIndex));
  }
  if (bIndex < formattedChars.length) {
    push('insert', joinRange(formattedChars, bIndex));
  }

  return diffs;
}

function emitEntries(
  type: DiffType,
  chunk: string,
  counter: LineCounter,
  entries: DiffEntry[],
): number {
  if (chunk.length === 0) {
    return 0;
  }
  const lines = chunk.split('\n');
  let emitted = 0;
  for (const line of lines) {
    const content = line.trim();
    if (content.length === 0) {
      continue;
    }
    entries.push({ type, content, lineNumber: counter.current });
    counter.current += 1;
    emitted += 1;
  }
  return emitted;
}

function convertToDiffEntries(operations: RawOp[]): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const originalCounter: LineCounter = { current: 1 };
  const formattedCounter: LineCounter = { current: 1 };

  for (const op of operations) {
    switch (op.type) {
      case 'equal': {
        const emitted = emitEntries('unchanged', op.text, originalCounter, entries);
        formattedCounter.current += emitted;
        break;
      }
      case 'delete': {
        emitEntries('removed', op.text, originalCounter, entries);
        break;
      }
      case 'insert': {
        emitEntries('added', op.text, formattedCounter, entries);
        break;
      }
    }
  }

  return entries;
}

function summarize(entries: DiffEntry[]): DiffResult['summary'] {
  const summary = {
    total: entries.length,
    added: 0,
    removed: 0,
    unchanged: 0,
  };

  for (const entry of entries) {
    switch (entry.type) {
      case 'added':
        summary.added += 1;
        break;
      case 'removed':
        summary.removed += 1;
        break;
      case 'unchanged':
        summary.unchanged += 1;
        break;
    }
  }

  return summary;
}

export function generateDiffMyers(original: string, formatted: string): DiffResult {
  const rawOps = diffStrings(original, formatted);
  const entries = convertToDiffEntries(rawOps);
  const summary = summarize(entries);
  return { entries, summary };
}
