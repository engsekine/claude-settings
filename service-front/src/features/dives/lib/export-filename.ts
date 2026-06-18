// エクスポートファイル名と Content-Disposition の生成（純粋関数）。
import type { ExportFormat } from '@/features/dives/lib/export-params';

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Date → YYYYMMDD（呼び出し側で Date を渡すためテスト可能） */
const dateStamp = (date: Date): string => `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;

/** ファイル名セグメントを安全化する（パス禁止文字・空白を _ に、連続 _ を 1 つに） */
const sanitizeSegment = (label: string): string =>
    label
        .replace(/[\\/:*?"<>|\s]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

export interface ExportFilenameInput {
    format: ExportFormat;
    /** 出力日（全件・絞り込み時のスタンプ用） */
    date: Date;
    /** 単一ログ出力時のみ指定（ファイル名にダイブ日とポイント名を含める） */
    single?: { diveDate: string; label: string } | undefined;
}

/**
 * - 全件 / 絞り込み: `dive-logs_YYYYMMDD.<ext>`
 * - 単一: `dive-log_<YYYYMMDD>_<安全化ポイント名>.<ext>`（名前が空なら日付のみ）
 */
export const buildExportFilename = ({ format, date, single }: ExportFilenameInput): string => {
    if (single) {
        const datePart = single.diveDate.replace(/-/g, '');
        const labelPart = sanitizeSegment(single.label);
        const base = labelPart ? `dive-log_${datePart}_${labelPart}` : `dive-log_${datePart}`;
        return `${base}.${format}`;
    }
    return `dive-logs_${dateStamp(date)}.${format}`;
};

/**
 * Content-Disposition 値を組み立てる。
 * ASCII フォールバック（非 ASCII は _）と RFC 5987 の `filename*`（UTF-8）を併記し、
 * 日本語ファイル名でも各ブラウザで文字化けせず保存できるようにする。
 */
export const contentDisposition = (filename: string): string => {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: ASCII 範囲外（制御文字含む）を _ に置換する意図
    const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
    const encoded = encodeURIComponent(filename);
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
};
