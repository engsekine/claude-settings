import { render, screen } from '@testing-library/react';

import { BarChart } from './BarChart';

const items = [
    { label: '2024', value: 18 },
    { label: '2025', value: 24 },
    { label: '2026', value: 11 },
];

describe('BarChart', () => {
    it('role="img" と aria-label で SVG を公開する', () => {
        render(<BarChart items={items} description="年別ダイビング本数のグラフ" />);
        expect(screen.getByRole('img', { name: '年別ダイビング本数のグラフ' })).toBeInTheDocument();
    });

    it('items の数だけ棒を items 順に描画し、ラベルを表示する', () => {
        const { container } = render(<BarChart items={items} description="年別" />);
        const bars = container.querySelectorAll('rect[data-bar]');
        expect(bars).toHaveLength(3);
        const labels = [...container.querySelectorAll('text[data-label]')].map((node) => node.textContent);
        expect(labels).toEqual(['2024', '2025', '2026']);
    });

    it('値 0 の棒も高さ 0 で描画される（NaN にならない）', () => {
        const { container } = render(
            <BarChart
                items={[
                    { label: '2025', value: 0 },
                    { label: '2026', value: 5 },
                ]}
                description="年別"
            />,
        );
        expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(2);
        expect(container.innerHTML).not.toContain('NaN');
    });

    it('全項目が 0 でも描画が破綻しない', () => {
        const { container } = render(
            <BarChart
                items={[
                    { label: '1月', value: 0 },
                    { label: '2月', value: 0 },
                ]}
                description="月別"
            />,
        );
        expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(2);
        expect(container.innerHTML).not.toContain('NaN');
    });

    it('単一項目でも破綻しない', () => {
        const { container } = render(<BarChart items={[{ label: '2026', value: 7 }]} description="年別" />);
        expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(1);
        expect(container.innerHTML).not.toContain('NaN');
    });

    it('items が空配列のとき何も描画しない（0 除算を回避する）', () => {
        const { container } = render(<BarChart items={[]} description="年別" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('多項目（12 年分）でもすべての棒とラベルを描画する', () => {
        const manyYears = Array.from({ length: 12 }, (_, index) => ({
            label: `${2015 + index}`,
            value: index + 1,
        }));
        const { container } = render(<BarChart items={manyYears} description="年別" />);
        expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(12);
        expect(container.querySelectorAll('text[data-label]')).toHaveLength(12);
        expect(container.innerHTML).not.toContain('NaN');
    });
});
