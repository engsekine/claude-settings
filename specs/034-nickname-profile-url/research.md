# Research: プロフィール URL のニックネーム化（034-nickname-profile-url）

## Decision 1: 単一動的セグメント `[slug]` で uuid / ニックネームの両方を受ける

- **Decision**: `/users/[id]` を `/users/[slug]` にリネームし、page 内で「uuid パターンなら ID として解釈（→ ニックネーム URL へ転送）、それ以外はニックネームとして解釈」する
- **Rationale**: Next.js は同一階層に複数の動的セグメント（`[id]` と `[nickname]`）を並存できない。判別を page 内に置くことで、既存 URL の後方互換（FR-004）とニックネーム URL（FR-001）を 1 ルートで両立できる
- **Alternatives considered**:
  - **別パス（`/u/[nickname]` 等）の新設**: 既存 `/users/` と 2 系統になり導線・共有 URL が分裂する。可読性の目的にも反する
  - **ID URL の廃止（404）**: 通知・ブックマーク・共有済みリンクを破壊する（spec Assumptions で否定済み）
- **補足**: uuid 形式のニックネームが判別を壊すため、FR-006 で新規・変更時に登録を拒否する（既存に該当があっても uuid 解釈が優先されるだけで、FR-005 の ID URL フォールバックで到達可能）

## Decision 2: ニックネーム解決は security definer RPC（`get_user_id_by_nickname`）

- **Decision**: `lower(trim(nickname)) = lower(trim(p_nickname))` で照合して user_id を返す RPC を追加する。`security definer` + `set search_path = ''`、grant は `authenticated` のみ
- **Rationale**:
  - user_details の RLS は「本人のみ read」のため、他人のニックネーム解決には RLS を越える経路が必要。既存の `get_user_public_profiles` / `search_users_by_nickname` と同じ確立済みパターン
  - 照合式が一意インデックス `user_details_nickname_key`（式インデックス）と完全一致するため、インデックスが効き、一意制約と同じ正規化（FR-002）が保証される
- **Alternatives considered**:
  - **PostgREST の ilike 直接照合**: trim を式で表現できず、インデックスも効かない。RLS の制約で他人の行はそもそも読めない
  - **正規化カラムの追加（nickname_normalized）**: テーブル変更と既存データ移行が必要。式インデックスで足りるため過剰

## Decision 3: リンク生成の一元化（`shared/lib/profile-path/`）

- **Decision**: `profilePath({ userId, nickname })` 純関数を shared/lib に置き、「URL 安全なら `/users/<encodeURIComponent(nickname)>`、不可なら `/users/<userId>`」の規則を全導線で共有する。URL 安全判定（禁止文字 `/ ? # % \`・制御文字・予約語 `search`・uuid 形式）も同モジュールに置き、schema（FR-006）と判定を共通化する
- **Rationale**: 判定規則が導線側と解決側・schema 側で食い違うと「リンクは生成されるが解決できない」事故になる。1 モジュールに集約して単体テストで固定する
- **Alternatives considered**: 各 feature での個別実装 — 033 の isOwnShop 重複と同じ保守リスクを最初から作ることになる

## Decision 4: ヘッダー（AuthNav）は auth の user_metadata.nickname を使い、変更時に同期する

- **Decision**: AuthNav のマイプロフィールリンクは `user.user_metadata.nickname` から profilePath で生成する。account 設定でニックネームを変更したとき、user_details の更新に加えて `auth.updateUser({ data: { nickname } })` で metadata も同期する。metadata に nickname が無い（同期前・一部の Google 初回ユーザー等）場合は ID URL となり、ページ側のリダイレクトでニックネーム URL に正規化される
- **Rationale**: AuthNav はセッション情報のみで描画するクライアントコンポーネントで、user_details への追加フェッチを全ページで発生させたくない。サインアップ時の metadata には nickname が既に入っており（handle_new_user が参照）、変更時の同期 1 行で恒久整合が取れる
- **Alternatives considered**:
  - **AuthNav で user_details をフェッチ**: 全ページ共通ヘッダーに毎回のクエリが乗る
  - **ID URL のまま（常にリダイレクト任せ）**: 機能はするが、主要導線が常に 1 リダイレクトを踏むのは無駄

## Decision 5: 予約セグメントは Next.js の静的ルート優先に依拠しつつ、登録を拒否する

- **Decision**: `/users/search` は静的ルートが動的 `[slug]` より優先されるため実装上の衝突はない。そのうえで、ニックネーム "search"（大文字小文字問わず）と将来の予約語衝突を避けるため、FR-006 の登録禁止リストに `search` を含める。予約語リストは profile-path モジュールの定数として一元管理する
- **Rationale**: ルーティング仕様だけに依拠すると「該当ニックネームのユーザーのプロフィール URL が別ページになる」不整合が残る。登録時拒否 + 既存該当者は ID フォールバック（FR-005）で両面から塞ぐ
