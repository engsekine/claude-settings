/**
 * ログ枠（クレジット）の定数（026-log-monetization）。
 * 金額・数量はクライアント入力を信用せず、必ずこの定数を唯一の情報源とする。
 */

/** 買い切りログパックの定義（research.md 7: パック 1 種の間はマスタテーブルを持たない） */
export const LOG_CREDIT_PACK = {
    /** 付与するログ枠数 */
    quantity: 10,
    /** 税込価格（円） */
    amountJpy: 300,
    /** Stripe Checkout / 購入履歴に表示する商品名 */
    displayName: 'ログパック（10 枠）',
} as const;

/** デイリーボーナスの 1 日あたり付与枠数 */
export const DAILY_BONUS_AMOUNT = 1;

/** 新規登録・機能導入時の初期無料枠（FR-008。DB マイグレーションの値と同期） */
export const INITIAL_GRANT_AMOUNT = 10;

/**
 * 残枠不足で dives の INSERT が拒否されたときのエラー DETAIL（consume_log_credit トリガーと同期）。
 * 独自 errcode は PostgREST が 500 に握りつぶすため、P0001 + DETAIL で判別する
 */
export const NO_CREDIT_ERROR_DETAIL = 'no_credit';

/** ActionResult.code に載せる残枠不足の識別子 */
export const NO_CREDIT_ACTION_CODE = 'no_credit';
