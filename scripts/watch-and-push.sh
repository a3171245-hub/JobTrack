#!/usr/bin/env bash
#
# watch-and-push.sh
# ファイル変更を検知して自動で git add / commit / push するスクリプト。
#
# 使い方:
#   npm run watch:push
#   （または）bash scripts/watch-and-push.sh
#
# 必要ツール（どちらか一方）:
#   - fswatch        : brew install fswatch
#   - chokidar-cli   : npm i -D chokidar-cli
#
# 連続保存でpushが暴発しないよう、変更検知後 DEBOUNCE 秒だけ待ってから
# まとめて1回pushします。
#
set -euo pipefail

# リポジトリルートへ移動（このスクリプトは scripts/ 配下にある前提）
cd "$(dirname "$0")/.."

BRANCH="${PUSH_BRANCH:-main}"
DEBOUNCE="${PUSH_DEBOUNCE:-3}"   # 変更が落ち着くまで待つ秒数

# 監視対象から外すパス（正規表現）
EXCLUDE_REGEX='(/\.git/|/node_modules/|/\.next/|/out/|/build/|\.tsbuildinfo$|/\.DS_Store$)'

log() { printf '\033[36m[watch-and-push]\033[0m %s\n' "$*"; }

# 実際に push する処理（変更が無ければ何もしない）
do_push() {
  # ステージング前に差分有無を確認（未追跡ファイルも含む）
  if [ -z "$(git status --porcelain)" ]; then
    return 0
  fi
  log "変更を検知 → コミット & push (origin/$BRANCH)"
  git add -A
  # .env など gitignore 済みは add されない。差分が空になる場合もあるのでガード
  if git diff --cached --quiet; then
    log "コミット対象がありません（gitignore済みの変更のみ）"
    return 0
  fi
  git commit -m "auto update" --quiet
  if git push origin "$BRANCH"; then
    log "push 完了 ✅"
  else
    log "push 失敗 ⚠️  （ネットワーク/コンフリクトを確認してください）"
  fi
}

# デバウンス付きで do_push を呼ぶ
schedule_push() {
  sleep "$DEBOUNCE"
  do_push
}

# chokidar-cli から1回だけ呼ばれるモード（デバウンスは chokidar 側が担当）
if [ "${1:-}" = "--once" ]; then
  do_push
  exit 0
fi

log "ブランチ: $BRANCH / デバウンス: ${DEBOUNCE}s"
log "監視を開始します（Ctrl+C で停止）"

# ── 監視ループ ───────────────────────────────────────────────
if command -v fswatch >/dev/null 2>&1; then
  log "fswatch を使用します"
  # -o: 変更をまとめて1イベントとして出力 / -l: レイテンシ
  fswatch -o -l 1 -e "$EXCLUDE_REGEX" . | while read -r _; do
    schedule_push
  done

elif npx --no-install chokidar --help >/dev/null 2>&1; then
  log "chokidar-cli を使用します"
  npx chokidar "**/*" \
    --ignore "**/node_modules/**" \
    --ignore "**/.git/**" \
    --ignore "**/.next/**" \
    --ignore "**/out/**" \
    --ignore "**/build/**" \
    --ignore "**/*.tsbuildinfo" \
    --debounce "$((DEBOUNCE * 1000))" \
    --command "bash scripts/watch-and-push.sh --once"

else
  cat >&2 <<'EOF'

[watch-and-push] 監視ツールが見つかりません。
  次のいずれかをインストールしてください:
    brew install fswatch
    npm i -D chokidar-cli

EOF
  exit 1
fi
