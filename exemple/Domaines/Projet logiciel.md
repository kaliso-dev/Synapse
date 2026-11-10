---
type: domaine
tags: [domaines]
---
# Projet logiciel

Le vault peut vivre dans le dépôt du code, dans `docs/vault/`. Avec `"fichiers": "depot"` dans `synapse.config.json`, Synapse publie aussi le code : un nom de fichier écrit entre accents graves dans une note (`src/app.js`) devient un lien qui ouvre le fichier.

| Dossier | Contient |
| --- | --- |
| `Fonctionnalités/` | une note par fonctionnalité : ce qu'elle fait, où est le code, son état |
| `Technique/` | architecture, base de données, déploiement, variables d'environnement |
| `Code/` | une fiche par fichier ou module important |
| `Versions/` | une note par version publiée, avec ses changements |
| `Bugs/` | un bug par note : symptôme, cause, correctif |
| `Décisions/` | les choix techniques et leur raison |

**Les liens qui comptent** : chaque fonctionnalité cite ses fichiers de code et les décisions qui la concernent ; chaque version liste les fonctionnalités et bugs qu'elle contient. Demande à Claude de mettre le vault à jour à la fin de chaque tâche (voir [[Travailler avec Claude]]).

> [!warning] Dépôt privé
> Avec `"fichiers": "depot"`, tout le code est publié sur le site. Ne le fais que pour un dépôt déjà public.

Retour aux [[Domaines]].
