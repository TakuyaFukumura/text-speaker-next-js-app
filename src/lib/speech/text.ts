import Graphemer from 'graphemer';

export const MAX_TEXT_GRAPHEMES = 10_000;
export const MAX_CHUNK_GRAPHEMES = 500;

const graphemer = new Graphemer();
const sentenceEnd = /[。！？.!?\r\n]/u;

export function splitGraphemes(text: string): string[] {
    if (typeof Intl.Segmenter === 'function') {
        return Array.from(
            new Intl.Segmenter('ja', {granularity: 'grapheme'}).segment(text),
            ({segment}) => segment
        );
    }

    return graphemer.splitGraphemes(text);
}

export function countGraphemes(text: string): number {
    return splitGraphemes(text).length;
}

export function splitTextIntoChunks(text: string): string[] {
    const graphemes = splitGraphemes(text);
    const chunks: string[] = [];

    while (graphemes.length > 0) {
        const limit = Math.min(MAX_CHUNK_GRAPHEMES, graphemes.length);
        let chunkLength = limit;

        if (graphemes.length > limit) {
            for (let index = limit - 1; index >= 0; index -= 1) {
                if (sentenceEnd.test(graphemes[index])) {
                    chunkLength = index + 1;
                    break;
                }
            }
        }

        chunks.push(graphemes.splice(0, chunkLength).join(''));
    }

    return chunks;
}
