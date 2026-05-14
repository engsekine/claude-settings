import { SignupForm } from '@/features/auth';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/signup',
        title: '新規登録',
        description: 'ダイビングログに新規登録します',
    },
    { noIndex: true },
);

export default function SignupPage() {
    return (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12">
            <h1 className="text-2xl font-semibold">新規登録</h1>
            <SignupForm />
        </div>
    );
}
