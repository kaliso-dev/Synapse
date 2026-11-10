# Installer Synapse pour quelqu'un

> **Ce fichier s'adresse à Claude.** Une personne t'a donné ce dépôt et veut « la même vue » : ses propres notes, dans un vault Obsidian, affichées comme un graphe qu'elle peut ouvrir dans son navigateur. Suis ces étapes dans l'ordre. Parle à la personne dans sa langue, simplement : elle n'est peut-être pas développeuse. Ne lui demande que ce que tu ne peux pas faire toi-même.

## Ce que tu vas livrer

Un dépôt GitHub **à la personne** qui contient :

```text
son-depot/
├── vault/                      ses notes, au format Obsidian (dossiers + notes .md + [[liens]])
│   ├── Accueil.md              la porte d'entrée, qui relie les notes d'index
│   ├── <Dossier>/<Dossier>.md  une note d'index par dossier
│   ├── Fichiers/               images, PDF…
│   ├── Modèles/                notes types (copiées de ce kit)
│   └── .obsidian/              réglages Obsidian (copiés de ce kit)
├── synapse/                    l'outil (copié tel quel de ce kit, ne pas modifier)
├── synapse.config.json         titre, dossier du vault, ce qui est publié
├── .github/workflows/synapse.yml   publie le site sur GitHub Pages à chaque envoi
├── CLAUDE.md                   les règles du vault, pour les prochains Claude
└── .gitignore
```

Et, si la personne le veut, un site `https://<compte>.github.io/<dépôt>/` qui montre le graphe.

Le vault d'exemple de ce kit (`exemple/`) est à la fois une démonstration et le guide de la méthode : lis au moins `exemple/Accueil.md`, `exemple/Guide/Dossiers et notes d'index.md`, `exemple/Guide/Relier les notes.md`, `exemple/Guide/Propriétés et tags.md` et la note de `exemple/Domaines/` la plus proche du domaine de la personne.

## 1. Poser les questions, en un seul message

1. **Le sujet** : à quoi va servir ce vault ? (études, entreprise, recherche, un projet, une passion, sa vie perso…) Qu'est-ce qu'on y mettra ?
2. **Ce qui existe déjà** : des notes, des documents à importer, un vault Obsidian, un dépôt GitHub ?
3. **Public ou privé** : un site GitHub Pages est **lisible par tout le monde** (même depuis un dépôt privé). Le contenu peut-il être public ? Si non : dépôt privé, pas de site, aperçu local et Obsidian seulement.
4. **Le nom** : comment appeler le vault (le titre du site) et le dépôt.

Si la personne ne répond pas à tout : sujet = ce qu'elle a décrit, privé par défaut si le contenu semble personnel, titre = « Mon cerveau », dépôt = `synapse`.

## 2. Le dépôt

- **La personne a déjà un dépôt** (par exemple le code d'un projet) : installe Synapse dedans. Le vault va dans `docs/vault/` pour un projet de code, sinon dans `vault/`.
- **Sinon, il faut un nouveau dépôt** :
  - si tu as un outil pour créer un dépôt (`gh repo create <nom> --public` ou `--private`, ou un outil GitHub `create_repository`) et que la personne est d'accord, crée-le ;
  - sinon, demande-lui de le créer : [github.com/new](https://github.com/new), le nom choisi, **Public** si elle veut le site gratuit, **ne rien cocher** (pas de README). Si tu tournes dans Claude Code sur le web, elle doit aussi donner l'accès à l'app Claude : [github.com/apps/claude/installations/select_target](https://github.com/apps/claude/installations/select_target).

Clone ensuite son dépôt et travaille dedans.

## 3. Copier l'outil

```bash
git clone --depth 1 https://github.com/kaliso-dev/Synapse /tmp/synapse-kit
cd <son-depot>
cp -r /tmp/synapse-kit/synapse ./synapse
mkdir -p .github/workflows && cp /tmp/synapse-kit/.github/workflows/synapse.yml .github/workflows/
mkdir -p vault/Fichiers && cp -r /tmp/synapse-kit/exemple/Modèles /tmp/synapse-kit/exemple/.obsidian vault/
cp -n /tmp/synapse-kit/.gitignore .gitignore   # ou ajoute ses lignes au .gitignore existant
```

Puis écris `synapse.config.json` à la racine :

```json
{
  "titre": "Le titre choisi",
  "vault": "vault",
  "fichiers": "vault",
  "sortie": "_site",
  "accueil": "Accueil",
  "exclure": ["Modèles"],
  "groupes": { "": { "nom": "Accueil" } }
}
```

| Clé | Sens |
| --- | --- |
| `titre` | le nom affiché en haut de la page et dans l'onglet |
| `vault` | le dossier du vault, depuis la racine du dépôt (`.` si tout le dépôt est le vault) |
| `fichiers` | ce que la page peut ouvrir en plus des notes : `"vault"` (les pièces jointes du vault, par défaut), `"depot"` (tous les fichiers du dépôt : **seulement pour un dépôt déjà public**, par exemple pour qu'une note cite le code), `"aucun"` |
| `sortie` | où le site est construit (ignoré par Git) |
| `accueil` | le nom de la note d'accueil, utilisée par la vérification |
| `exclure` | dossiers du vault à ne pas montrer (les modèles) |
| `groupes` | facultatif : renommer ou colorer un dossier de premier niveau, `"Projets": { "nom": "Mes projets", "couleur": "#30a46c" }` ; `""` désigne les notes à la racine |

Il faut Node 18 ou plus pour les commandes locales (`node --version`). Sur GitHub, le site se construit tout seul, même si la personne n'a pas Node.

## 4. Créer le vault

### La structure

1. Choisis **3 à 8 dossiers de premier niveau** adaptés au domaine : un dossier par **catégorie de choses** (Projets, Personnes, Cours, Sources, Clients…), jamais par date ni par statut. Inspire-toi de `exemple/Domaines/`. Deux niveaux de profondeur au plus.
2. Choisis une **liste courte de types de notes** (`type:` dans les propriétés), par exemple `projet, personne, réunion, source, idée, index`.
3. Si la personne veut décider, propose la structure en une liste courte et attends son accord. Sinon, fais-la et dis-lui laquelle tu as choisie.

### Les fichiers

1. `vault/Accueil.md` : deux ou trois phrases sur le but du vault, puis la liste des notes d'index, chacune avec une demi-ligne d'explication.
2. Pour chaque dossier `X` : `vault/X/X.md`, sa **note d'index** (pars de `Modèles/Index de dossier.md`). Elle dit ce que contient le dossier, renvoie à l'`[[Accueil]]`, et liste ses notes.
3. Les premières notes : à partir de ce que la personne t'a donné (documents, notes existantes, ce qu'elle t'a raconté). Pars du modèle du bon type. **N'invente jamais un fait** sur la personne ou son domaine : ce que tu ne sais pas s'écrit « À compléter ».
4. Les pièces jointes vont dans `vault/Fichiers/` et se citent avec `![[image.png]]` (affichée) ou `[[document.pdf]]` (lien).

### Comment relier les notes et les dossiers

- Un lien s'écrit `[[Nom de la note]]`, sans dossier ni `.md`. Jamais de lien Markdown `[texte](chemin.md)` vers une note, jamais de chemin.
- Le **nom de fichier est le titre** : clair, unique dans tout le vault, sans `/ \ : * ? " < > | # ^ [ ]`.
- Chaque note se termine par `Retour à [[<Index de son dossier>]]`, et l'index liste la note : le lien existe dans les deux sens.
- L'Accueil liste les index du premier niveau ; l'index d'un dossier liste les index de ses sous-dossiers.
- Les liens entre dossiers se font de note à note, **dans le texte**, là où l'idée est citée (la phrase autour explique le lien). Une propriété peut aussi porter un lien : `client: "[[Société Martin]]"`.
- Un lien vers une note qui n'existe pas encore est permis : c'est une « note à créer ». Ne t'en sers que si la personne doit l'écrire bientôt.
- Les tags (`tags: [urgent]` ou `#urgent` dans le texte) servent aux thèmes et états transversaux, pas à remplacer les dossiers.

### Importer un vault Obsidian existant

Mets-le tel quel dans `vault/` (ou règle `"vault"` sur son dossier). Garde ses notes, ses noms et son `.obsidian/` (sauf `workspace*.json`). Lance la vérification, puis **propose** les corrections (notes d'index, liens manquants) avant de déplacer ou renommer quoi que ce soit : un renommage casse les liens.

## 5. Vérifier

```bash
node synapse/build.mjs --check
```

Corrige tout ce qui est listé : liens cassés (sauf les notes à créer voulues), notes isolées, dossiers sans note d'index, notes pas reliées à l'index de leur dossier, notes qu'on n'atteint pas depuis l'accueil. Recommence jusqu'à « Tout est relié ».

Puis construis le site pour être sûr qu'il passe : `node synapse/build.mjs` (il écrit `_site/`, ignoré par Git). Si tu peux ouvrir un navigateur, `node synapse/serve.mjs` puis http://localhost:4000.

## 6. Le CLAUDE.md du dépôt

Copie `synapse/CLAUDE-vault.md` dans le `CLAUDE.md` à la racine du dépôt (ajoute-le à la fin s'il existe déjà), et remplis ses deux listes : les dossiers du vault et les types de notes. Ce sont les règles que suivra chaque Claude qui travaillera ensuite sur le vault.

## 7. Envoyer et publier

1. Commit et push sur `main` (un message clair, par exemple « Création du vault et de Synapse »).
2. **Si la personne veut le site** (dépôt public, ou compte GitHub payant pour un dépôt privé), elle doit faire un réglage, une seule fois. Donne-lui le lien direct : `https://github.com/<compte>/<dépôt>/settings/pages`, puis « Build and deployment » → **Source : GitHub Actions**.
3. Si l'action « Synapse » a échoué avant ce réglage (« Get Pages site failed »), relance-la : onglet **Actions** → Synapse → « Re-run all jobs » (ou un nouveau push).
4. Le site est en ligne une minute plus tard : `https://<compte>.github.io/<dépôt>/` (l'adresse exacte est affichée dans Settings → Pages). Vérifie qu'il s'ouvre si tu peux.

Sans site : retire `.github/workflows/synapse.yml` (sinon l'action échoue à chaque envoi), et la personne regarde son graphe avec `node synapse/serve.mjs`, ou dans Obsidian (vue Graphe).

## 8. Le message de fin à la personne

En quelques lignes :

- le lien du dépôt, et celui du site s'il y en a un ;
- ce que contient le vault (les dossiers, en une phrase chacun) ;
- **pour écrire** : installer [Obsidian](https://obsidian.md), récupérer le dépôt sur son ordinateur avec [GitHub Desktop](https://desktop.github.com) (File → Clone repository), puis dans Obsidian « Ouvrir un dossier comme coffre » → le dossier `vault`. Pour renvoyer ses changements : GitHub Desktop (Commit puis Push) ou le module communautaire Obsidian Git ;
- ou simplement **te demander** : « ajoute une note sur… », « range le vault », « crée un dossier pour… ».

## Dépannage

| Problème | Cause et solution |
| --- | --- |
| Le site affiche une erreur 404 | Pages n'est pas activé (étape 7.2), ou l'action a échoué : onglet Actions |
| L'action échoue à « configure-pages » | Pages n'est pas réglé sur « GitHub Actions », ou le dépôt est privé sur un compte gratuit |
| Une note n'apparaît pas | elle n'est pas en `.md`, est dans un dossier de `exclure`, dans `.obsidian/`, ou ignorée par `.gitignore` |
| Une image ne s'affiche pas | elle n'est pas dans le vault (avec `"fichiers": "vault"`), ou fait plus de 20 Mo |
| « data.json est introuvable » | le site n'a pas été construit : `node synapse/build.mjs`, ou regarde l'action |
| Le site ne change pas | il faut un push sur `main`, puis une minute ; le bouton ⟳ en bas à gauche relit la dernière version |
