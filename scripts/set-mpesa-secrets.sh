#!/usr/bin/env bash
# Push M-Pesa / Daraja secrets to the Supabase edge functions.
#
# Prereqs:
#   - Supabase CLI installed + logged in (`supabase login`)
#   - Project linked: `supabase link --project-ref <your-project-ref>`
#   - supabase/.env.mpesa filled in (copy from supabase/.env.mpesa.example)
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="supabase/.env.mpesa"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy supabase/.env.mpesa.example and fill it in."
  exit 1
fi

echo "Setting Supabase function secrets from $ENV_FILE ..."
supabase secrets set --env-file "$ENV_FILE"

echo "Deploying edge functions ..."
supabase functions deploy mpesa-stk
supabase functions deploy mpesa-callback

echo "Done. Verify with: supabase secrets list"
