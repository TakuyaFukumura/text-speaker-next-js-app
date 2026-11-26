import {fireEvent, render, screen} from '@testing-library/react';
import SpeechReader from '@/app/components/SpeechReader';
import {useSpeechSynthesis} from '@/lib/speech/useSpeechSynthesis';

jest.mock('@/lib/speech/useSpeechSynthesis', () => ({
    useSpeechSynthesis: jest.fn(),
}));

const japaneseVoice = {
    default: true,
    lang: 'ja-JP',
    name: 'Japanese',
    localService: true,
    voiceURI: 'ja-JP',
} as SpeechSynthesisVoice;

const alternateJapaneseVoice = {
    default: false,
    lang: 'ja-JP',
    name: 'Japanese alternate',
    localService: true,
    voiceURI: 'ja-JP-alternate',
} as SpeechSynthesisVoice;

const mockUseSpeechSynthesis = jest.mocked(useSpeechSynthesis);

function createSpeechState(): ReturnType<typeof useSpeechSynthesis> {
    return {
        canSpeak: true,
        currentChunk: 0,
        errorMessage: null,
        isSupported: true,
        pause: jest.fn(),
        play: jest.fn(),
        rate: 1,
        resume: jest.fn(),
        retry: jest.fn(),
        selectedVoice: japaneseVoice,
        selectedVoiceURI: japaneseVoice.voiceURI,
        setRate: jest.fn(),
        setSelectedVoiceURI: jest.fn(),
        status: 'idle',
        stop: jest.fn(),
        totalChunks: 0,
        voices: [japaneseVoice, alternateJapaneseVoice],
    };
}

describe('SpeechReader', () => {
    let speechState: ReturnType<typeof useSpeechSynthesis>;

    beforeEach(() => {
        speechState = createSpeechState();
        mockUseSpeechSynthesis.mockReturnValue(speechState);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('counts grapheme clusters and keeps over-limit text without allowing playback', () => {
        render(<SpeechReader/>);
        const textarea = screen.getByRole('textbox', {name: '読み上げるテキスト'});

        fireEvent.change(textarea, {target: {value: 'あ👨‍👩‍👧‍👦'}});
        expect(screen.getByText('2 / 10,000 文字')).toBeInTheDocument();

        const overLimitText = 'あ'.repeat(10_001);
        fireEvent.change(textarea, {target: {value: overLimitText}});

        expect(textarea).toHaveValue(overLimitText);
        expect(screen.getByText('10,001 / 10,000 文字')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('文字数の上限を超えています');
        expect(screen.getByRole('button', {name: '再生'})).toBeDisabled();
    });

    it('does not show the introductory description', () => {
        render(<SpeechReader/>);

        expect(screen.queryByText('テキストを入力し、ブラウザーまたは端末で利用できる日本語音声で読み上げます。')).not.toBeInTheDocument();
    });

    it('exposes voice and speed controls with accessible labels', () => {
        render(<SpeechReader/>);
        const voiceSelect = screen.getByRole('combobox', {name: '音声'});
        const speedSlider = screen.getByRole('slider', {name: /読み上げ速度/});

        fireEvent.change(voiceSelect, {target: {value: alternateJapaneseVoice.voiceURI}});
        fireEvent.change(speedSlider, {target: {value: '1.5'}});

        expect(speechState.setSelectedVoiceURI).toHaveBeenCalledWith(alternateJapaneseVoice.voiceURI);
        expect(speechState.setRate).toHaveBeenCalledWith(1.5);
        expect(screen.queryByText(/入力したテキストや設定は保存せず/)).not.toBeInTheDocument();
    });

    it('announces playback progress and presents pause and resume controls', () => {
        speechState.status = 'speaking';
        speechState.currentChunk = 2;
        speechState.totalChunks = 5;
        const {rerender} = render(<SpeechReader/>);

        expect(screen.getByRole('status')).toHaveTextContent('状態: 読み上げ中');
        expect(screen.getByText('進捗: 2/5')).toHaveAttribute('aria-label', '読み上げ進捗 2 / 5');
        expect(screen.getByRole('button', {name: '再生'})).toBeDisabled();
        fireEvent.click(screen.getByRole('button', {name: '一時停止'}));
        expect(speechState.pause).toHaveBeenCalled();

        speechState.status = 'paused';
        rerender(<SpeechReader/>);
        fireEvent.click(screen.getByRole('button', {name: '再開'}));
        expect(speechState.resume).toHaveBeenCalled();
    });

    it('shows unavailable voice guidance and disables playback', () => {
        speechState.canSpeak = false;
        speechState.voices = [];
        render(<SpeechReader/>);

        expect(screen.getByRole('alert')).toHaveTextContent('利用可能な日本語音声がありません');
        expect(screen.getByRole('combobox', {name: '音声'})).toBeDisabled();
        expect(screen.getByRole('button', {name: '再生'})).toBeDisabled();
    });

    it('offers retry for a failed utterance', () => {
        speechState.status = 'error';
        speechState.errorMessage = '読み上げに失敗しました。';
        render(<SpeechReader/>);

        fireEvent.click(screen.getByRole('button', {name: '失敗した箇所から再試行'}));

        expect(speechState.retry).toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent('読み上げに失敗しました');
    });
});
