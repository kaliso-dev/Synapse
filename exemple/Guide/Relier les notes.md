---
type: guide
tags: [guide, liens]
---
# Relier les notes

Les liens sont ce qui transforme un tas de fichiers en cerveau. Dans Obsidian (et dans Synapse), un lien s'écrit entre **doubles crochets** avec le nom de la note.

| On écrit | Ce que ça donne |
| --- | --- |
| `[[Créer une note]]` | un lien vers la note « Créer une note » |
| `[[Créer une note\|cette page]]` | le même lien, affiché « cette page » |
| `[[Propriétés et tags#Les tags]]` | un lien vers une partie précise d'une note |
| `![[schema-vault.svg]]` | une image affichée dans la note (voir [[Pièces jointes]]) |
| `[[Une note pas encore écrite]]` | un lien vers une note **à créer** |

On n'écrit jamais le dossier : `[[Créer une note]]` suffit, où que soit la note. Le dossier ne sert que si deux notes ont le même nom (à éviter).

## Les liens dans les deux sens

Quand la note A cite la note B, la note B le sait : en bas de chaque note, Synapse affiche « Mentionnée dans », la liste des notes qui pointent vers elle (Obsidian appelle ça les *backlinks*). Inutile donc d'écrire le lien des deux côtés, sauf entre une note et l'index de son dossier (voir [[Dossiers et notes d'index]]).

## Où mettre des liens

- Dans le texte, là où l'idée est citée : c'est le plus utile, car la phrase autour explique le lien.
- En bas de la note, une ligne `Lié à : [[…]], [[…]]`.
- Dans une propriété de l'en-tête, par exemple `projet: "[[Site web]]"` (voir [[Propriétés et tags]]).

## Les notes à créer

Un lien vers une note qui n'existe pas encore n'est pas une erreur : c'est une note à écrire. Le graphe la dessine en cercle vide, et la commande `node synapse/build.mjs --check` les liste. Par exemple, ce lien est volontairement vide : [[Une note pas encore écrite]].

Retour au [[Guide]].
