interface EmptyStateProps {
    /** 空であることを伝えるメッセージ */
    message?: string | undefined;
}

/** 一覧が 0 件のときの表示（FR-009）。レイアウトを崩さない */
export const EmptyState = ({ message = 'データがありません' }: EmptyStateProps) => (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed p-8 text-muted-foreground text-sm">
        {message}
    </div>
);
