import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CertificationForm } from './CertificationForm';

const meta = {
    title: 'features/certifications/CertificationForm',
    component: CertificationForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
            navigation: { pathname: '/settings/certifications/new' },
        },
    },
} satisfies Meta<typeof CertificationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_DIVE_OPTIONS = [
    { value: 'dive-1', label: '2023/04/01 石垣島・米原' },
    { value: 'dive-2', label: '2023/03/30 石垣島・崎枝' },
];

export const NewMode: Story = {
    args: {
        diveOptions: SAMPLE_DIVE_OPTIONS,
    },
};

export const EditMode: Story = {
    args: {
        certificationId: 'sample-cert-id',
        defaultValues: {
            agency: 'padi',
            rank: 'Open Water Diver',
            acquiredOn: '2023-04-01',
            diverNumber: '1234567890',
            instructorNumber: 'I-98765',
            trainedBy: '石垣島ダイビングショップ',
            acquiredLocation: '沖縄県石垣市',
            specialtyTags: 'エンリッチド・エア, ディープ',
            diveId: 'dive-1',
        },
        diveOptions: SAMPLE_DIVE_OPTIONS,
    },
};
