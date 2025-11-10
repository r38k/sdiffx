# sdiff - Static Diff Checking Tool

社内チャットボットが参照する用のドキュメントを整備するためのツール

## 概要

PDFやExcelから抽出したテキストをLLMで整形するとき、意図しない変更がないか確認するツールです。LLMの確率的な出力によってコンテンツが変更されることがあるため、それを検知できます。

## 要件（実装済み）

- ✅ 文字列の静的diff検査
- ✅ 二つのテキストファイル(mdを想定)を読む
- ✅ ファイル内のテキストを文単位でdiffを取る
- ✅ Markdownシンタックスを無視した比較
- ✅ 不足や過剰な文字列を出力

## インストール

```bash
npm install
npm run build
```

## 使用方法

### 1. 通常モード（Diff表示のみ）

```bash
node dist/index.js <original-file> <formatted-file>
```

差分を表示するだけで、修正はしません。

### 2. インタラクティブモード（Diff + 置換）

```bash
node dist/index-interactive.js <original-file> <formatted-file>
```

差分を確認してから、以下が選択できます：
- **Interactive**: 1つずつ確認しながら適用
- **Batch**: すべての変更を一括適用

詳細は [INTERACTIVE-MODE.md](./INTERACTIVE-MODE.md) を参照

### 例

```bash
# 基本的な使用例
node dist/index.js sample_original.md sample_formatted.md

# インタラクティブモード
node dist/index-interactive.js sample_original.md sample_formatted.md

# テストサンプルを実行
./test-all-samples.sh
```

## サンプルファイル

3つのシナリオを示すサンプルファイルが付属しています：

### 1. Formatting Changes (整形による変化)
```bash
node dist/index.js sample_original.md sample_formatted.md
```
- 元のテキスト: 句点なし、見出しなし
- 整形後のテキスト: 句点あり、見出しが追加
- **結果**: 新しいセクション見出しが4つ追加されている（実コンテンツは変わっていない）

### 2. Added Content (コンテンツ追加)
```bash
node dist/index.js sample_missing_original.md sample_missing_formatted.md
```
- 元のテキスト: 簡潔
- 整形後のテキスト: 追加情報が挿入
- **結果**: 新しい文が2つ追加

### 3. Removed Content (コンテンツ削除)
```bash
node dist/index.js sample_extra_original.md sample_extra_formatted.md
```
- 元のテキスト: 詳細な内容
- 整形後のテキスト: 冗長部分が削除
- **結果**: 削除された文が3つ

## 出力形式

### CLI表示
- **Diff Summary**: 追加/削除/変更なしの統計情報
- **Differences**: 実際の差分内容を表示
  - `+` : 追加された行
  - `-` : 削除された行
  - スペース: 変わらない行

### 統計情報
```
Total entries: 14
Added: 4
Removed: 0
Unchanged: 10
```

## アルゴリズム

### マッチング戦略（3段階）

1. **完全一致**: 元の行と整形後の行が完全に一致
2. **正規化一致**: 末尾の句点を除いて一致（例：`文です` vs `文です。`）
3. **類似度マッチング**: 編集距離ベースで類似した行をマッチ

### テキスト処理

1. Markdownシンタックスを削除（`#`, `**`, `*`, など）
2. 空白・改行を基準に文単位で分割
3. 空行はスキップ（比較対象から除外）

## 開発

### テスト実行

```bash
npm test           # ユニットテスト実行
./test-all-samples.sh  # サンプルテスト実行
```

### ビルド

```bash
npm run build      # TypeScript → JavaScript
npm run lint       # ESLint実行
```

## 制限事項

- 現在の実装は文単位での比較
- 文字単位での差分には未対応
- 大規模ドキュメント（100MB+）は未最適化

## 実装済みの機能

### 置換機能（実装済み）

```typescript
// Interactive mode: 1つずつ確認
// Batch mode: 一括置換
```

詳細は `src/cli/components/InteractiveReplacer.tsx` と `src/diff/replacement.ts` を参照

## 今後の機能

- [ ] インタラクティブモード（TUI）での差分確認の統合
- [ ] 複数ファイルの一括処理
- [ ] JSON出力フォーマット
- [ ] 差分レポートの生成
- [ ] 置換結果のファイル出力

## 注意点

- 整形前の文章はMarkdownシンタックスが入っていない想定
- 整形後の文章はシンタックス（#など）が入る想定
- これらの違いは比較時に無視される

## その他コンテキスト

- 対象となる文章は様々な文書(規約や設計書など)になるため，単純に「。」等で区切ることはできない
- 基本は空白や改行をベースで区切られる