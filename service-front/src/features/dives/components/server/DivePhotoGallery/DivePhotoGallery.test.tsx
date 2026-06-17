import { render, screen } from '@testing-library/react';

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

    it('元画像へのリンクを持つ', () => {
        render(<DivePhotoGallery photos={[view({ displayUrl: '/full.webp', alt: '海' })]} />);
        expect(screen.getByRole('link')).toHaveAttribute('href', '/full.webp');
    });

    it('キャプションがあれば表示する', () => {
        render(<DivePhotoGallery photos={[view({ caption: '珊瑚と魚', alt: '海' })]} />);
        expect(screen.getByText('珊瑚と魚')).toBeInTheDocument();
    });

    it('0 枚なら何も描画しない', () => {
        const { container } = render(<DivePhotoGallery photos={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
