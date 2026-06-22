import { LoginForm } from '@/features/admin-auth';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/login',
    title: 'ログイン',
    description: '運営管理画面にログインします',
});

export default function LoginPage() {
    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
            <h1 className="font-semibold text-2xl">運営管理画面ログイン</h1>
            <LoginForm />
        </div>
    );
}
