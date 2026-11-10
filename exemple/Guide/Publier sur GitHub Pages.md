---
type: guide
tags: [guide, outils]
---
# Publier sur GitHub Pages

Le dépôt contient une action GitHub (`.github/workflows/synapse.yml`) qui, à chaque envoi sur la branche `main`, construit le site avec `node synapse/build.mjs` et le publie.

## La première fois

1. Sur GitHub, dans le dépôt : **Settings → Pages**.
2. Sous « Build and deployment », **Source : GitHub Actions**.
3. Onglet **Actions** : relance la dernière exécution « Synapse » si elle avait échoué avant ce réglage.
4. L'adresse du site s'affiche dans Settings → Pages, du type `https://ton-nom.github.io/ton-depot/`.

## Ce qu'il faut savoir

> [!danger] Un site GitHub Pages est public
> Toutes les notes et pièces jointes publiées sont lisibles par n'importe qui qui a l'adresse, même si le dépôt est privé. Pour un vault personnel ou confidentiel : ne publie pas, et utilise l'aperçu local ci-dessous.

- Un dépôt **public** peut publier gratuitement. Un dépôt **privé** ne peut publier qu'avec un compte GitHub payant (et le site reste public).
- Le site se met à jour environ une minute après chaque envoi. Le bouton ⟳ en bas à gauche relit la dernière version.

## Aperçu local, sans rien publier

```bash
node synapse/serve.mjs
```

Puis ouvrir http://localhost:4000. La page relit le vault à chaque clic sur ⟳ : pratique pendant qu'on écrit dans [[Ouvrir le vault dans Obsidian|Obsidian]].

Retour au [[Guide]].
