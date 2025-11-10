import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { compareFiles } from '../core/processor.js';
import { Summary } from './components/Summary.js';
import { DiffList } from './components/DiffList.js';
import { InteractiveReplacer } from './components/InteractiveReplacer.js';
import { applyReplacements } from '../diff/replacement.js';

interface AppInteractiveProps {
  originalFile: string;
  formattedFile: string;
}

type AppState = 'loading' | 'diff-view' | 'replacement-mode' | 'replacement-confirm' | 'completed' | 'error';

export const AppInteractive: React.FC<AppInteractiveProps> = ({ originalFile, formattedFile }) => {
  const [state, setState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [replacements, setReplacements] = useState<Map<string, string>>(new Map());
  const [originalContent, setOriginalContent] = useState<string>('');

  useEffect(() => {
    try {
      const result = compareFiles(originalFile, formattedFile);
      setComparison(result);
      setOriginalContent(result.original);
      setState('diff-view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setState('error');
    }
  }, [originalFile, formattedFile]);

  const handleReplacementsComplete = (reps: Map<string, string>) => {
    setReplacements(reps);
    setState('replacement-confirm');
  };

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
        <Box marginTop={1}>
          <Text dimColor>Press 'r' to start replacement mode, or 'q' to quit</Text>
        </Box>

        {/* Handle keyboard input for diff view */}
        {useKeyboardInput(() => {
          setState('replacement-mode');
        })}
      </Box>
    );
  }

  if (state === 'replacement-mode' && comparison) {
    return (
      <InteractiveReplacer
        diffEntries={comparison.diffs.entries}
        originalText={originalContent}
        formattedText={comparison.formatted}
        onComplete={handleReplacementsComplete}
      />
    );
  }

  if (state === 'replacement-confirm') {
    const preview = applyReplacements(originalContent, replacements);
    const hasChanges = preview !== originalContent;

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Preview Changes</Text>
        <Box marginY={1}>
          <Text>Replacements: {replacements.size}</Text>
        </Box>
        {hasChanges ? (
          <Box marginBottom={1} flexDirection="column">
            <Text color="green">Changes will be applied:</Text>
            <Text dimColor>- Press 's' to save changes</Text>
            <Text dimColor>- Press 'q' to quit without saving</Text>
          </Box>
        ) : (
          <Box marginBottom={1}>
            <Text color="yellow">No replacements selected</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (state === 'completed') {
    return (
      <Box padding={1}>
        <Text color="green">✓ Process completed!</Text>
      </Box>
    );
  }

  return null;
};

/**
 * Simple keyboard input hook for diff view
 */
function useKeyboardInput(onReplace: () => void): null {
  useEffect(() => {
    const handleInput = (ch: string) => {
      if (ch === 'r') {
        onReplace();
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
  }, [onReplace]);

  return null;
}
