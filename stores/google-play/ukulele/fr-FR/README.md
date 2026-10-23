# Ukulele Fretboard Hero — Google Play — fr-FR

Fiche **Français**, pour l’édition ukulélé. Code de langue dans l’application : `fr` ; langue de la fiche Google Play : `fr-FR`.

Traduction de la [fiche anglaise](../en-US/README.md), adaptée à l’instrument et aux termes musicaux de cette langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 22 / 30 caractères

```text
Ukulele Fretboard Hero
```

### Brève description — 76 / 80 caractères

```text
Notes, gammes et accords d’ukulélé : routine quotidienne, quiz et accordeur.
```

### Description complète — 2620 / 4 000 caractères

```text
Repérez-vous sur le manche de votre ukulélé. Ukulele Fretboard Hero réunit des exercices guidés, des outils d’apprentissage visuels, un quiz sur les notes et un accordeur.

PRENEZ L’HABITUDE DE JOUER CHAQUE JOUR
Suivez cinq exercices dans une même tonalité : repérez les fondamentales, jouez une gamme, reliez les triades, travaillez les formes d’accords et explorez les pentatoniques. Les tablatures, noms de notes et degrés vous aident à comprendre ce que vous jouez. Avancez à votre rythme et recommencez votre routine.

RELIEZ LES POSITIONS À L’UKULÉLÉ
Explorez les cinq positions pentatoniques, les triades majeures et mineures, leurs renversements, les arpèges et les formes d’accords C, A, G et F. Mettez un degré en évidence et reliez les motifs sur les quatre cordes en accordage Sol–Do–Mi–La, avec un Sol aigu.

JOUEZ AVEC LE RETOUR DU MICROPHONE
Activez le microphone dans la Routine quotidienne pour suivre les notes surlignées et obtenir un retour pendant que vous jouez. Pratiquez les notes et les triades à votre rythme avec les exercices guidés. Vous pouvez aussi vous entraîner sans microphone.

TESTEZ VOS CONNAISSANCES
Relevez le défi du quiz de 60 secondes sur le manche. Retrouvez fondamentales, tierces et quintes, enchaînez les bonnes réponses et explorez davantage le manche au fil de votre progression.

REPÉREZ CHAQUE NOTE
La Carte du manche affiche les notes sur les quatre cordes et permet de se concentrer sur une seule note. Passez d’un outil à l’autre pour relier noms de notes, intervalles et positions.

COMPRENEZ L’HARMONIE
Explorez le Cycle des quintes interactif, les tonalités mineures relatives, les accords diatoniques et les progressions courantes. Visualisez les relations entre tonalités et accords.

ACCORDEZ-VOUS AVANT DE JOUER
Utilisez l’accordeur d’ukulélé intégré pour l’accordage Sol–Do–Mi–La, avec un Sol aigu. Choisissez la détection automatique des cordes ou la sélection manuelle. L’affichage indique si la note est trop aiguë, trop grave ou juste.

COMMENCEZ GRATUITEMENT
Explorez les modes et les positions d’Apprendre en La, le Cycle des quintes et la Routine quotidienne en La mineur. Un achat unique dans cette application débloque toutes les tonalités et toutes les notes à vie. Aucun abonnement n’est nécessaire.

CONFIDENTIALITÉ DU MICROPHONE
L’accès au microphone est facultatif et sert à l’accordage et au retour pendant les exercices. Le son est traité sur votre appareil : l’application ne l’enregistre pas et ne l’envoie pas à un serveur.

Pour les joueurs d’ukulélé qui veulent connaître leurs notes, relier leurs accords et pratiquer plus régulièrement.
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
| Éléments pour Android XR | `android-xr/` | 8 brouillons 2D en 2 560 × 1 440 : lire la section Android XR ci-dessous avant utilisation |

Importer les images de chaque dossier dans l'ordre **01 à 08**. Les noms indiquent le thème et la résolution. `alt-text.json` contient les textes alternatifs français, si la console les demande. `validation.json` indique les dimensions, poids et contrôles techniques de chaque export.

## Ordre des huit visuels

| N° | Sujet | Accroche des visuels téléphone |
| --- | --- | --- |
| 01 | Routine quotidienne : gamme | Une routine. De vrais progrès. |
| 02 | Triades | Jouez avec assurance. |
| 03 | Positions pentatoniques | Reliez les cinq positions. |
| 04 | Retour du microphone | Jouez. Le micro vous suit. |
| 05 | Quiz | Testez vos connaissances. |
| 06 | Accordeur | Accordez. À vous de jouer. |
| 07 | Carte du manche | Maîtrisez votre manche. |
| 08 | Cercle des quintes | Comprenez l’harmonie. |

`overview-phone.png` réunit les huit visuels téléphone. Ce fichier sert à la relecture, pas à l'import dans Google Play.

## Contenu et provenance

Les visuels téléphone reprennent le design validé : ruban cyan continu, fond magenta et marine, titres blancs/cyan et icônes néon. Les captures intégrées ont été renouvelées avec le code actuel, en français. Les vues tablette et ordinateur montrent directement l'interface dans des tailles de fenêtres distinctes ; elles ne sont pas des agrandissements des captures téléphone.

Les captures proviennent de la version web partagée avec l'application Capacitor, rendue dans Chromium avec des tailles d'écran simulées. Elles ne constituent pas un test de l'AAB sur des appareils physiques. Le README technique de `stores/` et les fichiers `source/capture-*.json` conservent les paramètres et le commit source. Certaines pages sont déroulantes : une capture montre la portion visible de l'interface.

L'icône est celle du dépôt. La bannière reprend le visuel de cet instrument avec l’accroche et les six fonctionnalités traduites en français. Le master et le prompt de localisation sont conservés dans `source/`. Les sources éditables sont dans `source/` ; ne pas les importer comme captures supplémentaires.

## Android XR et vidéos

Les fichiers XR sont des **brouillons 2D pour relecture**, pas des captures prises dans un casque ou l'émulateur Android XR. La compatibilité XR de l'application n'a pas été validée. La série conservée est en 16:9, comme la console photographiée, tandis que l'aide publique indique 8:5. Conserver ces fichiers en brouillon jusqu'à vérification de la cible et du format accepté.

Les champs vidéo et vidéos XR sont facultatifs. Aucun lien YouTube ni contenu spatial n'est inventé ; les laisser vides pour ce premier jet.

Référence : [Ajouter des éléments d'aperçu — aide Google Play](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en), consultée le 14 octobre 2026. Les limites visibles sur tes captures de la console sont également reprises dans [le profil de validation commun](../../requirements.json).


## Reproduction

```sh
STORE_INSTRUMENT=ukulele STORE_LOCALE=fr-FR node stores/tools/capture.cjs
STORE_INSTRUMENT=ukulele STORE_LOCALE=fr-FR node stores/tools/render.cjs
node stores/tools/export-feature.cjs stores/google-play/ukulele/fr-FR
STORE_INSTRUMENT=ukulele STORE_LOCALE=fr-FR node stores/tools/export-icon.cjs
node stores/tools/validate.cjs stores/google-play/ukulele/fr-FR
```

Les fonds, icônes de fonctionnalités et polices sont partagés avec la série guitare anglaise. Le logo est celui de Ukulele Fretboard Hero ; toutes les captures utilisent le profil ukulele et quatre cordes.
