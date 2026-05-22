import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LoginForm } from './LoginForm';

const meta = {
    title: 'features/auth/LoginForm',
    component: LoginForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
