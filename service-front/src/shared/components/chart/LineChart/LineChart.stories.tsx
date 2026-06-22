import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LineChart } from './LineChart';

const meta = {
    title: 'shared/chart/LineChart',
    component: LineChart,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常（月別平均水温） */
export const Default: Story = {
    args: {
        items: [
            { label: '7月', value: 27.5 },
            { label: '8月', value: 28.0 },
            { label: '9月', value: 26.0 },
            { label: '10月', value: 23.5 },
            { label: '11月', value: 21.0 },
            { label: '12月', value: 18.5 },
            { label: '1月', value: 16.0 },
            { label: '2月', value: 16.5 },
            { label: '3月', value: 17.5 },
            { label: '4月', value: 19.0 },
            { label: '5月', value: 21.0 },
            { label: '6月', value: 23.0 },
        ],
        description: '月別平均水温（直近 12 ヶ月）',
        unit: '℃',
    },
};

/** 欠測月あり（null で線が分断される — 0 と区別） */
export const WithMissingMonths: Story = {
    args: {
        items: [
            { label: '7月', value: 27.5 },
            { label: '8月', value: 28.0 },
            { label: '9月', value: null },
            { label: '10月', value: null },
            { label: '11月', value: 21.0 },
            { label: '12月', value: 18.5 },
            { label: '1月', value: null },
            { label: '2月', value: 16.5 },
            { label: '3月', value: 17.5 },
            { label: '4月', value: null },
            { label: '5月', value: 21.0 },
            { label: '6月', value: 23.0 },
        ],
        description: '月別平均水温（欠測月あり）',
        unit: '℃',
    },
};

/** 単一点 */
export const SinglePoint: Story = {
    args: {
        items: [{ label: '6月', value: 28.0 }],
        description: '月別最大深度（記録 1 ヶ月のみ）',
        unit: 'm',
    },
};

/** 月別最大深度 */
export const MaxDepth: Story = {
    args: {
        items: [
            { label: '7月', value: 18.0 },
            { label: '8月', value: 24.0 },
            { label: '9月', value: 22.5 },
            { label: '10月', value: 15.0 },
            { label: '11月', value: null },
            { label: '12月', value: null },
            { label: '1月', value: null },
            { label: '2月', value: 30.5 },
            { label: '3月', value: 25.0 },
            { label: '4月', value: 20.0 },
            { label: '5月', value: 26.5 },
            { label: '6月', value: 28.0 },
        ],
        description: '月別最大深度（直近 12 ヶ月）',
        unit: 'm',
    },
};
