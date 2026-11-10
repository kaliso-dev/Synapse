# Le vault : règles pour Claude

Ce dépôt contient un vault Obsidian (dossier donné par `"vault"` dans `synapse.config.json`), affiché comme un graphe par Synapse (`synapse/`, à ne pas modifier sans demande). Le site se reconstruit tout seul à chaque push sur `main`.

**Dossiers du vault** (un dossier par catégorie de choses, chacun avec sa note d'index du même nom) :
- `À remplir à l'installation` : ce qu'il contient

**Types de notes** (propriété `type:`) : `À remplir à l'installation`

## À chaque travail sur le vault

1. **Lire avant d'écrire** : `Accueil.md` et la note d'index du dossier concerné. Chercher si une note existe déjà sur le sujet (par son nom et dans le texte) : compléter plutôt que dupliquer.
2. **Une note = une idée ou une chose.** Le nom du fichier est le titre : clair, unique dans tout le vault, sans `/ \ : * ? " < > | # ^ [ ]`.
3. **Partir du modèle** du bon type dans `Modèles/` (remplacer `{{title}}` et `{{date}}`, dates au format AAAA-MM-JJ).
4. **Liens Obsidian seulement** : `[[Nom de la note]]`, `[[Nom|texte affiché]]`, `[[Nom#Partie]]`. Jamais de chemin, jamais de lien Markdown vers une note.
5. **Relier** :
   - chaque nouvelle note finit par `Retour à [[<index de son dossier>]]`, et l'index liste la note avec une demi-ligne ;
   - un nouveau dossier a sa note d'index du même nom, dedans, listée dans l'`[[Accueil]]` (ou dans l'index du dossier parent) ;
   - dans le texte, un lien vers chaque note existante dont on parle.
6. **Pièces jointes** dans `Fichiers/`, citées avec `![[image.png]]` ou `[[document.pdf]]`.
7. **Ne rien inventer** : ce qu'on ne sait pas s'écrit « À compléter ». Ce qui n'est plus vrai est corrigé ou supprimé, pas laissé à côté.
8. **Ne jamais renommer ni déplacer** une note sans mettre à jour tous les liens vers elle.
9. **Vérifier avant d'envoyer** : `node synapse/build.mjs --check`, et corriger les liens cassés, notes isolées, dossiers sans index et notes pas reliées à leur index.
10. **Envoyer** : commit (message clair) et push sur `main`. Le site est à jour une minute plus tard.

Le guide complet de la méthode, avec des exemples par domaine : https://github.com/kaliso-dev/Synapse
