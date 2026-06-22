/** siteLabel が受け取る最小の構造（feature 間 import を避けるため構造的型で受ける） */
interface SiteLabelInput {
    name: string;
    area: string | null;
}

/**
 * ダイブサイトの表示ラベルを組み立てる純粋関数。
 * エリアがあれば「エリア / 名称」（例: 伊豆 / 大瀬崎）、無ければ名称のみ。
 */
export const siteLabel = ({ name, area }: SiteLabelInput): string => {
    const trimmedName = name.trim();
    const trimmedArea = area?.trim();
    if (!trimmedArea) return trimmedName;
    return `${trimmedArea} / ${trimmedName}`;
};
