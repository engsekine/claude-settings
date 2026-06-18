import { buildExportFilename, contentDisposition } from './export-filename';

describe('buildExportFilename', () => {
    const date = new Date(2026, 5, 18); // 2026-06-18（ローカル）

    it('全件 CSV は dive-logs_YYYYMMDD.csv', () => {
        expect(buildExportFilename({ format: 'csv', date })).toBe('dive-logs_20260618.csv');
    });

    it('全件 PDF は dive-logs_YYYYMMDD.pdf', () => {
        expect(buildExportFilename({ format: 'pdf', date })).toBe('dive-logs_20260618.pdf');
    });

    it('単一はダイブ日 + 安全化ポイント名', () => {
        const name = buildExportFilename({
            format: 'pdf',
            date,
            single: { diveDate: '2025-07-01', label: '伊豆 / 大瀬崎' },
        });
        expect(name).toBe('dive-log_20250701_伊豆_大瀬崎.pdf');
    });

    it('単一でポイント名が空なら日付のみ', () => {
        const name = buildExportFilename({ format: 'csv', date, single: { diveDate: '2025-07-01', label: '' } });
        expect(name).toBe('dive-log_20250701.csv');
    });

    it('パス禁止文字を _ に畳む', () => {
        const name = buildExportFilename({
            format: 'csv',
            date,
            single: { diveDate: '2025-07-01', label: 'a/b:c*d' },
        });
        expect(name).toBe('dive-log_20250701_a_b_c_d.csv');
    });
});

describe('contentDisposition', () => {
    it('ASCII フォールバックと filename* を併記する', () => {
        const value = contentDisposition('dive-logs_20260618.csv');
        expect(value).toBe('attachment; filename="dive-logs_20260618.csv"; filename*=UTF-8\'\'dive-logs_20260618.csv');
    });

    it('日本語ファイル名は ASCII を _ にし filename* に UTF-8 エンコードを載せる', () => {
        const value = contentDisposition('dive-log_20250701_大瀬崎.pdf');
        expect(value).toContain('filename="dive-log_20250701____.pdf"');
        expect(value).toContain(`filename*=UTF-8''${encodeURIComponent('dive-log_20250701_大瀬崎.pdf')}`);
    });
});
