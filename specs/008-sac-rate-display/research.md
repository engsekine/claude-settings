# Research: エア消費率（SAC）の自動計算・表示

技術選定・設計判断の記録。Technical Context に NEEDS CLARIFICATION はないが、計算方式・ロジックの配置・結果の表現方法について複数の選択肢があったため判断理由を残す。

## R1. 計算方式: 体積ベース SAC（L/分）+ 10 m = 1 気圧の慣習近似

- **Decision**: SAC = (開始残圧 − 終了残圧) × タンク容量 ÷ 潜水時間 ÷ (平均水深 ÷ 10 + 1) を採用する。単位は L/分（水面換算）。`sacRateLpm` は丸めずに返し、表示時に小数第 1 位へ四捨五入する
- **Rationale**: レクリエーショナルダイビングの教本・ログアプリで最も一般的な計算方法で、ユーザーが手計算している値と一致する。体積ベース（L/分）はタンク容量が異なるダイブ間でも比較できる（spec Assumptions）。10 m = 1 気圧は実用上十分な近似で、入力に塩分・水温が無い以上これより精密にはできない
- **Alternatives considered**:
  - 圧力ベース SAC（bar/分）— タンク容量に依存して比較できないため不採用（タンク容量未入力でも出せる利点はあるが、誤解を招く）
  - 海水密度補正（10.06 m/気圧 等）— 淡水/海水の区別が入力項目に無く、差は 1% 未満で表示精度（小数第 1 位）に対して過剰
  - ガス種（EANx）補正 — 体積ベースの消費率はガス種に依存しないため不要（spec Assumptions で明記済み）

## R2. 配置: `features/dives/lib/sacRate.ts`（shared には置かない）

- **Decision**: 算出関数・結果型・不足項目ラベルを `features/dives/lib/sacRate.ts` に置く。同階層テストを付ける
- **Rationale**: 利用箇所が DiveDetail（dives feature）のみで、feature 内に閉じるロジックは feature の lib に置くのが Feature-based アーキテクチャの原則。同階層には既にダイブ計算の純粋関数 `calcBottomTime.ts` があり慣習が確立している。007（潮回り）が `shared/lib` だったのは dives と plans の 2 feature から使うためで、本機能は前提が異なる
- **Alternatives considered**:
  - `shared/lib/sacRate.ts`（007 と同配置）— 現時点で共有する相手がいない。将来ダッシュボード統計（dashboard feature）で SAC 推移を出すことになったら、その時点で shared へ昇格する（YAGNI）

## R3. 結果の表現: 判別共用体（ok / missing / invalid）

- **Decision**: `calcSacRate` は `{ status: 'ok', sacRateLpm } | { status: 'missing', missingFields } | { status: 'invalid' }` の判別共用体を返す
- **Rationale**: FR-004（不足項目の案内）には「どの項目が欠けているか」の情報が必要で、FR-005（不正値は案内も出さない）には不足と不正の区別が必要。3 状態を型で表現すると、表示側の分岐が網羅的になり TypeScript の exhaustiveness チェックが効く
- **Alternatives considered**:
  - `number | null` を返す — 不足項目が伝えられず FR-004 を満たせない。null の意味（不足 or 不正）も曖昧
  - `calcSacRate` と `getMissingSacFields` の 2 関数 — 呼び出し側で組み合わせ判断が必要になり、不足かつ不正のような中間状態の扱いがブレる

## R4. 表示位置: DiveDetail の「タンク・装備」セクション（新規コンポーネントなし）

- **Decision**: DiveDetail の「タンク・装備」セクション末尾（装備メモの前）に、ok 時は既存 Field と同じ見た目の値表示、missing 時は案内テキストを描画する。新規 UI コンポーネントは作らない
- **Rationale**: SAC の入力元（残圧・タンク容量）と同じ文脈に置くことで「この値から計算された」ことが直感的に伝わり、missing 案内からどの欄を埋めればよいかも見つけやすい。表示は値 + 案内テキストのみで、コンポーネント化するほどの構造を持たない（007 R4 と同じ判断）
- **Alternatives considered**:
  - 「水深・時間」セクションに置く — 平均水深・潜水時間も入力元だが、SAC は本質的にガス消費の指標でありタンク文脈が自然
  - ヘッダーへのバッジ表示（潮回りと並べる）— 潮回りは環境情報・SAC は計算指標で性質が異なり、ヘッダーが数値で混み合う
  - 専用セクション新設 — 1 値のために見出しを増やすのは過剰
