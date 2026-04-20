import Link from 'next/link';

import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/404',
        title: 'ページが見つかりません',
        description: 'お探しのページは存在しないか、移動した可能性があります。',
    },
    { noIndex: true },
);

export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
            <h1 className="text-6xl font-bold text-foreground">404</h1>
            <p className="text-lg text-muted-foreground">
                お探しのページが見つかりませんでした
            </p>
            <Link
                href="/"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
                ホームに戻る
            </Link>
        </main>
    );
}
