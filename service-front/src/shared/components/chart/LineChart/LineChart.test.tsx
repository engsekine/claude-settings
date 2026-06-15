import { render, screen } from '@testing-library/react';

import { LineChart } from './LineChart';

describe('LineChart', () => {
    it('role="img" と aria-label で SVG を公開する', () => {
        render(
            <LineChart
                items={[
                    { label: '5月', value: 21.0 },
                    { label: '6月', value: 23.5 },
                ]}
                description="月別平均水温のグラフ"
                unit="℃"
            />,
        );
        expect(screen.getByRole('img', { name: '月別平均水温のグラフ' })).toBeInTheDocument();
    });

    it('value が null の点で線が分断される（null を 0 として描画しない）', () => {
        const { container } = render(
            <LineChart
                items={[
                    { label: '1月', value: 16.0 },
                    { label: '2月', value: 16.5 },
                    { label: '3月', value: null },
                    { label: '4月', value: 19.0 },
                    { label: '5月', value: 21.0 },
                ]}
                description="水温"
                unit="℃"
            />,
        );
        // null を挟んで 2 本の線分に分かれる
        expect(container.querySelectorAll('polyline[data-line]')).toHaveLength(2);
        // データ点は非 null の 4 つだけ
        expect(container.querySelectorAll('circle[data-point]')).toHaveLength(4);
        expect(container.innerHTML).not.toContain('NaN');
    });

    it('単一点でも破綻しない（線なし・点のみ）', () => {
        const { container } = render(<LineChart items={[{ label: '6月', value: 28.0 }]} description="深度" unit="m" />);
        expect(container.querySelectorAll('polyline[data-line]')).toHaveLength(0);
        expect(container.querySelectorAll('circle[data-point]')).toHaveLength(1);
        expect(container.innerHTML).not.toContain('NaN');
    });

    it('全点 null でも描画が破綻しない', () => {
        const { container } = render(
            <LineChart
                items={[
                    { label: '5月', value: null },
                    { label: '6月', value: null },
                ]}
                description="水温"
                unit="℃"
            />,
        );
        expect(container.querySelectorAll('polyline[data-line]')).toHaveLength(0);
        expect(container.querySelectorAll('circle[data-point]')).toHaveLength(0);
        expect(container.innerHTML).not.toContain('NaN');
    });

    it('items が空配列のとき何も描画しない（0 除算を回避する）', () => {
        const { container } = render(<LineChart items={[]} description="水温" unit="℃" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('値ラベルに unit を付けて表示する', () => {
        const { container } = render(<LineChart items={[{ label: '6月', value: 28 }]} description="深度" unit="m" />);
        const valueLabels = [...container.querySelectorAll('text[data-value]')].map((node) => node.textContent);
        expect(valueLabels).toContain('28m');
    });

    it('x 軸ラベルを items 順に表示する', () => {
        const { container } = render(
            <LineChart
                items={[
                    { label: '5月', value: 1 },
                    { label: '6月', value: 2 },
                ]}
                description="テスト"
            />,
        );
        const labels = [...container.querySelectorAll('text[data-label]')].map((node) => node.textContent);
        expect(labels).toEqual(['5月', '6月']);
    });
});
