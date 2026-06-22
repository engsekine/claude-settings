import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PhotoThumbnail } from './PhotoThumbnail';

const meta = {
    title: 'shared/media/PhotoThumbnail',
    component: PhotoThumbnail,
    tags: ['autodocs'],
    args: {
        // Storybook では remotePatterns 設定に依存しないようローカル public アセットを使う
        src: '/logo.png',
        alt: '沖縄の珊瑚礁を泳ぐ魚',
    },
} satisfies Meta<typeof PhotoThumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 寸法が判明しているケース（width/height 指定） */
export const WithIntrinsicSize: Story = {
    args: { width: 800, height: 600 },
};

/** 寸法不明のケース（1:1 のボックスに fill） */
export const FillSquare: Story = {
    render: (args) => (
        <div style={{ width: 240 }}>
            <PhotoThumbnail {...args} />
        </div>
    ),
};
