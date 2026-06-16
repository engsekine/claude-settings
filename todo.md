test@example.com
password123

対応中
--------------
  4. ダイブサイト（ポイント）マスタ — 今は locationが自由入力なので「大瀬崎」「伊豆 /大瀬崎」が別物になります。マスタ化すると「このポイントで何本・平均透明度・ベストシーズン」が出せて、ログの蓄積価値が大きく上がります。todoの管理画面のマスタ管理対象としても自然で、rules/sql.mdの dive_sites 設計例とも一致します
--------------

広告を見るとダイビングログを追加できる機能

デイリーボーナス

広告なし、ログ無制限のサブスク

管理画面を追加したい

  中規模 — 新テーブル / Storage が必要
  5. 写真添付 — Supabase Storage + RLS。ログアプリの体感価値を最も上げる定番機能で、既存の公開ページ（publicSlug）との相乗効果もあります
  6. 検索・フィルタ強化 —　期間・深度範囲・ダイブタイプ。現状は番号 / 日付 /　場所のみです

  大きめ — 差別化要素

  7. ログのエクスポート（PDF / CSV） —
  紙ログ提出・バックアップ用途。todo
  のサブスク特典との相性も良いです
  8. 管理画面搭載
  9. モバイルアプリ化
  ボート上は圏外が普通なので、オフライン記録 →
  同期は実用性が高いです（複雑度も高め）



    完了後の片付けフロー

  # 1. worktree
  側の作業をコミット済みにしておく
  git -C .claude/worktrees/007-blank-days add -A
  git -C .claude/worktrees/007-blank-days
  commit -m "feat: ブランク日数の表示"
  ※worktreeは同じブランチ上に別コミットを作るものであり、ブランチには表示されない`git log`でコミットが確認できる

  # 2. develop
  に取り込む（メインリポジトリ側で実行）
  git merge feature/008-blank-days
  #    ※ PR 運用なら merge の代わりに push
  して GitHub で PR を作成

  # 3. worktree を外す
  git worktree remove
  .claude/worktrees/007-blank-days

  # 4. 役目を終えたブランチを削除
  git branch -d feature/008-blank-days

  googleカレンダー連携とかも/speckit-plan