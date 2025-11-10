import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { DiffEntry } from '../../diff/types.js';

interface DiffViewerProps {
  entries: DiffEntry[];
  onNavigate?: (index: number) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ entries, onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleInput = (ch: string) => {
      if (ch === 'j' || ch === 'n') {
        setCurrentIndex((prev) => Math.min(prev + 1, entries.length - 1));
      } else if (ch === 'k' || ch === 'p') {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      } else if (ch === 'q') {
        process.exit(0);
      }
    };

    process.stdin.on('data', (key) => {
      handleInput(key.toString());
    });

    return () => {
      process.stdin.removeAllListeners('data');
    };
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green">✓ No differences found</Text>
      </Box>
    );
  }

  const entry = entries[currentIndex];
  const isLast = currentIndex === entries.length - 1;

  const getColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'green';
      case 'removed':
        return 'red';
      case 'unchanged':
        return 'gray';
      default:
        return 'white';
    }
  };

  const getPrefix = (type: string) => {
    switch (type) {
      case 'added':
        return '+ ';
      case 'removed':
        return '- ';
      case 'unchanged':
        return '  ';
      default:
        return '  ';
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>
        Diff Viewer ({currentIndex + 1}/{entries.length})
      </Text>
      <Box marginY={1} flexDirection="column">
        <Text color={getColor(entry.type)}>
          {getPrefix(entry.type)}
          {entry.content.substring(0, 60)}
          {entry.content.length > 60 ? '...' : ''}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {!isLast
            ? 'j/n: next, k/p: prev, q: quit'
            : 'End of diff - press q to quit'}
        </Text>
      </Box>
    </Box>
  );
};
