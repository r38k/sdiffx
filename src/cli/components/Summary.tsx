import React from 'react';
import { Box, Text } from 'ink';
import { DiffResult } from '../../diff/types.js';

interface SummaryProps {
  diffs: DiffResult;
}

export const Summary: React.FC<SummaryProps> = ({ diffs }) => {
  const { added, removed, unchanged, total } = diffs.summary;

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Text bold>Diff Summary</Text>
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text>Total entries: </Text>
          <Text bold>{total}</Text>
        </Box>
        <Box>
          <Text color="green">Added: </Text>
          <Text bold color="green">
            {added}
          </Text>
        </Box>
        <Box>
          <Text color="red">Removed: </Text>
          <Text bold color="red">
            {removed}
          </Text>
        </Box>
        <Box>
          <Text color="gray">Unchanged: </Text>
          <Text bold color="gray">
            {unchanged}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
