import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

interface FormTextareaProps extends ComponentPropsWithRef<'textarea'> {
    id: string;
    label: string;
    error?: string | undefined;
    required?: boolean;
}

export const FormTextarea = ({ id, label, error, required, className, ...textareaProps }: FormTextareaProps) => {
    const errorId = `${id}-error`;

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="font-medium text-sm">
                {label}
                {required && (
                    <>
                        <span aria-hidden="true" className="ml-1 text-red-600">
                            *
                        </span>
                        <span className="sr-only">必須</span>
                    </>
                )}
            </label>
            <textarea
                id={id}
                aria-required={required ? 'true' : undefined}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                    'min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    className,
                )}
                {...textareaProps}
            />
            {error && (
                <span id={errorId} role="alert" className="text-red-600 text-sm">
                    {error}
                </span>
            )}
        </div>
    );
};
