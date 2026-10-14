# Android — Google Play : dimensions et préparation

Guide commun à toutes les applications et langues de `stores/google-play/`.
Les tailles ci-dessous sont en pixels. Conserver l'arborescence existante :
`<instrument>/<locale>/icon/`, `phone/`, `tablet-7/`, `tablet-10/`, `desktop/`, `android-xr/`.

## Formats de livraison

| Élément | Taille d'export du projet | Format | Quantité / poids maximal par image |
| --- | --- | --- | --- |
| Icône (`icon/`) | **512 × 512** | PNG RGBA, 32 bits | 1 ; 1 Mio |
| Feature graphic (`icon/`) | **1024 × 500** | PNG RGB 24 bits ou JPEG, sans alpha | 1 ; 15 Mio (console photographiée) |
| Téléphone | 1080 × 1920, ou 1920 × 1080 | PNG RGB ou JPEG | 2–8 ; 8 Mio ; viser au moins 4 |
| Tablette 7 pouces | 1080 × 1920 | PNG RGB ou JPEG | 4–8 dans ce projet ; 8 Mio |
| Tablette 10 pouces | 2560 × 1440 | PNG RGB ou JPEG | 4–8 ; 8 Mio |
| Ordinateur / Chromebook | 1920 × 1080 | PNG RGB ou JPEG | 4–8 ; 8 Mio |
| Android XR — aide publique | 3840 × 2400 ; minimum 1920 × 1200 | PNG ou JPEG, ratio 8:5 | 4–8 ; 8 Mio |

Ces tailles d'export sont nos valeurs de travail, sauf les deux dimensions fixes de `icon/`.
Pour les captures téléphone : côtés de 320 à 3840. La console fournie indique la même plage pour la tablette 7 pouces ; notre profil retient 1080–3840 et quatre images pour satisfaire aussi les recommandations grands écrans.
Tablette 10 pouces et ordinateur : côtés de 1080 à 7680. Ratios 16:9 ou 9:16.

**XR :** la console photographiée indique 16:9 ou 9:16, côtés 720–7680, 15 Mio, contrairement à l'aide publique ci-dessus. Les fichiers actuels dans `android-xr/` sont des brouillons 2D en 2560 × 1440. Le rapport signale cette divergence ; vérifier la cible et faire des captures dans l'environnement XR avant publication. Les vidéos XR sont facultatives.

## Textes

| Fichier | Maximum |
| --- | --- |
| `title.txt` | 30 caractères |
| `short-description.txt` | 80 caractères |
| `full-description.txt` | 4000 caractères |

## Référence à utiliser

- **Ce README** : guide de préparation réutilisable pour chaque application Android.
- **[requirements.json](requirements.json)** : règles communes utilisées par les scripts ; modifier ce fichier si les limites évoluent.
- **`<instrument>/<locale>/validation.json`** : résultat calculé à partir des fichiers présents, jamais une source pour décider des tailles. Relancer la validation après toute modification, suppression ou déplacement.
- **`<instrument>/<locale>/source/requirements.json`** : relevé historique de la console initiale, conservé comme provenance ; les scripts ne le lisent pas.

Les plateformes optionnelles sont contrôlées lorsque leur dossier existe. Le validateur accepte les quantités autorisées, sans imposer systématiquement huit captures. Il vérifie les dimensions réelles, le format, les canaux et la profondeur de couleur, le poids, le décodage complet et les limites de texte. Le rapport comprend une empreinte SHA-256 par fichier. Une erreur remplace l'ancien rapport de réussite par un rapport d'échec.

Depuis la racine du dépôt :

```sh
npm --prefix stores/tools ci
node stores/tools/export-feature.cjs stores/google-play/guitar/en-US
node stores/tools/validate.cjs stores/google-play/guitar/en-US
```

Pour une autre application ou langue, remplacer le dernier chemin. L'export utilise `source/feature-graphic-original.png`, conserve les proportions, centre le recadrage et produit le PNG opaque dans `icon/`. Vérifier visuellement que les textes restent entiers.

Références : [aide officielle Google Play](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en), vérifiée le 14 octobre 2026, et les six photos de console fournies pour ce projet. Confirmer les exigences de la console lors d'une nouvelle publication.
