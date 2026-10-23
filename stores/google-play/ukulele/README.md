# Ukulele Fretboard Hero — fiches Google Play

Les **11 langues de l’application** disposent chacune d’un `README.md` avec les trois champs à copier-coller et d’un `alt-text.json` avec dix propositions de textes alternatifs. Les descriptions sont adaptées à l’édition ukulélé ; la [fiche anglaise](en-US/README.md) sert de référence.

## Informations de l’application

| Champ | Valeur |
| --- | --- |
| Nom public | Ukulele Fretboard Hero |
| Identifiant Android | `com.ukulele.fretboardhero` |
| Profil de l’instrument | `ukulele` |
| Site | https://fretboard-hero.com/?instrument=ukulele |
| Politique de confidentialité | https://fretboard-hero.com/privacy |
| Assistance | hello@fretboard-hero.com |
| Achat intégré permanent | `lifetime_access` — achat unique, sans abonnement |

Ukulélé à quatre cordes, accordage Sol–Do–Mi–La (G–C–E–A) avec Sol aigu. Pentatoniques, triades, arpèges et formes d’accords C, A, G et F. Ne pas annoncer un accordage Sol grave ou baryton.

Les modes et positions d’Apprendre avec la fondamentale La, le Cycle des quintes et la Routine quotidienne en La mineur sont accessibles gratuitement. L’achat intégré débloque toutes les tonalités et notes à vie dans cette application. L’accès acheté n’est pas partagé automatiquement entre les applications Android distinctes.

Ces informations suivent [les variantes Android](../../../app/instruments.json), [le profil de l’instrument](../../../web/instruments/ukulele.js), [les règles d’accès](../../../web/core/access.js) et [la politique de confidentialité](../../../web/privacy.html).

## Langues

| Langue | Code dans l’application | Dossier Google Play | Textes alternatifs |
| --- | --- | --- | --- |
| English (United States) | `en` | [en-US/README.md](en-US/README.md) | [alt-text.json](en-US/alt-text.json) |
| Español | `es` | [es-ES/README.md](es-ES/README.md) | [alt-text.json](es-ES/alt-text.json) |
| Français | `fr` | [fr-FR/README.md](fr-FR/README.md) | [alt-text.json](fr-FR/alt-text.json) |
| Deutsch | `de` | [de-DE/README.md](de-DE/README.md) | [alt-text.json](de-DE/alt-text.json) |
| Italiano | `it` | [it-IT/README.md](it-IT/README.md) | [alt-text.json](it-IT/alt-text.json) |
| 日本語 | `ja` | [ja-JP/README.md](ja-JP/README.md) | [alt-text.json](ja-JP/alt-text.json) |
| 한국어 | `ko` | [ko-KR/README.md](ko-KR/README.md) | [alt-text.json](ko-KR/alt-text.json) |
| 简体中文 | `zh-CN` | [zh-CN/README.md](zh-CN/README.md) | [alt-text.json](zh-CN/alt-text.json) |
| Português (Brasil) | `pt-BR` | [pt-BR/README.md](pt-BR/README.md) | [alt-text.json](pt-BR/alt-text.json) |
| हिन्दी | `hi` | [hi-IN/README.md](hi-IN/README.md) | [alt-text.json](hi-IN/alt-text.json) |
| Bahasa Indonesia | `id` | [id/README.md](id/README.md) | [alt-text.json](id/alt-text.json) |

Les dossiers reprennent les codes déjà utilisés par la [fiche guitare](../guitar/README.md) et couvrent les 11 langues de [l’application](../../../web/core/i18n.js).

## Copier les textes

1. Ouvrir le README de la langue et copier les trois blocs dans les champs correspondants de Google Play Console.
2. Conserver le nom **Ukulele Fretboard Hero** dans toutes les langues.
3. Après préparation des images, vérifier les textes alternatifs face aux visuels avant de les renseigner si la console les demande.

| Champ | Limite du dépôt |
| --- | --- |
| Nom de l’application | 30 caractères |
| Brève description | 80 caractères |
| Description complète | 4 000 caractères |
| Chaque texte alternatif | 140 caractères |

Les compteurs des README suivent le validateur : points de code Unicode, espaces et sauts de ligne compris. Les titres des rubriques restent en français pour être reconnus par `stores/tools/validate.cjs` ; seuls les contenus des blocs sont destinés à la fiche publique.

## Correspondance des textes alternatifs

| Identifiant | Visuel prévu |
| --- | --- |
| `app-icon` | Icône de l’application |
| `feature-graphic` | Image de présentation |
| `01-routine` | Routine quotidienne : gamme |
| `02-triads` | Triades |
| `03-pentatonic` | Positions pentatoniques |
| `04-feedback` | Retour du microphone |
| `05-quiz` | Quiz |
| `06-tuner` | Accordeur |
| `07-map` | Carte du manche |
| `08-circle` | Cycle des quintes |

Les clés sont stables dans toutes les langues. Les descriptions restent générales tant que les captures ne sont pas produites ; elles ne certifient pas un état d’écran qui n’existe pas encore.

## État des visuels

La [série anglaise](en-US/README.md) contient désormais les huit visuels téléphone, les captures tablette 7 pouces, tablette 10 pouces et ordinateur, l’icône et l’image de présentation. Les captures utilisent le profil de cet instrument, en anglais et avec quatre cordes. Les fichiers `android-xr/` restent des brouillons 2D, sans validation dans un environnement XR.

Les dix autres langues contiennent uniquement les textes ; leurs visuels restent à produire. Le rapport `en-US/validation.json` mesure les fichiers anglais livrés et `en-US/overview-phone.png` permet de relire les huit visuels téléphone ensemble.

Voir [le guide Google Play commun](../README.md). Les images de présentation partagées se régénèrent avec `node stores/tools/export-og.cjs`.
