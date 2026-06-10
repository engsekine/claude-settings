import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PrivacyPolicyView } from './PrivacyPolicyView';

const meta = {
    title: 'features/privacy-policy/PrivacyPolicyView',
    component: PrivacyPolicyView,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof PrivacyPolicyView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
