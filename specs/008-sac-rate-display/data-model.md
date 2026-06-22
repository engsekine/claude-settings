# Data Model: エア消費率（SAC、導出値）

## メタ情報

| 項目 | 内容 |
|------|------|
| スキーマ変更 | **なし**（テーブル追加・カラム追加・マイグレーションすべて不要） |
| 永続化 | しない。SAC は表示の都度算出する導出値（spec FR-003） |
| 算出実装 | `service-front/src/features/dives/lib/sacRate.ts` の純粋関数 |
| 関連機能 | [008 エア消費率（SAC）の自動計算・表示](spec.md) |
| ステータス | 確定 |

## 1. 参照する既存データ（変更なし）

すべて `public.dives` テーブルの既存カラム。ドメイン型は `Dive`（`features/dives/types.ts`）。

| テーブル.カラム | ドメイン型フィールド | NULL | 用途 |
|----------------|--------------------|------|------|
| `dives.pressure_start_bar` | `pressureStartBar: number \| null` | 任意 | 消費ガス量の算出（開始側） |
| `dives.pressure_end_bar` | `pressureEndBar: number \| null` | 任意 | 消費ガス量の算出（終了側） |
| `dives.tank_volume_l` | `tankVolumeL: number \| null` | 任意 | 残圧差 → 体積への換算 |
| `dives.avg_depth_m` | `avgDepthM: number \| null` | 任意 | 周囲圧（水面換算）の算出 |
| `dives.bottom_time_min` | `bottomTimeMin: number` | 必須 | 毎分換算 |

## 2. 導出値: エア消費率（SacRate）

| 項目 | 内容 |
|------|------|
| 結果型 | `SacRateResult = { status: 'ok'; sacRateLpm: number } \| { status: 'missing'; missingFields: SacInputField[] } \| { status: 'invalid' }` |
| `SacInputField` | `'pressureStartBar' \| 'pressureEndBar' \| 'tankVolumeL' \| 'avgDepthM'`（潜水時間は必須項目のため不足になり得ない） |
| 不足ラベル | `SAC_INPUT_FIELD_LABELS`: pressureStartBar → 開始残圧 / pressureEndBar → 終了残圧 / tankVolumeL → タンク容量 / avgDepthM → 平均水深 |
| 計算式 | 消費ガス量[L] = (開始残圧 − 終了残圧) × タンク容量、周囲圧[気圧] = 平均水深 ÷ 10 + 1、`sacRateLpm` = 消費ガス量 ÷ 潜水時間 ÷ 周囲圧 |
| missing 判定 | 任意 4 項目のいずれかが `null` のとき。`missingFields` に不足項目をフィールド定義順で列挙 |
| invalid 判定 | 5 項目が揃っていて、消費ガス量 ≦ 0（開始残圧 ≦ 終了残圧）のとき。タンク容量 ≦ 0・潜水時間 ≦ 0 も防御的に invalid（DB CHECK により通常は発生しない） |
| 丸め | `sacRateLpm` は丸めず保持し、`formatSacRate` が表示時に小数第 1 位へ四捨五入して `15.0 L/分` 形式にする |
| 決定性 | 現在時刻・乱数に依存しない。同一入力 → 同一出力 |

## 3. 検証用フィクスチャ（単体テスト）

| 開始[bar] | 終了[bar] | タンク[L] | 平均水深[m] | 時間[分] | 期待結果 | 備考 |
|----------|----------|----------|------------|---------|---------|------|
| 200 | 50 | 10 | 10 | 50 | ok / 15.0 | SC-002 の代表ケース（1500 L ÷ 50 分 ÷ 2 気圧） |
| 180 | 60 | 12 | 15 | 48 | ok / 12.0 | 1440 L ÷ 48 分 ÷ 2.5 気圧 |
| 200 | 100 | 10 | 0 | 50 | ok / 20.0 | 平均水深 0 m = 周囲圧 1 気圧（水面） |
| 200 | 50 | 10 | 12 | 45 | ok / 15.2（表示） | 15.1515… の四捨五入を検証（`sacRateLpm` は非丸め） |
| null | 50 | 10 | 10 | 50 | missing [pressureStartBar] | 単一不足 |
| 200 | 50 | null | null | 50 | missing [tankVolumeL, avgDepthM] | 複数不足の列挙順 |
| 100 | 100 | 10 | 10 | 50 | invalid | 消費量 0 |
| 80 | 100 | 10 | 10 | 50 | invalid | 消費量が負（開始 < 終了） |

## 4. 精度と限界

- 周囲圧は「水深 10 m = 1 気圧加算」の慣習近似。海水・淡水の密度差（1% 未満）は補正しない（[research.md R1](research.md)）
- 平均水深は時間加重平均であることを前提とした概算値。ダイブコンピュータの実測 SAC とは差が出うる（参考値の位置づけ）
- 値の妥当性評価（目安との比較・警告）は行わず、計算結果をそのまま表示する（spec Assumptions）
