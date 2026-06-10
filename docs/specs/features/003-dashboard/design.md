# 003 ダッシュボード - 設計

## 1. データモデル

### `regulators` テーブル（新規）

ユーザーごとに複数のレギュレーターを登録可能。OH 期限管理に必要な情報を保持する。

| カラム | 型 | NULL | 説明 |
|--------|----|------|------|
| `id` | `uuid` | NO | 主キー（`gen_random_uuid()`） |
| `user_id` | `uuid` | NO | `users.id` への FK（`on delete cascade`） |
| `brand` | `text` | NO | メーカー名（例: SCUBAPRO） |
| `model` | `text` | NO | モデル名（例: MK25 EVO / S620Ti） |
| `purchased_on` | `date` | YES | 購入日 |
| `last_overhauled_on` | `date` | NO | 前回 OH 日。`>= 1900-01-01 and <= current_date` |
| `overhaul_interval_months` | `integer` | NO | OH 推奨周期（月）。`default 12`、`> 0` |
| `overhaul_interval_dives` | `integer` | NO | OH 推奨周期（本数）。`default 100`、`> 0` |
| `is_primary` | `boolean` | NO | メイン機材フラグ。`default false` |
| `notes` | `text` | YES | メモ |
| `created_at` | `timestamptz` | NO | `default now()` |
| `updated_at` | `timestamptz` | NO | trigger で自動更新 |

### 制約

- **PK**: `(id)`
- **FK**: `user_id` → `public.users(id)` ON DELETE CASCADE
- **CHECK**:
  - `length(trim(brand)) > 0`
  - `length(trim(model)) > 0`
  - `last_overhauled_on >= '1900-01-01' and last_overhauled_on <= current_date`
  - `overhaul_interval_months > 0`
  - `overhaul_interval_dives > 0`
- **部分ユニーク**: `unique (user_id) where is_primary = true`（1 ユーザー 1 メイン機材）

### インデックス

- `idx_regulators_user_id_is_primary on (user_id, is_primary)` — メイン機材引き当て用

### RLS

`SELECT` / `INSERT` / `UPDATE` / `DELETE` すべて `(select auth.uid()) = user_id` で自分のレコードのみ。

```sql
alter table public.regulators enable row level security;

create policy "users can read own regulators" on public.regulators
    for select using ((select auth.uid()) = user_id);
create policy "users can insert own regulators" on public.regulators
    for insert with check ((select auth.uid()) = user_id);
create policy "users can update own regulators" on public.regulators
    for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users can delete own regulators" on public.regulators
    for delete using ((select auth.uid()) = user_id);
```

### トリガー

- `regulators_handle_updated_at`: `BEFORE UPDATE` で `handle_updated_at()` を実行（既存関数を再利用）

## 2. ルート構成

```
src/app/
├── page.tsx                       # 認証必須に変更。TopDashboard を描画
├── (authenticated)/
│   └── settings/
│       └── equipment/
│           ├── page.tsx           # レギュレーター一覧
│           ├── new/page.tsx       # 新規登録
│           └── [id]/edit/page.tsx # 編集
```

- `src/proxy.ts` の `APP_ROUTE_PREFIXES` に `/` と `/settings` を追加（`/settings` は既に対象ならその配下に新ルート追加）

## 3. feature 構成

### 新規 feature: `dashboard`

```
src/features/dashboard/
├── components/
│   ├── server/
│   │   ├── TopDashboard/          # TOP のエントリ。子セクションを Server Component で組み立て
│   │   ├── StatsCards/            # 累計統計 4 種
│   │   ├── RegulatorPanel/        # OH 状況
│   │   └── RecentDives/           # 最近のログ
│   └── client/
│       └── RecordOverhaulButton/  # メンテ完了記録ボタン（Server Action 呼び出し）
├── server/
│   └── queries.ts                 # getDiveStats, getPrimaryRegulatorStatus
├── lib/
│   └── overhaul.ts                # OH ステータス計算（純粋関数）
└── types.ts
```

### 新規 feature: `regulators`（CRUD）

```
src/features/regulators/
├── components/
│   ├── client/
│   │   ├── RegulatorForm/         # 新規・編集共有
│   │   └── DeleteRegulatorButton/
│   └── server/
│       └── RegulatorList/
├── server/
│   ├── queries.ts                 # listRegulators, getRegulator
│   └── actions.ts                 # createRegulator, updateRegulator, deleteRegulator, recordOverhaul
├── schemas/
│   └── regulator.schema.ts        # yup
├── types.ts
└── constants.ts                   # ブランド選択肢などがあれば
```

## 4. yup スキーマ（必須項目のみ抜粋）

```ts
export const regulatorSchema = yup.object({
    brand: yup.string().trim().min(1, '必須').max(60).required(),
    model: yup.string().trim().min(1, '必須').max(80).required(),
    purchasedOn: yup.string().nullable().matches(/^\d{4}-\d{2}-\d{2}$/).default(null),
    lastOverhauledOn: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, '正しい日付を入力してください')
        .test('valid-range', '正しい日付を入力してください', isValidPastDate)
        .required('前回 OH 日は必須です'),
    overhaulIntervalMonths: yup.number().integer().min(1).max(120).default(12).required(),
    overhaulIntervalDives: yup.number().integer().min(1).max(1000).default(100).required(),
    isPrimary: yup.boolean().default(false).required(),
    notes: yup.string().trim().max(500).transform((v) => (v === '' ? null : v)).nullable().default(null),
});
```

## 5. データ取得方針

| 用途 | 方法 |
|------|------|
| TOP の累計統計 | Server Component で `getDiveStats()`（1 クエリで集計） |
| TOP のメイン機材 OH | Server Component で `getPrimaryRegulatorStatus()` |
| TOP の最近のログ | Server Component で既存 `listDives({ limit: 5 })` を再利用 |
| レギュレーター一覧 | Server Component で `listRegulators()` |
| レギュレーター CRUD | Server Actions |
| OH 完了記録 | Server Action `recordOverhaul(regulatorId)` → `revalidatePath('/')` |

### 累計統計クエリ

```sql
select
    count(*)              as total_dives,
    coalesce(sum(bottom_time_min), 0) as total_bottom_time_min,
    coalesce(max(max_depth_m), 0)     as max_depth_m,
    count(distinct location)          as visited_locations
from public.dives
where user_id = auth.uid();
```

Supabase JS では RPC 関数として用意するか、`rpc` を使わず複数の select を 1 リクエストで投げる（`.select('bottom_time_min, max_depth_m, location')` してクライアントで集計）かは要検討。**初期実装は RPC `get_dive_stats()` で実装**（行数が増えても DB 側で集計するため）。

```sql
create or replace function public.get_dive_stats()
returns table (
    total_dives bigint,
    total_bottom_time_min bigint,
    max_depth_m numeric,
    visited_locations bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
    select
        count(*),
        coalesce(sum(bottom_time_min), 0),
        coalesce(max(max_depth_m), 0),
        count(distinct location)
    from public.dives
    where user_id = (select auth.uid());
$$;
```

`security invoker` + RLS により、呼び出し元のユーザーのデータだけが集計される。

## 6. OH ステータス計算（純粋関数）

`src/features/dashboard/lib/overhaul.ts` に配置。

### インターフェース

```ts
export interface OverhaulInput {
    lastOverhauledOn: string;          // ISO date 'YYYY-MM-DD'
    intervalMonths: number;
    intervalDives: number;
    divesSinceLastOverhaul: number;    // last_overhauled_on 以降に潜った本数
    today: Date;                       // テスト容易性のため引数で受け取る
}

export interface OverhaulStatus {
    nextOverhaulDate: string;          // ISO date
    remainingDays: number;
    remainingDives: number;
    level: 'ok' | 'warning' | 'expired';
}

export const calcOverhaulStatus = (input: OverhaulInput): OverhaulStatus => { ... };
```

### 判定ロジック

```
remainingDays  = nextOverhaulDate - today（日単位）
remainingDives = intervalDives - divesSinceLastOverhaul

if (remainingDays <= 0 || remainingDives <= 0) level = 'expired'
else if (remainingDays <= 30 || remainingDives <= 10) level = 'warning'
else level = 'ok'
```

### 「last_overhauled_on 以降のダイブ本数」の取得

```sql
select count(*) from public.dives
where user_id = auth.uid() and dive_date >= $1;
```

`getPrimaryRegulatorStatus()` 内で実行し、上記の純粋関数に渡す。

## 7. アクセシビリティ

- 統計カードは `<dl>` または `<section aria-labelledby>` で構造化
- OH ステータスは色 + アイコン + テキストで識別可能に
- OH 期限切れは `role="status"`（緊急ではないが注意喚起）
- メンテ完了ダイアログは `role="dialog" aria-modal="true"` + フォーカストラップ
- 各セクションの見出しは h2、画面タイトルは h1

詳細は `rules/accessibility.md` に準拠。

## 8. エラーハンドリング

- 集計クエリ失敗 → 統計カードに「集計に失敗しました」を表示し、各値は `-`
- レギュレーター取得失敗 → OH パネルにエラー文言、設定画面への導線を表示
- OH 完了記録の Server Action 失敗 → トースト通知（`role="alert"`）
- レギュレーターが他人のもの（RLS で 0 件返却） → `notFound()` で 404

## 9. パフォーマンス

- 累計統計は RPC で DB 側集計（行数増加にも耐える）
- 「OH 以降のダイブ本数」は `dives(user_id, dive_date)` の既存インデックスで効率取得
- TOP は完全に Server Component で構成、Client 化が必要なのは「メンテ完了を記録」ボタンのみ
- TanStack Query は本 feature では不要（ストリーミングや追加読み込みがないため）

## 10. テスト方針

- `overhaul.ts`（純粋関数）: 単体テストで「余裕 / 期限間近 / 期限切れ」「日付境界」「本数境界」を網羅
- `regulator.schema.ts`: 必須・最大長・日付範囲を網羅
- `RegulatorForm`: React Testing Library で送信・バリデーション
- `TopDashboard`: 0 件 / 通常 / レギュレーター未登録の 3 パターン
- E2E: ログイン → TOP → レギュレーター登録 → TOP に反映 → メンテ完了記録 → 残日数リセット
