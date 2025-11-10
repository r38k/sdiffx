import { generateDiffMyers } from './algorithm';

describe('Diff Algorithm', () => {
  describe('generateDiffMyers', () => {
    it('should handle identical arrays', () => {
      const original = ['A', 'B', 'C'];
      const formatted = ['A', 'B', 'C'];
      const result = generateDiffMyers(original, formatted);

      expect(result.summary.unchanged).toBe(3);
      expect(result.summary.added).toBe(0);
      expect(result.summary.removed).toBe(0);
    });

    it('should detect added entries', () => {
      const original = ['A', 'B'];
      const formatted = ['A', 'X', 'B'];
      const result = generateDiffMyers(original, formatted);

      expect(result.summary.added).toBeGreaterThan(0);
      expect(result.entries.some((e) => e.type === 'added')).toBe(true);
    });

    it('should detect removed entries', () => {
      const original = ['A', 'X', 'B'];
      const formatted = ['A', 'B'];
      const result = generateDiffMyers(original, formatted);

      expect(result.summary.removed).toBeGreaterThan(0);
      expect(result.entries.some((e) => e.type === 'removed')).toBe(true);
    });

    it('should handle empty arrays', () => {
      const result1 = generateDiffMyers([], ['A', 'B']);
      expect(result1.summary.added).toBe(2);

      const result2 = generateDiffMyers(['A', 'B'], []);
      expect(result2.summary.removed).toBe(2);
    });

    it('should correctly match common elements', () => {
      const original = ['A', 'B', 'C', 'D'];
      const formatted = ['A', 'X', 'C', 'D'];
      const result = generateDiffMyers(original, formatted);

      const unchanged = result.entries.filter((e) => e.type === 'unchanged');
      expect(unchanged.length).toBeGreaterThan(0);
      expect(unchanged.some((e) => e.content === 'A')).toBe(true);
    });
  });
});
