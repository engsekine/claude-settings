import { buttonVariants } from '@repo/ui/components/button';
import Link from 'next/link';

import { DeleteDiveButton } from '@/features/dives/components/client/DeleteDiveButton';
import { TANK_TYPE_LABEL_MAP, type TankTypeValue } from '@/features/dives/constants';
import type { Dive } from '@/features/dives/types';

interface DiveDetailProps {
    dive: Dive;
}

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

const formatTime = (value: string | null): string | null => {
    if (!value) return null;
    return value.slice(0, 5);
};

const formatTankType = (value: TankTypeValue | null): string | null => {
    if (!value) return null;
    return TANK_TYPE_LABEL_MAP[value];
};

const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <dl className="flex flex-col gap-0.5">
            <dt className="font-medium text-muted-foreground text-xs">{label}</dt>
            <dd className="text-sm">{value}</dd>
        </dl>
    );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-base">{title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </section>
);

export const DiveDetail = ({ dive }: DiveDetailProps) => {
    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-sm">{formatDate(dive.diveDate)}</span>
                    {dive.diveNumber !== null && (
                        <span className="text-muted-foreground text-sm">#{dive.diveNumber}</span>
                    )}
                </div>
                <h1 className="font-semibold text-2xl">{dive.location}</h1>
                {dive.certificationDive && (
                    <span className="inline-block w-fit rounded-md bg-primary/10 px-2 py-0.5 text-primary text-xs">
                        講習ダイブ
                    </span>
                )}
            </header>

            <Section title="基本情報">
                <Field label="エントリー時刻" value={formatTime(dive.entryTime)} />
                <Field label="エキジット時刻" value={formatTime(dive.exitTime)} />
                <Field label="ダイブタイプ" value={dive.diveType} />
            </Section>

            <Section title="水深・時間">
                <Field label="最大水深" value={`${dive.maxDepthM}m`} />
                <Field label="平均水深" value={dive.avgDepthM === null ? null : `${dive.avgDepthM}m`} />
                <Field label="潜水時間" value={`${dive.bottomTimeMin}分`} />
            </Section>

            <Section title="コンディション">
                <Field label="天気" value={dive.weather} />
                <Field label="気温" value={dive.airTempC === null ? null : `${dive.airTempC}℃`} />
                <Field label="水温" value={dive.waterTempC === null ? null : `${dive.waterTempC}℃`} />
                <Field label="透明度" value={dive.visibilityM === null ? null : `${dive.visibilityM}m`} />
                <Field label="波・うねり" value={dive.wave} />
                <Field label="流れ" value={dive.currentCondition} />
            </Section>

            <Section title="タンク・装備">
                <Field label="タンク種別" value={formatTankType(dive.tankType)} />
                <Field label="タンク容量" value={dive.tankVolumeL === null ? null : `${dive.tankVolumeL}L`} />
                <Field label="ガス種類" value={dive.gasType} />
                <Field label="酸素濃度" value={dive.o2Percent === null ? null : `${dive.o2Percent}%`} />
                <Field label="開始残圧" value={dive.pressureStartBar === null ? null : `${dive.pressureStartBar}bar`} />
                <Field label="終了残圧" value={dive.pressureEndBar === null ? null : `${dive.pressureEndBar}bar`} />
                <Field label="ウェイト" value={dive.weightKg === null ? null : `${dive.weightKg}kg`} />
                <Field label="スーツ" value={dive.suitType} />
            </Section>

            {dive.equipmentNotes && (
                <section className="flex flex-col gap-2">
                    <h2 className="font-semibold text-base">装備メモ</h2>
                    <p className="whitespace-pre-wrap text-sm">{dive.equipmentNotes}</p>
                </section>
            )}

            <Section title="バディ・インストラクター">
                <Field label="バディ" value={dive.buddyName} />
                <Field label="インストラクター" value={dive.instructorName} />
            </Section>

            {dive.notes && (
                <section className="flex flex-col gap-2">
                    <h2 className="font-semibold text-base">メモ・印象</h2>
                    <p className="whitespace-pre-wrap text-sm">{dive.notes}</p>
                </section>
            )}

            <div className="flex items-center justify-end gap-2 border-border border-t pt-6">
                <Link href={`/dives/${dive.id}/edit`} className={buttonVariants({ variant: 'outline' })}>
                    編集
                </Link>
                <DeleteDiveButton diveId={dive.id} />
            </div>
        </div>
    );
};
