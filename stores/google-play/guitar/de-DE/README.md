# Guitar Fretboard Hero — Google Play — de-DE

Fiche **Deutsch**, pour l'application guitare. Code de langue dans l'application : `de` ; langue de la fiche Google Play : `de-DE`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 77 / 80 caractères

```text
Gitarrennoten, Tonleitern und Akkorde: tägliche Übungen, Quiz und Stimmgerät.
```

### Description complète — 2337 / 4 000 caractères

```text
Lerne dein Gitarrengriffbrett kennen. Guitar Fretboard Hero vereint angeleitete Übungen, visuelle Lernhilfen, ein Griffbrett-Quiz und ein Stimmgerät in einer App.

MACH TÄGLICHES ÜBEN ZUR GEWOHNHEIT
Fünf Übungen führen dich durch eine Tonart: Grundtöne finden, eine Tonleiter spielen, Dreiklänge verbinden, Rhythmus üben und pentatonische Muster erkunden. Tabulaturen, Notennamen und Tonstufen helfen dir zu verstehen, was du spielst. Gehe in deinem eigenen Tempo vor und wiederhole deine Routine.

VERBINDE DIE POSITIONEN
Entdecke die fünf Pentatonik-Positionen, Dur- und Moll-Dreiklänge, Umkehrungen und CAGED-Akkordformen. Hebe einzelne Tonstufen hervor, beschränke dich auf eine Position oder sieh, wie sich die Formen auf den sechs Saiten verbinden.

ÜBE MIT MIKROFON-FEEDBACK
Aktiviere das Mikrofon in der Täglichen Routine, folge den hervorgehobenen Noten und erhalte Rückmeldung beim Spielen. Nutze angeleitete Noten- und Dreiklangsübungen oder trainiere deinen Anschlag mit Rhythmusmustern und einstellbarem Tempo. Du kannst auch mit ausgeschaltetem Mikrofon üben.

TESTE DEIN WISSEN
Stelle dich dem 60-Sekunden-Griffbrett-Quiz. Finde Grundtöne, Terzen und Quinten, sammle richtige Antworten in Folge und erkunde nach und nach weitere Bereiche des Griffbretts.

FINDE JEDE NOTE
Die Griffbrettkarte zeigt die Noten auf dem gesamten Hals oder gezielt eine einzelne Note. Verbinde mit den verschiedenen Lernhilfen Notennamen, Intervalle und Griffbilder.

VERSTEHE HARMONIE
Erkunde den interaktiven Quintenzirkel, die parallelen Molltonarten, diatonische Akkorde und gängige Akkordfolgen. Erkenne die Beziehungen zwischen Tonarten und Akkorden.

STIMME DEINE GITARRE
Nutze das integrierte Stimmgerät mit automatischer Saitenerkennung oder wähle eine Saite manuell. Die Anzeige zeigt dir, ob der Ton zu hoch, zu tief oder richtig gestimmt ist.

STARTE MIT DER DEMO
Entdecke die Demo in a-Moll. Ein einmaliger In-App-Kauf schaltet alle Tonarten und Lernoptionen frei. Ein Abonnement ist nicht erforderlich.

MIKROFON UND DATENSCHUTZ
Der Mikrofonzugriff ist optional und wird zum Stimmen und für Rückmeldungen beim Üben verwendet. Die Audiodaten werden auf deinem Gerät verarbeitet. Die App zeichnet sie nicht auf und lädt sie nicht hoch.

Für Gitarristen, die ihr Griffbrett kennen, Positionen verbinden und regelmäßiger üben möchten.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **Deutsch** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Visuels et validation

[Aperçu des huit visuels téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les huit scènes utilisent l’interface guitare dans cette langue. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent les images à examiner pour la fiche. L’icône est commune à toutes les langues. Les images de `android-xr/` sont des brouillons 2D au format console, sans essai sur casque.

La copie de la bannière et des cartes est dans [source/copy.json](source/copy.json), les captures téléphone dans [source/screens-phone](source/screens-phone/). Depuis la racine du dépôt, exécuter `python stores/tools/render-localized-guitar.py de-DE` pour régénérer la bannière et les huit cartes, puis `node stores/tools/validate.cjs stores/google-play/guitar/de-DE` pour contrôler les fichiers.

[Retour aux 11 langues de la fiche guitare](../README.md).
