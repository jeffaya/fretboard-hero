# Guitar Fretboard Hero — Google Play — it-IT

Fiche **Italiano**, pour l'application guitare. Code de langue dans l'application : `it` ; langue de la fiche Google Play : `it-IT`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 74 / 80 caractères

```text
Note, scale e accordi di chitarra: pratica quotidiana, quiz e accordatore.
```

### Description complète — 2288 / 4 000 caractères

```text
Impara a orientarti sulla tastiera della chitarra. Guitar Fretboard Hero riunisce esercizi guidati, strumenti visivi per imparare, un quiz sulle note e un accordatore.

CREA UN’ABITUDINE QUOTIDIANA
Segui cinque esercizi nella stessa tonalità: trova le fondamentali, suona una scala, collega le triadi, esercita il ritmo ed esplora gli schemi pentatonici. Tablature, nomi delle note e gradi ti aiutano a capire quello che suoni. Procedi al tuo ritmo e ripeti la routine.

COLLEGA LE POSIZIONI
Esplora le cinque posizioni pentatoniche, le triadi maggiori e minori, i rivolti e le forme degli accordi CAGED. Evidenzia singoli gradi, isola una posizione o scopri come si collegano le forme sulle sei corde.

SUONA CON IL RISCONTRO DEL MICROFONO
Attiva il microfono nella Routine quotidiana per seguire le note evidenziate e ricevere un riscontro mentre suoni. Esercitati su note e triadi con una guida, oppure lavora sulla pennata con schemi ritmici e tempo regolabile. Puoi anche esercitarti con il microfono spento.

METTI ALLA PROVA LE TUE CONOSCENZE
Affronta il quiz di 60 secondi sulla tastiera. Trova fondamentali, terze e quinte, accumula risposte corrette consecutive ed esplora nuove zone del manico mentre migliori.

TROVA OGNI NOTA
Usa la Mappa della tastiera per visualizzare tutte le note o concentrarti su una sola. Passa da uno strumento all’altro per collegare nomi delle note, intervalli e posizioni.

COMPRENDI L’ARMONIA
Esplora il Circolo delle quinte interattivo, le tonalità relative minori, gli accordi diatonici e le progressioni più comuni. Scopri le relazioni tra tonalità e accordi.

ACCORDATI PRIMA DI SUONARE
Usa l’accordatore integrato con rilevamento automatico delle corde oppure scegli una corda manualmente. L’indicatore mostra se la nota è crescente, calante o accordata.

INIZIA CON LA DEMO
Esplora la demo in La minore. Un acquisto unico nell’app sblocca tutte le tonalità e le opzioni di apprendimento. Non è richiesto alcun abbonamento.

PRIVACY DEL MICROFONO
L’accesso al microfono è facoltativo e serve per l’accordatura e il riscontro durante gli esercizi. L’audio viene elaborato sul dispositivo: l’app non lo registra né lo carica su un server.

Per chi vuole conoscere la tastiera, collegare le posizioni e rendere più semplice la pratica regolare.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **Italiano** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Visuels et validation

[Aperçu des huit visuels téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les huit scènes utilisent l’interface guitare dans cette langue. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent les images à examiner pour la fiche. L’icône est commune à toutes les langues. Les images de `android-xr/` sont des brouillons 2D au format console, sans essai sur casque.

La copie de la bannière et des cartes est dans [source/copy.json](source/copy.json), les captures téléphone dans [source/screens-phone](source/screens-phone/). Depuis la racine du dépôt, exécuter `python stores/tools/render-localized-guitar.py it-IT` pour régénérer la bannière et les huit cartes, puis `node stores/tools/validate.cjs stores/google-play/guitar/it-IT` pour contrôler les fichiers.

[Retour aux 11 langues de la fiche guitare](../README.md).
