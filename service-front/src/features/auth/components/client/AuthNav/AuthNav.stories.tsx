import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthNav } from './AuthNav';

const sampleUser: SupabaseUser = {
    id: 'user-1',
    email: 'user@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
} as SupabaseUser;

const meta = {
    title: 'features/auth/AuthNav',
    component: AuthNav,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'ユーザーアイコンボタンを押すと右からシートが開き、ログイン状態に応じたメニューを表示する。zustand store と Supabase Auth に依存し、Storybook 上では `initialUser` を変えて未ログイン / ログイン済み状態を切り替えて確認する。',
            },
        },
    },
} satisfies Meta<typeof AuthNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {
    args: { initialUser: null },
};

export const LoggedIn: Story = {
    args: { initialUser: sampleUser },
};
