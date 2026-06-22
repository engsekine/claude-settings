# Research: ブランク日数の表示

技術選定・設計判断の記録。Technical Context に NEEDS CLARIFICATION はないが、既存実装との関係と表示位置に判断の余地があったため理由を残す。

## R1. 計算は既存 `daysUntil` を流用し、純粋関数 `calcBlankDays` に切り出す

- **Decision**: `shared/lib/date.ts` の `daysUntil(target, today)`（暦日差・文字列ベース）を流用し、`features/dashboard/lib/blankDays.ts` の `calcBlankDays(lastDiveOn, today)` に閉じ込める。符号反転 + `Math.max(0, ...)` で下限 0 に丸め、ログ 0 件は null
- **Rationale**: 既存 `getDashboardHero` が `-daysUntil(lastDiveOn, todayInJst())` をインライン計算しており、未来日ログで負の値がそのまま表示されうる（spec の Edge Case / FR-003 に違反する潜在バグ）。テスト可能な純粋関数に切り出すことで丸め仕様を単体テストで担保する。`features/dashboard/lib/overhaul.ts` と同じ配置パターン
- **Alternatives considered**:
  - getDashboardHero 内のインライン計算のまま `Math.max` を足す — テストが Server Action 経由になり重い。丸め・null の境界仕様はロジック単体で検証したい
  - date-fns 等の導入 — 既存方針（006 research R3）どおり、暦日差 1 種類のために依存は増やさない

## R2. 表示位置: ヒーロー内の既存文言を置き換える（統計カードには追加しない）

- **Decision**: ヒーローの「前回のダイブから ○ 日」を、数値を強調した `BlankDays` コンポーネント（「最後に潜ってから ○日」）に置き換える。累計統計（StatsCards）には追加しない
- **Rationale**: spec の Assumptions（既存ヒーロー表示の強化・置き換え）に一致。ヒーローはページ最上部で「開くだけで申告値がわかる」（SC-001）を最短で満たす。統計カードは「累計」の集まりであり、日々減衰・増加するブランク日数は意味的に異質
- **Alternatives considered**:
  - StatsCards に 5 枚目のカードとして追加 — 2×2 グリッドのレイアウトが崩れる。累計値でない値が混ざり一貫性を損なう
  - ヒーローと統計カードの両方 — 同一画面に同じ値が 2 回出るのは冗長

## R3. `DashboardHero.daysSinceLastDive` を `blankDays` に改名する

- **Decision**: 型のフィールド名をプロダクト用語（ブランク日数）に合わせて改名する
- **Rationale**: 「ブランク」はスペック・UI・ショップ申告で使う一貫した用語になった。参照箇所は `queries.ts` と `TopDashboard.tsx` の 2 箇所のみで改名コストが小さい
- **Alternatives considered**:
  - 名前を維持 — 用語の二重化（コードは daysSinceLastDive、UI はブランク）が以後の変更で混乱を生む

## R4. 0 日時の文言: ブランク表示に「今日もダイビング日和！」を併記

- **Decision**: `blankDays === 0` のとき「0日」の数値表示に加えて既存の文言を補足として残す
- **Rationale**: spec Edge Case が「既存メッセージは維持してよい」と許容している。当日に潜ったユーザーへのポジティブなフィードバックは既存 UX の良さなので残す
- **Alternatives considered**:
  - 「0日」のみ — 機能的には足りるが、既存のトーンが失われる
