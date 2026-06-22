import { notFound } from 'next/navigation';

import { getUserDetail } from '@/features/users-admin';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/users',
    title: 'ユーザー詳細',
    description: 'ユーザーの詳細情報',
});

const GENDER_LABEL: Record<string, string> = { male: '男性', female: '女性', unanswered: '未回答' };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const view = await getUserDetail(id);
    if (!view) notFound();

    const { detail, diveCount } = view;

    const rows: { label: string; value: string }[] = [
        { label: 'ニックネーム', value: detail.nickname },
        { label: '氏名', value: `${detail.last_name} ${detail.first_name}` },
        { label: '氏名（ローマ字）', value: `${detail.last_name_romaji} ${detail.first_name_romaji}` },
        { label: '生年月日', value: detail.birth_on },
        { label: '性別', value: GENDER_LABEL[detail.gender] ?? detail.gender },
        { label: 'ダイブログ件数', value: String(diveCount) },
        { label: '登録日', value: new Date(detail.created_at).toLocaleDateString('ja-JP') },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-semibold text-2xl">{detail.nickname}</h1>
            <dl className="grid max-w-xl grid-cols-[12rem_1fr] gap-y-2 text-sm">
                {rows.map((row) => (
                    <div key={row.label} className="contents">
                        <dt className="font-medium text-muted-foreground">{row.label}</dt>
                        <dd>{row.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
