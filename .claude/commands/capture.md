現在開いているページを 1920px・1100px・375px の3幅でスクリーンショットを撮影し、保存します。

## 保存先

`screenshots/YYYYMMDD/<N>/` フォルダ配下に保存する。N は実行のたびに 1 からインクリメントする。

## 手順

1. 保存先フォルダを決定・作成する
   ```bash
   DATE=$(date +%Y%m%d)
   NEXT=$(ls screenshots/$DATE/ 2>/dev/null | grep -E '^[0-9]+$' | sort -n | tail -1)
   NEXT=$((${NEXT:-0} + 1))
   mkdir -p screenshots/$DATE/$NEXT
   ```
2. 以下の順で `browser_resize` → `browser_navigate`（同じURL）→ `browser_take_screenshot` を繰り返す
   - 1920px × 900px → `screenshots/YYYYMMDD/N/<ドメイン名>-1920.png`
   - 1100px × 900px → `screenshots/YYYYMMDD/N/<ドメイン名>-1100.png`
   - 375px  × 900px → `screenshots/YYYYMMDD/N/<ドメイン名>-375.png`
3. 保存した3ファイルのパスを報告する
