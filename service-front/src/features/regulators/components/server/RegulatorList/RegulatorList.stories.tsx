import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RegulatorList } from './RegulatorList';

const meta = {
    title: 'features/regulators/RegulatorList',
    component: RegulatorList,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof RegulatorList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: { regulators: [] },
};

export const WithRegulators: Story = {
    args: {
        regulators: [
            {
                id: 'r1',
                brand: 'SCUBAPRO',
                model: 'MK25 EVO',
                purchasedOn: '2024-04-01',
                lastOverhauledOn: '2026-01-15',
                overhaulIntervalMonths: 12,
                overhaulIntervalDives: 100,
                isPrimary: true,
                notes: '冬用にセッティング済み',
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
            {
                id: 'r2',
                brand: 'apeks',
                model: 'XTX200',
                purchasedOn: null,
                lastOverhauledOn: '2025-11-01',
                overhaulIntervalMonths: 18,
                overhaulIntervalDives: 150,
                isPrimary: false,
                notes: null,
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
        ],
    },
};

export const WithActions: Story = {
    args: {
        regulators: WithRegulators.args.regulators,
        renderActions: (regulator) => (
            <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 text-foreground text-sm transition-colors hover:bg-muted/50"
            >
                {regulator.model} を削除
            </button>
        ),
    },
};
