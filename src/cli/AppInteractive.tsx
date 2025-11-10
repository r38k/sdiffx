import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { compareFiles, applyReplacementsToFile } from '../core/processor.js';
import { Summary } from './components/Summary.js';
import { DiffList } from './components/DiffList.js';
import { InteractiveReplacer, ReplacementSessionResult } from './components/InteractiveReplacer.js';
import { FileComparison } from '../diff/types.js';
import { ReplacementHistory } from '../diff/replacement.js';

type AppState = 'loading' | 'diff-view' | 'replacement' | 'summary' | 'completed' | 'error';

interface AppInteractiveProps {
  originalFile: string;
  formattedFile: string;
}

export const AppInteractive: React.FC<AppInteractiveProps> = ({ originalFile, formattedFile }) => {
  const [state, setState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<FileComparison | null>(null);
  const historyRef = useRef<ReplacementHistory>(new ReplacementHistory());
  const [replacementResult, setReplacementResult] = useState<ReplacementSessionResult | null>(null);
  const [replacementMap, setReplacementMap] = useState<Map<string, string>>(new Map());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const startReplacement = () => {
    if (!comparison) {
      return;
    }
    setStatusMessage(null);
    historyRef.current.clear();
    setReplacementResult(null);
    setReplacementMap(new Map());
    setState('replacement');
  };

  const exitApp = () => {
    console.log('\nGoodbye!');
    process.exit(0);
  };

  const handleReplacementComplete = (result: ReplacementSessionResult) => {
    setReplacementResult(result);
    setReplacementMap(new Map(result.replacements));
    setStatusMessage(null);
    setState('summary');
  };

  const handleReplacementCancel = () => {
    historyRef.current.clear();
    setReplacementResult(null);
    setReplacementMap(new Map());
    setStatusMessage('置換モードを終了しました');
    setState('diff-view');
  };

  const handleSummaryUndo = () => {
    const record = historyRef.current.undo();
    if (!record) {
      setStatusMessage('これ以上戻せません');
      return;
    }

    const nextMap = new Map(replacementMap);
    nextMap.delete(record.key);
    setReplacementMap(nextMap);
    setReplacementResult((prev) =>
      prev
        ? {
            ...prev,
            replacements: nextMap,
            acceptedEntries: historyRef.current.getEntries(),
          }
        : prev,
    );
    setStatusMessage('直前の置換を取り消しました');
  };

  const handleSave = () => {
    if (!comparison) {
      return;
    }
    if (replacementMap.size === 0) {
      setStatusMessage('適用する置換がありません');
      return;
    }

    try {
      applyReplacementsToFile(originalFile, formattedFile, replacementMap);
      setStatusMessage(null);
      setState('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : '置換の保存に失敗しました');
      setState('error');
    }
  };

  useInput(
    (input) => {
      const key = input.toLowerCase();
      if (state === 'diff-view') {
        if (key === 'r') {
          startReplacement();
        } else if (key === 'q') {
          exitApp();
        }
      } else if (state === 'summary') {
        if (key === 's') {
          handleSave();
        } else if (key === 'u') {
          handleSummaryUndo();
        } else if (key === 'q') {
          exitApp();
        }
      } else if (state === 'completed' && key === 'q') {
        exitApp();
      }
    },
    { isActive: state !== 'replacement' },
  );

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

  const historyEntries = historyRef.current.getEntries();

  if (state === 'replacement' && comparison) {
    return (
      <InteractiveReplacer
        diffEntries={comparison.diffs.entries}
        originalText={comparison.original}
        formattedText={comparison.formatted}
        history={historyRef.current}
        onComplete={handleReplacementComplete}
        onCancel={handleReplacementCancel}
      />
    );
  }

  if (state === 'summary' && comparison && replacementResult) {
    const appliedCount = historyEntries.length;
    const total = replacementResult.totalEntries;
    const modeLabel = replacementResult.mode === 'all' ? '全置換' : '確認後置換';

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>置換内容の最終確認</Text>
        <Box marginY={1}>
          <Text>
            モード: {modeLabel} ・ 選択済み: {appliedCount}/{total}
          </Text>
        </Box>
        {appliedCount === 0 ? (
          <Text color="yellow">適用予定の置換はありません</Text>
        ) : (
          <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
            <Text bold>置換リスト</Text>
            <Box marginTop={1} flexDirection="column">
              {historyEntries.map((record) => {
                const isDeletion = record.entry.type === 'added';
                const label = (isDeletion ? record.entry.formatted : record.entry.original) || '(内容未取得)';
                return (
                  <Box key={record.key} marginBottom={1} flexDirection="column">
                    <Text color={isDeletion ? 'red' : 'green'}>
                      {isDeletion ? '- ' : '+ '}
                      {label}
                    </Text>
                    <Text dimColor>
                      {new Date(record.entry.timestamp).toLocaleTimeString()} に選択
                    </Text>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
        {statusMessage && (
          <Box marginTop={1}>
            <Text color="yellow">{statusMessage}</Text>
          </Box>
        )}
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text bold color="green">
              s
            </Text>{' '}
            - 置換を保存
          </Text>
          <Text>
            <Text bold color="green">
              u
            </Text>{' '}
            - 直前の置換を取り消し
          </Text>
          <Text>
            <Text bold color="green">
              q
            </Text>{' '}
            - 終了
          </Text>
        </Box>
      </Box>
    );
  }

  if (state === 'completed' && comparison) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green">{formattedFile} に置換結果を保存しました。</Text>
        <Box marginTop={1}>
          <Text dimColor>q - 終了</Text>
        </Box>
      </Box>
    );
  }

  if (state === 'diff-view' && comparison) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>Static Diff Checker - sdiff (確認後置換対応)</Text>
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
        {statusMessage && (
          <Box marginTop={1}>
            <Text color="yellow">{statusMessage}</Text>
          </Box>
        )}
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">
            <Text bold>r</Text> - 置換モード開始（確認後置換 / 全置換）
          </Text>
          <Text color="yellow">
            <Text bold>q</Text> - Quit
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};
