# Guitar Fretboard Hero — Google Play — es-ES

Fiche **Español**, pour l'application guitare. Code de langue dans l'application : `es` ; langue de la fiche Google Play : `es-ES`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 79 / 80 caractères

```text
Notas, escalas y acordes de guitarra: práctica diaria, cuestionario y afinador.
```

### Description complète — 2394 / 4 000 caractères

```text
Familiarízate con el diapasón de tu guitarra. Guitar Fretboard Hero reúne ejercicios guiados, herramientas visuales de aprendizaje, un cuestionario sobre las notas y un afinador.

CREA UN HÁBITO DE PRÁCTICA DIARIA
Sigue cinco ejercicios en una misma tonalidad: encuentra las fundamentales, toca una escala, conecta tríadas, practica el ritmo y explora patrones pentatónicos. Las tablaturas, los nombres de las notas y los grados te ayudan a entender lo que tocas. Avanza a tu ritmo y repite tu rutina.

CONECTA EL DIAPASÓN
Explora las cinco posiciones pentatónicas, las tríadas mayores y menores, sus inversiones y las formas de acordes CAGED. Resalta grados concretos, aísla una posición o descubre cómo se conectan las formas en las seis cuerdas.

TOCA CON LA AYUDA DEL MICRÓFONO
Activa el micrófono en la Rutina diaria para seguir las notas resaltadas y recibir indicaciones mientras tocas. Practica notas y tríadas con ejercicios guiados, o trabaja el rasgueo con patrones rítmicos y un tempo ajustable. También puedes practicar con el micrófono apagado.

PON A PRUEBA TUS CONOCIMIENTOS
Acepta el reto del cuestionario de 60 segundos sobre el diapasón. Encuentra fundamentales, terceras y quintas, encadena respuestas correctas y explora más zonas del mástil a medida que progresas.

ENCUENTRA CADA NOTA
Usa el Mapa del diapasón para ver las notas de todo el mástil o centrarte en una sola. Combina las herramientas de aprendizaje para relacionar nombres de notas, intervalos y posiciones.

ENTIENDE LA ARMONÍA
Explora el Círculo de quintas interactivo, las tonalidades menores relativas, los acordes diatónicos y las progresiones habituales. Descubre cómo se relacionan tonalidades y acordes.

AFINA ANTES DE TOCAR
Utiliza el afinador integrado con detección automática de cuerdas o selecciona una cuerda manualmente. La pantalla te indica si la nota está alta, baja o afinada.

EMPIEZA CON LA DEMO
Explora la demo en La menor. Una compra única dentro de la aplicación desbloquea todas las tonalidades y opciones de aprendizaje. No necesitas ninguna suscripción.

PRIVACIDAD DEL MICRÓFONO
El acceso al micrófono es opcional y se utiliza para afinar y recibir indicaciones durante la práctica. El audio se procesa en tu dispositivo; la aplicación no lo graba ni lo sube a un servidor.

Para guitarristas que quieren conocer el mástil, conectar sus posiciones y practicar con más constancia.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **Español** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Visuels et validation

[Aperçu des huit visuels téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les huit scènes utilisent l’interface guitare dans cette langue. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent les images à examiner pour la fiche. L’icône est commune à toutes les langues. Les images de `android-xr/` sont des brouillons 2D au format console, sans essai sur casque.

La copie de la bannière et des cartes est dans [source/copy.json](source/copy.json), les captures téléphone dans [source/screens-phone](source/screens-phone/). Depuis la racine du dépôt, exécuter `python stores/tools/render-localized-guitar.py es-ES` pour régénérer la bannière et les huit cartes, puis `node stores/tools/validate.cjs stores/google-play/guitar/es-ES` pour contrôler les fichiers.

[Retour aux 11 langues de la fiche guitare](../README.md).
