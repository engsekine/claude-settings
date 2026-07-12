# Implementation Plan: プロフィール URL のニックネーム化

**Branch**: `034-nickname-profile-url` | **Date**: 2026-07-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/034-nickname-profile-url/spec.md`

## Summary

プロフィール URL（`/users/[id]`・`/users/[id]/followers`・`/users/[id]/following`）の識別子を内部 ID（uuid）からニックネームへ切り替える。動的セグメントを「uuid ならリダイレクト・それ以外はニックネーム解決」の二枚看板にし、ID 形式の既存 URL はニックネーム URL へ転送し続ける（FR-004。ニックネーム変更に追随できるようキャッシュされない一時リダイレクトを用いる）。ニックネーム → user_id の解決は一意制約と同じ正規化（`lower(trim())`）を使う RPC で行い、URL に使えないニックネーム（`/` 等・予約セグメント・uuid 形式）のユーザーは ID URL へフォールバックする共通ヘルパー `profilePath` で全導線を統一する。DB のテーブル変更はなし（解決用 RPC を 1 本追加）。

## Technical Context

**Language/Version**: TypeScript（strict）/ Next.js App Router（React 19 + React Compiler）

**Primary Dependencies**: Supabase（PostgreSQL + Auth + RLS）。新規 npm パッケージなし

**Storage**: テーブル変更なし。ニックネーム解決 RPC `get_user_id_by_nickname` を追加（既存の式インデックス `user_details_nickname_key` = `lower(trim(nickname))` を利用）

**Testing**: Vitest（profilePath ヘルパー・schema・RPC 呼び出し）/ Playwright（リダイレクト・導線・変更フロー）

**Target Platform**: Web（service-front）。admin-front は対象外（spec Assumptions）

**Project Type**: Web application（モノレポ内 service-front ワークスペース）

**Performance Goals**: ニックネーム解決は式インデックスを使う 1 クエリ。ID 形式 URL は 1 回のリダイレクトのみ追加

**Constraints**: user_details の RLS は本人のみ read のため、他人のニックネーム解決は既存パターン（`get_user_public_profiles` 等）と同じ security definer RPC で行う。既存ニックネームのデータ変更・移行は行わない（FR-005 フォールバックで救済）

**Scale/Scope**: ルート 3 つのセグメント変更 + リンク生成箇所 約 10 ファイル + ニックネーム schema 制約 + RPC 1 本

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 判定 | 根拠 |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md（前提確認・Assumptions 3 点明記済み）→ 本 plan → tasks。実装後に 021/025/027 等の既存 spec を /sync-spec で追随 |
| II. Server Components First | PASS | 解決・リダイレクトは page（Server Component）内。クライアント変更は AuthNav のリンク生成のみ |
| III. Test-First | PASS | profilePath / schema 追加制約 / uuid 判別は単体テスト先行。E2E でリダイレクト・導線・変更フローを検証 |
| IV. Security & RLS by Default | PASS | RPC は `security definer` + `set search_path = ''` + 返すのは user_id のみ（公開情報の範囲）。RLS 変更なし。オープンリダイレクトなし（遷移先は自前生成のみ） |
| V. Accessibility (WCAG 2.1 AA) | PASS | UI 変更はリンク href のみで表示・操作は不変。既存 a11y スイープで担保 |
| VI. Coding Standards | PASS | ヘルパーは `shared/lib/profile-path/`（フォルダ構成規約）。snake_case RPC・式インデックス活用 |

違反なし（Complexity Tracking 不要）。

## Project Structure

### Documentation (this feature)

```text
specs/034-nickname-profile-url/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output（RPC 定義）
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── routes-and-resolution.md  # ルーティング・解決・リンク生成の契約
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
supabase/migrations/
└── <ts>_create_get_user_id_by_nickname_fn.sql   # ★新規: ニックネーム→user_id 解決 RPC

service-front/src/shared/lib/profile-path/        # ★新規: リンク生成ヘルパー（純関数）
├── profile-path.ts        # profilePath / isUrlSafeNickname / isUuid / RESERVED_USER_SEGMENTS
├── profile-path.test.ts
└── index.ts

service-front/src/app/(authenticated)/users/[slug]/   # ★リネーム: [id] → [slug]
├── page.tsx               # uuid → ニックネーム URL へ redirect / ニックネーム → RPC 解決
├── followers/page.tsx     # 同上
└── following/page.tsx     # 同上

# 既存ファイルへの変更
service-front/src/shared/schemas/user-profile.ts   # nickname に URL 禁則（uuid 形式・予約語・禁止文字）を追加（FR-006）
service-front/src/features/social/                 # queries に resolveUserIdByNickname 追加・Timeline / FollowList / FollowCounts / UserSearch のリンクを profilePath 化
service-front/src/features/dives/                  # DiveDetail のバディリンクを profilePath 化
service-front/src/features/notifications/          # notificationTarget の followed 遷移先を profilePath 化（actor の nickname を利用）
service-front/src/features/auth/                   # AuthNav のマイプロフィールリンクを profilePath 化
service-front/src/features/account/                # nickname 変更時に auth の user_metadata を同期（research.md Decision 4）
```

**Structure Decision**: 動的セグメントは `[id]` を `[slug]` に置き換えた単一ルートで uuid / ニックネームの両方を受ける（同一階層に別の動的セグメントは並存できないため）。判別・エンコード・フォールバックのロジックは `shared/lib/profile-path/` の純関数に集約し、リンク生成側（features 各所）と解決側（users ページ）が同じ規則を共有する。

## 設計詳細

### 解決とリダイレクト（FR-001/002/004/008）

1. `/users/[slug]` の page で `slug` を判別:
   - **uuid 形式** → 既存 RPC `get_user_public_profiles([slug])` で nickname を取得 → URL 安全なら `redirect()` でニックネーム URL へ転送（FR-004）。URL 不可ニックネームなら転送せず ID のまま表示（FR-005 フォールバック）。ユーザー不在は `notFound()`
   - **それ以外** → `decodeURIComponent` した値を新 RPC `get_user_id_by_nickname` で解決（`lower(trim())` 照合 = FR-002）→ user_id を得て既存のプロフィール表示ロジックへ。解決不可は `notFound()`（FR-008）
2. `followers` / `following` も同じ判別・転送を行う（下層パスを維持して転送）
3. 予約セグメント `search` は静的ルートが動的セグメントより優先される（Next.js の仕様）ため衝突しない。ただしニックネーム "search" のユーザーはニックネーム URL に到達できないため FR-005/006 で扱う

### リンク生成（FR-003/005）

- `profilePath({ userId, nickname })`: nickname が URL 安全（禁止文字なし・予約語でない・uuid 形式でない）なら `/users/${encodeURIComponent(nickname)}`、そうでなければ `/users/${userId}` を返す
- nickname を表示に持つ導線（Timeline・FollowList・UserSearch・DiveDetail バディ・通知）はそのまま profilePath へ置き換える
- AuthNav（ヘッダー）は auth セッションの user_metadata.nickname から生成し、account の nickname 変更時に metadata を同期する（research.md Decision 4。metadata に nickname が無い場合は ID URL → リダイレクトで正規化される）

### ニックネーム制約の強化（FR-006）

- `shared/schemas/user-profile.ts` の nickname に追加: 禁止文字（`/ ? # % \` と制御文字）・uuid 形式・予約語（`search`）の拒否
- サインアップ（001）・Google 補完（016）・アカウント設定（変更）が同じ共有 schema を使うため 1 箇所の変更で全経路に効く
- DB の check 制約は追加しない（既存データが違反しうるため。spec Assumptions）

## Complexity Tracking

違反なし。
