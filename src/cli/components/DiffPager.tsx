import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput, useStdout, useStdin } from 'ink';
import ansiEscapes from 'ansi-escapes';
import { DiffEntry } from '../../diff/types.js';

interface DiffPagerProps {
  entries: DiffEntry[];
  height?: number;
  title?: string;
  enableQuit?: boolean;
  onExit?: () => void;
}

const TYPE_PREFIX: Record<DiffEntry['type'], string> = {
  added: '+',
  removed: '-',
  unchanged: ' ',
};

const ACTIVE_COLOR: Record<DiffEntry['type'], AnsiColor> = {
  added: 'greenBright',
  removed: 'redBright',
  unchanged: 'white',
};

const INACTIVE_COLOR: Record<DiffEntry['type'], AnsiColor> = {
  added: 'green',
  removed: 'red',
  unchanged: 'gray',
};

const LINE_NUMBER_WIDTH = 5;
const CONTENT_WIDTH = 100;
const POINTER_WIDTH = 3; // e.g. "> +"
const TOTAL_WIDTH = LINE_NUMBER_WIDTH + 3 + POINTER_WIDTH + 1 + CONTENT_WIDTH;
const DEFAULT_HEIGHT = 25;
const PLACEHOLDER_CHAR = ' ';

type AnsiColor =
  | 'red'
  | 'redBright'
  | 'green'
  | 'greenBright'
  | 'gray'
  | 'white'
  | 'cyanBright';

const ANSI_CODES: Record<AnsiColor, string> = {
  red: '\u001B[31m',
  redBright: '\u001B[91m',
  green: '\u001B[32m',
  greenBright: '\u001B[92m',
  gray: '\u001B[90m',
  white: '\u001B[37m',
  cyanBright: '\u001B[96m',
};

const RESET = '\u001B[0m';
const BOLD = '\u001B[1m';
const DIM = '\u001B[2m';

function colorize(text: string, color: AnsiColor, options?: { bold?: boolean; dim?: boolean }): string {
  const codes: string[] = [];
  if (options?.bold) {
    codes.push(BOLD);
  }
  if (options?.dim) {
    codes.push(DIM);
  }
  codes.push(ANSI_CODES[color]);
  return `${codes.join('')}${text}${RESET}`;
}

function padLine(text: string): string {
  if (text.length >= TOTAL_WIDTH) {
    return text.slice(0, TOTAL_WIDTH);
  }
  return text.padEnd(TOTAL_WIDTH, PLACEHOLDER_CHAR);
}

function truncateContent(text: string): string {
  if (text.length <= CONTENT_WIDTH) {
    return text.padEnd(CONTENT_WIDTH, PLACEHOLDER_CHAR);
  }
  return `${text.slice(0, CONTENT_WIDTH - 1)}…`;
}

function renderEntryLine(entry: DiffEntry, absoluteIndex: number, cursor: number): string {
  const isActive = absoluteIndex === cursor;
  const pointer = isActive ? '>' : ' ';
  const prefix = TYPE_PREFIX[entry.type];
  const snippet = truncateContent(entry.content.replace(/\n/g, ' '));
  const lineNumber = (entry.lineNumber ?? absoluteIndex + 1).toString().padStart(LINE_NUMBER_WIDTH, ' ');
  const numberPart = colorize(lineNumber, 'gray');
  const typeColor = isActive ? ACTIVE_COLOR[entry.type] : INACTIVE_COLOR[entry.type];
  const dim = entry.type === 'unchanged';
  const body = colorize(`${pointer} ${prefix} ${snippet}`, typeColor, { dim });
  return `${numberPart} | ${body}`;
}

function buildFrame(
  entries: DiffEntry[],
  cursor: number,
  offset: number,
  windowSize: number,
  title: string,
  enableQuit: boolean,
): string {
  const total = entries.length;
  const lines: string[] = [];
  const headerLabel = total === 0 ? `${title} (0/0)` : `${title} (${cursor + 1}/${total})`;
  lines.push(colorize(padLine(headerLabel), 'cyanBright', { bold: true }));
  const rangeLabel = total === 0 ? 'No differences' : `${offset + 1} - ${Math.min(offset + windowSize, total)} of ${total}`;
  lines.push(colorize(padLine(rangeLabel), 'gray'));
  lines.push(colorize(padLine('─'.repeat(TOTAL_WIDTH)), 'gray'));

  for (let idx = 0; idx < windowSize; idx++) {
    const absoluteIndex = offset + idx;
    const entry = entries[absoluteIndex];
    if (entry) {
      lines.push(renderEntryLine(entry, absoluteIndex, cursor));
    } else {
      lines.push(' '.repeat(TOTAL_WIDTH));
    }
  }

  const instructions = enableQuit
    ? '↑/↓ or j/k scroll · PgUp/PgDn jump · g/G start/end · q exit'
    : '↑/↓ or j/k scroll · PgUp/PgDn jump · g/G start/end';
  lines.push(colorize(padLine(instructions), 'gray', { dim: true }));

  return lines.join('\n');
}

const PLACEHOLDER_CACHE: Record<number, string> = {};

function getPlaceholderLines(lineCount: number): string {
  if (!PLACEHOLDER_CACHE[lineCount]) {
    const blankLine = PLACEHOLDER_CHAR.repeat(TOTAL_WIDTH);
    PLACEHOLDER_CACHE[lineCount] = Array.from({ length: lineCount }, () => blankLine).join('\n');
  }
  return PLACEHOLDER_CACHE[lineCount];
}

export const DiffPager: React.FC<DiffPagerProps> = ({
  entries,
  height = DEFAULT_HEIGHT,
  title = 'Differences',
  enableQuit = false,
  onExit,
}) => {
  const windowSize = Math.max(1, height);
  const frameLines = windowSize + 4;
  const [cursor, setCursor] = useState(0);
  const [offset, setOffset] = useState(0);
  const { stdout } = useStdout();
  const { stdin } = useStdin();
  const interactive = Boolean(stdin?.isTTY && stdout?.isTTY);

  useEffect(() => {
    setCursor(0);
    setOffset(0);
  }, [entries.length, windowSize]);

  const clampCursor = (value: number) => {
    if (entries.length === 0) {
      return 0;
    }
    return Math.min(Math.max(value, 0), entries.length - 1);
  };

  const updateCursor = (next: number) => {
    const clamped = clampCursor(next);
    if (clamped === cursor) {
      return;
    }
    setCursor(clamped);
    if (clamped < offset) {
      setOffset(clamped);
    } else if (clamped >= offset + windowSize) {
      setOffset(clamped - windowSize + 1);
    }
  };

  const moveCursor = (delta: number) => {
    if (entries.length === 0) {
      return;
    }
    updateCursor(cursor + delta);
  };

  const jumpToStart = () => {
    if (entries.length === 0) {
      return;
    }
    setCursor(0);
    setOffset(0);
  };

  const jumpToEnd = () => {
    if (entries.length === 0) {
      return;
    }
    const last = entries.length - 1;
    setCursor(last);
    setOffset(Math.max(0, last - windowSize + 1));
  };

  const handleQuit = () => {
    if (enableQuit && onExit) {
      onExit();
    }
  };

  useInput(
    (input, key) => {
      if (!interactive) {
        return;
      }
      if (entries.length === 0) {
        if (enableQuit && input === 'q') {
          handleQuit();
        }
        return;
      }
      if (key.downArrow || input === 'j') {
        moveCursor(1);
      } else if (key.upArrow || input === 'k') {
        moveCursor(-1);
      } else if (key.pageDown || input === 'f') {
        moveCursor(windowSize);
      } else if (key.pageUp || input === 'b') {
        moveCursor(-windowSize);
      } else if (input === 'g') {
        jumpToStart();
      } else if (input === 'G') {
        jumpToEnd();
      } else if (enableQuit && input === 'q') {
        handleQuit();
      }
    },
    { isActive: interactive },
  );

  const frameString = useMemo(() => {
    if (!interactive) {
      return '';
    }
    return buildFrame(entries, cursor, offset, windowSize, title, enableQuit);
  }, [interactive, entries, cursor, offset, windowSize, title, enableQuit]);

  useEffect(() => {
    if (!interactive || !stdout || frameString.length === 0) {
      return;
    }
    const moveUp = frameLines > 1 ? ansiEscapes.cursorUp(frameLines - 1) : '';
    stdout.write(`${moveUp}${ansiEscapes.cursorTo(0)}${frameString}`);
  }, [interactive, stdout, frameString, frameLines]);

  const placeholder = useMemo(() => getPlaceholderLines(frameLines), [frameLines]);

  if (interactive) {
    return (
      <Box flexDirection="column">
        <Text>{placeholder}</Text>
      </Box>
    );
  }

  const maxLines = windowSize;
  const visibleEntries = useMemo(() => entries.slice(0, maxLines), [entries, maxLines]);
  const remaining = Math.max(entries.length - maxLines, 0);

  const getColor = (type: DiffEntry['type']) => {
    switch (type) {
      case 'added':
        return 'greenBright' as const;
      case 'removed':
        return 'redBright' as const;
      case 'unchanged':
      default:
        return 'gray' as const;
    }
  };

  return (
    <Box flexDirection="column">
      {visibleEntries.map((entry, idx) => (
        <Box key={idx}>
          <Text color={getColor(entry.type)}>
            {TYPE_PREFIX[entry.type]} {entry.content.length > CONTENT_WIDTH ? `${entry.content.slice(0, CONTENT_WIDTH - 1)}…` : entry.content}
          </Text>
        </Box>
      ))}
      {remaining > 0 && (
        <Box marginTop={1}>
          <Text dimColor>... and {remaining} more entries</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>
          Non-interactive mode: run inside a real terminal to enable scrolling
          {enableQuit ? ' · q exits when interactive' : ''}
        </Text>
      </Box>
    </Box>
  );
};
