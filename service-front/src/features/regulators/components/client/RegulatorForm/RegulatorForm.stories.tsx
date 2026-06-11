import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RegulatorForm } from './RegulatorForm';

const meta = {
    title: 'features/regulators/RegulatorForm',
    component: RegulatorForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
            navigation: { pathname: '/settings/equipment/new' },
        },
    },
} satisfies Meta<typeof RegulatorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewMode: Story = {};

export const EditMode: Story = {
    args: {
        regulatorId: 'sample-id',
        defaultValues: {
            brand: 'SCUBAPRO',
            model: 'MK25 EVO / S620Ti',
            purchasedOn: '2024-04-01',
            lastOverhauledOn: '2026-01-15',
            overhaulIntervalMonths: 12,
            overhaulIntervalDives: 100,
            isPrimary: true,
            notes: 'OH はいつものショップに依頼。次回はホースも交換予定。',
        },
    },
};
