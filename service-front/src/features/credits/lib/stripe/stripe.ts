import 'server-only';

import type { Database } from '@repo/supabase';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import { findLogCreditPack } from '@/features/credits/constants';

/** webhook / 付与処理で使う service_role クライアントの型 */
export type ServiceRoleClient = SupabaseClient<Database>;

/**
 * Stripe SDK の初期化（遅延生成）。
 * STRIPE_SECRET_KEY はサーバー環境変数のみ。クライアントバンドルへは含めない
 */
export const getStripe = (): Stripe => {
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY が設定されていません');
    return new Stripe(secretKey);
};

/**
 * service_role の Supabase クライアント（webhook 専用）。
 * ユーザーセッションが存在しないサーバー間通信で RLS をバイパスして書き込む。
 * この関数を route handler / server 専用モジュール以外から import しないこと
 */
export const createServiceRoleClient = (): ServiceRoleClient => {
    const url = process.env['SUPABASE_INTERNAL_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    if (!url || !serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL が設定されていません');
    }
    return createSupabaseClient<Database>(url, serviceRoleKey, { auth: { persistSession: false } });
};

interface FulfillResult {
    credited: boolean;
    reason?: 'unpaid' | 'missing_user' | 'already_credited';
}

/**
 * 複数パック化（2026-07 価格改定）以前に作成された Checkout Session の内容。
 * 旧セッションは metadata.pack_id を持たないため、当時の単一パック定義で付与する
 */
const LEGACY_PACK = { quantity: 10, amountJpy: 300 } as const;

/**
 * checkout.session.completed の枠付与（026 / FR-005・007）。
 * 冪等性は DB 側（session_id ユニーク + credited_at 条件付き更新）が担保するため、
 * 重複 webhook でも安全に何度でも呼べる。DB エラーは throw し、
 * route が 500 を返して Stripe の自動リトライに委ねる
 */
export const fulfillCheckoutSession = async (
    supabase: ServiceRoleClient,
    session: Stripe.Checkout.Session,
): Promise<FulfillResult> => {
    if (session.payment_status !== 'paid') return { credited: false, reason: 'unpaid' };

    const userId = session.client_reference_id;
    if (!userId) return { credited: false, reason: 'missing_user' };

    const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? '');

    // p_quantity / p_amount_jpy は pending レコードが無い場合の自己修復作成でのみ使われる
    // （complete_purchase は既存レコードのスナップショット値を優先して付与する）
    const pack = findLogCreditPack(session.metadata?.['pack_id'] ?? '') ?? LEGACY_PACK;

    const { data: credited, error } = await supabase.rpc('complete_purchase', {
        p_session_id: session.id,
        p_payment_intent_id: paymentIntentId,
        p_user_id: userId,
        p_quantity: pack.quantity,
        p_amount_jpy: pack.amountJpy,
    });
    if (error) throw new Error(`complete_purchase に失敗: ${error.message}`);

    return credited === true ? { credited: true } : { credited: false, reason: 'already_credited' };
};

/**
 * charge.refunded の残枠調整（spec Edge Case: 未消費分を上限に差し引き 0 で床打ち）。
 * 冪等キーは refund ID（未展開の場合は charge ID で代替）
 */
export const processRefund = async (
    supabase: ServiceRoleClient,
    charge: Stripe.Charge,
): Promise<{ adjusted: boolean }> => {
    const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!paymentIntentId) return { adjusted: false };

    const refundId = charge.refunds?.data?.[0]?.id ?? charge.id;

    const { data: adjusted, error } = await supabase.rpc('apply_refund', {
        p_payment_intent_id: paymentIntentId,
        p_refund_id: refundId,
    });
    if (error) throw new Error(`apply_refund に失敗: ${error.message}`);

    return { adjusted: adjusted === true };
};

/**
 * 決済不成立（session expired / async payment failed）の購入レコードを failed にする。
 * 枠は付与しない（US2-AC2）。付与済みレコードは対象外（credited_at is null のみ）
 */
export const markPurchaseFailed = async (supabase: ServiceRoleClient, sessionId: string): Promise<void> => {
    const { error } = await supabase
        .from('log_credit_purchases')
        .update({ status: 'failed' })
        .eq('stripe_checkout_session_id', sessionId)
        .is('credited_at', null);
    if (error) throw new Error(`購入の failed 更新に失敗: ${error.message}`);
};
