# 002 ログ CRUD - 設計

## 1. データモデル

### `dives` テーブル

PADI ログブックの標準項目を踏襲する。

| カラム | 型 | NULL | 説明 |
|--------|----|------|------|
| `id` | `uuid` | NO | 主キー（`gen_random_uuid()`） |
| `user_id` | `uuid` | NO | `auth.users.id` への FK |
| `dive_number` | `int` | YES | 通算ダイブ番号 |
| `dive_date` | `date` | NO | 潜水日 |
| `entry_time` | `time` | YES | エントリー時刻 |
| `exit_time` | `time` | YES | エキジット時刻 |
| `location` | `text` | NO | エリア / ポイント名 |
| `country` | `text` | YES | 国 |
| `dive_site` | `text` | YES | 詳細ポイント名 |
| `dive_type` | `text` | YES | ボート / ビーチ / 流れ など |
| `weather` | `text` | YES | 天気 |
| `air_temp_c` | `numeric(4,1)` | YES | 気温（℃） |
| `water_temp_c` | `numeric(4,1)` | YES | 水温（℃） |
| `visibility_m` | `numeric(4,1)` | YES | 透明度（m） |
| `wave` | `text` | YES | 波・うねり |
| `current` | `text` | YES | 流れ |
| `max_depth_m` | `numeric(5,2)` | NO | 最大水深（m） |
| `avg_depth_m` | `numeric(5,2)` | YES | 平均水深（m） |
| `bottom_time_min` | `int` | NO | 潜水時間（分） |
| `surface_interval_min` | `int` | YES | 水面休息時間（分） |
| `tank_type` | `text` | YES | スチール / アルミ など |
| `tank_volume_l` | `numeric(4,1)` | YES | タンク容量（L） |
| `gas_type` | `text` | YES | Air / Nitrox など |
| `o2_percent` | `numeric(4,1)` | YES | 酸素濃度（%、Nitrox 用） |
| `pressure_start_bar` | `int` | YES | 開始残圧（bar） |
| `pressure_end_bar` | `int` | YES | 終了残圧（bar） |
| `weight_kg` | `numeric(4,1)` | YES | ウェイト（kg） |
| `suit_type` | `text` | YES | ウェット / ドライ / 厚さ |
| `equipment_notes` | `text` | YES | 装備メモ |
| `buddy_name` | `text` | YES | バディ名 |
| `instructor_name` | `text` | YES | インストラクター名 |
| `certification_dive` | `boolean` | NO | 講習ダイブか（default false） |
| `notes` | `text` | YES | メモ・印象 |
| `is_public` | `boolean` | NO | 公開フラグ（default false、phase2 で使用） |
| `public_slug` | `text` | YES | 公開URL用 slug（unique） |
| `created_at` | `timestamptz` | NO | 作成日時（default now()） |
| `updated_at` | `timestamptz` | NO | 更新日時（trigger で更新） |

### インデックス

- `idx_dives_user_date` on (`user_id`, `dive_date desc`) — 一覧表示用
- `idx_dives_user_location` on (`user_id`, `location`) — 検索用
- `idx_dives_public_slug` on (`public_slug`) where `is_public = true` — phase2 用

### RLS ポリシー

```sql
alter table dives enable row level security;

create policy "owner_select" on dives
  for select using (user_id = auth.uid());
create policy "owner_insert" on dives
  for insert with check (user_id = auth.uid());
create policy "owner_update" on dives
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner_delete" on dives
  for delete using (user_id = auth.uid());
```

## 2. ルート構成

```
src/app/(app)/dives/
├── page.tsx                     # 一覧
├── new/page.tsx                 # 新規作成
└── [id]/
    ├── page.tsx                 # 詳細
    └── edit/page.tsx            # 編集
```

## 3. feature 構成

```
src/features/dives/
├── components/
│   ├── DiveList.tsx
│   ├── DiveCard.tsx
│   ├── DiveDetail.tsx
│   ├── DiveForm.tsx             # 新規・編集で共有
│   ├── DiveSearchBar.tsx
│   └── DeleteDiveButton.tsx
├── hooks/
│   └── useDives.ts              # TanStack Query（一覧の追加読み込み・検索用）
├── server/
│   ├── queries.ts               # 取得系（Server Component から使用）
│   └── actions.ts               # Server Actions（create / update / delete）
├── schemas/
│   └── dive.schema.ts           # yup
├── types.ts
└── constants.ts                 # dive_type / gas_type の選択肢など
```

## 4. yup スキーマ（必須項目のみ抜粋）

```ts
export const diveSchema = yup.object({
  dive_date: yup.date().required(),
  location: yup.string().required(),
  max_depth_m: yup.number().positive().required(),
  bottom_time_min: yup.number().integer().min(1).required(),
  // 任意項目はすべて optional
})
```

## 5. データ取得方針

| 場面 | 方法 |
|------|------|
| 一覧（初期表示） | Server Component で `queries.listDives()` |
| 一覧（追加読み込み・検索） | TanStack Query (`useDives`) |
| 詳細 | Server Component で `queries.getDive(id)` |
| 作成 / 更新 / 削除 | Server Actions |

## 6. ページネーション

- ページサイズ: 20
- 方式: キーセットページネーション（`(dive_date, id)` の複合カーソル）
- 「もっと見る」クリックで次セットを TanStack Query で取得

## 7. 検索

- 入力: `dateFrom` / `dateTo` / `location`（部分一致）
- クエリ: `where user_id = $1 and dive_date between $2 and $3 and location ilike $4`
- 並び順: `dive_date desc, id desc`

## 8. アクセシビリティ

- フォームの全 input にラベルを付与
- エラーは `aria-describedby` で input に関連付け
- 削除ダイアログは `role="dialog" aria-modal="true"` でフォーカストラップ
- カードリストは `role="list"` / `role="listitem"`
- 必須フィールドは `aria-required="true"`

## 9. エラーハンドリング

- RLS 違反 / 存在しない id → `notFound()` で 404
- バリデーションエラー → フォームにフィールド単位で表示
- ネットワークエラー → トースト通知
