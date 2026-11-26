'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {countGraphemes, MAX_TEXT_GRAPHEMES, splitTextIntoChunks} from './text';

export type SpeechStatus = 'idle' | 'speaking' | 'paused' | 'stopped' | 'completed' | 'error' | 'interrupted';

interface PlaybackSession {
    id: number;
    chunks: string[];
    chunkIndex: number;
    charIndex: number | null;
    started: boolean;
    settings: {
        voice: SpeechSynthesisVoice;
        rate: number;
    };
}

interface SpeechSettings {
    voice: SpeechSynthesisVoice;
    rate: number;
}

const isJapaneseVoice = (voice: SpeechSynthesisVoice) => /^ja(?:-|$)/i.test(voice.lang);

function chooseDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    return voices.find((voice) => voice.default) ?? voices[0];
}

export function useSpeechSynthesis(text: string) {
    const [supported, setSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [rate, setRate] = useState(1);
    const [status, setStatus] = useState<SpeechStatus>('idle');
    const [currentChunk, setCurrentChunk] = useState(0);
    const [totalChunks, setTotalChunks] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const sessionRef = useRef<PlaybackSession | null>(null);
    const sessionIdRef = useRef(0);
    const statusRef = useRef<SpeechStatus>('idle');
    const pauseRequestedRef = useRef(false);
    const previousTextRef = useRef(text);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const failedChunkIndexRef = useRef<number | null>(null);
    const speakChunkRef = useRef<(session: PlaybackSession, chunkIndex: number, offset?: number) => void>(() => undefined);
    const selectedVoice = voices.find((voice) => voice.voiceURI === selectedVoiceURI);

    const updateStatus = useCallback((nextStatus: SpeechStatus) => {
        statusRef.current = nextStatus;
        setStatus(nextStatus);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.SpeechSynthesisUtterance !== 'function') {
            return;
        }

        const synthesis = window.speechSynthesis;
        if (!synthesis || typeof synthesis.getVoices !== 'function') {
            return;
        }

        synthesisRef.current = synthesis;

        const updateVoices = () => {
            const japaneseVoices = synthesis.getVoices().filter(isJapaneseVoice);
            setSupported(true);
            setVoices(japaneseVoices);
            setSelectedVoiceURI((currentURI) => {
                if (japaneseVoices.some((voice) => voice.voiceURI === currentURI)) {
                    return currentURI;
                }
                return chooseDefaultVoice(japaneseVoices)?.voiceURI ?? '';
            });
        };

        updateVoices();
        synthesis.addEventListener('voiceschanged', updateVoices);

        return () => {
            synthesis.removeEventListener('voiceschanged', updateVoices);
            sessionRef.current = null;
            utteranceRef.current = null;
            synthesisRef.current = null;
            pauseRequestedRef.current = false;
            synthesis.cancel();
        };
    }, []);

    const speakChunk = useCallback((session: PlaybackSession, chunkIndex: number, offset = 0) => {
        const synthesis = synthesisRef.current;
        if (!synthesis || sessionRef.current?.id !== session.id) {
            return;
        }

        session.chunkIndex = chunkIndex;
        session.charIndex = offset;
        session.started = false;
        setCurrentChunk(chunkIndex + 1);
        updateStatus('speaking');

        const utterance = new window.SpeechSynthesisUtterance(session.chunks[chunkIndex].slice(offset));
        utterance.voice = session.settings.voice;
        utterance.rate = session.settings.rate;
        utteranceRef.current = utterance;

        utterance.onstart = () => {
            if (sessionRef.current?.id === session.id) {
                session.started = true;
            }
        };
        utterance.onboundary = (event) => {
            if (sessionRef.current?.id === session.id && Number.isFinite(event.charIndex) && event.charIndex >= 0) {
                session.started = true;
                session.charIndex = offset + event.charIndex;
            }
        };
        utterance.onend = () => {
            if (sessionRef.current?.id !== session.id) {
                return;
            }
            if (chunkIndex + 1 < session.chunks.length) {
                speakChunkRef.current(session, chunkIndex + 1);
                return;
            }

            sessionRef.current = null;
            utteranceRef.current = null;
            failedChunkIndexRef.current = null;
            updateStatus('completed');
        };
        utterance.onerror = (event) => {
            if (sessionRef.current?.id !== session.id) {
                return;
            }

            utteranceRef.current = null;
            if (event.error === 'canceled' && !session.started) {
                return;
            }

            if (event.error === 'interrupted' || event.error === 'canceled') {
                sessionRef.current = null;
                updateStatus('interrupted');
                setErrorMessage('ブラウザーまたは端末によって読み上げが中断されました。');
                return;
            }

            failedChunkIndexRef.current = chunkIndex;
            updateStatus('error');
            setErrorMessage('読み上げに失敗しました。失敗したチャンクの先頭から再試行できます。');
        };

        try {
            synthesis.speak(utterance);
        } catch (error) {
            failedChunkIndexRef.current = chunkIndex;
            updateStatus('error');
            const detail = error instanceof Error ? ` (${error.message})` : '';
            setErrorMessage(`読み上げを開始できませんでした${detail}。失敗したチャンクの先頭から再試行できます。`);
        }
    }, [updateStatus]);

    useEffect(() => {
        speakChunkRef.current = speakChunk;
    }, [speakChunk]);

    const beginSession = useCallback((
        chunks: string[],
        settings: SpeechSettings,
        startChunkIndex = 0,
        offset = 0
    ) => {
        const synthesis = synthesisRef.current;
        if (!synthesis) {
            return;
        }

        sessionRef.current = null;
        utteranceRef.current = null;
        synthesis.cancel();
        pauseRequestedRef.current = false;
        setErrorMessage(null);

        const session: PlaybackSession = {
            id: ++sessionIdRef.current,
            chunks,
            chunkIndex: startChunkIndex,
            charIndex: offset,
            started: false,
            settings,
        };
        sessionRef.current = session;
        setTotalChunks(chunks.length);
        speakChunk(session, startChunkIndex, offset);
    }, [speakChunk]);

    const play = useCallback(() => {
        if (
            !selectedVoice ||
            !synthesisRef.current ||
            !text.trim() ||
            countGraphemes(text) > MAX_TEXT_GRAPHEMES
        ) {
            return;
        }

        const chunks = splitTextIntoChunks(text);
        if (chunks.length === 0) {
            return;
        }

        failedChunkIndexRef.current = null;
        beginSession(chunks, {voice: selectedVoice, rate});
    }, [beginSession, rate, selectedVoice, text]);

    const pause = useCallback(() => {
        if (statusRef.current !== 'speaking' || !synthesisRef.current) {
            return;
        }

        pauseRequestedRef.current = true;
        synthesisRef.current.pause();
        updateStatus('paused');
    }, [updateStatus]);

    const resume = useCallback(() => {
        const session = sessionRef.current;
        if (statusRef.current !== 'paused' || !session) {
            return;
        }

        const offset = session.charIndex !== null &&
        session.charIndex >= 0 &&
        session.charIndex < session.chunks[session.chunkIndex].length
            ? session.charIndex
            : 0;
        beginSession(session.chunks, session.settings, session.chunkIndex, offset);
    }, [beginSession]);

    const stop = useCallback(() => {
        sessionRef.current = null;
        utteranceRef.current = null;
        failedChunkIndexRef.current = null;
        pauseRequestedRef.current = false;
        sessionIdRef.current += 1;
        synthesisRef.current?.cancel();
        setCurrentChunk(0);
        setTotalChunks(0);
        setErrorMessage(null);
        updateStatus('stopped');
    }, [updateStatus]);

    const retry = useCallback(() => {
        const session = sessionRef.current;
        const failedChunkIndex = failedChunkIndexRef.current;
        if (!session || failedChunkIndex === null) {
            return;
        }

        beginSession(session.chunks, session.settings, failedChunkIndex);
    }, [beginSession]);

    useEffect(() => {
        if (previousTextRef.current !== text) {
            previousTextRef.current = text;
            if (statusRef.current === 'speaking' || statusRef.current === 'paused') {
                stop();
            }
        }
    }, [stop, text]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const session = sessionRef.current;
            const synthesis = synthesisRef.current;
            if (
                document.visibilityState === 'visible' &&
                statusRef.current === 'speaking' &&
                !pauseRequestedRef.current &&
                session?.started &&
                synthesis &&
                !synthesis.speaking &&
                !synthesis.paused
            ) {
                sessionRef.current = null;
                utteranceRef.current = null;
                updateStatus('interrupted');
                setErrorMessage('ブラウザーまたは端末によって読み上げが中断された可能性があります。');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [updateStatus]);

    return {
        canSpeak: supported &&
            Boolean(selectedVoice) &&
            Boolean(text.trim()) &&
            countGraphemes(text) <= MAX_TEXT_GRAPHEMES,
        currentChunk,
        errorMessage,
        isSupported: supported,
        pause,
        play,
        rate,
        resume,
        retry,
        selectedVoice,
        selectedVoiceURI,
        setRate,
        setSelectedVoiceURI,
        status,
        stop,
        totalChunks,
        voices,
    };
}
