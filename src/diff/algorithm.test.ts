import { generateDiffMyers } from './algorithm.js';

describe('Character diff algorithm', () => {
  it('marks identical paragraphs as unchanged', () => {
    const text = 'Paragraph one\nParagraph two';
    const result = generateDiffMyers(text, text);

    expect(result.summary.unchanged).toBe(2);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
  });

  it('detects inserted paragraphs', () => {
    const original = 'A\nB';
    const formatted = 'A\nX inserted\nB';
    const result = generateDiffMyers(original, formatted);

    expect(result.summary.added).toBe(1);
    const added = result.entries.find((entry) => entry.type === 'added');
    expect(added?.content).toBe('X inserted');
  });

  it('detects removed paragraphs', () => {
    const original = 'A\nTO REMOVE\nB';
    const formatted = 'A\nB';
    const result = generateDiffMyers(original, formatted);

    expect(result.summary.removed).toBe(1);
    const removed = result.entries.find((entry) => entry.type === 'removed');
    expect(removed?.content).toBe('TO REMOVE');
  });

  it('handles empty strings', () => {
    const nothing = generateDiffMyers('', '');
    expect(nothing.summary.total).toBe(0);

    const addOnly = generateDiffMyers('', 'New text');
    expect(addOnly.summary.added).toBe(1);

    const removeOnly = generateDiffMyers('Old text', '');
    expect(removeOnly.summary.removed).toBe(1);
  });

  it('captures inline edits within a paragraph', () => {
    const original = 'AI 関連技術は日々発展をみせる';
    const formatted = 'AI 関連技術は日々発展をみせ、社会に広がる';
    const result = generateDiffMyers(original, formatted);

    expect(result.summary.added).toBeGreaterThan(0);
    expect(result.summary.unchanged).toBeGreaterThan(0);
  });
});
