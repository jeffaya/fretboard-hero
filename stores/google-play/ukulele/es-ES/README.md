# Ukulele Fretboard Hero — Google Play — es-ES

Fiche **Español**, pour l’édition ukulélé. Code de langue dans l’application : `es` ; langue de la fiche Google Play : `es-ES`.

Traduction de la [fiche anglaise](../en-US/README.md), adaptée à l’instrument et aux termes musicaux de cette langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 22 / 30 caractères

```text
Ukulele Fretboard Hero
```

### Brève description — 78 / 80 caractères

```text
Notas, escalas y acordes de ukelele: práctica diaria, cuestionario y afinador.
```

### Description complète — 2516 / 4 000 caractères

```text
Oriéntate en el diapasón de tu ukelele. Ukulele Fretboard Hero reúne ejercicios guiados, herramientas visuales, un cuestionario sobre el diapasón y un afinador en una sola aplicación.

CREA UN HÁBITO DE PRÁCTICA DIARIA
Sigue cinco ejercicios en una misma tonalidad: encuentra las fundamentales, toca una escala, conecta tríadas, practica el ritmo y explora patrones pentatónicos. Las tablaturas, los nombres de las notas y los grados te ayudan a entender lo que tocas. Avanza a tu ritmo y repite tu rutina.

CONECTA LAS POSICIONES DEL UKELELE
Explora las cinco posiciones pentatónicas, las tríadas mayores y menores, sus inversiones, los arpegios y las formas de acordes C, A, G y F. Resalta grados y conecta patrones en las cuatro cuerdas con afinación Sol–Do–Mi–La y Sol agudo.

TOCA CON LA AYUDA DEL MICRÓFONO
Activa el micrófono en la Rutina diaria para seguir las notas resaltadas y recibir indicaciones mientras tocas. Practica notas y tríadas con ejercicios guiados y trabaja el ritmo con un tempo ajustable. También puedes practicar con el micrófono apagado.

PON A PRUEBA TUS CONOCIMIENTOS
Acepta el reto del cuestionario de 60 segundos sobre el diapasón. Encuentra fundamentales, terceras y quintas, encadena respuestas correctas y explora más zonas del mástil a medida que progresas.

ENCUENTRA CADA NOTA
El Mapa del diapasón muestra las notas en las cuatro cuerdas y permite centrarse en una sola nota. Conecta nombres de notas, intervalos y posiciones al pasar de una herramienta a otra.

ENTIENDE LA ARMONÍA
Explora el Círculo de quintas interactivo, las tonalidades menores relativas, los acordes diatónicos y las progresiones habituales. Descubre cómo se relacionan tonalidades y acordes.

AFINA ANTES DE TOCAR
Usa el afinador de ukelele integrado para la afinación Sol–Do–Mi–La con Sol agudo. Elige la detección automática de cuerdas o selecciona una manualmente. La pantalla indica si la nota está alta, baja o afinada.

EMPIEZA GRATIS
Explora los modos y las posiciones de Aprender en La, el Círculo de quintas y la Rutina diaria en La menor. Una compra única dentro de esta aplicación desbloquea todas las tonalidades y notas de por vida. No se necesita suscripción.

PRIVACIDAD DEL MICRÓFONO
El acceso al micrófono es opcional y se utiliza para afinar y recibir indicaciones durante la práctica. El audio se procesa en tu dispositivo; la aplicación no lo graba ni lo sube a un servidor.

Para quienes tocan el ukelele y quieren conocer las notas, conectar acordes y practicar con más constancia.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient dix propositions en **Español** : icône, image de présentation et huit thèmes de captures. Les clés correspondent au format de la fiche guitare. Chaque valeur est limitée à 140 caractères.

## Visuels et validation

[Aperçu des huit scènes téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent huit visuels chacun. La routine et l’accordeur utilisent un signal de test traité par l’application. Les huit captures du dossier `android-xr/` sont des brouillons 2D à vérifier sur casque.

Les [accroches localisées](source/copy.json) et les [captures téléphone](source/screens-phone/) permettent de régénérer les cartes et la bannière.

```sh
python3 stores/tools/localized_visuals.py ukulele es-ES
node stores/tools/validate.cjs stores/google-play/ukulele/es-ES
```

[Toutes les langues de cet instrument](../README.md).
