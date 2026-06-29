'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@repo/ui/components/button';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { CONTACT_BODY_MAX_LENGTH, INQUIRY_CATEGORY_OPTIONS } from '@/features/contact/constants';
import { type ContactFormValues, contactSchema } from '@/features/contact/schemas/contact.schema';
import { submitInquiry } from '@/features/contact/server/actions';
import { FormField, FormSelect, FormTextarea } from '@/shared/components/form';

interface ContactFormProps {
    /** 初期値（ログイン中は氏名・メールが補完される。未ログインは空 / FR-013） */
    defaultValues: ContactFormValues;
}

const EMPTY_VALUES: ContactFormValues = { name: '', email: '', category: '', body: '', website: '' };

export const ContactForm = ({ defaultValues }: ContactFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ContactFormValues>({
        resolver: yupResolver(contactSchema),
        defaultValues,
    });

    const onSubmit = handleSubmit((values) => {
        setSuccessMessage(null);
        startTransition(async () => {
            const result = await submitInquiry(values);
            if (!result.success) {
                setError('root', { message: result.error });
                return;
            }
            setSuccessMessage('お問い合わせを受け付けました。お返事まで今しばらくお待ちください。');
            reset(EMPTY_VALUES);
        });
    });

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <FormField
                id="name"
                label="お名前"
                type="text"
                autoComplete="name"
                required
                error={errors.name?.message}
                {...register('name')}
            />

            <FormField
                id="email"
                label="メールアドレス"
                type="email"
                autoComplete="email"
                required
                error={errors.email?.message}
                {...register('email')}
            />

            <FormSelect
                id="category"
                label="お問い合わせ種別"
                options={INQUIRY_CATEGORY_OPTIONS}
                placeholder="選択してください"
                required
                error={errors.category?.message}
                {...register('category')}
            />

            <FormTextarea
                id="body"
                label="お問い合わせ内容"
                rows={8}
                maxLength={CONTACT_BODY_MAX_LENGTH}
                required
                error={errors.body?.message}
                {...register('body')}
            />

            {/* ハニーポット: 視覚・支援技術の双方から隠す。bot が入力すると送信を破棄する（R-003） */}
            <div aria-hidden="true" className="sr-only">
                <label htmlFor="contact-website">Web サイト（入力しないでください）</label>
                <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            {successMessage && (
                <p role="status" aria-live="polite" className="text-green-700 text-sm">
                    {successMessage}
                </p>
            )}

            {errors.root && (
                <p role="alert" className="text-red-600 text-sm">
                    {errors.root.message}
                </p>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending} aria-busy={isPending}>
                    {isPending ? '送信中...' : '送信する'}
                </Button>
            </div>
        </form>
    );
};
