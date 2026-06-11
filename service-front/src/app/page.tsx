import { NextPlanCard } from '@/features/plans';
import { createClient } from '@/shared/lib/supabase/server';

export default async function Home() {
    // 現行 TOP（`/`）は公開ルートのため、認証ユーザーにのみ「次の予定」を表示する（FR-006）。
    // 003-dashboard 実装時は本セクションをダッシュボードのレイアウトへ移設する。
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16">
                <div className="text-center">
                    <h1 className="font-semibold text-3xl text-foreground tracking-tight">Welcome</h1>
                    <p className="mt-4 text-lg text-muted-foreground">ここにコンテンツを追加してください。</p>
                </div>
                {user && (
                    <section aria-labelledby="next-plan-heading" className="mx-auto w-full max-w-2xl">
                        <h2 id="next-plan-heading" className="sr-only">
                            次のダイビング予定
                        </h2>
                        <NextPlanCard />
                    </section>
                )}
            </div>
        </div>
    );
}
