# Synapse : à lire avant tout travail

Ce dépôt est un **kit** : un outil qui affiche un vault Obsidian comme un graphe, publiable sur GitHub Pages, plus un vault d'exemple qui sert de guide.

- **On te demande d'installer Synapse pour quelqu'un** (« installe-moi ça », « je veux la même vue », « crée-moi un vault ») : suis [INSTALLER.md](INSTALLER.md), étape par étape. Tu travailles alors dans le dépôt **de la personne**, pas dans celui-ci.
- **On te demande de modifier le kit lui-même** : lis ce qui suit.

## Le kit

| Fichier | Rôle |
| --- | --- |
| `synapse/vault.mjs` | Markdown façon Obsidian vers HTML (tout est échappé), liens `[[…]]`, alias, tags, propriétés, pièces jointes, graphe |
| `synapse/build.mjs` | lit `synapse.config.json` et le vault, écrit le site dans `_site/` ; `--check` vérifie les liens et la structure |
| `synapse/serve.mjs` | aperçu local sur http://localhost:4000, relit le vault à chaque demande |
| `synapse/app/` | la page : `index.html`, `synapse.js` (graphe sur canvas, lecteur, recherche), `synapse.css` (thème clair et sombre), `icon.svg` |
| `synapse/CLAUDE-vault.md` | les règles du vault, copiées dans le `CLAUDE.md` du dépôt de chaque personne |
| `exemple/` | le vault d'exemple, publié par ce dépôt sur sa propre page GitHub Pages |
| `.github/workflows/synapse.yml` | construit et publie le site à chaque push sur `main` |

## Règles

- **Aucune dépendance** : Node 18 ou plus, rien d'autre. Pas de `package.json`, pas de bibliothèque dans la page.
- **CSP stricte** dans `index.html` : ni script ni style en ligne. Une couleur ou une taille calculée en JavaScript passe par une variable CSS (`style.setProperty`).
- **Tout ce qui vient d'une note est échappé** (`esc`) : le seul HTML produit est celui écrit dans `vault.mjs` et `synapse.js`. Seuls les liens `http(s)` et `mailto` sortent du site.
- **Rien de secret ne doit être publié** : `build.mjs` écarte `.env`, clés et fichiers d'identifiants ; garde ces protections.
- **Les deux thèmes** : toute nouvelle couleur est une variable dans `:root` (clair) et dans les deux blocs sombres de `synapse.css` ; le canvas lit les variables `--g-*`.
- Textes de l'interface en français.

## Tester

```bash
node synapse/build.mjs --check   # le vault d'exemple : un seul lien cassé, volontaire
node synapse/build.mjs           # écrit _site/
node synapse/serve.mjs           # http://localhost:4000 ; ?debug=1 expose window.__cv pour les tests
```

Vérifier dans un navigateur : graphe, clic sur une note, fichier, recherche (`Ctrl K`), thème clair et sombre, largeur de téléphone (390 px), console sans erreur.
