'use client';

import { useState, useTransition } from 'react';

import { setDiveVisibility } from '@/features/dives/server/actions';

interface DiveVisibilityToggleProps {
    diveId: string;
    /** 初期の公開状態 */
    initialIsPublic: boolean;
    /** 初期の公開 slug（公開中のとき共有リンク表示に使う） */
    initialPublicSlug?: string | null;
}

/** 共有リンクのパス（匿名共有ページ）。`/dives/[id]` と衝突しないよう `/shared/dives/` 配下にする */
const sharePath = (slug: string): string => `/shared/dives/${slug}`;

/**
 * ログの公開/非公開トグル（spec 021 US2 / FR-007〜011）。
 * role="switch" で状態を伝え、切替時に setDiveVisibility を呼ぶ。
 * 公開中は共有リンクを表示する（非公開化で即無効）。
 */
export const DiveVisibilityToggle = ({
    diveId,
    initialIsPublic,
    initialPublicSlug = null,
}: DiveVisibilityToggleProps) => {
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [publicSlug, setPublicSlug] = useState<string | null>(initialPublicSlug);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const next = !isPublic;
        setError(null);
        startTransition(async () => {
            const result = await setDiveVisibility(diveId, next);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setIsPublic(result.isPublic);
            setPublicSlug(result.publicSlug);
            setIsCopied(false);
        });
    };

    // 共有リンクは相対パスだけだとコピーしても使えないため、絶対 URL を組み立ててコピーする
    const handleCopy = async (slug: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}${sharePath(slug)}`);
            setIsCopied(true);
        } catch (copyError) {
            console.warn('[DiveVisibilityToggle] copy failed:', copyError);
            setError('共有リンクのコピーに失敗しました');
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="このログを公開する"
                    aria-busy={isPending}
                    disabled={isPending}
                    onClick={handleToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 ${
                        isPublic ? 'bg-primary' : 'bg-muted-foreground/40'
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block size-5 transform rounded-full bg-background transition-transform ${
                            isPublic ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                    />
                </button>
                <span className="text-sm">{isPublic ? '公開中' : '非公開'}</span>
            </div>

            {isPublic && publicSlug && (
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    <span>共有リンク:</span>
                    {/* bg-muted 上で muted-foreground だとコントラスト 4.34 で WCAG AA 未満のため text-foreground にする */}
                    <code className="rounded bg-muted px-1 py-0.5 text-foreground">{sharePath(publicSlug)}</code>
                    <button
                        type="button"
                        onClick={() => void handleCopy(publicSlug)}
                        className="rounded border border-input px-2 py-0.5 text-foreground text-xs hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                        {isCopied ? 'コピーしました' : 'リンクをコピー'}
                    </button>
                    <span role="status" aria-live="polite" className="sr-only">
                        {isCopied ? '共有リンクをコピーしました' : ''}
                    </span>
                </div>
            )}

            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </div>
    );
};
