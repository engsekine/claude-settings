import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiveList } from './DiveList';

const meta = {
    title: 'features/dives/DiveList',
    component: DiveList,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => {
            const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
            return (
                <QueryClientProvider client={client}>
                    <Story />
                </QueryClientProvider>
            );
        },
    ],
} satisfies Meta<typeof DiveList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: { initialPage: { items: [], nextCursor: null } },
};

export const WithItems: Story = {
    args: {
        initialPage: {
            items: [
                {
                    id: 'd1',
                    diveNumber: 1,
                    diveDate: '2026-04-15',
                    location: '伊豆',
                    diveSite: '大瀬崎',
                    maxDepthM: 18,
                    bottomTimeMin: 40,
                    waterTempC: 18.2,
                    visibilityM: 12,
                    certificationDive: false,
                },
                {
                    id: 'd2',
                    diveNumber: 2,
                    diveDate: '2026-04-10',
                    location: '伊豆',
                    diveSite: 'IOP',
                    maxDepthM: 24,
                    bottomTimeMin: 38,
                    waterTempC: 17.5,
                    visibilityM: 8,
                    certificationDive: true,
                },
            ],
            nextCursor: null,
        },
    },
};
