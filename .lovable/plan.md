# Mise en page album Panini dans la dialogue

Recréer dans la dialogue d'équipe la mise en page double-page du vrai album Panini, uniquement pour les équipes-pays (les équipes spéciales gardent la mise en page actuelle).

## Ce qu'on voit sur la référence

- Fond orange chaud type kraft, avec des bandes vertes en haut et bas.
- Panneau « WE ARE [PAYS] » en haut à gauche, drapeau + nom officiel de la fédération.
- Les emplacements de stickers ont en arrière-plan un énorme « 26 » blanc en silhouette (le motif iconique Panini).
- Chaque slot affiche `CODE` + `numéro` centrés, et le nom du joueur en bas.
- Quand un sticker est collé, une vignette bleu ciel (photo + nom + club) le recouvre — on simulera ça avec un état « possédé » mis en valeur (bleu ciel + check), pas de photo réelle.
- En bas à droite, une petite carte d'identité du groupe (drapeaux du groupe + ville/date du match).

## Détection « pays vs spécial »

- Utiliser `team.isSpecial` (déjà disponible dans `TeamGroup`).
- Si `isSpecial` → on garde la dialogue actuelle telle quelle.
- Sinon → on bascule sur le nouveau composant « AlbumSpread ».

## Nouveau composant `TeamAlbumSpread`

Fichier : `src/components/sticker-album/team-album-spread.tsx`

Structure :

```text
┌────────────────────────────────────────────────────────────┐
│  bandes vertes haut                                        │
│  ┌─────────────┐  ┌──┬──┬──┬──┐                            │
│  │ WE ARE      │  │ 1│ 2│..│..│   ← rangée 1 (4 slots)     │
│  │ AUSTRIA     │  ├──┼──┼──┼──┤                            │
│  │ 🇦🇹 Fédé.    │  │..│..│..│..│                            │
│  └─────────────┘  └──┴──┴──┴──┘                            │
│   rangées suivantes : grille 5 colonnes responsive         │
│  bandes vertes bas + carte groupe                          │
└────────────────────────────────────────────────────────────┘
```

- Panneau « WE ARE » : titre display gras + drapeau + sous-titre = `team.name` traduit en plusieurs langues (on garde simple : `team.name`).
- Slots Panini : nouveau visuel `PaniniSlot` avec :
  - fond orange pâle
  - gros chiffre `2 6` en arrière-plan (SVG ou texte XL en `text-white/70`)
  - `CODE` + numéro centrés en sombre
  - nom du joueur en bas (uppercase, sérif condensée)
  - état possédé → overlay bleu ciel (`bg-sky-200`) avec check + nom + `×N` si double
  - état double → badge `×N` + boutons `+/-` en dessous (comme aujourd'hui)
  - clic → cycle (missing → owned → double → missing)
- Header de la dialogue (drapeau + nom + %) : conservé tel quel au-dessus du spread.
- Stickers 1 et 13 (logo/écusson) restent dans le header, exclus du spread comme aujourd'hui.

## Tokens design

Ajouter dans `src/styles.css` :

- `--panini-paper` : orange kraft du fond
- `--panini-green` : vert des bandes
- `--panini-slot` : orange clair des emplacements
- `--panini-owned` : bleu ciel des vignettes collées
- `--panini-owned-foreground` : bleu marine

Utiliser ces tokens dans `PaniniSlot` pour éviter les couleurs en dur.

## Intégration

Modifier `src/components/sticker-album/team-album-dialog.tsx` :
- Importer `TeamAlbumSpread`.
- Si `team.isSpecial === false`, remplacer la grille actuelle (`bg-muted/30` + `StickerSlot`) par `<TeamAlbumSpread team={team} stickers={gridStickers} onCycle={...} onAdjust={...} />`.
- Sinon, conserver la grille `StickerSlot` actuelle.

## Hors scope

- Pas de vraies photos de joueurs (on n'a pas les images, on simule l'état « collé »).
- Pas de carte « Group X » dynamique (statique décorative en bas, ou omise dans v1).
- Aucun changement de logique back / DB / mutations.

## Question rapide

Couleur de fond du spread : on part sur le orange kraft de la photo (chaud, façon papier), ou tu préfères qu'on garde le ton neutre actuel et qu'on ajoute juste le motif « 26 » + le panneau « WE ARE » ?
