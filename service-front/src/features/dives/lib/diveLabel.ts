import type { DiveSiteRef } from '@/features/dives/types';

interface DiveLabelInput {
    location: string | null;
    diveSite: DiveSiteRef | null;
}

/**
 * ログの表示ポイント名を解決する純粋関数。
 * サイト参照があれば「エリア / 名称」（エリア無しは名称のみ）、無ければ自由入力のポイント名。
 * どちらも無い場合は空文字（DB CHECK でこの状態は発生しない想定の防御）。
 */
export const diveLocationLabel = ({ location, diveSite }: DiveLabelInput): string => {
    if (diveSite) {
        const area = diveSite.area?.trim();
        return area ? `${area} / ${diveSite.name}` : diveSite.name;
    }
    return location ?? '';
};
