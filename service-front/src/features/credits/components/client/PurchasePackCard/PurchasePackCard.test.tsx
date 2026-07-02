import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Server Action モックを vi.mock より前に宣言し、ファクトリ内でクロージャ参照する
const createCheckoutSession = vi.fn();

vi.mock('@/features/credits/server/actions', () => ({
    createCheckoutSession: (...args: unknown[]) => createCheckoutSession(...args),
}));

// vi.mock の後に import する（ホイスティングの都合）
import { PurchasePackCard } from './PurchasePackCard';

describe('PurchasePackCard', () => {
    beforeEach(() => {
        createCheckoutSession.mockReset();
    });

    describe('初期表示', () => {
        it('パック名「ログパック（10 枠）」を表示する', () => {
            render(<PurchasePackCard />);

            expect(screen.getByText('ログパック（10 枠）')).toBeInTheDocument();
        });

        it('価格「¥300」を表示する', () => {
            render(<PurchasePackCard />);

            expect(screen.getByText('¥300')).toBeInTheDocument();
        });

        it('「購入する」ボタンを表示する', () => {
            render(<PurchasePackCard />);

            expect(screen.getByRole('button', { name: '購入する' })).toBeInTheDocument();
        });

        it('初期状態ではエラーメッセージを表示しない', () => {
            render(<PurchasePackCard />);

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('購入成功時', () => {
        it('createCheckoutSession を呼び window.location.href に Stripe の URL を設定する', async () => {
            const stripeUrl = 'https://checkout.stripe.com/pay/cs_test_xxx';
            createCheckoutSession.mockResolvedValueOnce({ success: true, url: stripeUrl });
            // jsdom の window.location は書き込み保護されているため差し替える
            Object.defineProperty(window, 'location', {
                value: { href: '' },
                writable: true,
                configurable: true,
            });

            const user = userEvent.setup();
            render(<PurchasePackCard />);

            await user.click(screen.getByRole('button', { name: '購入する' }));

            expect(createCheckoutSession).toHaveBeenCalledTimes(1);
            expect(window.location.href).toBe(stripeUrl);
        });
    });

    describe('購入失敗時', () => {
        it('role="alert" でエラーメッセージを表示する（US2-AC2）', async () => {
            createCheckoutSession.mockResolvedValueOnce({
                success: false,
                error: '購入手続きの開始に失敗しました',
            });
            const user = userEvent.setup();
            render(<PurchasePackCard />);

            await user.click(screen.getByRole('button', { name: '購入する' }));

            expect(await screen.findByRole('alert')).toHaveTextContent('購入手続きの開始に失敗しました');
        });

        it('再試行するとエラーがクリアされる', async () => {
            createCheckoutSession
                .mockResolvedValueOnce({ success: false, error: '最初のエラー' })
                .mockResolvedValueOnce({ success: true, url: 'https://checkout.stripe.com/pay/cs_test_yyy' });
            Object.defineProperty(window, 'location', {
                value: { href: '' },
                writable: true,
                configurable: true,
            });
            const user = userEvent.setup();
            render(<PurchasePackCard />);

            await user.click(screen.getByRole('button', { name: '購入する' }));
            expect(await screen.findByRole('alert')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: '購入する' }));

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('送信中の状態', () => {
        it('送信中はボタンが disabled + aria-busy になり文言が変わる', async () => {
            // 決して resolve しない Promise で pending 状態を維持する
            createCheckoutSession.mockReturnValueOnce(new Promise(() => undefined));
            const user = userEvent.setup();
            render(<PurchasePackCard />);

            await user.click(screen.getByRole('button', { name: '購入する' }));

            const pendingButton = screen.getByRole('button', { name: '手続きを開始しています...' });
            expect(pendingButton).toBeDisabled();
            expect(pendingButton).toHaveAttribute('aria-busy', 'true');
        });
    });
});
