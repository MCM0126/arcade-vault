#!/usr/bin/env bash
# Hook PostToolUse: formatea con Prettier y lintea con ESLint --fix
# tras Write, Edit o MultiEdit. Solo procesa archivos dentro del proyecto.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Extraer file_path del payload JSON que Claude Code entrega por stdin
file=$(node -e '
  let d = "";
  process.stdin.on("data", c => d += c).on("end", () => {
    try {
      const input = JSON.parse(d);
      const fp = (input.tool_input || {}).file_path || "";
      process.stdout.write(fp);
    } catch (e) {}
  });
')

# Nada que procesar
[ -z "$file" ] && exit 0

# El archivo debe existir
[ -f "$file" ] || exit 0

# El archivo debe estar dentro del proyecto (evitar tocar rutas externas)
project_dir="$(cd "${CLAUDE_PROJECT_DIR:-.}" && pwd)"
abs_file="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
case "$abs_file" in
  "$project_dir"/*) ;;
  *) exit 0 ;;
esac

case "$file" in
  *.ts|*.tsx|*.jsx|*.js|*.cjs|*.mjs)
    npx --no-install prettier --write "$file" 2>/dev/null || true
    npx --no-install eslint --fix "$file" 2>/dev/null || true
    ;;
  *.md|*.mdx)
    npx --no-install prettier --write "$file" 2>/dev/null || true
    ;;
esac

exit 0
