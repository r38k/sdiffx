import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { compareFiles } from '../core/processor.js';
import { Summary } from './components/Summary.js';
import { DiffList } from './components/DiffList.js';

interface AppInteractiveProps {
  originalFile: string;
  formattedFile: string;
}

type AppState = 'loading' | 'diff-view' | 'mode-menu' | 'completed' | 'error';

export const AppInteractive: React.FC<AppInteractiveProps> = ({ originalFile, formattedFile }) => {
  const [state, setState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    try {
      const result = compareFiles(originalFile, formattedFile);
      setComparison(result);
      setState('diff-view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setState('error');
    }
  }, [originalFile, formattedFile]);

  // Setup stdin listener for keyboard input
  useEffect(() => {
    const handleKeyPress = (ch: string) => {
      if (state === 'diff-view') {
        if (ch === 'r' || ch === 'R') {
          setState('mode-menu');
        } else if (ch === 'q' || ch === 'Q') {
          console.log('\nGoodbye!');
          process.exit(0);
        }
      } else if (state === 'mode-menu') {
        if (ch === 'i' || ch === 'I') {
          console.log('\n✓ Interactive mode selected - Feature coming soon');
          process.exit(0);
        } else if (ch === 'b' || ch === 'B') {
          console.log('\n✓ Batch mode selected - Feature coming soon');
          process.exit(0);
        } else if (ch === 'q' || ch === 'Q') {
          setState('diff-view');
        }
      }
    };

    // Listen for Enter key in TTY
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    const listener = (buf: Buffer) => {
      const str = buf.toString();
      for (const char of str) {
        handleKeyPress(char);
      }
    };

    process.stdin.on('data', listener);

    return () => {
      process.stdin.removeListener('data', listener);
      if (process.stdin.isTTY) {
        try {
          process.stdin.setRawMode(false);
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [state]);

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

  if (state === 'diff-view' && comparison) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Static Diff Checker - sdiff (Interactive Mode)</Text>
        <Box marginY={1}>
          <Text dimColor>
            Original: {originalFile} → Formatted: {formattedFile}
          </Text>
        </Box>
        <Summary diffs={comparison.diffs} />
        <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Differences:</Text>
          </Box>
          <DiffList entries={comparison.diffs.entries} maxLines={15} />
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">
            <Text bold>r</Text> - Start replacement mode
          </Text>
          <Text color="yellow">
            <Text bold>q</Text> - Quit
          </Text>
        </Box>
      </Box>
    );
  }

  if (state === 'mode-menu' && comparison) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Select Replacement Mode</Text>
        <Box marginY={1}>
          <Text>Found:</Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          <Text color="green">
            + {comparison.diffs.entries.filter((e: any) => e.type === 'added').length} additions
          </Text>
          <Text color="red">
            - {comparison.diffs.entries.filter((e: any) => e.type === 'removed').length} removals
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          <Text>
            <Text bold color="yellow">i</Text> - Interactive (confirm each)
          </Text>
          <Text>
            <Text bold color="yellow">b</Text> - Batch (replace all)
          </Text>
          <Text>
            <Text bold color="yellow">q</Text> - Cancel
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};
