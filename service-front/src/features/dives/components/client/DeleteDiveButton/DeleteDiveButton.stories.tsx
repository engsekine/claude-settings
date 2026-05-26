import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DeleteDiveButton } from './DeleteDiveButton';

const meta = {
    title: 'features/dives/DeleteDiveButton',
    component: DeleteDiveButton,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DeleteDiveButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { diveId: 'sample-id' },
};
