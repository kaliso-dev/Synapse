# Synapse

**Ton vault Obsidian en graphe vivant, publié sur GitHub Pages.** Chaque note est un point, chaque `[[lien]]` un trait ; on clique sur un point pour lire la note, on cherche, on zoome, on suit les liens. Pour n'importe quel sujet : études, entreprise, recherche, projet de code, création, vie perso.

![Synapse : le graphe du vault d'exemple, une note ouverte dans le lecteur](.github/apercu-clair.png)

- **Démo** (le vault d'exemple de ce dépôt, qui est aussi le guide) : https://kaliso-dev.github.io/Synapse/
- **Format Obsidian** : un dossier de notes Markdown, des `[[liens]]`, des propriétés, des tags. On écrit dans [Obsidian](https://obsidian.md) (ou on demande à Claude), Synapse affiche.
- **Statique** : un dossier `_site/` à héberger sur GitHub Pages, sans serveur, sans compte, sans base de données. Aucune dépendance : Node 18 suffit pour construire.
- **Thème clair et sombre**, téléphone et ordinateur.

## L'installer avec Claude (le plus simple)

Ouvre [Claude Code](https://claude.ai/code) et donne-lui ce message, en remplaçant le sujet :

> Installe-moi Synapse en suivant https://github.com/kaliso-dev/Synapse/blob/main/INSTALLER.md : crée mon dépôt et mon vault Obsidian pour **[ton sujet : mes études de droit, mon entreprise de menuiserie, ma thèse…]**.

Claude te pose quelques questions (le sujet, public ou privé, le nom), crée le dépôt (ou te dit comment le créer en un clic), construit le vault avec ses dossiers et ses notes déjà reliées, et met le site en ligne. Il ne te restera qu'un réglage à faire sur GitHub, dont il te donne le lien.

## L'installer à la main

1. Copie dans ton dépôt le dossier `synapse/` et le fichier `.github/workflows/synapse.yml`.
2. Mets tes notes dans `vault/` (ou ailleurs, voir la configuration), avec une note `Accueil.md`.
3. Écris `synapse.config.json` à la racine :
   ```json
   { "titre": "Mon cerveau", "vault": "vault", "fichiers": "vault", "accueil": "Accueil", "exclure": ["Modèles"] }
   ```
4. Vérifie : `node synapse/build.mjs --check`, puis envoie sur GitHub (branche `main`).
5. Sur GitHub : **Settings → Pages → Source : GitHub Actions**. Le site est en ligne une minute plus tard, à l'adresse `https://<ton-compte>.github.io/<ton-depot>/`.

Pour regarder sans rien publier : `node synapse/serve.mjs`, puis http://localhost:4000.

## Construire un bon vault

La méthode tient en trois règles, détaillées dans le guide ([exemple/Guide](exemple/Guide/Guide.md)) :

1. **Une note, une idée.** Le nom du fichier est le titre ; il est clair et unique.
2. **Des liens partout.** `[[Nom de la note]]` dans le texte, là où l'idée est citée.
3. **Les dossiers rangent, les liens relient.** Chaque dossier a une note d'index du même nom qui liste ses notes ; chaque note renvoie à son index ; l'`Accueil` relie les index. `node synapse/build.mjs --check` vérifie que tout est relié.

Des structures toutes prêtes par domaine : [exemple/Domaines](exemple/Domaines/Domaines.md). Des notes types : [exemple/Modèles](exemple/Modèles).

## Commandes

| Commande | Effet |
| --- | --- |
| `node synapse/build.mjs` | construit le site dans `_site/` |
| `node synapse/build.mjs --check` | liste les liens cassés, notes isolées, dossiers sans note d'index, notes hors d'atteinte depuis l'accueil |
| `node synapse/build.mjs --strict` | comme `--check`, en erreur s'il y a un lien cassé |
| `node synapse/serve.mjs` | aperçu local sur http://localhost:4000 (`--port` pour en changer), relu à chaque clic sur ⟳ |

## Configuration

`synapse.config.json`, à la racine du dépôt (toutes les clés sont facultatives) :

| Clé | Par défaut | Sens |
| --- | --- | --- |
| `titre` | `"Mon cerveau"` | le nom affiché en haut de la page |
| `vault` | `"vault"` | le dossier du vault depuis la racine du dépôt (`"."` si tout le dépôt est le vault) |
| `fichiers` | `"vault"` | ce que la page peut ouvrir en plus des notes : `"vault"` (les pièces jointes du vault), `"depot"` (tout le dépôt, pour qu'une note cite du code : **dépôt public seulement**), `"aucun"` |
| `sortie` | `"_site"` | le dossier construit |
| `accueil` | `"Accueil"` | la note d'entrée, pour la vérification |
| `exclure` | `[]` | des dossiers du vault à ne pas montrer, par exemple `["Modèles"]` |
| `groupes` | `{}` | renommer ou colorer un dossier de premier niveau : `{ "Projets": { "nom": "Mes projets", "couleur": "#30a46c" } }` (`""` = les notes à la racine) |

## Ce qui est publié

> [!WARNING]
> Un site GitHub Pages est **public**, même quand le dépôt est privé. Toutes les notes et les pièces jointes du vault y sont lisibles. Pour un vault personnel ou confidentiel : garde le dépôt privé, supprime `.github/workflows/synapse.yml`, et utilise l'aperçu local ou Obsidian.

Jamais publiés, quoi qu'il arrive : les fichiers `.env`, les clés (`.pem`, `.key`, `id_rsa`…), `.npmrc`, `.netrc`, les dossiers `.git`, `.obsidian`, `.trash` et `node_modules`. Les fichiers de plus de 20 Mo (ou les textes de plus de 600 Ko) sont listés mais pas copiés.

## Ce que Synapse comprend du format Obsidian

Les liens `[[Note]]`, `[[Note|texte]]`, `[[Note#Partie]]`, les notes à créer (liens vers une note absente), les alias (`aliases:`), les propriétés en en-tête (avec des liens dedans), les tags (`tags:` et `#tag` dans le texte), les images et pièces jointes (`![[image.png]]`, `![[image.png|300]]`, `[[document.pdf]]`), les encadrés (`> [!tip]`), les cases à cocher, les tableaux, le code avec couleurs, le surlignage `==texte==` et les commentaires `%%…%%` (masqués).

Pas encore : les Canvas, Dataview, Mermaid, les formules mathématiques ; une note intégrée (`![[Note]]`) s'affiche comme un lien.

## Licence

[MIT](LICENSE) : libre d'utiliser, de modifier et de partager.
