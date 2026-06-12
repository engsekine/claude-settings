import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CertificationList } from './CertificationList';

const meta = {
    title: 'features/certifications/CertificationList',
    component: CertificationList,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof CertificationList>;

export default meta;
type Story = StoryObj<typeof meta>;

const TODAY = '2026-06-12';

export const Empty: Story = {
    args: {
        certifications: [],
        today: TODAY,
    },
};

export const WithCertifications: Story = {
    args: {
        today: TODAY,
        certifications: [
            {
                id: 'c1',
                agency: 'padi',
                rank: 'Open Water Diver',
                acquiredOn: '2018-03-10',
                diverNumber: '1234567890',
                instructorNumber: 'I-98765',
                trainedBy: '石垣島ダイビングショップ',
                acquiredLocation: '沖縄県石垣市',
                dive: { id: 'dive-1', diveDate: '2018-03-10', location: '石垣島・米原' },
                tags: ['エンリッチド・エア', 'ディープ'],
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
            {
                id: 'c2',
                agency: 'padi',
                rank: 'Advanced Open Water Diver',
                acquiredOn: '2019-08-22',
                diverNumber: null,
                instructorNumber: null,
                trainedBy: null,
                acquiredLocation: '静岡県伊豆',
                dive: null,
                tags: ['ナビゲーション'],
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
            {
                id: 'c3',
                agency: 'cmas',
                rank: '★ One Star Diver',
                acquiredOn: '2023-11-05',
                diverNumber: null,
                instructorNumber: null,
                trainedBy: null,
                acquiredLocation: null,
                dive: null,
                tags: [],
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
        ],
    },
};

export const WithActions: Story = {
    args: {
        today: TODAY,
        certifications: WithCertifications.args.certifications,
        renderActions: (certification) => (
            <>
                <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1.5 text-foreground text-sm transition-colors hover:bg-muted/50"
                >
                    編集
                </button>
                <button
                    type="button"
                    className="rounded-md border border-destructive px-3 py-1.5 text-destructive text-sm transition-colors hover:bg-destructive/10"
                >
                    {certification.rank} を削除
                </button>
            </>
        ),
    },
};
