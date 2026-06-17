import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();
const deleteDivePhoto = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh }),
}));
vi.mock('@/features/dives/server/photoActions', () => ({
    deleteDivePhoto: (...args: unknown[]) => deleteDivePhoto(...args),
}));

import { DeleteDivePhotoButton } from './DeleteDivePhotoButton';

describe('DeleteDivePhotoButton', () => {
    beforeEach(() => {
        refresh.mockReset();
        deleteDivePhoto.mockReset().mockResolvedValue({ success: true });
    });

    it('初期は「写真を削除」ボタンのみ表示する', () => {
        render(<DeleteDivePhotoButton photoId="p1" />);
        expect(screen.getByRole('button', { name: '写真を削除' })).toBeInTheDocument();
        expect(deleteDivePhoto).not.toHaveBeenCalled();
    });

    it('クリックで確認を表示し、確定すると削除して refresh する', async () => {
        render(<DeleteDivePhotoButton photoId="p1" />);
        fireEvent.click(screen.getByRole('button', { name: '写真を削除' }));
        expect(screen.getByText('この写真を削除しますか？元に戻せません。')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '削除する' }));
        await waitFor(() => expect(deleteDivePhoto).toHaveBeenCalledWith('p1'));
        await waitFor(() => expect(refresh).toHaveBeenCalled());
    });

    it('キャンセルで確認を閉じ、削除しない', () => {
        render(<DeleteDivePhotoButton photoId="p1" />);
        fireEvent.click(screen.getByRole('button', { name: '写真を削除' }));
        fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
        expect(screen.getByRole('button', { name: '写真を削除' })).toBeInTheDocument();
        expect(deleteDivePhoto).not.toHaveBeenCalled();
    });

    it('削除失敗時はエラーを表示する', async () => {
        deleteDivePhoto.mockResolvedValue({ success: false, error: '写真の削除に失敗しました' });
        render(<DeleteDivePhotoButton photoId="p1" />);
        fireEvent.click(screen.getByRole('button', { name: '写真を削除' }));
        fireEvent.click(screen.getByRole('button', { name: '削除する' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('写真の削除に失敗しました');
        expect(refresh).not.toHaveBeenCalled();
    });
});
