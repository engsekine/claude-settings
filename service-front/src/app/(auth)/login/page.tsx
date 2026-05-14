import { LoginForm } from '@/features/auth';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/login',
        title: 'ログイン',
        description: 'ダイビングログにログインします',
    },
    { noIndex: true },
);

export default function LoginPage() {
    return (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12">
            <h1 className="text-2xl font-semibold">ログイン</h1>
            <LoginForm />
        </div>
    );
}
