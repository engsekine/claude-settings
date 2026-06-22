import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { DivePhotoView } from '@/features/dives/types';
import { DivePhotoGallery } from './DivePhotoGallery';

const photo = (id: string, caption = ''): DivePhotoView => ({
    id,
    displayUrl: '/logo.png',
    thumbUrl: '/logo.png',
    caption,
    isCover: id === 'p1',
    width: 800,
    height: 600,
    alt: `${id} の写真`,
});

const meta = {
    title: 'features/dives/DivePhotoGallery',
    component: DivePhotoGallery,
    tags: ['autodocs'],
} satisfies Meta<typeof DivePhotoGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultiplePhotos: Story = {
    args: { photos: [photo('p1', '珊瑚と魚'), photo('p2'), photo('p3', 'ナイトダイブ')] },
};

export const SinglePhoto: Story = {
    args: { photos: [photo('p1', '透明度抜群')] },
};

export const Empty: Story = {
    args: { photos: [] },
};
