import {act, renderHook, waitFor} from '@testing-library/react';
import {useSpeechSynthesis} from '@/lib/speech/useSpeechSynthesis';

class MockUtterance extends EventTarget implements SpeechSynthesisUtterance {
    text: string;
    lang = '';
    voice: SpeechSynthesisVoice | null = null;
    volume = 1;
    rate = 1;
    pitch = 1;
    onstart: SpeechSynthesisUtterance['onstart'] = null;
    onend: SpeechSynthesisUtterance['onend'] = null;
    onerror: SpeechSynthesisUtterance['onerror'] = null;
    onboundary: SpeechSynthesisUtterance['onboundary'] = null;
    onmark: SpeechSynthesisUtterance['onmark'] = null;
    onpause: SpeechSynthesisUtterance['onpause'] = null;
    onresume: SpeechSynthesisUtterance['onresume'] = null;

    constructor(text = '') {
        super();
        this.text = text;
    }
}

const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
const originalUtterance = Object.getOwnPropertyDescriptor(window, 'SpeechSynthesisUtterance');
let voiceEvents: EventTarget;
let japaneseVoices: SpeechSynthesisVoice[];
let isSpeaking: boolean;
let isPaused: boolean;
let utterances: SpeechSynthesisUtterance[];
let synthesis: SpeechSynthesis;

const japaneseVoice = {
    default: true,
    lang: 'ja-JP',
    name: 'Japanese',
    localService: true,
    voiceURI: 'ja-JP',
} as SpeechSynthesisVoice;

const englishVoice = {
    default: true,
    lang: 'en-US',
    name: 'English',
    localService: true,
    voiceURI: 'en-US',
} as SpeechSynthesisVoice;

function restoreWindowProperty(name: 'speechSynthesis' | 'SpeechSynthesisUtterance', descriptor?: PropertyDescriptor) {
    if (descriptor) {
        Object.defineProperty(window, name, descriptor);
    } else {
        Reflect.deleteProperty(window, name);
    }
}

function endUtterance(utterance: SpeechSynthesisUtterance) {
    isSpeaking = false;
    act(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent));
}

describe('useSpeechSynthesis', () => {
    beforeEach(() => {
        japaneseVoices = [japaneseVoice];
        voiceEvents = new EventTarget();
        isSpeaking = false;
        isPaused = false;
        utterances = [];

        synthesis = {
            getVoices: jest.fn(() => japaneseVoices),
            speak: jest.fn((utterance: SpeechSynthesisUtterance) => {
                utterances.push(utterance);
                isSpeaking = true;
                isPaused = false;
            }),
            cancel: jest.fn(() => {
                isSpeaking = false;
                isPaused = false;
            }),
            pause: jest.fn(() => {
                isSpeaking = false;
                isPaused = true;
            }),
            resume: jest.fn(() => {
                isSpeaking = true;
                isPaused = false;
            }),
            addEventListener: voiceEvents.addEventListener.bind(voiceEvents),
            removeEventListener: voiceEvents.removeEventListener.bind(voiceEvents),
            get speaking() {
                return isSpeaking;
            },
            get paused() {
                return isPaused;
            },
        } as unknown as SpeechSynthesis;

        Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: synthesis});
        Object.defineProperty(window, 'SpeechSynthesisUtterance', {
            configurable: true,
            value: MockUtterance,
        });
    });

    afterEach(() => {
        restoreWindowProperty('speechSynthesis', originalSpeechSynthesis);
        restoreWindowProperty('SpeechSynthesisUtterance', originalUtterance);
    });

    it('selects a default Japanese voice and updates asynchronously loaded voices', async () => {
        japaneseVoices = [];
        const {result} = renderHook(() => useSpeechSynthesis('読み上げ'));

        expect(result.current.canSpeak).toBe(false);
        japaneseVoices = [englishVoice, japaneseVoice];
        act(() => voiceEvents.dispatchEvent(new Event('voiceschanged')));

        await waitFor(() => {
            expect(result.current.selectedVoiceURI).toBe('ja-JP');
        });
        expect(result.current.voices).toEqual([japaneseVoice]);
        expect(result.current.canSpeak).toBe(true);
    });

    it('reads consecutive chunks and updates progress until completion', () => {
        const text = 'あ'.repeat(501);
        const {result} = renderHook(() => useSpeechSynthesis(text));

        act(() => result.current.play());
        expect(utterances[0].text).toBe('あ'.repeat(500));
        expect(result.current.currentChunk).toBe(1);
        expect(result.current.totalChunks).toBe(2);
        expect(result.current.status).toBe('speaking');

        endUtterance(utterances[0]);
        expect(utterances[1].text).toBe('あ');
        expect(result.current.currentChunk).toBe(2);

        endUtterance(utterances[1]);
        expect(result.current.status).toBe('completed');
    });

    it('resumes from the latest boundary and keeps the original playback settings', () => {
        const {result} = renderHook(() => useSpeechSynthesis('abcdef'));

        act(() => result.current.play());
        act(() => utterances[0].onstart?.(new Event('start') as SpeechSynthesisEvent));
        act(() => utterances[0].onboundary?.(
            Object.assign(new Event('boundary'), {charIndex: 2}) as SpeechSynthesisEvent
        ));
        act(() => result.current.pause());
        act(() => result.current.setRate(2));
        act(() => result.current.resume());

        expect(result.current.status).toBe('speaking');
        expect(utterances[1].text).toBe('cdef');
        expect(utterances[1].rate).toBe(1);
    });

    it('restarts the current chunk when no boundary position was reported', () => {
        const {result} = renderHook(() => useSpeechSynthesis('読み上げ'));

        act(() => result.current.play());
        act(() => result.current.pause());
        act(() => result.current.resume());

        expect(utterances[1].text).toBe('読み上げ');
    });

    it('stops playback when the input changes', () => {
        const {result, rerender} = renderHook(({text}) => useSpeechSynthesis(text), {
            initialProps: {text: '再生中の文章'},
        });

        act(() => result.current.play());
        rerender({text: '編集後の文章'});

        expect(synthesis.cancel).toHaveBeenCalled();
        expect(result.current.status).toBe('stopped');
    });

    it('retries a failed chunk from its beginning', () => {
        const {result} = renderHook(() => useSpeechSynthesis('あ'.repeat(501)));

        act(() => result.current.play());
        endUtterance(utterances[0]);
        act(() => utterances[1].onstart?.(new Event('start') as SpeechSynthesisEvent));
        act(() => utterances[1].onerror?.(
            Object.assign(new Event('error'), {error: 'synthesis-failed'}) as SpeechSynthesisErrorEvent
        ));
        expect(result.current.status).toBe('error');

        act(() => result.current.retry());
        expect(utterances[2].text).toBe('あ');
        expect(result.current.status).toBe('speaking');
    });

    it('cancels the active utterance when the component unmounts', () => {
        const {result, unmount} = renderHook(() => useSpeechSynthesis('読み上げ'));
        act(() => result.current.play());

        unmount();

        expect(synthesis.cancel).toHaveBeenCalled();
    });

    it('reports an interruption when speech is no longer active after returning to the tab', () => {
        Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'visible'});
        const {result} = renderHook(() => useSpeechSynthesis('読み上げ'));

        act(() => result.current.play());
        act(() => utterances[0].onstart?.(new Event('start') as SpeechSynthesisEvent));
        isSpeaking = false;
        act(() => document.dispatchEvent(new Event('visibilitychange')));

        expect(result.current.status).toBe('interrupted');
        expect(result.current.errorMessage).toContain('中断');
    });
});
