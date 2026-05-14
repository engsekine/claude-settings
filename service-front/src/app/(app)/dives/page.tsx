import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/dives',
        title: 'ダイビングログ',
        description: 'あなたのダイビングログ一覧',
    },
    { noIndex: true },
);

/** 002 ログ CRUD で本実装する。現状は認証ガード確認用の仮ページ。 */
export default function DivesPage() {
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-semibold">ダイビングログ</h1>
            <p className="mt-4 text-muted-foreground">
                ここに 002 でログ一覧を実装します。
            </p>
        </div>
    );
}
