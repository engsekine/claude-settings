import { Button as UiButton, buttonVariants as uiButtonVariants } from '@repo/ui/components/button';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type ButtonVariantOptions = Parameters<typeof uiButtonVariants>[0];

/**
 * service-front 全体のボタンを bold に統一するための `buttonVariants` ラッパー。
 * shadcn / @repo/ui は直接編集せず、ここで見た目を上書きする（Link に buttonVariants を渡す用途）。
 * tailwind-merge により @repo/ui 側の font-medium は font-bold に置き換わる。
 */
export const buttonVariants = (options?: ButtonVariantOptions): string => cn(uiButtonVariants(options), 'font-bold');

/**
 * @repo/ui の Button を bold 既定でラップしたコンポーネント。
 * service-front では `@repo/ui/components/button` を直接使わず、このラッパーを使う。
 */
export const Button = ({ className, ...props }: ComponentProps<typeof UiButton>) => (
    <UiButton className={cn('font-bold', className)} {...props} />
);
