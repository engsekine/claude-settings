import type { DiveFormValues } from '@/features/dives/schemas/dive.schema';
import type { Dive } from '@/features/dives/types';

/**
 * Dive を編集フォームの初期値に変換する。
 * フォームで扱わないメタ情報（id / userId / isPublic / タイムスタンプ等）は含めない。
 */
export const mapDiveToFormValues = (dive: Dive): Partial<DiveFormValues> => ({
    diveNumber: dive.diveNumber,
    diveDate: dive.diveDate,
    entryTime: dive.entryTime,
    exitTime: dive.exitTime,
    location: dive.location,
    diveSiteId: dive.diveSiteId,
    diveType: dive.diveType,
    weather: dive.weather,
    airTempC: dive.airTempC,
    waterTempC: dive.waterTempC,
    visibilityM: dive.visibilityM,
    wave: dive.wave,
    currentCondition: dive.currentCondition,
    maxDepthM: dive.maxDepthM,
    avgDepthM: dive.avgDepthM,
    bottomTimeMin: dive.bottomTimeMin,
    tankType: dive.tankType,
    tankVolumeL: dive.tankVolumeL,
    gasType: dive.gasType,
    o2Percent: dive.o2Percent,
    pressureStartBar: dive.pressureStartBar,
    pressureEndBar: dive.pressureEndBar,
    weightKg: dive.weightKg,
    suitType: dive.suitType,
    equipmentNotes: dive.equipmentNotes,
    buddyName: dive.buddyName,
    instructorName: dive.instructorName,
    certificationDive: dive.certificationDive,
    notes: dive.notes,
});
