import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FormSelect } from './FormSelect';

const meta = {
    title: 'shared/form/FormSelect',
    component: FormSelect,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof FormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const diveTypeOptions = [
    { value: 'fun', label: 'ファンダイブ' },
    { value: 'training', label: '講習' },
    { value: 'other', label: 'その他' },
];

export const Default: Story = {
    args: {
        id: 'diveType',
        label: 'ダイブタイプ',
        options: diveTypeOptions,
        placeholder: '選択してください',
    },
};

export const WithError: Story = {
    args: {
        id: 'diveType',
        label: 'ダイブタイプ',
        options: diveTypeOptions,
        placeholder: '選択してください',
        error: 'ダイブタイプを選択してください',
    },
};

export const Required: Story = {
    args: {
        id: 'diveType',
        label: 'ダイブタイプ',
        options: diveTypeOptions,
        placeholder: '選択してください',
        required: true,
    },
};
