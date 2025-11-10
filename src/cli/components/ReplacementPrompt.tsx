import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface ReplacementPromptProps {
  onSelectInteractive: () => void;
  onSelectBatch: () => void;
  onCancel: () => void;
}

export const ReplacementPrompt: React.FC<ReplacementPromptProps> = ({
  onSelectInteractive,
  onSelectBatch,
  onCancel,
}) => {
  const items = [
    { label: 'Interactive (confirm each replacement)', value: 'interactive' },
    { label: 'Batch (replace all at once)', value: 'batch' },
    { label: 'Cancel', value: 'cancel' },
  ];

  const handleSelect = (item: typeof items[0]) => {
    switch (item.value) {
      case 'interactive':
        onSelectInteractive();
        break;
      case 'batch':
        onSelectBatch();
        break;
      case 'cancel':
        onCancel();
        break;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Select replacement mode:</Text>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
