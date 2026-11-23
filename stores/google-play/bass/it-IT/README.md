# Bass Fretboard Hero — Google Play — it-IT

Fiche **Italiano**, pour l’édition basse. Code de langue dans l’application : `it` ; langue de la fiche Google Play : `it-IT`.

Traduction de la [fiche anglaise](../en-US/README.md), adaptée à l’instrument et aux termes musicaux de cette langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 19 / 30 caractères

```text
Bass Fretboard Hero
```

### Brève description — 71 / 80 caractères

```text
Note, scale e arpeggi di basso: pratica quotidiana, quiz e accordatore.
```

### Description complète — 2429 / 4 000 caractères

```text
Conosci meglio il tuo basso a quattro corde. Bass Fretboard Hero riunisce esercizi guidati, strumenti visivi, un quiz sulla tastiera e un accordatore in un’unica app.

CREA UN’ABITUDINE QUOTIDIANA
Segui cinque esercizi nella stessa tonalità: trova le fondamentali, suona una scala, collega le triadi, esercita il ritmo ed esplora gli schemi pentatonici. Tablature, nomi delle note e gradi ti aiutano a capire quello che suoni. Procedi al tuo ritmo e ripeti la routine.

COLLEGA LE POSIZIONI SUL BASSO
Esplora le cinque posizioni pentatoniche, le triadi maggiori e minori, i rivolti e gli arpeggi. Evidenzia i singoli gradi, isola una posizione e collega gli schemi sulle quattro corde con accordatura standard Mi–La–Re–Sol.

SUONA CON IL RISCONTRO DEL MICROFONO
Attiva il microfono nella Routine quotidiana per seguire le note evidenziate e ricevere un riscontro mentre suoni. Esercitati su note e triadi con una guida e lavora sul ritmo con un tempo regolabile. Puoi anche esercitarti con il microfono spento.

METTI ALLA PROVA LE TUE CONOSCENZE
Affronta il quiz di 60 secondi sulla tastiera. Trova fondamentali, terze e quinte, accumula risposte corrette consecutive ed esplora nuove zone del manico mentre migliori.

TROVA OGNI NOTA
La Mappa della tastiera mostra le note sulle quattro corde e permette di concentrarsi su una nota alla volta. Passa da uno strumento all’altro per collegare nomi delle note, intervalli e posizioni.

COMPRENDI L’ARMONIA
Esplora il Circolo delle quinte interattivo, le tonalità relative minori, gli accordi diatonici e le progressioni più comuni. Scopri le relazioni tra tonalità e accordi.

ACCORDATI PRIMA DI SUONARE
Usa l’accordatore di basso integrato per l’accordatura standard Mi–La–Re–Sol. Scegli il rilevamento automatico della corda o selezionala manualmente. Il display indica se la nota è crescente, calante o intonata.

INIZIA GRATIS
Esplora le modalità e le posizioni di Impara in La, il Circolo delle quinte e la Routine quotidiana in La minore. Un acquisto unico in questa app sblocca tutte le tonalità e tutte le note per sempre. Non è necessario un abbonamento.

PRIVACY DEL MICROFONO
L’accesso al microfono è facoltativo e serve per l’accordatura e il riscontro durante gli esercizi. L’audio viene elaborato sul dispositivo: l’app non lo registra né lo carica su un server.

Per bassisti che vogliono conoscere le note, collegare le posizioni ed esercitarsi con più regolarità.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient dix propositions en **Italiano** : icône, image de présentation et huit thèmes de captures. Les clés correspondent au format de la fiche guitare. Chaque valeur est limitée à 140 caractères.

## Visuels et validation

[Aperçu des huit scènes téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les scènes montrent Bass Fretboard Hero en accordage standard Mi–La–Ré–Sol. Les captures de la routine et de l’accordeur utilisent un signal de test. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent huit images chacun. Le dossier `android-xr/` reprend les vues 2D de tablette pour la revue sur casque.

Les accroches de la bannière et des cartes se trouvent dans [source/copy.json](source/copy.json). Depuis la racine du dépôt, régénérer la bannière et les cartes à partir des [captures téléphone](source/screens-phone/), puis vérifier les fichiers.

```sh
python3 stores/tools/localized_visuals.py bass it-IT
node stores/tools/validate.cjs stores/google-play/bass/it-IT
```

[Retour aux 11 langues de la fiche basse](../README.md).
