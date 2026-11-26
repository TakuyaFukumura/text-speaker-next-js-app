import {render, screen} from '@testing-library/react';
import AboutPage from '../../../../src/app/about/page';

describe('AboutPage', () => {
    it('アプリの説明と読み上げ画面へのリンクを表示する', () => {
        render(<AboutPage/>);

        expect(screen.getByRole('heading', {name: '説明', level: 1})).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '使い方', level: 2})).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '主な機能', level: 2})).toBeInTheDocument();
        expect(screen.getByRole('heading', {name: '音声とプライバシーについて', level: 2})).toBeInTheDocument();
        expect(screen.getByRole('link', {name: '読み上げ画面に戻る'})).toHaveAttribute('href', '/');
    });
});
