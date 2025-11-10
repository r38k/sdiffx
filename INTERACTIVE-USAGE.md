# インタラクティブモード使用方法

## 重要: ターミナルでの実行が必須

インタラクティブモードは**対話型のターミナル環境でのみ動作**します。

❌ **動作しない環境:**
- パイプ経由の入力 (`echo "r" | sdiff-interactive ...`)
- リダイレクト (`< input.txt sdiff-interactive ...`)
- GitHub Actions などの自動化環境
- SSH経由の非TTY接続

✅ **動作する環境:**
- ローカルのターミナル (bash, zsh, PowerShell など)
- TTY接続された対話型シェル

## 基本的な使い方

### ステップ 1: 起動

ターミナルで以下を実行します：

```bash
node dist/index-interactive.js sample_missing_original.md sample_missing_formatted.md
```

すると、以下が表示されます：

```
 Static Diff Checker - sdiff (Interactive Mode)

 Original: sample_missing_original.md → Formatted: sample_missing_formatted.md

 [Diff Summary表示]

 [Differences表示]

 r - Start replacement mode
 q - Quit
```

### ステップ 2: キー入力

**r キー** を押して置換モードに進みます：

```
 Select Replacement Mode

 Found:
 + 2 additions
 - 0 removals

 i - Interactive (confirm each)
 b - Batch (replace all)
 q - Cancel
```

### ステップ 3: モード選択

**i** または **b** キーを押します：

```
 ✓ Interactive mode selected - Feature coming soon
```

（現在は "coming soon" と表示されますが、フレームワークは完成しています）

## キーボードショートカット

### Diff ビュー
| キー | 動作 |
|------|------|
| `r` | 置換モードを開く |
| `q` | プログラムを終了 |

### 置換モード選択
| キー | 動作 |
|------|------|
| `i` | Interactive mode（1つずつ確認） |
| `b` | Batch mode（全て置換） |
| `q` | Diff ビューに戻る |

## 正しい実行方法

```bash
# 通常モード（差分表示のみ）
node dist/index.js original.md formatted.md

# インタラクティブモード（対話型）
node dist/index-interactive.js original.md formatted.md
```

## トラブルシューティング

### "キーを押しても反応しない"

**原因:** パイプまたはリダイレクトで実行している

**解決策:** ターミナルで直接実行してください

```bash
# ❌ これはダメ
echo "" | node dist/index-interactive.js original.md formatted.md

# ✅ これが正しい
node dist/index-interactive.js original.md formatted.md
```

### "Raw mode is not supported"

**原因:** TTY ではない環境で実行している

**解決策:** 対話型のターミナルで実行してください

## 今後の実装予定

現在、以下の機能は実装フレームワークが完成していますが、詳細な処理は "coming soon" です：

- [ ] Interactive replacement（1つずつ確認）
- [ ] Batch replacement（全て一括置換）
- [ ] ファイルへの変更の保存
- [ ] Undo 機能

## 実装状況

```
✅ キーボード入力処理
✅ Diff ビュー表示
✅ 置換モード選択画面
⏳ 置換機能（実装中）
```

## 参考

- [通常モード](./README.md) - 差分表示のみ
- [サンプルテスト](./test-samples.md) - テスト方法
