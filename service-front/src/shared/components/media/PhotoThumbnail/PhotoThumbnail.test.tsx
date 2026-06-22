import { render, screen } from '@testing-library/react';

import { PhotoThumbnail } from './PhotoThumbnail';

describe('PhotoThumbnail', () => {
    it('alt を持つ画像として公開する', () => {
        render(<PhotoThumbnail src="/a.webp" alt="沖縄の珊瑚" width={800} height={600} />);
        expect(screen.getByRole('img', { name: '沖縄の珊瑚' })).toBeInTheDocument();
    });

    it('寸法が判明していれば width/height を反映する', () => {
        render(<PhotoThumbnail src="/a.webp" alt="海" width={800} height={600} />);
        const img = screen.getByRole('img', { name: '海' });
        expect(img).toHaveAttribute('width', '800');
        expect(img).toHaveAttribute('height', '600');
    });

    it('既定は遅延読込（priority 未指定）', () => {
        render(<PhotoThumbnail src="/a.webp" alt="海" width={800} height={600} />);
        expect(screen.getByRole('img', { name: '海' })).toHaveAttribute('loading', 'lazy');
    });

    it('寸法不明でも alt 付きで描画する（fill）', () => {
        render(<PhotoThumbnail src="/a.webp" alt="魚" />);
        expect(screen.getByRole('img', { name: '魚' })).toBeInTheDocument();
    });
});
