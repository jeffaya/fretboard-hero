# Guitar Fretboard Hero — Google Play — zh-CN

Fiche **简体中文**, pour l'application guitare. Code de langue dans l'application : `zh-CN` ; langue de la fiche Google Play : `zh-CN`.

Traduction de la [fiche anglaise](../en-US/README.md), avec les termes musicaux adaptés à la langue. Copier uniquement le contenu des trois blocs ci-dessous dans la console. Le nom de marque reste identique dans toutes les langues.

## Textes à copier-coller

### Nom de l'application — 21 / 30 caractères

```text
Guitar Fretboard Hero
```

### Brève description — 30 / 80 caractères

```text
通过每日练习、指板测验和调音器，学习吉他的音符、音阶与和弦。
```

### Description complète — 690 / 4 000 caractères

```text
让吉他指板变得更熟悉。Guitar Fretboard Hero 将引导练习、可视化学习工具、指板测验和调音器集于一款应用。

养成每日练习的习惯
在同一调性中完成五项练习：寻找根音、弹奏音阶、连接三和弦、练习节奏，以及探索五声音阶指型。清晰的六线谱、音名和音级标记，帮助你理解正在弹奏的内容。按自己的节奏完成步骤，并重复练习。

连接指板上的把位
探索五个五声音阶把位、大小三和弦、转位，以及 CAGED 和弦指型。突出显示某个音级，专注练习一个把位，或观察指型如何在六根琴弦上相互连接。

跟随麦克风反馈练习
在每日练习中开启麦克风，跟随高亮音符弹奏并获得反馈。使用音符和三和弦引导练习，或通过可调速度的节奏型练习扫弦。你也可以关闭麦克风进行练习。

检验你的指板知识
挑战 60 秒指板测验。寻找根音、三度音和五度音，争取连续答对，并随着练习逐步熟悉更广的指板区域。

找到每一个音
使用指板图查看整个琴颈上的音符，或一次只关注一个音。在不同学习工具之间切换，理解音名、音程与指型之间的联系。

理解和声关系
探索交互式五度圈、关系小调、调内和弦和常见和弦进行。直观了解调性与和弦之间的关系。

弹奏前先调音
内置吉他调音器支持自动识别琴弦，也可以手动选择。调音界面会显示音高偏高、偏低，还是准确。

从演示模式开始
体验 A 小调演示模式。一次性应用内购买即可解锁全部调性和学习选项，无需订阅。

麦克风隐私
麦克风权限为可选项，用于调音和练习时的实时反馈。音频在你的设备上处理，应用不会录制或上传音频。

为希望熟悉指板、连接指型，并更轻松地坚持练习的吉他爱好者而设计。
```

## Textes alternatifs

[alt-text.json](alt-text.json) contient 10 textes en **简体中文** : l'icône, l'image de présentation et les huit thèmes de captures, dans le même ordre que la fiche anglaise. Les identifiants techniques restent identiques ; seules les valeurs sont traduites. Chaque texte est limité à 140 caractères.

## Visuels et validation

[Aperçu des huit visuels téléphone](overview-phone.jpg) · [Bannière Google Play](icon/feature-graphic-1024x500.png) · [Rapport de validation](validation.json)

Les huit scènes utilisent l’interface guitare dans cette langue. Les dossiers `phone/`, `tablet-7/`, `tablet-10/` et `desktop/` contiennent les images à examiner pour la fiche. L’icône est commune à toutes les langues. Les images de `android-xr/` sont des brouillons 2D au format console, sans essai sur casque.

La copie de la bannière et des cartes est dans [source/copy.json](source/copy.json), les captures téléphone dans [source/screens-phone](source/screens-phone/). Depuis la racine du dépôt, exécuter `python stores/tools/render-localized-guitar.py zh-CN` pour régénérer la bannière et les huit cartes, puis `node stores/tools/validate.cjs stores/google-play/guitar/zh-CN` pour contrôler les fichiers.

[Retour aux 11 langues de la fiche guitare](../README.md).
