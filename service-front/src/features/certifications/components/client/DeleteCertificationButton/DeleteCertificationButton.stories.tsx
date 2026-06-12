import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DeleteCertificationButton } from './DeleteCertificationButton';

const meta = {
    title: 'features/certifications/DeleteCertificationButton',
    component: DeleteCertificationButton,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DeleteCertificationButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { certificationId: 'sample-id', name: 'PADI Open Water Diver' },
};
