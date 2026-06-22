/**
 * カンマ（, / 、）区切りのタグ入力文字列をタグ配列に変換する純粋関数。
 * 各要素を trim し、空要素を除外、重複は 1 つにまとめる。
 */
export const parseSpecialtyTags = (tagsText: string): string[] => {
    const tags = tagsText
        .split(/[,、]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

    return [...new Set(tags)];
};
