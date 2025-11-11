import {
  stripMarkdown,
  splitBySentence,
  normalizeForComparison,
  normalizeLine,
  normalizeDocumentText,
  extractParagraphMappings,
} from './markdown.js';

describe('Markdown Utilities', () => {
  describe('stripMarkdown', () => {
    it('should remove headers', () => {
      expect(stripMarkdown('# Header\nContent')).toBe('Header\nContent');
      expect(stripMarkdown('## Subheader\nContent')).toBe('Subheader\nContent');
    });

    it('should remove bold formatting', () => {
      expect(stripMarkdown('This is **bold** text')).toBe('This is bold text');
      expect(stripMarkdown('This is __bold__ text')).toBe('This is bold text');
    });

    it('should remove italic formatting', () => {
      expect(stripMarkdown('This is *italic* text')).toBe('This is italic text');
      expect(stripMarkdown('This is _italic_ text')).toBe('This is italic text');
    });

    it('should remove inline code', () => {
      expect(stripMarkdown('Use `npm install` command')).toBe('Use npm install command');
    });

    it('should remove links', () => {
      expect(stripMarkdown('[Google](https://google.com)')).toBe('Google');
      expect(stripMarkdown('[text][ref]')).toBe('text');
    });

    it('should remove HTML tags', () => {
      expect(stripMarkdown('Hello <span>world</span>')).toBe('Hello world');
    });
  });

  describe('splitBySentence', () => {
    it('should split by newlines', () => {
      const result = splitBySentence('Line 1\nLine 2\nLine 3');
      expect(result).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });

    it('should split by multiple spaces', () => {
      const result = splitBySentence('Word1  Word2   Word3');
      expect(result).toEqual(['Word1', 'Word2', 'Word3']);
    });

    it('should handle empty lines', () => {
      const result = splitBySentence('Line 1\n\nLine 2');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('should trim whitespace', () => {
      const result = splitBySentence('  Word1  \n  Word2  ');
      expect(result).toEqual(['Word1', 'Word2']);
    });
  });

  describe('normalizeForComparison', () => {
    it('should strip markdown and normalize whitespace', () => {
      const result = normalizeForComparison('# **Bold** text  with   spaces');
      expect(result).toBe('Bold text with spaces');
    });

    it('should handle complex formatting', () => {
      const input = '## Header with [link](url) and `code`';
      const result = normalizeForComparison(input);
      expect(result).toContain('Header');
      expect(result).toContain('link');
      expect(result).toContain('code');
    });
  });

  describe('normalizeLine', () => {
    it('should convert full-width alphanumerics and hyphens', () => {
      expect(normalizeLine('ＤＭＳＯＵ‐０２')).toBe('DMSOU-02');
    });

    it('should collapse various whitespace characters', () => {
      expect(normalizeLine('第　１章   総　則')).toBe('第1章 総則');
    });

    it('should remove trailing punctuation after normalization', () => {
      expect(normalizeLine('１４日。')).toBe('14日');
    });
  });

  describe('normalizeDocumentText', () => {
    it('should collapse soft line breaks inside paragraphs', () => {
      const input = 'AI に\nより⽬指すべき社会\n及び...';
      expect(normalizeDocumentText(input)).toBe('AI に より⽬指すべき社会 及び...');
    });

    it('should keep paragraph boundaries with double newlines', () => {
      const input = '段落1\n続き\n\n段落2';
      expect(normalizeDocumentText(input)).toBe('段落1 続き\n段落2');
    });

    it('should strip markdown before normalization', () => {
      const input = '# 見出し\n\n本文 **強調**';
      expect(normalizeDocumentText(input)).toBe('見出し\n本文 強調');
    });
  });

  describe('extractParagraphMappings', () => {
    it('should retain markdown for display but normalize for matching', () => {
      const result = extractParagraphMappings('# 見出し\n\n本文 **強調**');
      expect(result[0]).toEqual({ normalized: '見出し', display: '# 見出し' });
      expect(result[1]).toEqual({ normalized: '本文 強調', display: '本文 **強調**' });
    });

    it('should skip empty blocks', () => {
      const result = extractParagraphMappings(' \n\n  ');
      expect(result.length).toBe(0);
    });
  });
});
