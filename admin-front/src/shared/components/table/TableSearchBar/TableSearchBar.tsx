'use client';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

interface TableSearchBarProps {
    placeholder?: string;
}

/** 一覧のキーワード検索バー。search クエリを URL に同期し、検索時は page を 1 に戻す */
export const TableSearchBar = ({ placeholder = 'キーワード検索' }: TableSearchBarProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get('search') ?? '');

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
            params.set('search', value.trim());
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <form role="search" onSubmit={onSubmit} className="flex gap-2">
            <Input
                type="search"
                aria-label="キーワード検索"
                placeholder={placeholder}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="max-w-xs"
            />
            <Button type="submit" variant="outline">
                検索
            </Button>
        </form>
    );
};
