import { fireEvent, render, screen } from '@testing-library/react';

import type { DivePhotoView } from '@/features/dives/types';
import { DivePhotoGallery } from './DivePhotoGallery';

const view = (over: Partial<DivePhotoView> = {}): DivePhotoView => ({
    id: 'p1',
    displayUrl: '/display-p1.webp',
    thumbUrl: '/thumb-p1.webp',
    caption: '',
    isCover: false,
    width: 800,
    height: 600,
    alt: '2026-06-16 大瀬崎 の写真',
    ...over,
});

describe('DivePhotoGallery', () => {
    it('写真を alt 付きで順に表示する', () => {
        render(
            <DivePhotoGallery
                photos={[
                    view({ id: 'p1', alt: '一枚目' }),
                    view({ id: 'p2', thumbUrl: '/thumb-p2.webp', alt: '二枚目' }),
                ]}
            />,
        );
        const imgs = screen.getAllByRole('img');
        expect(imgs.map((img) => img.getAttribute('alt'))).toEqual(['一枚目', '二枚目']);
    });

    it('各サムネイルが拡大表示のトリガーボタンになっている', () => {
        render(<DivePhotoGallery photos={[view({ alt: '海' })]} />);
        expect(screen.getByRole('button', { name: '海 を拡大表示' })).toBeInTheDocument();
    });

    it('サムネイルをクリックすると拡大モーダルを開く', async () => {
        render(<DivePhotoGallery photos={[view({ displayUrl: '/full.webp', alt: '海の写真' })]} />);
        fireEvent.click(screen.getByRole('button', { name: '海の写真 を拡大表示' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('0 枚なら何も描画しない', () => {
        const { container } = render(<DivePhotoGallery photos={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
