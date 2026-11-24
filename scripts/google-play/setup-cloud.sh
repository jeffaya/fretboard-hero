#!/usr/bin/env bash
# Run from an authenticated Google Cloud Shell. No private key is generated.
set -euo pipefail

repo=jeffaya/fretboard-hero
repo_id=1403065511
pool=fretboard-hero-publish
provider=github-actions
publisher=github-play-publish
if [[ -n ${1:-} ]]; then
  billing_email=$1
else
  read -rp "Adresse du compte de service des achats visible dans Play Console : " billing_email
fi
if [[ ! $billing_email =~ ^[a-z0-9-]+@([a-z][a-z0-9-]*[a-z0-9])\.iam\.gserviceaccount\.com$ ]]; then
  echo "Adresse attendue : compte@projet.iam.gserviceaccount.com" >&2
  exit 1
fi
project=${BASH_REMATCH[1]}
email="$publisher@$project.iam.gserviceaccount.com"
if [[ "$billing_email" == "$email" ]]; then
  echo "Le compte des achats et celui de publication doivent être distincts." >&2
  exit 1
fi
# Check the actual billing identity before making any changes in the project.
gc() { gcloud --project="$project" "$@"; }
gc iam service-accounts describe "$billing_email" --format='value(email)' >/dev/null
number=$(gc projects describe "$project" --format='value(projectNumber)')
[[ "$number" =~ ^[0-9]+$ ]] || { echo "Numéro du projet introuvable." >&2; exit 1; }
pool_path="projects/$number/locations/global/workloadIdentityPools/$pool"
provider_path="$pool_path/providers/$provider"
echo "Projet : $project. Compte de publication : $email."
gc services enable androidpublisher.googleapis.com iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com

accounts=$(gc iam service-accounts list --format=json)
if ! jq -e --arg email "$email" 'any(.[]; .email == $email)' <<<"$accounts" >/dev/null; then
  gc iam service-accounts create "$publisher" --display-name="Fretboard Hero - Google Play releases"
fi
pools=$(gc iam workload-identity-pools list --location=global --format=json)
if ! jq -e --arg n "$pool_path" 'any(.[]; .name == $n)' <<<"$pools" >/dev/null; then
  gc iam workload-identity-pools create "$pool" --location=global --display-name="Fretboard Hero publishing"
elif ! jq -e --arg n "$pool_path" 'any(.[]; .name == $n and .state == "ACTIVE" and (.disabled != true))' <<<"$pools" >/dev/null; then
  echo "Le pool de publication existant est inactif." >&2
  exit 1
fi
args=(--location=global --workload-identity-pool="$pool")
issuer=https://token.actions.githubusercontent.com
condition="assertion.repository_owner_id == '74216419' && assertion.repository_id == '$repo_id' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == '$repo/.github/workflows/generate-android-app.yml@refs/heads/main'"
mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.environment=assertion.environment'
providers=$(gc iam workload-identity-pools providers list "${args[@]}" --format=json)
if ! jq -e --arg n "$provider_path" 'all(.[]; .name == $n)' <<<"$providers" >/dev/null; then
  echo "Ce pool contient un autre fournisseur. Vérifier son usage avant de le réutiliser." >&2
  exit 1
fi
if [[ $(jq length <<<"$providers") == 0 ]]; then
  gc iam workload-identity-pools providers create-oidc "$provider" "${args[@]}" --issuer-uri="$issuer" --attribute-mapping="$mapping" --attribute-condition="$condition"
else
  info=$(gc iam workload-identity-pools providers describe "$provider" "${args[@]}" --format=json)
  if ! jq -e --arg issuer "$issuer" --arg condition "$condition" '
    .state == "ACTIVE" and (.disabled != true) and .oidc.issuerUri == $issuer and
    ((.oidc.allowedAudiences // []) | length == 0) and .attributeCondition == $condition and
    .attributeMapping["attribute.repository_id"] == "assertion.repository_id" and
    .attributeMapping["google.subject"] == "assertion.sub" and
    .attributeMapping["attribute.environment"] == "assertion.environment"' <<<"$info" >/dev/null; then
    echo "Le fournisseur existant diffère du workflow attendu. Vérifier sa configuration." >&2
    exit 1
  fi
fi
gc iam service-accounts add-iam-policy-binding "$email" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$pool_path/attribute.repository_id/$repo_id" --condition=None --format=none

echo "Dans Play Console, inviter $email sur Guitare, Basse et Ukulélé : lecture des informations, versions de test et versions de production."
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=$provider_path"
echo "GOOGLE_PLAY_SERVICE_ACCOUNT=$email"
if ! command -v gh >/dev/null; then
  echo "GitHub CLI est absent. Reporter les deux lignes ci-dessus dans les variables Actions du dépôt."
  exit 1
fi
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  gh auth login --hostname github.com --web --git-protocol https
fi
current=$(gh variable list --repo "$repo" --limit 1000 --json name,value)
keys=(GCP_WORKLOAD_IDENTITY_PROVIDER GOOGLE_PLAY_SERVICE_ACCOUNT)
values=("$provider_path" "$email")
for i in 0 1; do
  if ! jq -e --arg k "${keys[i]}" --arg v "${values[i]}" 'all(.[]; .name != $k or .value == $v)' <<<"$current" >/dev/null; then
    echo "La variable ${keys[i]} existe avec une autre valeur. Vérifier sa destination avant de la remplacer." >&2
    exit 1
  fi
done
for i in 0 1; do
  gh variable set "${keys[i]}" --repo "$repo" --body "${values[i]}"
  [[ $(gh variable get "${keys[i]}" --repo "$repo") == "${values[i]}" ]]
done
echo "Google Cloud et les deux variables GitHub sont configurés. Terminer l’invitation dans Play Console si nécessaire."
