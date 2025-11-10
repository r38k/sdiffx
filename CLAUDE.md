# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**sdiffx** is a static diff checking tool designed to validate text integrity when documents are processed by LLMs. The primary use case is comparing text before and after LLM formatting (from PDFs/Excel to markdown) to ensure no unintended changes were made.

### Key Implementation Details
- **Language**: TypeScript with ESM modules
- **CLI**: React Ink for terminal UI
- **Text Splitting**: Whitespace and newline-based (not punctuation-based)
- **Markdown Handling**: Strips markdown syntax from formatted text before comparison
- **Diff Algorithm**: Greedy matching with longest common subsequence

### Core Modules

1. **`src/utils/markdown.ts`** - Text parsing and normalization
   - `stripMarkdown()` - Remove markdown syntax
   - `splitBySentence()` - Split by whitespace/newlines
   - `normalizeForComparison()` - Combined preprocessing

2. **`src/diff/algorithm.ts`** - Diff generation
   - `generateDiffMyers()` - Greedy diff algorithm (primary)
   - `generateDiff()` - LCS-based algorithm (alternative)
   - Returns structured diff entries with type (added/removed/unchanged)

3. **`src/core/processor.ts`** - File handling and comparison
   - `compareFiles()` - Load and compare two files
   - `compareTexts()` - Compare text strings directly
   - Chains markdown stripping → splitting → diff generation

4. **`src/cli/App.tsx`** - Main React Ink application
   - Loads files, runs comparison, displays results
   - Shows summary and first 15 diffs
   - Error handling for file I/O

5. **`src/cli/components/`** - Reusable UI components
   - `Summary.tsx` - Diff statistics display
   - `DiffList.tsx` - List view of diffs
   - `DiffViewer.tsx` - Interactive single diff viewer (planned)
   - `ReplacementPrompt.tsx` - Replacement mode selector (planned)

## Common Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/ using tsgo
npm test             # Run Jest test suite
npm run lint         # Run ESLint
npm run dev          # Run with tsgo directly
npm start            # Run compiled CLI
npm run lsmcp        # Launch lsmcp symbol indexing tool
node dist/index.js <file1> <file2>  # Run CLI directly
```

## Testing

- **Test Framework**: Jest with ts-jest for ESM support
- **Test Files**: Colocated with source (*.test.ts)
- **Configuration**: jest.config.js with ESM settings and moduleNameMapper
- **Current Coverage**: 17 tests covering markdown utilities and diff algorithm

### Running Specific Tests
```bash
npm test -- --testNamePattern="stripMarkdown"
npm test -- src/diff/algorithm.test.ts
```

## File Structure

```
src/
  ├── cli/                # React Ink UI components
  │   ├── App.tsx         # Main app component
  │   └── components/     # Reusable components
  ├── core/
  │   └── processor.ts    # File I/O and comparison orchestration
  ├── diff/
  │   ├── algorithm.ts    # Diff algorithms (*.test.ts for tests)
  │   ├── replacement.ts  # String replacement utilities
  │   └── types.ts        # TypeScript interfaces
  └── utils/
      └── markdown.ts     # Text processing (*.test.ts for tests)
```

## Configuration Notes

- **Build Tool**: Uses `tsgo` for TypeScript compilation with `--skipLibCheck` flag
- **tsconfig.json**: Uses `moduleResolution: "nodenext"` and `module: "NodeNext"` for ESM
- **package.json**: Configured with `"type": "module"` for ESM
- **Import Statements**: Must include `.js` extension for relative imports (ESM requirement)
- **Jest Configuration**: Uses moduleNameMapper to map `.js` extensions
- **Development Tools**: Uses `@mizchi/lsmcp` for symbol indexing and codebase navigation

## Known Limitations and TODO Items

- **Diff Quality**: Current greedy algorithm may miss optimal alignments with heavily edited text
- **Replacement Feature**: UI components exist but interactive replacement mode not fully integrated
- **Performance**: Not optimized for very large documents (100MB+)
- **Character-level Diffs**: Currently sentence-level only; character-level comparison future work

## Performance Considerations

- Sentence splitting is O(n) where n = text length
- Diff generation is O(m*n) where m, n = sentence counts
- For typical documents (1-100K sentences), performance is acceptable
- Large documents may benefit from incremental diff or sampling

## CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration:

- **Workflow File**: `.github/workflows/ci.yml`
- **Triggers**: Runs on push to `main` and `develop` branches, and on pull requests
- **Matrix Testing**: Tests on Node.js 18.x and 20.x
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm cache
  3. Install dependencies (`npm ci`)
  4. Run linter (`npm run lint`)
  5. Run tests (`npm test`)
  6. Build project (`npm run build`)
  7. Verify CLI functionality

Pull requests must pass all CI checks before merging.

## Debugging Tips

- Use `npm run build` to check for TypeScript errors before running
- Check markdown stripping is working: test with `# Header` → should become `Header`
- For diff issues, add temporary logging in `src/diff/algorithm.ts`
- Run single test file: `npm test -- src/utils/markdown.test.ts --verbose`
- Use `npm run lsmcp` to index symbols and improve IDE support
