'use client';

import {countGraphemes, MAX_TEXT_GRAPHEMES} from '@/lib/speech/text';
import {SpeechStatus, useSpeechSynthesis} from '@/lib/speech/useSpeechSynthesis';
import {useState} from 'react';

const statusLabels: Record<SpeechStatus, string> = {
    idle: '待機中',
    speaking: '読み上げ中',
    paused: '一時停止中',
    stopped: '停止中',
    completed: '読み上げ完了',
    error: 'エラー',
    interrupted: '中断',
};

export default function SpeechReader() {
    const [text, setText] = useState('');
    const speech = useSpeechSynthesis(text);
    const graphemeCount = countGraphemes(text);
    const isOverLimit = graphemeCount > MAX_TEXT_GRAPHEMES;
    const isActive = speech.status === 'speaking' || speech.status === 'paused';
    const canPlay = speech.canSpeak && !isOverLimit && speech.status !== 'speaking' && speech.status !== 'paused';

    return (
        <main
            className="font-sans min-h-[calc(100vh-4rem)] bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
            <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-lg sm:p-10 dark:bg-gray-800">
                <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-gray-100">
                    テキスト読み上げ
                </h1>

                <label htmlFor="speech-text" className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                    読み上げるテキスト
                </label>
                <textarea
                    id="speech-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={12}
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white p-4 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="ここに文章を入力してください"
                    aria-describedby="text-count"
                />
                <div
                    id="text-count"
                    className={`mt-2 text-right text-sm ${isOverLimit ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {graphemeCount.toLocaleString('ja-JP')} / {MAX_TEXT_GRAPHEMES.toLocaleString('ja-JP')} 文字
                </div>
                {isOverLimit && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                        文字数の上限を超えています。入力内容は保持されますが、読み上げできません。
                    </p>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="speech-voice"
                               className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                            音声
                        </label>
                        <select
                            id="speech-voice"
                            value={speech.selectedVoiceURI}
                            onChange={(event) => speech.setSelectedVoiceURI(event.target.value)}
                            disabled={speech.voices.length === 0}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        >
                            {speech.voices.length === 0 && <option value="">利用可能な日本語音声がありません</option>}
                            {speech.voices.map((voice) => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="speech-rate"
                               className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                            読み上げ速度: {speech.rate.toFixed(1)}x
                        </label>
                        <input
                            id="speech-rate"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={speech.rate}
                            onChange={(event) => speech.setRate(Number(event.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>0.5x</span>
                            <span>2.0x</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={speech.play}
                        disabled={!canPlay}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        再生
                    </button>
                    <button
                        type="button"
                        onClick={speech.status === 'paused' ? speech.resume : speech.pause}
                        disabled={!isActive}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {speech.status === 'paused' ? '再開' : '一時停止'}
                    </button>
                    <button
                        type="button"
                        onClick={speech.stop}
                        disabled={!isActive}
                        className="rounded-lg bg-gray-600 px-5 py-2.5 font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        停止
                    </button>
                    {speech.status === 'error' && (
                        <button
                            type="button"
                            onClick={speech.retry}
                            className="rounded-lg border border-red-600 px-5 py-2.5 font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                        >
                            失敗した箇所から再試行
                        </button>
                    )}
                </div>

                <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p role="status" aria-live="polite" aria-atomic="true"
                       className="font-medium text-gray-800 dark:text-gray-200">
                        状態: {statusLabels[speech.status]}
                    </p>
                    {speech.totalChunks > 0 && isActive && (
                        <p
                            className="mt-1 text-sm text-gray-600 dark:text-gray-300"
                            aria-live="polite"
                            aria-atomic="true"
                            aria-label={`読み上げ進捗 ${speech.currentChunk} / ${speech.totalChunks}`}
                        >
                            進捗: {speech.currentChunk}/{speech.totalChunks}
                        </p>
                    )}
                    {speech.errorMessage && (
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                            {speech.errorMessage}
                        </p>
                    )}
                    {!speech.isSupported && (
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                            このブラウザーでは音声読み上げ機能を利用できません。
                        </p>
                    )}
                    {speech.isSupported && speech.voices.length === 0 && (
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                            利用可能な日本語音声がありません。端末に日本語音声を追加してから再度お試しください。
                        </p>
                    )}
                </div>

            </section>
        </main>
    );
}
