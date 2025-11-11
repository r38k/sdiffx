import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { compareFiles } from '../core/processor.js';
import { Summary } from './components/Summary.js';
import { DiffPager } from './components/DiffPager.js';
import { FileComparison } from '../diff/types.js';

interface AppProps {
  originalFile: string;
  formattedFile: string;
}

export const App: React.FC<AppProps> = ({ originalFile, formattedFile }) => {
  const [state, setState] = useState<'loading' | 'display' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<FileComparison | null>(null);

  useEffect(() => {
    try {
      const result = compareFiles(originalFile, formattedFile);
      setComparison(result);
      setState('display');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setState('error');
    }
  }, [originalFile, formattedFile]);

  if (state === 'loading') {
    return (
      <Box padding={1}>
        <Text>Loading files...</Text>
      </Box>
    );
  }

  if (state === 'error') {
    return (
      <Box padding={1}>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Static Diff Checker - sdiffx</Text>
      <Box marginY={1}>
        <Text dimColor>
          Original: {originalFile} → Formatted: {formattedFile}
        </Text>
      </Box>
      {comparison && (
        <>
          <Summary diffs={comparison.diffs} />
          <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
            <DiffPager
              entries={comparison.diffs.entries}
              height={25}
              enableQuit
              onExit={() => process.exit(0)}
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press q to exit, or use 'sdiffx -i' for interactive replacement mode</Text>
          </Box>
       </>
     )}
    </Box>
  );
};
