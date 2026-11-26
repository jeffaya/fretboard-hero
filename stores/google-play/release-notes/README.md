# Publier une mise à jour Android

Dans **Actions → Generate Android App → Run workflow**, la sélection initiale est `all` et `production`. Lancer sur `main` construit puis soumet les trois applications. Choisir `build-only` pour télécharger uniquement les fichiers.

Laisser les deux champs de version vides pour utiliser le plus grand code des builds Android terminés sur `main`, plus un, y compris si une publication ultérieure a échoué. Le nom public sépare les deux derniers chiffres en version mineure et correctif, avec une version majeure implicite de 1 pour les codes sous 100. Exemples : 10 → 1.1.0, 11 → 1.1.1, 20 → 1.2.0, 131 → 1.3.1. Les champs restent modifiables, notamment pour promouvoir le même build signé ou après un envoi manuel avec un code supérieur. Le nom du job **Build**, l’artefact et le résumé donnent les valeurs calculées.

| Destination | Résultat |
| --- | --- |
| `build-only` | Génère les AAB signés et les fichiers de mapping téléchargeables. |
| `internal` | Envoie chaque AAB et ses notes sur la piste de test interne. |
| `production` (par défaut) | Soumet chaque mise à jour pour examen en vue d’un déploiement à 100 %. En publication standard, Google publie après approbation. En publication gérée, terminer dans la Play Console. |

## Préparer les notes

Chaque instrument reçoit un artefact `play-notes-…` avec le JSON des 14 langues. Le job de publication lit exactement ce fichier. Le résumé de l’exécution affiche le texte français.

Un fichier relu nommé `<version_name>.json` dans ce dossier est prioritaire. Les notes de [1.1.1](1.1.1.json) décrivent le changement de routine et les leçons intégrées, avec une précision sur les arpèges pour la basse. Le bloc `common` fournit le texte partagé. Un objet `guitar`, `bass-4` ou `ukulele` permet de remplacer certaines traductions.

Pour une version sans fichier, le build identifie le dernier code effectivement publié en production pour chaque application et retrouve son commit dans l’historique des builds. Les notes listent dans la langue du lecteur les parties de l’application modifiées depuis ce commit. Si aucune fonctionnalité reconnue n’a changé, elles annoncent simplement la version. Sur une branche de prévisualisation ou en build seul sans accès Play, le point de comparaison est le dernier build de l’instrument sur `main`. Si une publication Play ne correspond à aucun commit identifiable, fournir une note relue pour cette version. Les 14 traductions doivent comporter de 1 à 500 caractères chacune.

## Configuration groupée avec Cloud Shell

Ouvrir un terminal [Google Cloud Shell](https://shell.cloud.google.com/) dans le compte administrateur du projet des achats. Depuis le dépôt contenant [le script de configuration](../../../scripts/google-play/setup-cloud.sh), lancer :

```sh
bash scripts/google-play/setup-cloud.sh
```

Coller l’adresse du compte de service des achats quand le script la demande. Il en déduit le projet, vérifie que le compte existe et crée un compte de publication distinct. Il configure les API et la fédération GitHub, puis ajoute les secrets Actions manquants au dépôt. Les secrets déjà saisis sont conservés. GitHub CLI peut demander une connexion. Si la CLI est absente, le script affiche les deux valeurs à reporter. Le script peut être relancé après une interruption.

Dans **Play Console → Utilisateurs et autorisations**, inviter en une seule fois le compte de publication affiché à la fin. Sélectionner les trois applications et leurs droits de lecture, de test et de production (étape 2 ci-dessous).

## Configurer Google Cloud et GitHub une fois

1. Dans le projet Google Cloud de ton choix, activer **Google Play Android Developer API**, **IAM Service Account Credentials API**, **Security Token Service API** et **Identity and Access Management API**. Créer un compte de service de publication, commun aux trois applications ou distinct par instrument.
2. Dans **Play Console → Utilisateurs et autorisations**, inviter l’adresse du compte de service. Dans les autorisations par application, sélectionner les applications correspondantes, autoriser l’affichage des informations sur l’application et accorder les droits de déploiement sur les canaux de test et en production.
3. Dans **Google Cloud → IAM et administration → Fédération d’identité de charge de travail**, créer un pool dédié à ce dépôt et un fournisseur OIDC GitHub avec l’émetteur `https://token.actions.githubusercontent.com` et l’audience par défaut. Renseigner les mappages et la condition ci-dessous. Le dépôt GitHub est public, donc l’émetteur seul ne suffit pas à identifier ce workflow.

   | Attribut Google | Expression GitHub |
   | --- | --- |
   | `google.subject` | `assertion.sub` |
   | `attribute.repository_id` | `assertion.repository_id` |
   | `attribute.environment` | `assertion.environment` |

   Condition du fournisseur pour ce dépôt et son workflow sur `main` (les identifiants numériques appartiennent à `jeffaya/fretboard-hero`) :

   ```text
   assertion.repository_owner_id == '74216419' && assertion.repository_id == '1403065511' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'jeffaya/fretboard-hero/.github/workflows/generate-android-app.yml@refs/heads/main'
   ```

4. Accorder le rôle **Utilisateur de Workload Identity** (`roles/iam.workloadIdentityUser`) **sur le compte de service** à l’identité du pool. Pour un compte commun, le membre est `principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/attribute.repository_id/1403065511`. Pour un compte par application, remplacer la fin `attribute.repository_id/1403065511` par `attribute.environment/google-play-guitar`, `attribute.environment/google-play-bass` ou `attribute.environment/google-play-ukulele` sur le compte correspondant. Utiliser le numéro numérique du projet qui héberge le pool.
5. Dans GitHub, renseigner les deux **secrets Actions** suivants. Le job de publication les utilise pour obtenir un jeton temporaire auprès de Google.

   | Secret | Valeur | Emplacement |
   | --- | --- | --- |
   | `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID` | Settings → Secrets and variables → Actions → Secrets → Repository secrets |
   | `GOOGLE_PLAY_SERVICE_ACCOUNT` | Adresse en `@PROJECT_ID.iam.gserviceaccount.com` | Au même endroit pour un compte commun, ou sous Settings → Environments → environnement de l’instrument → Environment secrets pour des comptes distincts |

   | Instrument dans Actions | Environnement GitHub | Application Google Play |
   | --- | --- | --- |
   | `guitar` | `google-play-guitar` | `com.guitar.fretboardhero` |
   | `bass-4` | `google-play-bass` | `com.bass.fretboardhero` |
   | `ukulele` | `google-play-ukulele` | `com.ukulele.fretboardhero` |

[Configurer OIDC pour GitHub Actions](https://github.com/google-github-actions/auth#setup) · [Autorisations de la Play Console](https://support.google.com/googleplay/android-developer/answer/9844686?hl=fr)

## Vérifier ou reprendre un envoi

Chaque instrument a un résultat indépendant dans le résumé GitHub, avec le package, la piste, le code et l’état observé à la fin du job. La décision de Google peut arriver après cette exécution. L’état à jour se trouve dans **Play Console → Vue d’ensemble de la publication**.

Pour reprendre un envoi interrompu, relancer le job en échec. Pour promouvoir du test interne vers la production, sélectionner la même version et le même code sur le même commit. Le workflow réutilise alors le bundle déjà envoyé à Google. Si les sources ont changé, choisir un nouveau code et vérifier les notes de cette version. Une version déjà présente sur la piste est vérifiée sans nouvel envoi. Un examen en cours pour une autre mise à jour est conservé. Si Google exige une soumission manuelle après un refus, le résumé invite à choisir **Envoyer pour examen** dans la console.
