import { redirect } from 'next/navigation';

import { createClient } from '@/shared/lib/supabase/server';

/**
 * 認証必須ルートのプロフィール補完ゲート（016-google-login）。
 *
 * Google ログイン初回ユーザーは user_details が未作成（補完未完了）の状態で
 * セッションを持つ。その状態で /dives などの本体ルートに来たら、
 * /profile-completion へ誘導して補完を促す（FR-005 / FR-015）。
 *
 * /profile-completion 自体は (onboarding) グループに置き本レイアウトの配下に
 * 含めないため、リダイレクトループは発生しない。
 * 補完判定は user_details 行の有無を 1 回 SELECT するのみ（research.md Decision 4）。
 */
export default async function AuthenticatedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    /** 未認証は proxy で /login に弾かれるが、防御的に確認する */
    if (!user) redirect('/login');

    /**
     * メール未確認のログインを拒否する（FR-006）。
     * Google が返すメールは通常 email_verified=true で取り込まれるためレアケースだが、
     * 万一未確認のままセッションが張られた場合に防御的に弾く。
     */
    if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        redirect('/login?error=email_not_verified');
    }

    const { data: details } = await supabase
        .from('user_details')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!details) redirect('/profile-completion');

    return <>{children}</>;
}
