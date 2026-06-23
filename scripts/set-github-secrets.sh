#!/usr/bin/env bash
# Push the credentials from your local .env up to GitHub Actions secrets.
# Run from your own terminal (needs `gh auth login` + network). Reads .env;
# never commits any value.
#
#   bash scripts/set-github-secrets.sh
set -euo pipefail

ENV_FILE="${1:-.env}"
[ -f "$ENV_FILE" ] || { echo "No $ENV_FILE found. Copy .env.example to .env and fill it in."; exit 1; }
command -v gh >/dev/null || { echo "gh CLI not found. Install it and run 'gh auth login'."; exit 1; }

KEYS=(
  BASE_URL
  ADMIN_USERNAME ADMIN_PASSWORD ADMIN_OTP
  COMPANY_ADMIN_USERNAME COMPANY_ADMIN_PASSWORD COMPANY_ADMIN_OTP
  INDIVIDUAL_USERNAME INDIVIDUAL_PASSWORD INDIVIDUAL_OTP
)

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

for key in "${KEYS[@]}"; do
  value="${!key:-}"
  if [ -z "$value" ]; then
    echo "skip  $key (empty in $ENV_FILE)"
    continue
  fi
  printf '%s' "$value" | gh secret set "$key" --body -
  echo "set   $key"
done

echo "Done. Verify with: gh secret list"
