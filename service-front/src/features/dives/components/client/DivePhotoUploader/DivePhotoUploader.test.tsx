import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_PHOTO_BYTES } from '@/features/dives/lib/photoValidation';

const refresh = vi.fn();
const upload = vi.fn();
const addDivePhoto = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh }),
}));
vi.mock('@/shared/lib/supabase/browser', () => ({
    createClient: () => ({ storage: { from: () => ({ upload }) } }),
}));
vi.mock('@/features/dives/server/photoActions', () => ({
    addDivePhoto: (...args: unknown[]) => addDivePhoto(...args),
}));

import { DivePhotoUploader } from './DivePhotoUploader';

const fileOf = (name: string, type: string, size: number): File => {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

const getFileInput = (container: HTMLElement): HTMLInputElement => {
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error('file input not found');
    return input as HTMLInputElement;
};

describe('DivePhotoUploader', () => {
    beforeEach(() => {
        refresh.mockReset();
        upload.mockReset().mockResolvedValue({ error: null });
        addDivePhoto.mockReset().mockResolvedValue({ success: true, photoId: 'p1' });
    });

    it('写真追加ボタンと aria-live 領域を公開する', () => {
        render(<DivePhotoUploader diveId="d1" userId="u1" existingCount={0} />);
        expect(screen.getByRole('button', { name: '写真を追加' })).toBeInTheDocument();
    });

    it('容量超過はクライアント検証で弾き、アップロードしない', async () => {
        const { container } = render(<DivePhotoUploader diveId="d1" userId="u1" existingCount={0} />);
        const big = fileOf('big.jpg', 'image/jpeg', MAX_PHOTO_BYTES + 1);
        fireEvent.change(getFileInput(container), { target: { files: [big] } });

        await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
        expect(addDivePhoto).not.toHaveBeenCalled();
        expect(upload).not.toHaveBeenCalled();
    });

    it('正常時は原本をアップロードし addDivePhoto を呼んで refresh する', async () => {
        const { container } = render(<DivePhotoUploader diveId="d1" userId="u1" existingCount={0} />);
        const valid = fileOf('a.jpg', 'image/jpeg', 1024);
        fireEvent.change(getFileInput(container), { target: { files: [valid] } });

        await waitFor(() => expect(addDivePhoto).toHaveBeenCalledOnce());
        expect(addDivePhoto).toHaveBeenCalledWith(
            expect.objectContaining({ diveId: 'd1', origPath: expect.stringMatching(/^u1\/d1\/orig\//) }),
        );
        expect(upload).toHaveBeenCalledOnce();
        await waitFor(() => expect(refresh).toHaveBeenCalled());
        expect(screen.getByText('1 枚の写真を追加しました')).toBeInTheDocument();
    });

    it('上限超過（既存 10 枚）はクライアント検証で弾く', async () => {
        const { container } = render(<DivePhotoUploader diveId="d1" userId="u1" existingCount={10} />);
        fireEvent.change(getFileInput(container), { target: { files: [fileOf('a.jpg', 'image/jpeg', 1024)] } });
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('最大 10 枚'));
        expect(addDivePhoto).not.toHaveBeenCalled();
    });
});
