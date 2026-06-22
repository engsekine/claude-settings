# Research: ダイブサイト（ポイント）マスタ

Phase 0 の設計判断記録。spec の Clarifications で確定済みの論点と、plan 段階で決めた技術判断をまとめる。

## R1: サイト参照とポイント名テキストの保持方法

- **Decision**: ログは `dive_site_id`（null 可）を参照する。サイト参照時は表示名をマスタから取得し `location` は保持しない。自由入力ログのみ `location` を使う（サイト参照と自由入力は **排他**）。
- **Rationale**: `rules/sql.md`「サイト名は `dive_site_id` に従属＝冗長保存しない（2NF/3NF）」に適合し、マスタ改名が全ログに即反映され表記ゆれが根絶される（SC-001）。spec Clarification（2026-06-16 / Q1=A）で確定。
- **Alternatives considered**:
  - サイト名を `location` にスナップショット保存（改名履歴は残るが冗長・表記ゆれ再発リスク）→ 却下
  - `location` を常に必須にして `dive_site_id` を付加情報に（名称の正が二重化）→ 却下

## R2: ダイブサイト選択 UI（検索）

- **Decision**: ダイブサイト全件を Server 側で取得してページから渡し、Client コンポーネント `SearchSelect` でインクリメンタル絞り込み（名称・エリアの部分一致、大文字小文字無視）を行う。新規ライブラリは追加しない。
- **Rationale**: サイトは数百件規模で全件保持が現実的。クライアント絞り込みはネットワーク往復なしで体感が速く、WAI-ARIA コンボボックスパターンで a11y を担保しやすい。`shared/components/form` に汎用部品として置けば再利用できる。
- **Alternatives considered**:
  - サーバサイド検索（都度クエリ）→ 件数が小さい現状ではオーバーエンジニアリング。将来マスタが数千件規模になったら移行（quickstart に将来メモ）
  - 既存 `FormSelect`（素の `<select>`）流用 → 検索不可で件数増に弱い、要望（検索 UI）を満たさない → 却下

## R3: サイト別実績の集計方法

- **Decision**: 本人の当該サイトのログを RLS スコープの `select`（`where dive_site_id = X`）で取得し、純粋関数 `siteStats.ts` で本数・平均透明度・月別本数を集計する。新規 RPC は作らない。
- **Rationale**: 1 ユーザー × 1 サイトのログは高々数十件で、アプリ側集計で十分。純粋関数はテストが容易（`sacRate.ts` / `blankDays.ts` / `heldPeriod.ts` と同じ方針＝Test-First に適合）。
- **Alternatives considered**:
  - RPC（`get_dive_site_stats`）でDB集計（`get_dive_stats` 同様）→ 件数が小さく、関数追加・`search_path` 固定の保守コストに見合わない → 却下（将来クロスユーザー統計を出すなら再検討）

## R4: ベストシーズンの定義

- **Decision**: 月（1–12）ごとの潜水本数を集計し、本数が多い月の上位を「よく潜る時期」として提示する。コンディション（透明度等）評価はスコープ外。
- **Rationale**: 既存ログ（`dive_date`）だけで算出でき入力項目を増やさない。spec Clarification（Q4=A）で確定。データ不足時は傾向を断定しない（spec Edge Case）。
- **Alternatives considered**: 月別平均透明度ベース / 本数・透明度併記 → 将来拡張に回す。

## R5: feature 配置とクロス feature 連携

- **Decision**: マスタ参照・実績は新規 `features/dive-sites` に独立。ログ入力（`features/dives`）へはページ層でサイト選択肢を props 注入し、feature 間 import を避ける。検索選択 UI は `shared/components/form/SearchSelect` に汎用化。
- **Rationale**: 006（`features/certifications` がダイブ選択肢をページ層経由で受け取る）と同じ非依存パターン。Feature-based アーキテクチャ（`arch/feature-based.md`）・CLAUDE.md のフォルダ規約に適合。
- **Alternatives considered**: `features/dives` 内にサイトマスタを同居 → マスタは横断的でログ機能の責務外、独立が自然 → 却下。

## R6: マスタの管理主体と書き込み権限（US3 の扱い）

- **Decision**: `dive_sites` は全ユーザー共有マスタ。RLS は **SELECT のみ** authenticated に許可し、INSERT/UPDATE/DELETE ポリシーは設けない（seed / service role のみ書き込み可）。初期データは `seed.sql` で投入。管理 UI・統合（US3）は別機能「管理画面」+ 管理者ロール導入に依存するため本機能ではスコープ外。
- **Rationale**: 現状アプリに管理者ロールが存在しない（spec Assumptions）。ポリシー無しの RLS はデフォルト deny なので一般ユーザーからの改変を安全に防げる。US1/US2 はシード済みマスタで価値が成立する（独立デリバリ可能）。
- **Alternatives considered**:
  - 本機能内で管理者ロール + 管理 CRUD まで実装 → スコープ肥大・認可設計が重く、US1/US2 の早期提供を阻害 → 却下（管理画面機能へ）
  - ユーザーが直接マスタに追加可 → 重複・荒れの温床。今回は自由入力フォールバックで代替し、マスタ化は運用者に委ねる → 却下

## R7: 既存データ互換 / 移行

- **Decision**: 既存ログは `location` 自由入力のまま保持（`dive_site_id` は null）。新規記録からマスタ参照を任意で選べる段階移行。過去ログの一括変換はしない。
- **Rationale**: spec Clarification（Q3 相当 / Assumptions）。`location` を nullable 化し排他 CHECK を入れても、既存行（location 有・site null）は CHECK を満たすため無停止で互換。
- **Alternatives considered**: 既存 location から自動でサイトを起こして紐付け → 自動マッチ誤りのリスク。将来「管理画面」での統合機能に委ねる → 却下。
