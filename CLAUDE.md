# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**sdiff** is a static diff checking tool designed to validate text integrity when documents are processed by LLMs. The primary use case is comparing text before and after LLM formatting (from PDFs/Excel to markdown) to ensure no unintended changes were made.

### Key Constraints
- Pre-formatted text contains no markdown syntax; post-formatted text may contain markdown markers (#, -, etc.)
- Text comparison should ignore markdown syntax and focus on actual content
- Sentence/line boundaries are not always at punctuation (。); splitting should prioritize whitespace and line breaks
- Documents can vary widely (regulations, design specs, etc.), so no assumptions should be made about structure

### Primary Use Cases
1. Extract text from PDFs/Excel files
2. Format text with LLM
3. Compare pre/post text at sentence/word level to detect unintended changes
4. Allow interactive or batch string replacement when differences are found

## Implementation Plan

### Tech Stack
- **CLI Framework**: React Ink (for terminal UI)
- **Language**: TypeScript/JavaScript (based on Ink requirement)
- **Input**: Two text files (typically markdown)
- **Output**: Visual diff with sentence-level granularity + ability to perform string replacements

### Core Components

1. **Text Parsing**: Strip markdown syntax before comparison
2. **Diff Engine**: Generate sentence-level diffs (whitespace/newline based splitting)
3. **CLI Interface**: Interactive mode using React Ink
4. **String Replacement**: Two modes - interactive confirmation or batch replace

### Architecture Notes
- Keep diff generation logic separate from CLI presentation
- Diff output should be composable (usable outside Ink if needed)
- Support reading from file paths or stdin
- Preserve character positions for replacement operations

## Development Setup

Once the project is scaffolded:
1. Install dependencies with `npm install` or `yarn`
2. Check `package.json` for build, test, and lint scripts
3. Development typically follows standard TypeScript/Node.js conventions

## File Structure (To Be Created)

```
src/
  ├── diff/          # Core diff algorithm and text processing
  ├── cli/           # React Ink CLI components
  ├── utils/         # Markdown stripping, text normalization
  └── index.ts       # Entry point
```

## Testing and Quality

Check `package.json` for available scripts. Common patterns:
- `npm run build` - Compile TypeScript
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run dev` - Development mode (if available)

## Notes for Implementation

- The README specifies using React Ink, which requires careful state management for complex diffs
- Consider performance with large documents
- Markdown stripping should be robust (handle edge cases like code blocks)
- Diff granularity (sentence vs word vs character) should be configurable or well-documented
