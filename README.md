# RAWG Explorer

Application web pour découvrir les jeux populaires de RAWG, les rechercher et consulter leur fiche détaillée. Le projet utilise Vite pour le serveur de développement et la compilation.

## Prérequis

- Node.js et npm
- Une clé API RAWG

## Installation

Depuis la racine du projet :

```bash
npm install
```

Crée ou modifie le fichier `.env` à la racine :

```env
VITE_RAWG_API_KEY=ta_cle_api_rawg
```

Vite n’expose au code du navigateur que les variables préfixées par `VITE_`. Redémarre le serveur après avoir modifié `.env`.

## Développement

```bash
npm run dev
```

Ouvre l’adresse affichée par Vite dans le terminal, généralement [http://localhost:5173](http://localhost:5173).

## Compilation

Pour générer la version de production :

```bash
npm run build
```

Pour prévisualiser le résultat compilé :

```bash
npm run preview
```

Tailwind peut être recompilé séparément pendant le développement :

```bash
npx @tailwindcss/cli -i ./css/input.css -o ./css/style.css --watch
```

Les styles spécifiques à l’application sont dans `css/app.css`.

## Fonctionnalités

- Affichage et recherche de jeux.
- Page de détails à l’adresse `/game/<id>`.
- Fond animé avec particules en CSS et JavaScript natif.
- Icônes Lucide.

## Arborescence principale

```text
.
├── index.html
├── js/
│   └── index.js
├── css/
│   ├── input.css
│   ├── style.css
│   └── app.css
├── package.json
└── .env
```

## Note sur la clé API

Les variables `VITE_*` sont intégrées au code client au moment du build et sont visibles par les visiteurs. Cette clé RAWG convient à une démo ou à un usage local; pour une application publique, il faut passer les requêtes par un service backend si la clé doit rester secrète.
