import { ValidationError } from 'yup';

import { OptimisticLockError, ReferencedError } from './mutations';

/** yup の検証エラーから最初のメッセージを取り出す */
export const firstValidationError = (error: unknown): string => {
    if (error instanceof ValidationError) return error.errors[0] ?? '入力内容を確認してください';
    return '入力内容を確認してください';
};

/** mutation のエラーをユーザー向けメッセージに変換する */
export const mapMutationError = (error: unknown): string => {
    if (error instanceof OptimisticLockError) return '他の管理者が更新しました。再読み込みしてください';
    if (error instanceof ReferencedError) return `他の ${error.count} 件のデータから参照されているため削除できません`;

    const code = (error as { code?: string } | null)?.code;
    if (code === '23505') return '同じ値が既に登録されています';
    if (code === '23503') return '他のデータから参照されているため削除できません';
    return '処理に失敗しました。時間をおいて再度お試しください';
};
