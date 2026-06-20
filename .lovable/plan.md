# Plan : Album en dialogue + français partout

## Problème actuel
- Cliquer sur une équipe en vue Album → 404 (la route `/team/$teamCode` ne se charge pas correctement dans le preview).
- Quelques textes encore en anglais (404 page, certains labels).

## Ce qui change

### 1. Boîte de dialogue équipe (remplace la route)
- Nouveau composant `TeamAlbumDialog` (shadcn `Dialog`) ouvert depuis `TeamCard` au clic.
- Plus aucune navigation : suppression du `<Link to="/team/...">` dans `team-card.tsx`, remplacé par un `onClick` qui passe le code équipe au parent.
- Le fichier de route `src/routes/team.$teamCode.tsx` est supprimé (la route disparaît, plus de 404 possible).
- État `selectedTeamCode` géré dans `src/routes/index.tsx`.

### 2. Contenu de la dialogue — style album (image 3)
- En-tête : drapeau XL + nom équipe + code + barre de progression + `X/20 possédés` + `Y%`.
- Grille 4 ou 5 colonnes de **cartes-stickers** au style album Panini :
  - Forme de vignette arrondie avec **gros numéro** centré (ex. `CPV 3`) sur fond doux quand manquant.
  - Quand possédé : fond coloré équipe / coche, le numéro reste lisible.
  - Quand double : badge `×N` doré en coin + bordure dorée.
  - Foil/brillant : bordure dégradée or.
  - Sous la carte : nom du joueur en petit (ex. `LOGAN COSTA`).
- **Tap** sur la carte = cycle (manquant → possédé → double).
- **Boutons +/−** visibles uniquement sur les doubles, en bas de la carte.
- Boutons bas de dialogue : `Fermer`, `← Équipe précédente`, `Équipe suivante →` (change `selectedTeamCode` sans fermer).

### 3. Tout en français
- `__root.tsx` page 404 : `404` / `Page introuvable` / `La page demandée n'existe pas.` / `Retour à l'accueil`.
- Vérifier `errorComponent` / `notFoundComponent` par défaut du router → versions FR.
- Titres meta : déjà FR sur `/`, OK.
- Tout libellé restant en EN (`Loading`, etc.) → FR.

## Fichiers touchés
- `src/components/sticker-album/team-card.tsx` — devient un bouton avec `onClick`, plus de `<Link>`.
- `src/components/sticker-album/team-album-dialog.tsx` — **nouveau**, contient en-tête + grille + StickerSlot redessiné en style album.
- `src/components/sticker-album/sticker-slot.tsx` — restyle "vignette Panini" (numéro proéminent, badge double, foil).
- `src/routes/index.tsx` — état dialogue + intégration.
- `src/routes/team.$teamCode.tsx` — **supprimé**.
- `src/routeTree.gen.ts` — régénéré auto.
- `src/routes/__root.tsx` — `notFoundComponent` en français.
- `src/router.tsx` — `defaultNotFoundComponent` / `defaultErrorComponent` en français si présents.

## Ce qui ne change pas
- Schéma DB, logique import JSON, export PDF, hooks de mutation.
- Vue Liste, statistiques, toggle Album/Liste.
