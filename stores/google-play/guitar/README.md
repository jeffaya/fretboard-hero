# Guitar Fretboard Hero — fiches Google Play

Les **11 langues de l'application** disposent chacune d'un `README.md` avec les trois champs à copier-coller et d'un `alt-text.json` avec les dix descriptions des visuels. La fiche anglaise existante sert de référence.

## Langues

| Langue | Code dans l'application | Dossier Google Play | Textes alternatifs |
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

La liste de l'application provient de [web/core/i18n.js](../../../web/core/i18n.js) et de [web/locales](../../../web/locales). Les dossiers reprennent les [codes de traduction des fiches Google Play](https://support.google.com/googleplay/android-developer/answer/9844778?hl=en), vérifiés le 17 octobre 2026. Par exemple, `fr` devient `fr-FR`, `ja` devient `ja-JP` et l'indonésien reste `id`.

## Copier les textes

1. Ouvrir le README de la langue.
2. Copier les blocs du nom, de la brève description et de la description complète dans la langue correspondante de la fiche Google Play.
3. Utiliser les valeurs du JSON pour les textes alternatifs des images correspondantes, si la console les demande.

Le nom **Guitar Fretboard Hero** reste identique dans toutes les langues. Les titres des rubriques restent en français pour conserver la compatibilité avec `stores/tools/validate.cjs` ; seuls les contenus des blocs sont destinés à la fiche publique.

| Champ | Limite |
| --- | --- |
| Nom de l'application | 30 caractères |
| Brève description | 80 caractères |
| Description complète | 4 000 caractères |
| Chaque texte alternatif | 140 caractères |

Les compteurs suivent le validateur du dépôt : points de code Unicode, espaces et sauts de ligne compris. Les contenus mentionnent les fonctionnalités de la fiche anglaise, la démo, l'achat unique sans abonnement et le traitement local du son.

## Correspondance des textes alternatifs

Les identifiants du JSON sont stables dans toutes les langues :

| Identifiant | Visuel |
| --- | --- |
| `app-icon` | `icon/app-icon-512x512.png` |
| `feature-graphic` | `icon/feature-graphic-1024x500.png` |
| `01-routine` | Routine quotidienne : gamme |
| `02-triads` | Triades |
| `03-pentatonic` | Positions pentatoniques |
| `04-feedback` | Retour du microphone |
| `05-quiz` | Quiz |
| `06-tuner` | Accordeur |
| `07-map` | Carte du manche |
| `08-circle` | Cercle des quintes |

Les clés 01 à 08 correspondent aux préfixes des captures dans les différents formats d'écran. Les noms de notes sont adaptés aux conventions de l'application.

## État des images

- **en-US** : visuels existants et guide d'import ; Android XR reste un brouillon 2D.
- **Les dix autres langues** : README et textes alternatifs uniquement. Les images localisées restent à produire avec l'interface et les accroches dans la même langue.

Ne pas présenter une image anglaise comme une capture traduite. Lors de l'ajout des visuels, vérifier que chaque texte alternatif décrit toujours l'état visible, puis lancer `stores/tools/validate.cjs` sur le dossier complet. Le rapport généré `validation.json` ne certifie pas des images absentes.

Les dimensions et les consignes communes restent dans le [README Google Play](../README.md).
