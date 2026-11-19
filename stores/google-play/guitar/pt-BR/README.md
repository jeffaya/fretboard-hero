# Guitar Fretboard Hero — Google Play — pt-BR

Fiche **Português (Brasil)**, pour l'application guitare. Code de langue dans l'application : `pt-BR` ; langue de la fiche Google Play : `pt-BR`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 70 / 80 caractères

```text
Notas, escalas e acordes de guitarra: prática diária, quiz e afinador.
```

### Description complète — 2231 / 4 000 caractères

```text
Conheça melhor o braço da sua guitarra. Guitar Fretboard Hero reúne exercícios guiados, ferramentas visuais de aprendizagem, um quiz sobre notas e um afinador.

CRIE O HÁBITO DE PRATICAR TODOS OS DIAS
Faça cinco exercícios na mesma tonalidade: encontre as fundamentais, toque uma escala, conecte tríades, pratique o ritmo e explore padrões pentatônicos. Tablaturas, nomes de notas e graus ajudam você a entender o que está tocando. Avance no seu ritmo e repita sua rotina.

CONECTE AS POSIÇÕES
Explore as cinco posições pentatônicas, tríades maiores e menores, inversões e formas de acordes CAGED. Destaque graus específicos, isole uma posição ou veja como as formas se conectam nas seis cordas.

TOQUE COM O RETORNO DO MICROFONE
Ative o microfone na Rotina diária para seguir as notas destacadas e receber retorno enquanto toca. Pratique notas e tríades com exercícios guiados ou trabalhe as batidas com padrões rítmicos e andamento ajustável. Você também pode praticar com o microfone desligado.

TESTE SEUS CONHECIMENTOS
Encare o quiz de 60 segundos sobre o braço da guitarra. Encontre fundamentais, terças e quintas, faça sequências de acertos e explore novas regiões do braço conforme avança.

ENCONTRE CADA NOTA
Use o Mapa do braço para visualizar todas as notas ou focar em uma só. Alterne entre as ferramentas para relacionar nomes de notas, intervalos e posições.

ENTENDA A HARMONIA
Explore o Círculo das quintas interativo, as tonalidades relativas menores, os acordes diatônicos e as progressões mais comuns. Veja como tonalidades e acordes se relacionam.

AFINE ANTES DE TOCAR
Use o afinador integrado com detecção automática das cordas ou escolha uma corda manualmente. O indicador mostra se a nota está acima, abaixo ou na afinação correta.

COMECE COM A DEMO
Explore a demo em Lá menor. Uma compra única no aplicativo desbloqueia todas as tonalidades e opções de aprendizagem. Não é necessária assinatura.

PRIVACIDADE DO MICROFONE
O acesso ao microfone é opcional e serve para afinar e receber retorno durante a prática. O áudio é processado no seu dispositivo; o aplicativo não o grava nem o envia para um servidor.

Para quem quer conhecer o braço da guitarra, conectar posições e praticar com mais regularidade.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **Português (Brasil)** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Visuels et validation

[Aperçu des huit visuels téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les huit scènes utilisent l’interface guitare dans cette langue. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent les images à examiner pour la fiche. L’icône est commune à toutes les langues. Les images de `android-xr/` sont des brouillons 2D au format console, sans essai sur casque.

La copie de la bannière et des cartes est dans [source/copy.json](source/copy.json), les captures téléphone dans [source/screens-phone](source/screens-phone/). Depuis la racine du dépôt, exécuter `python stores/tools/render-localized-guitar.py pt-BR` pour régénérer la bannière et les huit cartes, puis `node stores/tools/validate.cjs stores/google-play/guitar/pt-BR` pour contrôler les fichiers.

[Retour aux 11 langues de la fiche guitare](../README.md).
