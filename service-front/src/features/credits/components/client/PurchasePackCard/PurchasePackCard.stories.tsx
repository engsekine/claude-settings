import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PurchasePackCard } from './PurchasePackCard';

/**
 * ログパック購入カード（026 / FR-005）。
 *
 * 「購入する」ボタンは内部で Server Action（createCheckoutSession）を呼び出すため、
 * Storybook 上ではクリックしても実際の決済フローは起動しない。
 * ボタンの表示・ラベル・レイアウトの確認を目的とした静的 story。
 */
const meta = {
    title: 'features/credits/PurchasePackCard',
    component: PurchasePackCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof PurchasePackCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示。パック名・説明・価格・購入ボタンを含む通常状態。 */
export const Default: Story = {};
