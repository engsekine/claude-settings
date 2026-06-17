import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DeleteDivePhotoButton } from './DeleteDivePhotoButton';

const meta = {
    title: 'features/dives/DeleteDivePhotoButton',
    component: DeleteDivePhotoButton,
    tags: ['autodocs'],
    args: {
        photoId: '33333333-3333-3333-3333-333333333333',
    },
} satisfies Meta<typeof DeleteDivePhotoButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
