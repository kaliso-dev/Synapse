---
type: guide
tags: [guide, liens, structure]
aliases: [Lier les dossiers, Notes d'index]
---
# Dossiers et notes d'index

Les **dossiers rangent**, les **liens relient**. Un dossier seul ne crée aucun lien dans le graphe : pour qu'un dossier soit relié au reste du vault, on lui donne une **note d'index**.

![[schema-vault.svg]]

## La structure

```text
vault/
├── Accueil.md              la porte d'entrée : liste toutes les notes d'index
├── Projets/
│   ├── Projets.md          note d'index du dossier (même nom que le dossier)
│   ├── Site web.md
│   └── Déménagement.md
├── Personnes/
│   ├── Personnes.md
│   └── Camille Martin.md
├── Fichiers/               images, PDF… (voir Pièces jointes)
└── Modèles/                notes types (voir Utiliser des modèles)
```

## Comment lier les dossiers

1. **Chaque dossier a sa note d'index**, du même nom que le dossier, rangée dedans : `Projets/Projets.md`. Elle dit en une phrase ce que contient le dossier, puis liste ses notes avec un lien chacune (et une demi-ligne d'explication).
2. **Chaque note renvoie à l'index de son dossier** : une ligne `Retour à [[Projets]]` en bas suffit. Le lien existe alors dans les deux sens.
3. **L'[[Accueil]] liste toutes les notes d'index** du premier niveau. Un sous-dossier est listé dans l'index du dossier parent, pas dans l'accueil.
4. **Les liens entre dossiers** se font de note à note, là où c'est utile : la note « Site web » (dans Projets) cite « Camille Martin » (dans Personnes).

Avec ces règles, on atteint chaque note depuis l'accueil en deux ou trois clics, et le graphe montre de vraies « régions » (une couleur par dossier de premier niveau).

## Combien de dossiers

- Peu au premier niveau : entre 3 et 8. Chacun prend une couleur dans le graphe.
- Pas plus de deux niveaux de profondeur : au-delà, des liens valent mieux que des sous-dossiers.
- Un dossier par grande **catégorie de choses** (projets, personnes, cours, sources), pas par date ni par statut : la date et le statut vont dans les propriétés (voir [[Propriétés et tags]]).

## Vérifier

```bash
node synapse/build.mjs --check
```

Cette commande liste les dossiers sans note d'index, les notes pas reliées à l'index de leur dossier, les notes isolées et celles qu'on n'atteint pas depuis l'accueil.

Des exemples de dossiers pour chaque domaine : [[Domaines]]. Retour au [[Guide]].
