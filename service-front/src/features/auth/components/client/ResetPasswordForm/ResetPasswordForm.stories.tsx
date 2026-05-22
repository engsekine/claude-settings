import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ResetPasswordForm } from './ResetPasswordForm';

const meta = {
    title: 'features/auth/ResetPasswordForm',
    component: ResetPasswordForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
