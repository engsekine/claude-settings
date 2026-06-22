/** 一覧取得の結果（ページャ表示用の総件数を含む） */
export interface ResourceListResult<Row> {
    rows: Row[];
    total: number;
    page: number;
    perPage: number;
}

/** 一覧取得パラメータ（contracts/admin-resource.md） */
export interface ListParams {
    page: number;
    perPage: number;
    /** キーワード（searchColumns に対して ilike 部分一致） */
    search?: string | undefined;
    /** 検索対象カラム（許可リスト。injection 防止） */
    searchColumns?: readonly string[] | undefined;
    /** 並び替え。sortableColumns に含まれる場合のみ適用 */
    sort?: { column: string; ascending: boolean } | undefined;
    /** 並び替え許可カラム（許可リスト） */
    sortableColumns?: readonly string[] | undefined;
    /** ソフトデリート済みも含めるか（既定 false） */
    includeDeleted?: boolean | undefined;
    /** 対象テーブルが deleted_at を持つか */
    hasDeletedAt?: boolean | undefined;
}
