import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DeleteRegulatorButton } from './DeleteRegulatorButton';

const meta = {
    title: 'features/regulators/DeleteRegulatorButton',
    component: DeleteRegulatorButton,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DeleteRegulatorButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { regulatorId: 'sample-id', name: 'SCUBAPRO MK25 EVO / S620Ti' },
};
