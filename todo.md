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
# 0. メインリポジトリ（develop）で worktree
  とブランチを同時作成
  git worktree add .claude/worktrees/013-google-calendar -b worktree-013-google-calendar

  # 1. worktree 側で作業 →
  コミット（worktree-013…ブランチ上のコミットになる）
  git -C .claude/worktrees/013-google-calendar
  add -A
  git -C .claude/worktrees/013-google-calendar
  commit -m "feat: Googleカレンダー連携"

  # 2. develop に取り込む（メインリポジトリ側
  = develop に居る状態で実行）
  git merge worktree-013-google-calendar
  #   PR 運用なら → git push -u origin
  worktree-013-google-calendar して GitHub で
  PR

  # 3. worktree を外す（未コミット変更が残ると
  失敗。その場合のみ --force）
  git worktree remove
  .claude/worktrees/013-google-calendar

  # 4. マージ済みブランチを削除（-d
  はマージ済みのみ消せる安全版）