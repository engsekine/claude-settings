import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setDiveVisibility } from '@/features/dives/server/actions';
import { DiveVisibilityToggle } from './DiveVisibilityToggle';

vi.mock('@/features/dives/server/actions', () => ({
    setDiveVisibility: vi.fn(),
}));

const mockedSetDiveVisibility = vi.mocked(setDiveVisibility);

describe('DiveVisibilityToggle', () => {
    beforeEach(() => {
        mockedSetDiveVisibility.mockReset();
    });

    it('初期状態を switch の aria-checked とラベルに反映する', () => {
        render(<DiveVisibilityToggle diveId="d1" initialIsPublic={false} />);
        const toggle = screen.getByRole('switch', { name: 'このログを公開する' });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByText('非公開')).toBeInTheDocument();
    });

    it('公開化に成功すると公開状態になり共有リンクを表示する', async () => {
        mockedSetDiveVisibility.mockResolvedValue({ success: true, isPublic: true, publicSlug: 'abcdef0123456789' });
        const user = userEvent.setup();
        render(<DiveVisibilityToggle diveId="d1" initialIsPublic={false} />);

        await user.click(screen.getByRole('switch'));

        expect(mockedSetDiveVisibility).toHaveBeenCalledWith('d1', true);
        await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
        expect(screen.getByText('/shared/dives/abcdef0123456789')).toBeInTheDocument();
    });

    it('失敗時は role="alert" でエラーを表示し、状態を変えない', async () => {
        mockedSetDiveVisibility.mockResolvedValue({ success: false, error: '公開設定の更新に失敗しました' });
        const user = userEvent.setup();
        render(<DiveVisibilityToggle diveId="d1" initialIsPublic={false} />);

        await user.click(screen.getByRole('switch'));

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('公開設定の更新に失敗しました'));
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it('公開中は初期 slug の共有リンクを表示する', () => {
        render(<DiveVisibilityToggle diveId="d1" initialIsPublic initialPublicSlug="0123456789abcdef" />);
        expect(screen.getByText('/shared/dives/0123456789abcdef')).toBeInTheDocument();
    });
});
