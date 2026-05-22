import { render, screen } from '@testing-library/react';
import { TermsView } from './TermsView';

describe('TermsView', () => {
    it('h1 タイトルとして「利用規約」を表示する', () => {
        render(<TermsView />);

        expect(screen.getByRole('heading', { level: 1, name: '利用規約' })).toBeInTheDocument();
    });

    it('6 つの条項見出しをすべて表示する', () => {
        render(<TermsView />);

        const expectedHeadings = [
            '第1条（適用）',
            '第2条（利用登録）',
            '第3条（禁止事項）',
            '第4条（サービスの停止・変更）',
            '第5条（免責事項）',
            '第6条（利用規約の変更）',
        ];

        for (const heading of expectedHeadings) {
            expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
        }
    });

    it('制定日を表示する', () => {
        render(<TermsView />);

        expect(screen.getByText(/制定日:/)).toBeInTheDocument();
    });
});
