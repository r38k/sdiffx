/**
 * Type definitions for diff operations
 */

export type DiffType = 'added' | 'removed' | 'unchanged';

export interface DiffEntry {
  type: DiffType;
  content: string;
  lineNumber?: number;
  position?: number;
}

export interface DiffResult {
  entries: DiffEntry[];
  summary: {
    total: number;
    added: number;
    removed: number;
    unchanged: number;
  };
}

export interface FileComparison {
  original: string;
  formatted: string;
  diffs: DiffResult;
}
