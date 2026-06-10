import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { FormSelect } from './FormSelect';

const diveTypeOptions = [
    { value: 'fun', label: 'ファンダイブ' },
    { value: 'training', label: '講習' },
] as const;

describe('FormSelect', () => {
    it('label と select が関連付けられ、options が表示される', () => {
        render(<FormSelect id="diveType" label="ダイブタイプ" options={diveTypeOptions} />);

        const select = screen.getByLabelText('ダイブタイプ');
        expect(select).toHaveAttribute('id', 'diveType');
        expect(screen.getByRole('option', { name: 'ファンダイブ' })).toHaveValue('fun');
        expect(screen.getByRole('option', { name: '講習' })).toHaveValue('training');
    });

    it('placeholder を渡すと先頭に空の option が表示される', () => {
        render(
            <FormSelect id="diveType" label="ダイブタイプ" options={diveTypeOptions} placeholder="選択してください" />,
        );

        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveTextContent('選択してください');
        expect(options[0]).toHaveValue('');
        expect(options).toHaveLength(3);
    });

    it('エラーがあると alert ロールで表示され aria 属性が紐付く', () => {
        render(
            <FormSelect
                id="diveType"
                label="ダイブタイプ"
                options={diveTypeOptions}
                error="ダイブタイプを選択してください"
            />,
        );

        const select = screen.getByLabelText('ダイブタイプ');
        expect(select).toHaveAttribute('aria-invalid', 'true');
        expect(select).toHaveAttribute('aria-describedby', 'diveType-error');

        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('id', 'diveType-error');
        expect(alert).toHaveTextContent('ダイブタイプを選択してください');
    });

    it('required の場合は aria-required と必須マークが付く', () => {
        render(<FormSelect id="diveType" label="ダイブタイプ" options={diveTypeOptions} required />);

        expect(screen.getByLabelText(/ダイブタイプ/)).toHaveAttribute('aria-required', 'true');
        expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText('必須')).toHaveClass('sr-only');
    });

    it('選択を変更すると onChange が呼ばれる', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(
            <FormSelect
                id="diveType"
                label="ダイブタイプ"
                name="diveType"
                options={diveTypeOptions}
                onChange={handleChange}
            />,
        );

        const select = screen.getByLabelText('ダイブタイプ');
        expect(select).toHaveAttribute('name', 'diveType');

        await user.selectOptions(select, 'training');
        expect(handleChange).toHaveBeenCalled();
        expect(select).toHaveValue('training');
    });
});
