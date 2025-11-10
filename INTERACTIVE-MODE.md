# インタラクティブモード使用ガイド

## 概要

sdiffxには2つのモードがあります：

1. **通常モード** (`sdiffx`) - 差分を表示するのみ
2. **インタラクティブモード** (`sdiffx -i` / `sdiffx-interactive`) - 差分表示 + 置換機能

## インタラクティブモードの起動

```bash
node dist/index.js -i <original-file> <formatted-file>
```

または、インストール後（エイリアス）：

```bash
sdiffx -i <original-file> <formatted-file>
# 互換用: sdiffx-interactive <original-file> <formatted-file>
```
> `sdiffx-interactive` エイリアスは npm などでグローバルインストールした場合に利用できます。

## 使い方

### ステップ 1: Diff ビューの表示

起動すると、まず差分が表示されます。

```
 Static Diff Checker - sdiffx (Interactive Mode)

 Original: sample_original.md → Formatted: sample_formatted.md

 ╭─────────────────────────────────╮
 │ Diff Summary                    │
 │                                 │
 │ Total entries: 14               │
 │ Added: 4                        │
 │ Removed: 0                      │
 │ Unchanged: 10                   │
 ╰─────────────────────────────────╯

 Differences:
 (最初の15行が表示)

 Press 'r' to start replacement mode, or 'q' to quit
```

### ステップ 2: キーボード操作（Diffビュー）

Diffビューで以下のキーが使えます：

| キー | 動作 |
|------|------|
| `r` | 置換モードを開始 |
| `q` | 変更なしで終了 |

### ステップ 3: 置換モードの選択

'r' を押すと、置換モードを選択できます：

```
 Select Replacement Mode:

 i - Interactive (confirm each replacement)
 b - Batch (replace all added content)
 q - Quit without replacing
```

#### Interactive Mode（1つずつ確認）

```bash
i キーを押す
```

以下のように、追加された各行について確認されます：

```
 Interactive Replacement Mode

 2/4

 + 本システムについて

 Include this addition? (y/n/q):
```

**各キー**:
- `y` - この追加を含める（次へ）
- `n` - スキップ（次へ）
- `q` - モード終了

#### Batch Mode（一括置換）

```bash
b キーを押す
```

すべての追加をまとめて受け入れます：

```
 Batch Replacement Mode

 Adding 4 new entries and removing 0 entries...

 ✓ Batch replacement completed!
```

### ステップ 4: 変更の確認と保存

置換完了後、プレビューが表示されます：

```
 Preview Changes

 Replacements: 4

 Changes will be applied:
 - Press 's' to save changes
 - Press 'q' to quit without saving
```

| キー | 動作 |
|------|------|
| `s` | 変更を保存 |
| `q` | 保存せずに終了 |

## 実践例

### 例1: Interactive Mode で確認しながら適用

```bash
# 起動
node dist/index.js -i sample_missing_original.md sample_missing_formatted.md

# Diff確認 → r キーを押す
# → i キーを押す（Interactive mode選択）
# → 各行について y/n で選択
# → s キーで保存
```

### 例2: Batch Mode で一括置換

```bash
# 起動
node dist/index.js -i sample_extra_original.md sample_extra_formatted.md

# Diff確認 → r キーを押す
# → b キーを押す（Batch mode選択）
# → すべての追加が即座に受け入れられる
# → s キーで保存
```

## デフォルトモードでの使い分け

| 用途 | コマンド | 説明 |
|------|---------|------|
| 差分をさっと確認 | `sdiffx file1 file2` | 結果を表示するのみ |
| 差分を確認して置換 | `sdiffx -i file1 file2` *(alias: `sdiffx-interactive`)* | 確認しながら適用 |

## キーボードショートカット一覧

### Diff ビュー
- `r` - 置換モード開始
- `q` - 終了

### 置換モード選択
- `i` - Interactive mode（確認しながら）
- `b` - Batch mode（一括）
- `q` - キャンセル

### Interactive Replacement
- `y` - 追加を含める
- `n` - スキップ
- `q` - 終了

### 変更確認
- `s` - 保存
- `q` - 保存しない

## Tips

### 複数のファイルペアを処理する場合

```bash
# スクリプトで自動化
for original in *_original.md; do
  formatted="${original/_original.md/_formatted.md}"
  echo "Processing $original ↔ $formatted"
  sdiffx -i "$original" "$formatted"
done
```

### 差分が大きい場合

通常モードで先に差分を確認してから、インタラクティブモードで置換するのがおすすめです：

```bash
# 1. 差分を確認
sdiffx original.md formatted.md

# 2. インタラクティブモードで置換
sdiffx -i original.md formatted.md
```

## トラブルシューティング

### キーボード入力が反応しない

- ターミナルが標準入力を受け取っているか確認
- 別のプロセスが標準入力をブロックしていないか確認

### 置換が完全に適用されていない

- 大文字小文字の違いがないか確認
- 特殊文字が含まれていないか確認
- 置換対象のテキストが正確に一致しているか確認

### メモリ不足で失敗する場合

- ファイルサイズが大きすぎないか確認
- システムメモリに余裕があるか確認

## 技術詳細

### コンポーネント構成

- `AppInteractive.tsx` - メインのアプリケーションロジック
- `InteractiveReplacer.tsx` - 置換UIコンポーネント
- `replacement.ts` - テキスト置換処理

### 内部の状態遷移

```
loading
  ↓
diff-view (r で進行)
  ↓
replacement-mode (i/b 選択)
  ↓
replacement-confirm (s/q 選択)
  ↓
completed
```

## 今後の改善予定

- [ ] ファイルに直接保存する機能
- [ ] diff の前後を矢印で表示
- [ ] Undo 機能
- [ ] 複数ファイルのバッチ処理
- [ ] JSON 形式での diff 出力
