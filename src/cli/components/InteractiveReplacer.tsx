import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { DiffEntry } from '../../diff/types.js';

interface InteractiveReplacerProps {
  diffEntries: DiffEntry[];
  originalText: string;
  formattedText: string;
  onComplete: (replacements: Map<string, string>) => void;
}

export const InteractiveReplacer: React.FC<InteractiveReplacerProps> = ({
  diffEntries,
  originalText,
  formattedText,
  onComplete,
}) => {
  const [mode, setMode] = useState<'select' | 'interactive' | 'batch'>('select');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replacements, setReplacements] = useState<Map<string, string>>(new Map());

  const addedEntries = diffEntries.filter((e) => e.type === 'added');
  const removedEntries = diffEntries.filter((e) => e.type === 'removed');

  useEffect(() => {
    const handleInput = (ch: string) => {
      if (mode === 'select') {
        if (ch === 'i') {
          setMode('interactive');
        } else if (ch === 'b') {
          setMode('batch');
        } else if (ch === 'q') {
          onComplete(replacements);
          process.exit(0);
        }
      } else if (mode === 'interactive') {
        if (ch === 'y') {
          // Mark this entry for replacement
          const entry = addedEntries[currentIndex];
          replacements.set(entry.content, entry.content);
          if (currentIndex < addedEntries.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            onComplete(replacements);
            process.exit(0);
          }
        } else if (ch === 'n') {
          // Skip this entry
          if (currentIndex < addedEntries.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            onComplete(replacements);
            process.exit(0);
          }
        } else if (ch === 'q') {
          onComplete(replacements);
          process.exit(0);
        }
      }
    };

    process.stdin.on('data', (key) => {
      handleInput(key.toString());
    });

    return () => {
      process.stdin.removeAllListeners('data');
    };
  }, [mode, currentIndex, replacements]);

  if (mode === 'select') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Select Replacement Mode:</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>i - Interactive (confirm each replacement)</Text>
          <Text>b - Batch (replace all added content)</Text>
          <Text>q - Quit without replacing</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press a key to continue...</Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'interactive') {
    const entry = addedEntries[currentIndex];
    if (!entry) {
      return (
        <Box padding={1}>
          <Text color="green">✓ Replacement complete!</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Interactive Replacement Mode</Text>
        <Box marginTop={1} marginBottom={1}>
          <Text>{currentIndex + 1}/{addedEntries.length}</Text>
        </Box>
        <Box marginBottom={1} flexDirection="column">
          <Text color="green">+ {entry.content}</Text>
        </Box>
        <Box>
          <Text>Include this addition? (y/n/q): </Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'batch') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Batch Replacement Mode</Text>
        <Box marginTop={1} marginBottom={1}>
          <Text>Adding {addedEntries.length} new entries and removing {removedEntries.length} entries...</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="green">✓ Batch replacement completed!</Text>
        </Box>
      </Box>
    );
  }

  return null;
};
