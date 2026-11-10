---
type: guide
tags: [guide, bases]
---
# Créer une note

Une note est un fichier `.md`. **Son nom de fichier est son titre** : c'est lui qu'on écrit dans les liens, donc il doit être clair et unique.

## Bien nommer

- Un nom qui se comprend seul : `Réunion du 12 mars avec le client`, pas `réunion 3`.
- Des majuscules et des accents si on veut, des espaces aussi.
- Jamais ces caractères, qu'Obsidian refuse : `/ \ : * ? " < > | # ^ [ ]`.
- Pas deux notes du même nom, même dans deux dossiers différents : les liens deviendraient ambigus.

## Le contenu

```markdown
---
type: concept
tags: [exemple]
---
# Titre de la note

Une ou deux phrases qui disent de quoi il s'agit.

## Détails
…

Lié à : [[Une autre note]], [[Encore une]]
```

L'en-tête entre les deux lignes `---` est facultatif : voir [[Propriétés et tags]]. Pour démarrer plus vite, pars d'un modèle : voir [[Utiliser des modèles]].

> [!warning] Une note sans lien est une note perdue
> Avant de fermer une nouvelle note, ajoute au moins un lien vers elle depuis l'index de son dossier. Voir [[Relier les notes]].

Retour au [[Guide]].
