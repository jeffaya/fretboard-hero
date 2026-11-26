# Ukulele Fretboard Hero — Google Play — it-IT

Fiche **Italiano**, pour l’édition ukulélé. Code de langue dans l’application : `it` ; langue de la fiche Google Play : `it-IT`.

Traduction de la [fiche anglaise](../en-US/README.md), adaptée à l’instrument et aux termes musicaux de cette langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 22 / 30 caractères

```text
Ukulele Fretboard Hero
```

### Brève description — 73 / 80 caractères

```text
Note, scale e accordi di ukulele: pratica quotidiana, quiz e accordatore.
```

### Description complète — 2461 / 4 000 caractères

```text
Impara a orientarti sulla tastiera dell’ukulele. Ukulele Fretboard Hero riunisce esercizi guidati, strumenti visivi, un quiz sulla tastiera e un accordatore in un’unica app.

CREA UN’ABITUDINE QUOTIDIANA
Segui cinque esercizi nella stessa tonalità: trova le fondamentali, suona una scala, collega le triadi, esercita il ritmo ed esplora gli schemi pentatonici. Tablature, nomi delle note e gradi ti aiutano a capire quello che suoni. Procedi al tuo ritmo e ripeti la routine.

COLLEGA LE POSIZIONI SULL’UKULELE
Esplora le cinque posizioni pentatoniche, le triadi maggiori e minori, i rivolti, gli arpeggi e le forme degli accordi C, A, G e F. Evidenzia i gradi e collega gli schemi sulle quattro corde con accordatura Sol–Do–Mi–La e Sol acuto.

SUONA CON IL RISCONTRO DEL MICROFONO
Attiva il microfono nella Routine quotidiana per seguire le note evidenziate e ricevere un riscontro mentre suoni. Esercitati su note e triadi con una guida e lavora sul ritmo con un tempo regolabile. Puoi anche esercitarti con il microfono spento.

METTI ALLA PROVA LE TUE CONOSCENZE
Affronta il quiz di 60 secondi sulla tastiera. Trova fondamentali, terze e quinte, accumula risposte corrette consecutive ed esplora nuove zone del manico mentre migliori.

TROVA OGNI NOTA
La Mappa della tastiera mostra le note sulle quattro corde e permette di concentrarsi su una nota alla volta. Passa da uno strumento all’altro per collegare nomi delle note, intervalli e posizioni.

COMPRENDI L’ARMONIA
Esplora il Circolo delle quinte interattivo, le tonalità relative minori, gli accordi diatonici e le progressioni più comuni. Scopri le relazioni tra tonalità e accordi.

ACCORDATI PRIMA DI SUONARE
Usa l’accordatore di ukulele integrato per l’accordatura Sol–Do–Mi–La con Sol acuto. Scegli il rilevamento automatico della corda o selezionala manualmente. Il display indica se la nota è crescente, calante o intonata.

INIZIA GRATIS
Esplora le modalità e le posizioni di Impara in La, il Circolo delle quinte e la Routine quotidiana in La minore. Un acquisto unico in questa app sblocca tutte le tonalità e tutte le note per sempre. Non è necessario un abbonamento.

PRIVACY DEL MICROFONO
L’accesso al microfono è facoltativo e serve per l’accordatura e il riscontro durante gli esercizi. L’audio viene elaborato sul dispositivo: l’app non lo registra né lo carica su un server.

Per chi suona l’ukulele e vuole conoscere le note, collegare gli accordi ed esercitarsi con più regolarità.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient dix propositions en **Italiano** : icône, image de présentation et huit thèmes de captures. Les clés correspondent au format de la fiche guitare. Chaque valeur est limitée à 140 caractères.

## Visuels et validation

[Aperçu des huit scènes téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent huit visuels chacun. La routine et l’accordeur utilisent un signal de test traité par l’application. Les huit captures du dossier `android-xr/` sont des brouillons 2D à vérifier sur casque.

Les [accroches localisées](source/copy.json) et les [captures téléphone](source/screens-phone/) permettent de régénérer les cartes et la bannière.

```sh
python3 stores/tools/localized_visuals.py ukulele it-IT
node stores/tools/validate.cjs stores/google-play/ukulele/it-IT
```

[Toutes les langues de cet instrument](../README.md).
