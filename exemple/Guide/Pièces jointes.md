---
type: guide
tags: [guide, fichiers]
---
# Pièces jointes

Les images, PDF, tableurs et autres fichiers vont dans le dossier `Fichiers/` du vault (Obsidian peut les y ranger tout seul : c'est réglé dans `.obsidian/app.json`).

- `![[schema-vault.svg]]` affiche l'image dans la note.
- `![[schema-vault.svg|300]]` l'affiche sur 300 pixels de large.
- `[[schema-vault.svg]]` met un simple lien vers le fichier.
- `![texte](https://exemple.org/image.png)` affiche une image prise sur le web.

![[schema-vault.svg|360]]

Dans Synapse, l'onglet **Fichiers** liste les pièces jointes ; un fichier cité par une note apparaît dans le graphe (carré) quand l'option « Fichiers » est cochée.

> [!warning] Ce qui est publié est public
> Sur GitHub Pages, chaque pièce jointe du vault est téléchargeable par n'importe qui. Rien de confidentiel dans `Fichiers/` si le site est en ligne : voir [[Publier sur GitHub Pages]].

Les fichiers de plus de 20 Mo (et les fichiers texte de plus de 600 Ko) sont listés mais pas publiés.

Retour au [[Guide]].
