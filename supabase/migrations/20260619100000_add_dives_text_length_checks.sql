-- ========================================
-- dives 自由入力テキストカラムに長さ CHECK 制約を追加
-- アプリ層（yup の .max）と同値を DB 側にも二重で表現し、
-- 1 行に巨大なテキストが保存されるのを防ぐ。
-- 上限値は src/features/dives/schemas/dive.schema.ts と一致させる。
-- ========================================

alter table public.dives
    add constraint dives_location_len_check
        check (location is null or char_length(location) <= 120),
    add constraint dives_dive_type_len_check
        check (dive_type is null or char_length(dive_type) <= 40),
    add constraint dives_weather_len_check
        check (weather is null or char_length(weather) <= 60),
    add constraint dives_wave_len_check
        check (wave is null or char_length(wave) <= 60),
    add constraint dives_current_condition_len_check
        check (current_condition is null or char_length(current_condition) <= 60),
    add constraint dives_gas_type_len_check
        check (gas_type is null or char_length(gas_type) <= 40),
    add constraint dives_suit_type_len_check
        check (suit_type is null or char_length(suit_type) <= 40),
    add constraint dives_equipment_notes_len_check
        check (equipment_notes is null or char_length(equipment_notes) <= 1000),
    add constraint dives_buddy_name_len_check
        check (buddy_name is null or char_length(buddy_name) <= 100),
    add constraint dives_instructor_name_len_check
        check (instructor_name is null or char_length(instructor_name) <= 100),
    add constraint dives_notes_len_check
        check (notes is null or char_length(notes) <= 2000);
