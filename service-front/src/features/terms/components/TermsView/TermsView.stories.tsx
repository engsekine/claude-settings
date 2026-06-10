import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TermsView } from './TermsView';

const meta = {
    title: 'features/terms/TermsView',
    component: TermsView,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof TermsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
