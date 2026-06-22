import path from 'node:path';

import { Font } from '@react-pdf/renderer';

/** PDF で使う日本語フォントのファミリ名 */
export const PDF_FONT_FAMILY = 'NotoSansJP';

let registered = false;

/**
 * PDF 用の日本語フォントを登録する（初回のみ）。
 * 未登録だと標準フォントには日本語グリフが無く文字化けするため、PDF 生成前に必ず呼ぶ。
 */
export const registerPdfFonts = (): void => {
    if (registered) return;

    Font.register({
        family: PDF_FONT_FAMILY,
        src: path.join(process.cwd(), 'src/features/dives/pdf/fonts/NotoSansJP-Regular.otf'),
    });

    // CJK を含む語は任意の文字位置で折り返せるよう 1 文字ずつに分割する。
    // 英数字のみの語はハイフン分割せずそのまま返す（途中で割れないように）。
    Font.registerHyphenationCallback((word) => (/[　-鿿＀-￯]/.test(word) ? Array.from(word) : [word]));

    registered = true;
};
