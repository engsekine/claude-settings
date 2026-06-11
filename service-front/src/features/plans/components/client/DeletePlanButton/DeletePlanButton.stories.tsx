import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DeletePlanButton } from './DeletePlanButton';

const meta = {
    title: 'features/plans/DeletePlanButton',
    component: DeletePlanButton,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DeletePlanButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { planId: 'sample-id' },
};
