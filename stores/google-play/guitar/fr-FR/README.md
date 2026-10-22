# Guitar Fretboard Hero — Google Play — fr-FR

Fiche **Français**, pour l'application guitare. Code de langue dans l'application : `fr` ; langue de la fiche Google Play : `fr-FR`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 77 / 80 caractères

```text
Notes, gammes et accords de guitare : routine quotidienne, quiz et accordeur.
```

### Description complète — 2495 / 4 000 caractères

```text
Familiarisez-vous avec le manche de votre guitare. Guitar Fretboard Hero réunit des exercices guidés, des outils d’apprentissage visuels, un quiz sur les notes et un accordeur.

PRENEZ L’HABITUDE DE JOUER CHAQUE JOUR
Suivez cinq exercices dans une même tonalité : repérez les fondamentales, jouez une gamme, reliez les triades, travaillez le rythme et explorez les pentatoniques. Les tablatures, noms de notes et degrés vous aident à comprendre ce que vous jouez. Avancez à votre rythme et recommencez votre routine.

RELIEZ LES POSITIONS SUR LE MANCHE
Explorez les cinq positions pentatoniques, les triades majeures et mineures, leurs renversements et les formes d’accords CAGED. Mettez un degré en évidence, isolez une position ou observez les liens entre les formes sur les six cordes.

JOUEZ AVEC LE RETOUR DU MICROPHONE
Activez le microphone dans la Routine quotidienne pour suivre les notes surlignées et obtenir un retour pendant que vous jouez. Pratiquez les notes et les triades avec les exercices guidés, ou travaillez votre strumming avec des motifs rythmiques et un tempo réglable. Vous pouvez aussi vous entraîner sans microphone.

TESTEZ VOS CONNAISSANCES
Relevez le défi du quiz de 60 secondes sur le manche. Retrouvez fondamentales, tierces et quintes, enchaînez les bonnes réponses et explorez davantage le manche au fil de votre progression.

REPÉREZ CHAQUE NOTE
La Carte du manche affiche les notes sur les six cordes et permet de se concentrer sur une seule note. Passez d’un outil à l’autre pour relier noms de notes, intervalles et positions.

COMPRENEZ L’HARMONIE
Explorez le Cycle des quintes interactif, les tonalités mineures relatives, les accords diatoniques et les progressions courantes. Visualisez les relations entre tonalités et accords.

ACCORDEZ-VOUS AVANT DE JOUER
Utilisez l’accordeur intégré avec détection automatique des cordes ou sélection manuelle. L’affichage indique si la note est trop aiguë, trop grave ou juste.

COMMENCEZ AVEC LA DÉMO
Découvrez la démo en La mineur. Un achat unique dans l’application débloque l’ensemble des tonalités et des options d’apprentissage. Aucun abonnement n’est nécessaire.

CONFIDENTIALITÉ DU MICROPHONE
L’accès au microphone est facultatif et sert à l’accordage et au retour pendant les exercices. Le son est traité sur votre appareil : l’application ne l’enregistre pas et ne l’envoie pas à un serveur.

Pour les guitaristes qui veulent connaître leur manche, relier leurs positions et pratiquer plus régulièrement.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **Français** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Fichiers à importer

| Champ de la console | Fichier ou dossier | Format livré |
| --- | --- | --- |
| Icône de l’application | `icon/app-icon-512x512.png` | Icône existante, PNG RGBA, 512 × 512 |
| Image de présentation | `icon/feature-graphic-1024x500.png` | Bannière française, PNG RGB, 1 024 × 500 |
| Téléphone | `phone/` | 8 PNG RGB, 1 080 × 1 920, portrait |
| Tablette 7 pouces | `tablet-7/` | 8 PNG RGB, 1 080 × 1 920, portrait |
| Tablette 10 pouces | `tablet-10/` | 8 PNG RGB, 2 560 × 1 440, paysage |
| Ordinateur | `desktop/` | 8 PNG RGB, 1 920 × 1 080, paysage |
| Android XR | `android-xr/` | 8 brouillons 2D, 2 560 × 1 440 ; ne pas importer avant validation XR |

Importer les images dans l’ordre **01 à 08**. Le [guide Android](../../README.md) décrit les dimensions et règles communes. `validation.json` recense les fichiers effectivement contrôlés. `overview-phone.png` sert à la relecture ; ce n’est pas une capture supplémentaire à importer.

## Ordre des visuels téléphone

| N° | Sujet | Accroche |
| --- | --- | --- |
| 01 | Routine quotidienne : gamme | Une routine. De vrais progrès. |
| 02 | Triades | Jouez avec assurance. |
| 03 | Positions pentatoniques | Reliez les cinq positions. |
| 04 | Retour du microphone | Jouez. Le micro vous suit. |
| 05 | Quiz | Testez vos connaissances. |
| 06 | Accordeur | Accordez. À vous de jouer. |
| 07 | Carte du manche | Maîtrisez votre manche. |
| 08 | Cycle des quintes | Comprenez l’harmonie. |

## Sources et génération

Les visuels reprennent le ruban cyan, le fond marine et magenta, les polices, les icônes et le logo existants. Les éléments graphiques communs sont référencés depuis `../en-US/source/layout/assets/`, sans duplication. Le texte éditable est dans `source/copy-fr.json` et la mise en page dans `source/layout/panorama.html`.

Les captures intégrées aux visuels téléphone et les vues tablette/ordinateur proviennent de l’interface réelle en français, rendue dans Chromium avec des tailles de fenêtres distinctes. Les fichiers `source/capture-*.json` enregistrent le commit source, la langue et le texte visible. Ils décrivent des captures de la version web partagée avec Capacitor, pas un test de l’AAB sur appareils physiques. L’accès complet est activé uniquement dans le navigateur de capture ; aucun achat n’est effectué et la configuration du produit reste inchangée. Le retour micro et l’accordeur utilisent un signal synthétique traité par le détecteur réel.

La bannière est la traduction du visuel existant, avec le même logo. Son master et le prompt de localisation sont conservés dans `source/feature-master-fr.png` et `source/feature-provenance.md`. L’export recadre les marges décoratives pour obtenir 1 024 × 500, sans transparence. L’image OG du site n’est pas modifiée.

Depuis la racine du dépôt :

```sh
npm --prefix stores/tools ci
npx --prefix stores/tools playwright install chromium
STORE_LOCALE=fr-FR node stores/tools/capture.cjs
STORE_LOCALE=fr-FR node stores/tools/render.cjs
node stores/tools/export-feature.cjs stores/google-play/guitar/fr-FR
node stores/tools/validate.cjs stores/google-play/guitar/fr-FR
```

Le workflow manuel **Google Play visual export**, avec la langue `fr-FR`, fournit aussi une archive des exports. Il ne publie rien dans Google Play.

## Android XR et vidéos

Les fichiers XR restent des **brouillons 2D pour relecture**. Ils ne proviennent pas d’un casque ou d’un émulateur XR ; la compatibilité n’est pas certifiée. Le format 16:9 correspond à la console photographiée, tandis que l’aide publique reprise dans le guide commun indique 8:5. Vérifier la cible et le format avant toute utilisation. Les champs vidéo restent vides : aucune vidéo ni scène spatiale n’est fournie.

[Retour aux 11 langues de la fiche guitare](../README.md).
