#!/usr/bin/env bash
# Safe setup for an OpenAI-managed Codex Cloud repository workspace.
# Do not run with production credentials. New repo bootstrap creates lockfile first.
set -euo pipefail
cd "$(dirname "$0")/.."
node --version
npm --version
if [ -f package-lock.json ]; then
  npm ci
else
  echo 'No package-lock.json: bootstrap EVAL-000 in Codex first; setup installs nothing yet.'
fi
