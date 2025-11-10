# sdiff サンプルテスト

## 利用可能なサンプル

### 1. 構造変更（sample_original.md ↔ sample_formatted.md）
```bash
node dist/index.js sample_original.md sample_formatted.md
```

**説明**: LLMで整形されたドキュメント。
- 元のテキスト: 句点なし、見出しなし
- 整形後のテキスト: 句点あり、見出し（## など）が追加
- **期待される結果**: 新しいセクション見出しが4つ追加されている

**結果**:
```
Total entries: 14
Added: 4        (新しいセクション見出し)
Removed: 0
Unchanged: 10   (実際のコンテンツは変わっていない)
```

---

### 2. コンテンツ追加（sample_missing_original.md ↔ sample_missing_formatted.md）
```bash
node dist/index.js sample_missing_original.md sample_missing_formatted.md
```

**説明**: 整形時にコンテンツが追加されたケース。
- 元のテキスト: 簡潔
- 整形後のテキスト: 追加情報と句点が付加
- **期待される結果**: 新しい文が2つ追加

**結果**:
```
Total entries: 14
Added: 2        (新しい文が2つ)
  - PDFやExcelから抽出したテキストをLLMで整形したとき...
  - 二つのテキストファイルを読み込む処理。
Removed: 0
Unchanged: 12
```

---

### 3. コンテンツ削除（sample_extra_original.md ↔ sample_extra_formatted.md）
```bash
node dist/index.js sample_extra_original.md sample_extra_formatted.md
```

**説明**: 整形時にコンテンツが削除されたケース。
- 元のテキスト: 詳細な内容
- 整形後のテキスト: 一部文が削除
- **期待される結果**: 削除された文が3つ

**結果**:
```
Total entries: 15
Added: 0
Removed: 3      (削除された文が3つ)
  - 差分の検出は自動的に行われます
  - これは非常に便利な機能です
  - 予期しない変更が発生する可能性があります
Unchanged: 12
```

---

## 使用方法

各サンプルを実行して、diff検査の動作を確認してください。

**対話的に確認する場合:**
```bash
node dist/index.js <original-file> <formatted-file>
```

**JSON形式で詳細を見る場合:**
```bash
node -e "import('./dist/core/processor.js').then(m => console.log(JSON.stringify(m.compareFiles('sample_original.md', 'sample_formatted.md'), null, 2)))"
```

## 各サンプルの活用シーン

1. **sample_original.md / sample_formatted.md**
   - LLMが見出しやフォーマッティングを追加する典型的なケース
   - マークダウン構造の変化を確認

2. **sample_missing_original.md / sample_missing_formatted.md**
   - LLMが説明や追加情報を加える場合
   - 追加されたコンテンツの検出

3. **sample_extra_original.md / sample_extra_formatted.md**
   - LLMが冗長な部分を削除する場合
   - 削除されたコンテンツの検出

## テストコマンド

すべてのサンプルでテストを実行:

```bash
echo "=== Test 1: Formatting ===" && node dist/index.js sample_original.md sample_formatted.md 2>&1 | grep -E "Total|Added|Removed|Unchanged"

echo -e "\n=== Test 2: Added Content ===" && node dist/index.js sample_missing_original.md sample_missing_formatted.md 2>&1 | grep -E "Total|Added|Removed|Unchanged"

echo -e "\n=== Test 3: Removed Content ===" && node dist/index.js sample_extra_original.md sample_extra_formatted.md 2>&1 | grep -E "Total|Added|Removed|Unchanged"
```
