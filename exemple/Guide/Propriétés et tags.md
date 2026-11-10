---
type: guide
tags: [guide, structure]
statut: à jour
---
# Propriétés et tags

## Les propriétés

L'en-tête d'une note, entre deux lignes `---` tout en haut, contient ses **propriétés** (Obsidian les affiche sous le titre, Synapse aussi) :

```yaml
---
type: projet
statut: en cours
date: 2026-03-12
responsable: "[[Camille Martin]]"
aliases: [Refonte du site]
tags: [client, web]
---
```

- `type` dit quelle sorte de note c'est (projet, personne, réunion, cours, source…). Garde la même liste de types dans tout le vault.
- `statut`, `date`, `responsable`… : ce dont ton domaine a besoin. Un lien entre guillemets (`"[[Camille Martin]]"`) compte comme un vrai lien dans le graphe.
- `aliases` : d'autres noms pour la note. `[[Refonte du site]]` mènera à la note même si elle s'appelle autrement.
- `tags` : voir plus bas.

## Les tags

Un tag regroupe des notes **à travers** les dossiers : `#urgent`, `#idée`, `#à-relire`. On l'écrit dans la propriété `tags`, ou directement dans le texte avec un dièse, comme ici : #exemple.

Dans Synapse, cliquer sur un tag filtre le graphe sur les notes qui le portent ; l'option « Tags » du panneau Affichage les dessine en losanges.

> [!info] Dossier, tag ou lien ?
> Le **dossier** dit ce qu'est une note (une seule réponse). Le **tag** dit un état ou un thème transversal (plusieurs possibles). Le **lien** dit avec quoi elle est en rapport, et pourquoi.

Retour au [[Guide]].
