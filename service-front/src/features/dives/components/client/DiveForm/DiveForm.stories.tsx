import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DiveForm } from './DiveForm';

const meta = {
    title: 'features/dives/DiveForm',
    component: DiveForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
            navigation: { pathname: '/dives/new' },
        },
    },
} satisfies Meta<typeof DiveForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewMode: Story = {};

export const EditMode: Story = {
    args: {
        diveId: 'sample-id',
        defaultValues: {
            diveNumber: 42,
            diveDate: '2026-04-15',
            location: '伊豆',
            diveSite: '大瀬崎',
            maxDepthM: 22.5,
            bottomTimeMin: 48,
            waterTempC: 18.2,
            visibilityM: 12,
        },
    },
};
