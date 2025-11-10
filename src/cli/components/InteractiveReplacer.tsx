import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { DiffEntry } from '../../diff/types.js';
import {
  HistoryRecord,
  ReplacementHistory,
  ReplacementInstruction,
  findMatchingLine,
  serializeInstruction,
} from '../../diff/replacement.js';

interface ActionableEntry extends DiffEntry {
  entryIndex: number;
}

type DecisionState = 'pending' | 'accepted' | 'skipped';
type ReplacementMode = 'menu' | 'confirm' | 'all' | 'done';

export interface ReplacementSessionResult {
  mode: 'confirm' | 'all';
  replacements: Map<string, string>;
  acceptedEntries: HistoryRecord[];
  totalEntries: number;
}

interface InteractiveReplacerProps {
  diffEntries: DiffEntry[];
  originalText: string;
  formattedText: string;
  history: ReplacementHistory;
  onComplete: (result: ReplacementSessionResult) => void;
  onCancel: () => void;
}

const createEntryKey = (entry: ActionableEntry): string => `${entry.type}:${entry.entryIndex}`;

export const InteractiveReplacer: React.FC<InteractiveReplacerProps> = ({
  diffEntries,
  originalText,
  formattedText,
  history,
  onComplete,
  onCancel,
}) => {
  const actionableEntries = useMemo<ActionableEntry[]>(
    () =>
      diffEntries
        .map((entry, idx) => ({ ...entry, entryIndex: idx }))
        .filter((entry) => entry.type === 'added' || entry.type === 'removed'),
    [diffEntries],
  );

  const totalEntries = actionableEntries.length;

  const [mode, setMode] = useState<ReplacementMode>('menu');
  const [selectedMode, setSelectedMode] = useState<'confirm' | 'all' | null>(null);
  const [currentIndex, setCurrentIndex] = useState(totalEntries > 0 ? 0 : -1);
  const [decisionStates, setDecisionStates] = useState<DecisionState[]>(() =>
    Array(totalEntries).fill('pending'),
  );
  const [replacements, setReplacements] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    history.clear();
    setMode('menu');
    setSelectedMode(null);
    setReplacements(new Map());
    setDecisionStates(Array(totalEntries).fill('pending'));
    setCurrentIndex(totalEntries > 0 ? 0 : -1);
  }, [history, totalEntries]);

  const completedCount = decisionStates.filter((state) => state !== 'pending').length;
  const undoCount = history.size();
  const currentEntry = currentIndex >= 0 ? actionableEntries[currentIndex] : undefined;

  const getAnchorForEntry = (entryPosition: number): string | undefined => {
    for (let idx = entryPosition - 1; idx >= 0; idx--) {
      const candidate = diffEntries[idx];
      if (candidate?.type === 'unchanged') {
        return findMatchingLine(formattedText, candidate.content) ?? candidate.content;
      }
    }
    return undefined;
  };

  const getSnippetForEntry = (entry: ActionableEntry): string => {
    const source = entry.type === 'added' ? formattedText : originalText;
    const line = findMatchingLine(source, entry.content);
    return line ?? entry.content;
  };

  const findNextPending = (start: number, states: DecisionState[] = decisionStates): number => {
    for (let idx = start; idx < states.length; idx++) {
      if (states[idx] === 'pending') {
        return idx;
      }
    }
    return -1;
  };

  const finalizeSession = (completedMode: 'confirm' | 'all', latestMap: Map<string, string>) => {
    setMode('done');
    setSelectedMode(completedMode);
    onComplete({
      mode: completedMode,
      replacements: new Map(latestMap),
      acceptedEntries: history.getEntries(),
      totalEntries,
    });
  };

  const advanceAfterDecision = (
    latestMap: Map<string, string>,
    entryIdx: number,
    states: DecisionState[] = decisionStates,
  ) => {
    const nextIndex = findNextPending(entryIdx + 1, states);
    if (nextIndex === -1) {
      finalizeSession('confirm', latestMap);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleAccept = () => {
    if (currentIndex < 0 || !currentEntry) {
      finalizeSession('confirm', replacements);
      return;
    }

    const key = createEntryKey(currentEntry);
    const snippet = getSnippetForEntry(currentEntry);
    const anchor = getAnchorForEntry(currentEntry.entryIndex);
    const instruction: ReplacementInstruction = {
      type: currentEntry.type as 'added' | 'removed',
      snippet,
      anchor,
      anchorPosition: 'after',
    };
    const payload = serializeInstruction(instruction);

    const nextMap = new Map(replacements);
    nextMap.set(key, payload);

    history.push({
      key,
      entryIndex: currentIndex,
      entry: {
        type: currentEntry.type as 'added' | 'removed',
        original: currentEntry.type === 'removed' ? snippet : anchor ?? '',
        formatted: currentEntry.type === 'added' ? snippet : '',
        timestamp: Date.now(),
      },
    });

    const nextStates = [...decisionStates];
    nextStates[currentIndex] = 'accepted';
    setDecisionStates(nextStates);
    setReplacements(nextMap);
    advanceAfterDecision(nextMap, currentIndex, nextStates);
  };

  const handleSkip = () => {
    if (currentIndex < 0) {
      finalizeSession('confirm', replacements);
      return;
    }
    const nextStates = [...decisionStates];
    nextStates[currentIndex] = 'skipped';
    setDecisionStates(nextStates);
    const nextIndex = findNextPending(currentIndex + 1, nextStates);
    if (nextIndex === -1) {
      finalizeSession('confirm', replacements);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleUndo = () => {
    const record = history.undo();
    if (!record) {
      return;
    }
    setReplacements((prev) => {
      const next = new Map(prev);
      next.delete(record.key);
      return next;
    });
    setDecisionStates((prev) => {
      const next = [...prev];
      next[record.entryIndex] = 'pending';
      return next;
    });
    setCurrentIndex(record.entryIndex);
    if (mode === 'done') {
      setMode('confirm');
      setSelectedMode('confirm');
    }
  };

  const handleBatchMode = () => {
    setSelectedMode('all');
    if (totalEntries === 0) {
      finalizeSession('all', new Map());
      return;
    }

    history.clear();
    const nextMap = new Map<string, string>();
    const acceptedStates: DecisionState[] = [];

    actionableEntries.forEach((entry, idx) => {
      const snippet = getSnippetForEntry(entry);
      const anchor = getAnchorForEntry(entry.entryIndex);
      const instruction: ReplacementInstruction = {
        type: entry.type as 'added' | 'removed',
        snippet,
        anchor,
        anchorPosition: 'after',
      };
      const payload = serializeInstruction(instruction);
      const key = createEntryKey(entry);
      nextMap.set(key, payload);

      history.push({
        key,
        entryIndex: idx,
        entry: {
          type: entry.type as 'added' | 'removed',
          original: entry.type === 'removed' ? snippet : anchor ?? '',
          formatted: entry.type === 'added' ? snippet : '',
          timestamp: Date.now(),
        },
      });
      acceptedStates.push('accepted');
    });

    setDecisionStates(acceptedStates);
    setReplacements(nextMap);
    finalizeSession('all', nextMap);
  };

  const handleStartConfirm = () => {
    setSelectedMode('confirm');
    if (totalEntries === 0) {
      finalizeSession('confirm', new Map());
    } else {
      setMode('confirm');
      setCurrentIndex(0);
    }
  };

  useInput(
    (input) => {
      const key = input.toLowerCase();
      if (mode === 'menu') {
        if (key === 'i') {
          handleStartConfirm();
        } else if (key === 'b') {
          handleBatchMode();
        } else if (key === 'q') {
          onCancel();
        }
      } else if (mode === 'confirm') {
        if (key === 'y') {
          handleAccept();
        } else if (key === 'n') {
          handleSkip();
        } else if (key === 'u') {
          handleUndo();
        } else if (key === 'q') {
          onCancel();
        }
      }
    },
    { isActive: mode !== 'done' },
  );

  if (mode === 'menu') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>置換モードを選択してください</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>対象の差分: {totalEntries}</Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text bold color="yellow">
                i
              </Text>{' '}
              - 確認後置換（1件ずつ確認）
            </Text>
            <Text>
              <Text bold color="yellow">
                b
              </Text>{' '}
              - 全置換（全てを一括で適用）
            </Text>
            <Text>
              <Text bold color="yellow">
                q
              </Text>{' '}
              - 戻る
            </Text>
          </Box>
        </Box>
        {totalEntries === 0 && (
          <Box marginTop={1}>
            <Text color="green">適用可能な差分はありません</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (mode === 'confirm' && currentEntry) {
    const isFormattedExtra = currentEntry.type === 'added';
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>確認後置換モード</Text>
        <Box marginY={1}>
          <Text>
            {completedCount}/{totalEntries} 完了 ・ 取り消し可能: {undoCount}
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color={isFormattedExtra ? 'red' : 'green'}>
            {isFormattedExtra ? '- ' : '+ '}
            {currentEntry.content}
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text>
            {isFormattedExtra ? 'このテキストを削除しますか？' : 'このテキストを追加しますか？'} (y=はい /
            n=スキップ / u=1つ戻る / q=終了)
          </Text>
        </Box>
      </Box>
    );
  }

  if (mode === 'done') {
    return (
      <Box padding={1}>
        <Text color="green">置換の選択が完了しました。最終確認に進みます...</Text>
      </Box>
    );
  }

  return null;
};
