# Bass Fretboard Hero — Google Play — de-DE

Fiche **Deutsch**, pour l’édition basse. Code de langue dans l’application : `de` ; langue de la fiche Google Play : `de-DE`.

Traduction de la [fiche anglaise](../en-US/README.md), adaptée à l’instrument et aux termes musicaux de cette langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 19 / 30 caractères

```text
Bass Fretboard Hero
```

### Brève description — 75 / 80 caractères

```text
Bassnoten, Tonleitern und Arpeggios: tägliche Übungen, Quiz und Stimmgerät.
```

### Description complète — 2451 / 4 000 caractères

```text
Lerne deinen viersaitigen Bass kennen. Bass Fretboard Hero vereint angeleitete Übungen, visuelle Lernwerkzeuge, ein Griffbrett-Quiz und ein Stimmgerät in einer App.

MACH TÄGLICHES ÜBEN ZUR GEWOHNHEIT
Fünf Übungen führen dich durch eine Tonart: Grundtöne finden, eine Tonleiter spielen, Dreiklänge verbinden, Rhythmus üben und pentatonische Muster erkunden. Tabulaturen, Notennamen und Tonstufen helfen dir zu verstehen, was du spielst. Gehe in deinem eigenen Tempo vor und wiederhole deine Routine.

VERBINDE POSITIONEN AUF DEM BASS
Erkunde die fünf Pentatonik-Positionen, Dur- und Moll-Dreiklänge, ihre Umkehrungen und Arpeggios. Hebe einzelne Tonstufen hervor, wähle eine Position und verbinde Muster auf den vier Saiten in der Standardstimmung E–A–D–G.

ÜBE MIT MIKROFON-FEEDBACK
Aktiviere das Mikrofon in der Täglichen Routine, folge den hervorgehobenen Noten und erhalte Rückmeldung beim Spielen. Nutze angeleitete Noten- und Dreiklangsübungen und trainiere deinen Rhythmus mit einstellbarem Tempo. Du kannst auch mit ausgeschaltetem Mikrofon üben.

TESTE DEIN WISSEN
Stelle dich dem 60-Sekunden-Griffbrett-Quiz. Finde Grundtöne, Terzen und Quinten, sammle richtige Antworten in Folge und erkunde nach und nach weitere Bereiche des Griffbretts.

FINDE JEDE NOTE
Die Griffbrettkarte zeigt Noten auf allen vier Saiten oder hebt einen einzelnen Ton hervor. Verbinde Notennamen, Intervalle und Positionen, indem du zwischen den Lernwerkzeugen wechselst.

VERSTEHE HARMONIE
Erkunde den interaktiven Quintenzirkel, die parallelen Molltonarten, diatonische Akkorde und gängige Akkordfolgen. Erkenne die Beziehungen zwischen Tonarten und Akkorden.

STIMME VOR DEM SPIELEN
Nutze das integrierte Bass-Stimmgerät für die Standardstimmung E–A–D–G. Lass die Saite automatisch erkennen oder wähle sie manuell. Die Anzeige zeigt, ob der Ton zu hoch, zu tief oder richtig gestimmt ist.

KOSTENLOS STARTEN
Erkunde die Lernmodi und Positionen mit Grundton A, den Quintenzirkel und die Tägliche Routine in a-Moll. Ein einmaliger In-App-Kauf schaltet alle Tonarten und Noten in dieser App dauerhaft frei. Ein Abonnement ist nicht erforderlich.

MIKROFON UND DATENSCHUTZ
Der Mikrofonzugriff ist optional und wird zum Stimmen und für Rückmeldungen beim Üben verwendet. Die Audiodaten werden auf deinem Gerät verarbeitet. Die App zeichnet sie nicht auf und lädt sie nicht hoch.

Für Bassisten, die ihre Noten kennen, Positionen verbinden und regelmäßiger üben möchten.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient dix propositions en **Deutsch** : icône, image de présentation et huit thèmes de captures. Les clés correspondent au format de la fiche guitare. Chaque valeur est limitée à 140 caractères.

## Visuels et validation

[Aperçu des huit scènes téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les scènes montrent Bass Fretboard Hero en accordage standard Mi–La–Ré–Sol. Les captures de la routine et de l’accordeur utilisent un signal de test. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent huit images chacun. Le dossier `android-xr/` reprend les vues 2D de tablette pour la revue sur casque.

Les accroches de la bannière et des cartes se trouvent dans [source/copy.json](source/copy.json). Depuis la racine du dépôt, régénérer la bannière et les cartes à partir des [captures téléphone](source/screens-phone/), puis vérifier les fichiers.

```sh
python3 stores/tools/localized_visuals.py bass de-DE
node stores/tools/validate.cjs stores/google-play/bass/de-DE
```

[Retour aux 11 langues de la fiche basse](../README.md).
