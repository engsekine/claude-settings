'use client';

import { Button } from '@repo/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/ui/components/dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 取り消し不能・破壊的操作なら true（ボタンを destructive 表示に） */
    destructive?: boolean;
    isPending?: boolean;
    onConfirm: () => void;
}

/**
 * 破壊的操作の確認ダイアログ（SC-006 / FR-013）。
 * base-ui Dialog により role="dialog"・フォーカストラップ・Esc クローズを満たす（T019 / Constitution V）。
 */
export const ConfirmDialog = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'OK',
    cancelLabel = 'キャンセル',
    destructive = false,
    isPending = false,
    onConfirm,
}: ConfirmDialogProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                    {cancelLabel}
                </Button>
                <Button
                    variant={destructive ? 'destructive' : 'default'}
                    onClick={onConfirm}
                    disabled={isPending}
                    aria-busy={isPending}
                >
                    {isPending ? '処理中...' : confirmLabel}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
