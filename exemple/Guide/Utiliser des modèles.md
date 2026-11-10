---
type: guide
tags: [guide, bases]
aliases: [Modèles de notes]
---
# Utiliser des modèles

Le dossier `Modèles/` contient des notes types, déjà structurées. Il n'est pas dessiné dans le graphe (il est dans `exclure` de `synapse.config.json`).

| Modèle | Pour |
| --- | --- |
| `Modèles/Note.md` | une idée, un concept, n'importe quoi |
| `Modèles/Index de dossier.md` | la note d'index d'un nouveau dossier (voir [[Dossiers et notes d'index]]) |
| `Modèles/Projet.md` | un projet, avec objectif, étapes, statut |
| `Modèles/Personne.md` | une personne : rôle, contact, notes liées |
| `Modèles/Réunion.md` | un compte rendu daté, avec décisions et actions |
| `Modèles/Source.md` | un livre, un article, une vidéo, un cours |
| `Modèles/Journal.md` | une note par jour ou par semaine |

## Dans Obsidian

Active le module **Modèles** (Réglages → Modules principaux → Modèles) : le dossier `Modèles` est déjà réglé. Puis, dans une note vide, commande « Insérer un modèle ». `{{title}}` devient le nom de la note, `{{date}}` la date du jour.

## Avec Claude

Demande simplement « crée une note Projet pour … » : il partira du bon modèle et la reliera à l'index (voir [[Travailler avec Claude]]).

Retour au [[Guide]].
