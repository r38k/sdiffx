import React from 'react';
import { Box, Text } from 'ink';
import { DiffEntry } from '../../diff/types.js';

interface DiffListProps {
  entries: DiffEntry[];
  maxLines?: number;
}

export const DiffList: React.FC<DiffListProps> = ({ entries, maxLines = 10 }) => {
  if (entries.length === 0) {
    return (
      <Box padding={1}>
        <Text color="green">✓ No differences found</Text>
      </Box>
    );
  }

  const displayEntries = entries.slice(0, maxLines);
  const remaining = entries.length - maxLines;

  const getColor = (type: string): string => {
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

  const getPrefix = (type: string): string => {
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
      {displayEntries.map((entry, idx) => (
        <Box key={idx}>
          <Text color={getColor(entry.type)}>
            {getPrefix(entry.type)}
            {entry.content.length > 70
              ? entry.content.substring(0, 67) + '...'
              : entry.content}
          </Text>
        </Box>
      ))}
      {remaining > 0 && (
        <Box marginTop={1}>
          <Text dimColor>... and {remaining} more entries</Text>
        </Box>
      )}
    </Box>
  );
};
