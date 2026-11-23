# Ukulele Fretboard Hero — Google Play — pt-BR

Fiche **Português (Brasil)**, pour l’édition ukulélé. Code de langue dans l’application : `pt-BR` ; langue de la fiche Google Play : `pt-BR`.

Traduction de la [fiche anglaise](../en-US/README.md), adaptée à l’instrument et aux termes musicaux de cette langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 22 / 30 caractères

```text
Ukulele Fretboard Hero
```

### Brève description — 69 / 80 caractères

```text
Notas, escalas e acordes de ukulele: prática diária, quiz e afinador.
```

### Description complète — 2386 / 4 000 caractères

```text
Aprenda a se orientar no braço do ukulele. Ukulele Fretboard Hero reúne exercícios guiados, ferramentas visuais, um quiz sobre o braço e um afinador em um só aplicativo.

CRIE O HÁBITO DE PRATICAR TODOS OS DIAS
Faça cinco exercícios na mesma tonalidade: encontre as fundamentais, toque uma escala, conecte tríades, pratique o ritmo e explore padrões pentatônicos. Tablaturas, nomes de notas e graus ajudam você a entender o que está tocando. Avance no seu ritmo e repita sua rotina.

CONECTE AS POSIÇÕES NO UKULELE
Explore as cinco posições pentatônicas, tríades maiores e menores, inversões, arpejos e formas de acordes C, A, G e F. Destaque graus e conecte padrões nas quatro cordas com afinação Sol–Dó–Mi–Lá e Sol agudo.

TOQUE COM O RETORNO DO MICROFONE
Ative o microfone na Rotina diária para seguir as notas destacadas e receber retorno enquanto toca. Pratique notas e tríades com exercícios guiados e trabalhe o ritmo com andamento ajustável. Você também pode praticar com o microfone desligado.

TESTE SEUS CONHECIMENTOS
Encare o quiz de 60 segundos sobre o braço do instrumento. Encontre fundamentais, terças e quintas, faça sequências de acertos e explore novas regiões do braço conforme avança.

ENCONTRE CADA NOTA
O Mapa do braço mostra as notas nas quatro cordas e permite focar em uma nota de cada vez. Alterne entre as ferramentas para conectar nomes de notas, intervalos e posições.

ENTENDA A HARMONIA
Explore o Círculo das quintas interativo, as tonalidades relativas menores, os acordes diatônicos e as progressões mais comuns. Veja como tonalidades e acordes se relacionam.

AFINE ANTES DE TOCAR
Use o afinador de ukulele integrado para a afinação Sol–Dó–Mi–Lá com Sol agudo. Escolha a detecção automática de cordas ou selecione uma manualmente. A tela mostra se a nota está acima, abaixo ou no tom certo.

COMECE GRÁTIS
Explore os modos e as posições de Aprender em Lá, o Círculo das quintas e a Rotina diária em Lá menor. Uma compra única neste aplicativo desbloqueia todas as tonalidades e notas com acesso vitalício. Não é necessária uma assinatura.

PRIVACIDADE DO MICROFONE
O acesso ao microfone é opcional e serve para afinar e receber retorno durante a prática. O áudio é processado no seu dispositivo; o aplicativo não o grava nem o envia para um servidor.

Para quem toca ukulele e quer conhecer as notas, conectar acordes e praticar com mais regularidade.
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient dix propositions en **Português (Brasil)** : icône, image de présentation et huit thèmes de captures. Les clés correspondent au format de la fiche guitare. Chaque valeur est limitée à 140 caractères.

## Visuels et validation

[Aperçu des huit scènes téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent huit visuels chacun. La routine et l’accordeur utilisent un signal de test traité par l’application. Les huit captures du dossier `android-xr/` sont des brouillons 2D à vérifier sur casque.

Les [accroches localisées](source/copy.json) et les [captures téléphone](source/screens-phone/) permettent de régénérer les cartes et la bannière.

```sh
python3 stores/tools/localized_visuals.py ukulele pt-BR
node stores/tools/validate.cjs stores/google-play/ukulele/pt-BR
```

[Toutes les langues de cet instrument](../README.md).
