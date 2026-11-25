import {
    countGraphemes,
    MAX_CHUNK_GRAPHEMES,
    MAX_TEXT_GRAPHEMES,
    splitGraphemes,
    splitTextIntoChunks,
} from '@/lib/speech/text';

describe('speech text utilities', () => {
    it('counts displayed grapheme clusters instead of code units', () => {
        expect(countGraphemes('あ👨‍👩‍👧‍👦か\u3099🇯🇵')).toBe(4);
    });

    it('uses the grapheme fallback when Intl.Segmenter is unavailable', () => {
        const originalSegmenter = Intl.Segmenter;
        Object.defineProperty(Intl, 'Segmenter', {configurable: true, value: undefined});

        try {
            expect(splitGraphemes('👨‍👩‍👧‍👦か\u3099🇯🇵')).toEqual(['👨‍👩‍👧‍👦', 'か\u3099', '🇯🇵']);
        } finally {
            Object.defineProperty(Intl, 'Segmenter', {configurable: true, value: originalSegmenter});
        }
    });

    it('splits at the last sentence or newline boundary within the chunk limit', () => {
        const text = `${'あ'.repeat(480)}。${'い'.repeat(10)}！${'う'.repeat(20)}`;
        const chunks = splitTextIntoChunks(text);

        expect(chunks[0]).toBe(`${'あ'.repeat(480)}。${'い'.repeat(10)}！`);
        expect(chunks.join('')).toBe(text);
        expect(chunks.every((chunk) => countGraphemes(chunk) <= MAX_CHUNK_GRAPHEMES)).toBe(true);

        const newlineText = `${'あ'.repeat(499)}\n${'い'.repeat(3)}`;
        expect(splitTextIntoChunks(newlineText)[0]).toBe(`${'あ'.repeat(499)}\n`);
    });

    it('splits at the grapheme limit when no sentence boundary is present', () => {
        const text = '👩🏽‍🚀'.repeat(MAX_CHUNK_GRAPHEMES + 1);
        const chunks = splitTextIntoChunks(text);

        expect(chunks.map(countGraphemes)).toEqual([MAX_CHUNK_GRAPHEMES, 1]);
        expect(chunks.join('')).toBe(text);
    });

    it('returns no chunks for empty input and preserves input at the text limit', () => {
        expect(splitTextIntoChunks('')).toEqual([]);
        expect(countGraphemes('あ'.repeat(MAX_TEXT_GRAPHEMES))).toBe(MAX_TEXT_GRAPHEMES);
    });
});
