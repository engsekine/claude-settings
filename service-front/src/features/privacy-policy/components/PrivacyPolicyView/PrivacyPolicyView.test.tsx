import { render, screen } from '@testing-library/react';
import { PrivacyPolicyView } from './PrivacyPolicyView';

describe('PrivacyPolicyView', () => {
    it('h1 タイトルとして「プライバシーポリシー」を表示する', () => {
        render(<PrivacyPolicyView />);

        expect(screen.getByRole('heading', { level: 1, name: 'プライバシーポリシー' })).toBeInTheDocument();
    });

    it('主要セクション見出しをすべて表示する', () => {
        render(<PrivacyPolicyView />);

        const expectedHeadings = [
            '個人情報の収集について',
            '個人情報の利用目的',
            '個人情報の第三者提供',
            'Cookieの使用について',
            'プライバシーポリシーの変更',
        ];

        for (const heading of expectedHeadings) {
            expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
        }
    });

    it('制定日を表示する', () => {
        render(<PrivacyPolicyView />);

        expect(screen.getByText(/制定日:/)).toBeInTheDocument();
    });
});
