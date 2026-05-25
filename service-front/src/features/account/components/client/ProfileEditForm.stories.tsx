import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProfileEditForm } from './ProfileEditForm';

const meta = {
    title: 'features/account/ProfileEditForm',
    component: ProfileEditForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        email: 'user@example.com',
        defaultValues: {
            lastName: '山田',
            firstName: '太郎',
            lastNameRomaji: 'Yamada',
            firstNameRomaji: 'Taro',
            nickname: 'たろちゃん',
            birthOn: '1990-01-01',
            gender: 'male',
            heightCm: 175,
            weightKg: 68.5,
        },
    },
};

export const Female: Story = {
    args: {
        email: 'jane@example.com',
        defaultValues: {
            lastName: '田中',
            firstName: '花子',
            lastNameRomaji: 'Tanaka',
            firstNameRomaji: 'Hanako',
            nickname: 'はなちゃん',
            birthOn: '1992-05-10',
            gender: 'female',
            heightCm: 160,
            weightKg: 50,
        },
    },
};

export const Unanswered: Story = {
    args: {
        email: 'unknown@example.com',
        defaultValues: {
            lastName: '匿名',
            firstName: '希望',
            lastNameRomaji: 'Anonymous',
            firstNameRomaji: 'User',
            nickname: 'anon',
            birthOn: '2000-01-01',
            gender: 'unanswered',
            heightCm: null,
            weightKg: null,
        },
    },
};
