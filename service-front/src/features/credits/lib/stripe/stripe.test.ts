import type Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';

import { fulfillCheckoutSession, markPurchaseFailed, processRefund } from './stripe';

/** rpc / from をモックした service_role クライアント相当 */
const buildSupabaseMock = (rpcResult: { data: unknown; error: { message: string } | null }) => {
    const rpc = vi.fn().mockResolvedValue(rpcResult);
    const updateEq2 = vi.fn().mockResolvedValue({ error: null });
    const updateEq1 = vi.fn().mockReturnValue({ is: updateEq2 });
    const update = vi.fn().mockReturnValue({ eq: updateEq1 });
    const from = vi.fn().mockReturnValue({ update });
    return { client: { rpc, from }, rpc, from, update };
};

const buildSession = (overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session =>
    ({
        id: 'cs_test_123',
        client_reference_id: 'user-1',
        payment_intent: 'pi_test_123',
        payment_status: 'paid',
        ...overrides,
    }) as Stripe.Checkout.Session;

describe('fulfillCheckoutSession', () => {
    it('paid のセッションで metadata.pack_id のパック内容で complete_purchase を呼ぶ', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        const result = await fulfillCheckoutSession(client as any, buildSession({ metadata: { pack_id: 'standard' } }));

        expect(result).toEqual({ credited: true });
        expect(rpc).toHaveBeenCalledWith('complete_purchase', {
            p_session_id: 'cs_test_123',
            p_payment_intent_id: 'pi_test_123',
            p_user_id: 'user-1',
            p_quantity: 30,
            p_amount_jpy: 1200,
        });
    });

    it('metadata の無い旧セッションは旧単一パック（10 枠 / ¥300）で付与する', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        const result = await fulfillCheckoutSession(client as any, buildSession());

        expect(result).toEqual({ credited: true });
        expect(rpc).toHaveBeenCalledWith('complete_purchase', {
            p_session_id: 'cs_test_123',
            p_payment_intent_id: 'pi_test_123',
            p_user_id: 'user-1',
            p_quantity: 10,
            p_amount_jpy: 300,
        });
    });

    it('付与済みセッション（RPC が false）は credited: false の no-op になる（冪等）', async () => {
        const { client } = buildSupabaseMock({ data: false, error: null });

        const result = await fulfillCheckoutSession(client as any, buildSession());

        expect(result).toEqual({ credited: false, reason: 'already_credited' });
    });

    it('未払い（payment_status が paid 以外）は RPC を呼ばず no-op', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        const result = await fulfillCheckoutSession(client as any, buildSession({ payment_status: 'unpaid' }));

        expect(result).toEqual({ credited: false, reason: 'unpaid' });
        expect(rpc).not.toHaveBeenCalled();
    });

    it('client_reference_id が無いセッションは対象外として no-op', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        const result = await fulfillCheckoutSession(client as any, buildSession({ client_reference_id: null }));

        expect(result).toEqual({ credited: false, reason: 'missing_user' });
        expect(rpc).not.toHaveBeenCalled();
    });

    it('RPC エラーは throw して呼び出し元（route の 500 → Stripe リトライ）に委ねる', async () => {
        const { client } = buildSupabaseMock({ data: null, error: { message: 'db down' } });

        await expect(fulfillCheckoutSession(client as any, buildSession())).rejects.toThrow(/db down/);
    });
});

describe('processRefund', () => {
    const buildCharge = (overrides: Partial<Stripe.Charge> = {}): Stripe.Charge =>
        ({
            id: 'ch_test_123',
            payment_intent: 'pi_test_123',
            refunds: { data: [{ id: 're_test_123' }] },
            ...overrides,
        }) as Stripe.Charge;

    it('apply_refund を payment_intent と refund_id で呼ぶ', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        const result = await processRefund(client as any, buildCharge());

        expect(result).toEqual({ adjusted: true });
        expect(rpc).toHaveBeenCalledWith('apply_refund', {
            p_payment_intent_id: 'pi_test_123',
            p_refund_id: 're_test_123',
        });
    });

    it('refunds が展開されていない charge は charge.id を冪等キーにする', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        await processRefund(client as any, buildCharge({ refunds: null }));

        expect(rpc).toHaveBeenCalledWith('apply_refund', {
            p_payment_intent_id: 'pi_test_123',
            p_refund_id: 'ch_test_123',
        });
    });

    it('対象外決済（RPC が false）は adjusted: false の no-op', async () => {
        const { client } = buildSupabaseMock({ data: false, error: null });

        const result = await processRefund(client as any, buildCharge());

        expect(result).toEqual({ adjusted: false });
    });

    it('payment_intent が無い charge は RPC を呼ばず no-op', async () => {
        const { client, rpc } = buildSupabaseMock({ data: true, error: null });

        const result = await processRefund(client as any, buildCharge({ payment_intent: null }));

        expect(result).toEqual({ adjusted: false });
        expect(rpc).not.toHaveBeenCalled();
    });
});

describe('markPurchaseFailed', () => {
    it('未付与の購入を failed に更新する', async () => {
        const { client, from, update } = buildSupabaseMock({ data: null, error: null });

        await markPurchaseFailed(client as any, 'cs_test_123');

        expect(from).toHaveBeenCalledWith('log_credit_purchases');
        expect(update).toHaveBeenCalledWith({ status: 'failed' });
    });
});
