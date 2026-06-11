# Research: CI/CD 整備（GitHub Actions）

Phase 0 の設計判断の記録。Technical Context に NEEDS CLARIFICATION は残っていない。

## Decision 1: ワークフローは「軽量 ci.yml」と「重量 full-test.yml」の 2 ファイル構成

- **Decision**: PR + main で走る `ci.yml` と、main push のみの `full-test.yml` に分離する
- **Rationale**: spec で確定した実行ポリシー（重いテストは main のみ — FR-011）をトリガーレベルで表現でき、PR のフィードバックを 10 分以内（SC-001）に保てる。required checks の対象も `ci.yml` のジョブだけで完結する
- **Alternatives considered**: 1 ファイル + `if: github.ref == 'refs/heads/main'` 条件分岐 → ジョブ一覧が PR 上で「スキップ」表示されノイズになる。job レベル分割の方が明確

## Decision 2: チェックは並列の独立ジョブに分割（1 ジョブ複数ステップにしない）

- **Decision**: lint / markup-lint / type-check / unit-test / db-lint を独立ジョブにする
- **Rationale**: FR-004（独立判別）・FR-006（個別ステータス）・FR-009（個別再実行）を GitHub の標準 UI で満たせる。並列実行で wall-clock も短い
- **Alternatives considered**: 1 ジョブ直列（`npm run validate`）→ 最初の失敗で後続が見えず、再実行も全部やり直しになる。matrix 戦略 → コマンドが異質（db-lint は Node 不要）で matrix の旨味がない

## Decision 3: 依存キャッシュは `actions/setup-node` 内蔵の npm キャッシュ

- **Decision**: `actions/setup-node@v4` の `cache: 'npm'`（ルート `package-lock.json` キー）を使い、`npm ci` でインストールする
- **Rationale**: 公式機能で設定 1 行。モノレポでもルート lock ファイル 1 つなのでキーが単純（FR-007）
- **Alternatives considered**: `actions/cache` で `node_modules` を直接キャッシュ → lock 更新時の不整合リスクと設定量が増える割に短縮幅が小さい

## Decision 4: DB lint は `supabase db start`（DB コンテナのみ）で実行

- **Decision**: `supabase/setup-cli@v1` で CLI を入れ、`supabase db start` → `supabase db lint` を実行する
- **Rationale**: lint はローカル DB への接続が必要だが、auth / storage 等のフルスタック（`supabase start`）は不要。DB のみ起動で時間を節約しつつマイグレーション全体を検証できる（FR-005）
- **Alternatives considered**: フル `supabase start` → 起動が遅い。SQL の静的パースのみのツール → RLS / 関数の lint（`auth_rls_initplan` 等）が検証できない

## Decision 5: Action はメジャーバージョンタグ固定（SHA ピン留めしない）

- **Decision**: `actions/checkout@v4` 等、公式 / ベンダー公式 Action のみをメジャータグで使用する
- **Rationale**: 使用するのは GitHub 公式 2 つ + Supabase 公式 1 つのみで、サプライチェーンリスクは限定的。SHA ピン留めは更新運用（Dependabot 連携）が前提になり、今回のスコープ（Dependabot は対象外）と釣り合わない
- **Alternatives considered**: 全 Action SHA 固定 → セキュリティは上がるが更新が手動になり陳腐化しやすい。後続 feature で Dependabot 導入時に切り替え可能

## Decision 6: E2E の環境変数はシークレットにしない

- **Decision**: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` は `supabase status -o env` の出力（CLI ローカルスタックの公開デフォルトキー）からジョブ内で生成する
- **Rationale**: ローカルスタックのキーは Supabase CLI が全員に同じ値を配る開発用デフォルトで秘匿価値がない。シークレットレス（FR-008）を保てる
- **Alternatives considered**: リポジトリシークレットに登録 → フォーク PR で使えなくなる・管理対象が増えるだけで利点がない

## Decision 7: E2E の Next.js サーバーは Playwright の webServer に任せる

- **Decision**: CI でも `playwright.config.ts` の `webServer`（`NEXT_DIST_DIR=.next-playwright next dev -p 9323`）をそのまま使う
- **Rationale**: ローカルと同一の起動経路で SC-003（CI とローカルの一致）を保つ。dist dir 分離済みのためビルドキャッシュ衝突も起きない
- **Alternatives considered**: `next build` + `next start` → 本番ビルドの検証になる利点はあるが、dev モードと挙動差があり既存テストの前提（dev）から乖離する。ビルド検証は将来 `build` ジョブとして追加可能
