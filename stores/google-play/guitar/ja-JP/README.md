# Guitar Fretboard Hero — Google Play — ja-JP

Fiche **日本語**, pour l'application guitare. Code de langue dans l'application : `ja` ; langue de la fiche Google Play : `ja-JP`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 36 / 80 caractères

```text
毎日の練習、クイズ、チューナーで、ギターの音、スケール、コードを学ぼう。
```

### Description complète — 1009 / 4 000 caractères

```text
ギターの指板を、もっと身近に。Guitar Fretboard Heroは、ガイド付きの練習、視覚的に学べるツール、指板クイズ、チューナーをひとつにまとめたアプリです。

毎日練習する習慣を
ひとつのキーで5つの練習に取り組めます。ルート音を探し、スケールを弾き、トライアドをつなぎ、リズムを練習し、ペンタトニックのパターンをたどりましょう。タブ譜、音名、度数表示が、弾いている内容の理解を助けます。自分のペースで進め、何度でも練習を繰り返せます。

指板上のポジションをつなぐ
5つのペンタトニック・ポジション、メジャーとマイナーのトライアド、転回形、CAGEDのコードフォームを確認できます。特定の度数を強調したり、ひとつのポジションに絞ったりして、6本の弦の上でフォームがどうつながるかを見てみましょう。

マイクのフィードバックで練習
「毎日の練習」でマイクを有効にすると、強調表示された音を追いながら、演奏に応じたフィードバックを受けられます。音やトライアドのガイド付き練習に加え、テンポを調整できるリズムパターンでストロークも練習できます。マイクをオフにしたまま練習することもできます。

クイズで理解を確認
60秒の指板クイズに挑戦。ルート、3度、5度を探し、連続正解を目指しながら、指板のさまざまな場所に慣れていきましょう。

指板上の音を見つける
指板マップで全体の音を表示したり、ひとつの音に注目したりできます。学習ツールを切り替えながら、音名、音程、フォームの関係をつかみましょう。

ハーモニーを理解する
インタラクティブな五度圏で、平行短調、ダイアトニックコード、よく使われるコード進行を確認できます。キーとコードの関係を視覚的に学べます。

弾く前にチューニング
内蔵チューナーは弦の自動検出と手動選択に対応。音が高いか低いか、正しく合っているかを画面で確認できます。

まずはデモから
ラ・マイナーのデモを試せます。アプリ内で一度購入すると、すべてのキーと学習オプションが利用可能になります。サブスクリプションは不要です。

マイクとプライバシー
マイクへのアクセスは任意で、チューニングと練習中のフィードバックに使用します。音声は端末内で処理され、アプリが録音したり、サーバーへ送信したりすることはありません。

指板を理解し、フォームをつなぎ、日々の練習を続けたいギタリストのために。
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **日本語** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Visuels et validation

[Aperçu des huit visuels téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les huit scènes utilisent l’interface guitare dans cette langue. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent les images à examiner pour la fiche. L’icône est commune à toutes les langues. Les images de `android-xr/` sont des brouillons 2D au format console, sans essai sur casque.

La copie de la bannière et des cartes est dans [source/copy.json](source/copy.json), les captures téléphone dans [source/screens-phone](source/screens-phone/). Depuis la racine du dépôt, exécuter `python stores/tools/render-localized-guitar.py ja-JP` pour régénérer la bannière et les huit cartes, puis `node stores/tools/validate.cjs stores/google-play/guitar/ja-JP` pour contrôler les fichiers.

[Retour aux 11 langues de la fiche guitare](../README.md).
