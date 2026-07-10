-- 伊豆・千葉でのダイビング経験とボートダイビング経験の項目を廃止（clarify 2026-07-11）。
-- フォーム・出力テキストからも削除するため、未リリースのシートテーブルからカラムごと落とす
alter table public.application_sheets drop column has_izu_chiba_experience;
alter table public.application_sheets drop column has_boat_experience;
