---
type: guide
tags: [guide, outils]
---
# Travailler avec Claude

Claude peut créer et tenir le vault à jour. Le fichier `CLAUDE.md` à la racine du dépôt lui donne les règles (il le lit avant chaque travail).

## Ce qu'on peut lui demander

- « Ajoute une note sur … » : il choisit le dossier, part du bon modèle ([[Utiliser des modèles]]), écrit la note et la relie à l'index du dossier.
- « Range le vault » : il vérifie avec `node synapse/build.mjs --check` et corrige les liens cassés, les notes isolées, les dossiers sans index.
- « Crée un dossier pour … » : il crée le dossier, sa note d'index et le lien depuis l'[[Accueil]] (voir [[Dossiers et notes d'index]]).
- « Résume ce document dans le vault » : il crée une note Source, et des notes pour les idées importantes, reliées entre elles.

## Les règles qu'il suit

1. Une note par idée ou par chose, un nom clair et unique ([[Créer une note]]).
2. Des `[[liens]]` Obsidian, jamais de chemins.
3. Chaque note reliée à l'index de son dossier, chaque index relié à l'accueil.
4. Vérifier avec `--check` avant d'envoyer, puis envoyer sur GitHub pour mettre le site à jour.

Retour au [[Guide]].
