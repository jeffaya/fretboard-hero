# Guitar Fretboard Hero — Google Play — en-US

Premier jet : **guitare, anglais (États-Unis)**. Les dossiers basse et ukulélé sont réservés pour la suite. Les textes ci-dessous sont aussi disponibles en `.txt` pour les copier sans mise en forme.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 78 / 80 caractères

```text
Learn guitar notes, scales and chords with daily practice, quizzes and a tuner
```

### Description complète — 2154 / 4 000 caractères

```text
Make the guitar neck feel familiar. Guitar Fretboard Hero brings guided practice, visual learning tools, a fretboard quiz and a tuner together in one app.

BUILD A DAILY PRACTICE HABIT
Follow five exercises in one key: find root notes, play a scale, connect triads, practice rhythm and explore pentatonic patterns. Clear tablature, note names and degree labels help you understand what you are playing. Move through the steps at your own pace and repeat your routine.

CONNECT THE FRETBOARD
Explore the five pentatonic positions, major and minor triads, inversions and CAGED chord shapes. Highlight individual degrees, isolate a position or see how shapes connect across the six-string guitar neck.

PLAY WITH MICROPHONE FEEDBACK
Enable the microphone in Daily Routine to follow the highlighted notes and receive feedback as you play. Use guided note and triad exercises, or work on your strumming with rhythm patterns and an adjustable tempo. You can also practice with the microphone turned off.

TEST YOUR KNOWLEDGE
Challenge yourself in a 60-second fretboard quiz. Find roots, thirds and fifths, build an accuracy streak and explore more of the neck as you progress.

FIND EVERY NOTE
Use the Fretboard Map to reveal the notes across the neck or focus on one note at a time. Switch between learning tools to connect note names, intervals and shapes.

MAKE HARMONY MAKE SENSE
Explore the interactive Circle of Fifths, relative minor keys, diatonic chords and common progressions. See how keys and chords relate to each other.

TUNE BEFORE YOU PLAY
Use the built-in guitar tuner with automatic string detection or choose a string manually. The tuning display helps you see whether the note is sharp, flat or in tune.

START WITH THE DEMO
Explore the A minor demo. A one-time in-app purchase unlocks the full set of keys and learning options. No subscription is required.

MICROPHONE PRIVACY
Microphone access is optional and is used for tuning and live practice feedback. Audio is processed on your device and is not recorded or uploaded by the app.

Built for guitarists who want to know the neck, connect their shapes and make regular practice easier.
```

## Fichiers à importer

Voir le [guide commun Android et ses dimensions](../../README.md). Le rapport `validation.json` est recalculé depuis les fichiers présents ; il ne définit pas les tailles attendues.

| Champ de la console | Fichier ou dossier | Format livré |
| --- | --- | --- |
| Éléments visuels courants : icône de l'application | `icon/app-icon-512x512.png` | PNG RGBA, 512 × 512 |
| Éléments visuels courants : image de présentation | `icon/feature-graphic-1024x500.png` | PNG RGB, 1 024 × 500 |
| Captures d'écran pour téléphone | `phone/` | 8 PNG RGB, 1 080 × 1 920, portrait |
| Captures d'écran pour tablette 7 pouces | `tablet-7/` | 8 PNG RGB, 1 080 × 1 920, portrait |
| Captures d'écran pour tablette 10 pouces | `tablet-10/` | 8 PNG RGB, 2 560 × 1 440, paysage |
| Desktop assets : captures d'écran sur ordinateur | `desktop/` | 8 PNG RGB, 1 920 × 1 080, paysage |
| Éléments pour Android XR | `android-xr/` | 8 brouillons 2D en 2 560 × 1 440 : lire son README avant utilisation |

Importer les images de chaque dossier dans l'ordre **01 à 08**. Les noms indiquent le thème et la résolution. `alt-text.json` contient les textes alternatifs anglais, si la console les demande. `validation.json` indique les dimensions, poids et contrôles techniques de chaque export.

## Ordre des huit visuels

| N° | Sujet | Accroche des visuels téléphone |
| --- | --- | --- |
| 01 | Routine quotidienne : gamme | Daily routine for huge progress. |
| 02 | Triades | Play with more confidence. |
| 03 | Positions pentatoniques | Break out of the box. |
| 04 | Retour du microphone | Get feedback as you play. |
| 05 | Quiz | Test your knowledge. |
| 06 | Accordeur | Get in tune. Get playing. |
| 07 | Carte du manche | Know your fretboard. |
| 08 | Cercle des quintes | Make harmony make sense. |

`preview.html` permet de parcourir toutes les séries. `overview-phone.png` réunit les huit visuels téléphone. Ces deux fichiers servent à la relecture, pas à l'import dans Google Play.

## Contenu et provenance

Les visuels téléphone reprennent le design validé : ruban cyan continu, fond magenta et marine, titres blancs/cyan et icônes néon. Les captures intégrées ont été renouvelées avec le code actuel, en anglais. Les vues tablette et ordinateur montrent directement l'interface dans des tailles de fenêtres distinctes ; elles ne sont pas des agrandissements des captures téléphone.

Les captures proviennent de la version web partagée avec l'application Capacitor, rendue dans Chromium avec des tailles d'écran simulées. Elles ne constituent pas un test de l'AAB sur des appareils physiques. Le README technique de `stores/` et les fichiers `source/capture-*.json` conservent les paramètres et le commit source. Certaines pages sont déroulantes : une capture montre la portion visible de l'interface.

L'icône est celle du dépôt. La bannière est un nouvel élément marketing reprenant l'identité existante. Les sources éditables sont dans `source/` ; ne pas les importer comme captures supplémentaires.

## Android XR et vidéos

Les fichiers XR sont des **brouillons 2D pour relecture**, pas des captures prises dans un casque ou l'émulateur Android XR. La compatibilité XR de l'application n'a pas été validée. La série conservée est en 16:9, comme la console photographiée, tandis que l'aide publique indique 8:5. Conserver ces fichiers en brouillon jusqu'à vérification de la cible et du format accepté.

Les champs vidéo et vidéos XR sont facultatifs. Aucun lien YouTube ni contenu spatial n'est inventé ; les laisser vides pour ce premier jet.

Référence : [Ajouter des éléments d'aperçu — aide Google Play](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en), consultée le 14 octobre 2026. Les limites visibles sur tes captures de la console sont également reprises dans `source/requirements.json`.
