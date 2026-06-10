import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SignupForm } from './SignupForm';

const meta = {
    title: 'features/auth/SignupForm',
    component: SignupForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
