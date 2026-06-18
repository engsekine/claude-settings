import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';

import { TANK_TYPE_LABEL_MAP } from '@/features/dives/constants';
import type { Dive } from '@/features/dives/types';

import type { DivePdfEntry } from './build-pdf-data';
import { PDF_FONT_FAMILY, registerPdfFonts } from './registerFont';

const styles = StyleSheet.create({
    page: { padding: 28, fontFamily: PDF_FONT_FAMILY, fontSize: 9, color: '#1f2937' },
    title: { fontSize: 14, marginBottom: 12 },
    empty: { fontSize: 11, color: '#6b7280', marginTop: 24, textAlign: 'center' },
    logBox: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4, padding: 10, marginBottom: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    diveNo: { fontSize: 10, color: '#6b7280' },
    location: { fontSize: 11 },
    fieldGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    field: { width: '33.33%', marginBottom: 4, paddingRight: 6 },
    label: { fontSize: 7, color: '#6b7280' },
    value: { fontSize: 9 },
    notes: { marginTop: 4 },
    thumbs: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    thumb: { width: 90, height: 68, marginRight: 6, marginTop: 6, objectFit: 'cover', borderRadius: 2 },
});

/** 値を表示文字列にする（空・null は空文字、数値には単位を付与） */
const display = (value: string | number | null | undefined, suffix = ''): string =>
    value === null || value === undefined || value === '' ? '' : `${value}${suffix}`;

/** ログ欄に並べるラベル付き項目（紙ログの主要項目） */
const fieldRows = (dive: Dive): [string, string][] => {
    const pressure =
        dive.pressureStartBar != null || dive.pressureEndBar != null
            ? `${display(dive.pressureStartBar)}→${display(dive.pressureEndBar)} bar`
            : '';
    return [
        ['日付', dive.diveDate],
        ['ダイブタイプ', display(dive.diveType)],
        ['潜水時間', display(dive.bottomTimeMin, ' 分')],
        ['最大水深', display(dive.maxDepthM, ' m')],
        ['平均水深', display(dive.avgDepthM, ' m')],
        ['水温', display(dive.waterTempC, ' ℃')],
        ['透明度', display(dive.visibilityM, ' m')],
        ['天気', display(dive.weather)],
        ['タンク', dive.tankType ? TANK_TYPE_LABEL_MAP[dive.tankType] : ''],
        ['ガス', display(dive.gasType)],
        ['残圧', pressure],
        ['ウェイト', display(dive.weightKg, ' kg')],
        ['バディ', display(dive.buddyName)],
        ['インストラクター', display(dive.instructorName)],
    ];
};

const DiveEntry = ({ entry }: { entry: DivePdfEntry }) => (
    <View style={styles.logBox} wrap={false}>
        <View style={styles.header}>
            <Text style={styles.diveNo}>{entry.dive.diveNumber != null ? `No. ${entry.dive.diveNumber}` : ''}</Text>
            <Text style={styles.location}>{entry.locationLabel}</Text>
        </View>

        <View style={styles.fieldGrid}>
            {fieldRows(entry.dive).map(([label, value]) => (
                <View key={label} style={styles.field}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value}>{value}</Text>
                </View>
            ))}
        </View>

        {entry.dive.notes ? (
            <View style={styles.notes}>
                <Text style={styles.label}>メモ</Text>
                <Text style={styles.value}>{entry.dive.notes}</Text>
            </View>
        ) : null}

        {entry.thumbnails.length > 0 ? (
            <View style={styles.thumbs}>
                {entry.thumbnails.map((bytes, index) => (
                    // サムネイルは位置のみで識別される（安定 ID を持たない）ため index キーを許容する
                    // biome-ignore lint/suspicious/noArrayIndexKey: 並び替え・増減しない静的な PDF 描画
                    <Image
                        key={`${entry.dive.id}-thumb-${index}`}
                        style={styles.thumb}
                        src={{ data: Buffer.from(bytes), format: 'png' }}
                    />
                ))}
            </View>
        ) : null}
    </View>
);

/** ダイブログを紙ログ体裁で並べた PDF ドキュメント（0 件は案内ページ） */
export const DiveLogPdf = ({ entries }: { entries: DivePdfEntry[] }) => (
    <Document title="ダイビングログ">
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>ダイビングログ（{entries.length} 本）</Text>
            {entries.length === 0 ? (
                <Text style={styles.empty}>対象ログがありません</Text>
            ) : (
                entries.map((entry) => <DiveEntry key={entry.dive.id} entry={entry} />)
            )}
        </Page>
    </Document>
);

/** フォント登録のうえ PDF を Buffer にレンダリングする（Route Handler から呼ぶ） */
export const renderDiveLogPdf = async (entries: DivePdfEntry[]): Promise<Buffer> => {
    registerPdfFonts();
    return renderToBuffer(<DiveLogPdf entries={entries} />);
};
