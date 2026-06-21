## Problème
Sur mobile (360px), le dialogue d'équipe déborde horizontalement : le header tient en `flex` une seule ligne avec drapeau + titre + 2 badges (1, 13) + %, ce qui pousse le contenu hors écran. La grille intérieure (`grid-cols-2`) avec le panneau "WE ARE" coupe aussi les stickers.

## Changements

### `src/components/sticker-album/team-album-dialog.tsx`
- `DialogContent` : ajouter `w-[100vw] sm:w-full max-w-[100vw] sm:max-w-5xl rounded-none sm:rounded-lg max-h-[100dvh] sm:max-h-[92vh]` pour plein écran mobile.
- Header : passer en deux rangées sur mobile.
  - Ligne 1 : drapeau + (code + nom + compteurs) + % à droite. Utiliser `grid grid-cols-[auto_minmax(0,1fr)_auto]` avec `min-w-0` et `truncate` sur le titre. Réduire drapeau à `text-4xl sm:text-6xl`, titre `text-xl sm:text-3xl`, % `text-2xl sm:text-4xl`.
  - Ligne 2 (badges 1 + 13) : sous le header, `flex gap-2` centré, badges en `h-12 w-[72px]`, masquer le label `team_code` sur mobile (garder juste numéro + nom tronqué), `text-[8px]`.
- Padding header : `p-3 sm:p-5`.

### `src/components/sticker-album/team-album-spread.tsx`
- Padding intérieur : `p-2 sm:p-6`.
- Grille : `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4` (déjà ok mais réduire le gap mobile).
- Panneau "WE ARE" : sur mobile, `col-span-2` plein largeur en haut comme bandeau compact (réduire padding + texte `text-lg`), `sm:col-span-1` retour normal.

### `src/components/sticker-album/panini-slot.tsx`
- Réduire tailles typo numéro sur mobile : `text-2xl sm:text-4xl md:text-5xl` au lieu de `text-4xl md:text-5xl`, pour que les stickers respirent en colonne 2.

Résultat : le dialogue occupe toute la largeur de l'écran mobile, le header s'empile proprement, et la grille de stickers tient en 2 colonnes sans rogner.