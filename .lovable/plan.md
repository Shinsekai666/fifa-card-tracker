## Refonte "Mon Classeur Panini FIFA 2026"

Ton album = 48 équipes × 20 stickers + 20 spéciaux (980 au total). Je transforme l'app pour qu'elle colle exactement à cette structure et soit ludique à utiliser.

### 1. Schéma BDD enrichi (migration)

Ajout sur la table `stickers` :
- `team_code` (TEXT) — ex. `CPV`, `FRA`, `SPE` pour spéciaux
- `team_name` (TEXT) — ex. `Cabo Verde`
- `team_flag` (TEXT) — emoji drapeau (auto-déduit à l'import depuis le code pays ISO, sinon vide)
- `team_order` (INT) — ordre d'affichage des équipes (Spéciaux en premier, puis ordre du JSON)
- `position` (INT) — position du sticker dans l'équipe (1 à 20)
- `is_special` (BOOL) — true pour la "team" Spéciaux
- `is_foil` (BOOL) — sticker brillant/holographique

Anciennes colonnes conservées : `number` (= code unique type `CPV13` ou `FWC1`), `name`, `status`, `doubles_count`.

### 2. Import JSON intelligent

L'app détecte ta structure (`special_stickers.items[]` + `teams[].stickers[]` ou équivalent) et remplit tout en un import. Champs reconnus :
- Racine : `teams`, `special_stickers`, `total_stickers`
- Équipe : `code`, `name`, `flag`, `country`, `stickers` ou `items`
- Sticker : `code`/`number`, `name`, `position`, `foil`, `type`

Re-import = met à jour les noms/structure sans toucher à ton statut/doubles (upsert sur `number`).

Bouton "Importer JSON" dans le header + zone drag-and-drop dans l'état vide.

### 3. Vue Album (par défaut, ludique)

**Écran 1 — Sommaire des équipes** : grille responsive de cartes équipe avec
- Drapeau + nom + code
- Anneau de progression circulaire (ex. `12/20`)
- Mini barre de couleur : 🟢 possédés, 🟡 doubles, ⚪ manquants
- Badge "✨ Spéciaux" mis en avant si c'est la team spéciaux

**Écran 2 — Page d'une équipe** : grille 4×5 façon page d'album
- Chaque case = un sticker, taille uniforme, look "pochette"
- Affiche le code (ex. `CPV 13`) et le nom du joueur
- Bordure dorée + icône ✨ si `is_foil`
- État visuel clair :
  - Manquant : case grisée, contour pointillé
  - Possédé : case colorée aux couleurs de l'équipe, ✓
  - Double : case colorée + badge `×2`, `×3` doré
- **Tap rapide** = cycle des 3 états (manquant → possédé → double → manquant)
- **Boutons +/–** visibles uniquement quand statut = double, pour ajuster la quantité
- En-tête de page : drapeau XL, nom, progression, navigation ← équipe précédente / suivante →

### 4. Vue Liste (toggle)

Toggle dans le header (icônes 📖 Album / ☰ Liste) :
- Recherche globale + filtres (statut, équipe)
- Cartes compactes comme aujourd'hui mais regroupées par équipe (en-têtes collants)
- Mêmes interactions tap/+/–

### 5. Stats globales (toujours visibles)

Bandeau en haut : progression %, possédés, manquants, doubles totaux, équipes complètes.

### 6. Export PDF amélioré

- **Manquants** : groupés par équipe, drapeau dans le titre, colonne `Code / Joueur`, équipes complétées masquées
- **Doubles** : groupés par équipe, colonne quantité, total en bas
- Pied de page avec date + URL de l'app pour l'imprimer et l'emporter

### 7. Détails ludiques

- Animation discrète quand on coche un sticker (scale + couleur)
- Confetti léger quand une équipe est complétée à 100%
- Compteur "Équipes complètes : 3/48" en haut

---

### Détails techniques

- **Migration** : `ALTER TABLE stickers ADD COLUMN team_code TEXT, team_name TEXT, team_flag TEXT, team_order INT DEFAULT 0, position INT DEFAULT 0, is_special BOOL DEFAULT false, is_foil BOOL DEFAULT false;` + index sur `(team_order, position)`.
- **Routes TanStack** :
  - `/` — sommaire équipes (vue album) OU liste si toggle activé (state local + localStorage)
  - `/team/$teamCode` — page d'une équipe
- **Import** : parser dans `src/lib/sticker-import.ts` étendu pour reconnaître `teams[]` + `special_stickers`. Mapping drapeau via table ISO→emoji incluse (Cabo Verde → 🇨🇻, etc.). Upsert sur `number` qui préserve `status` et `doubles_count` existants.
- **PDF** : regroupement par `team_order`/`team_name`, en-têtes de section dans `jspdf-autotable` via plusieurs `autoTable` consécutifs.
- **Composants** : nouveau `TeamCard`, `AlbumPage`, `StickerSlot` (vue album), réutilisation du `StickerCard` existant pour la vue liste.
- **State** : TanStack Query déjà en place, ajout d'un hook `useStickersByTeam()` qui regroupe en mémoire.

### Ce que je ne change pas

- Pas de login (toujours mono-utilisateur partagé)
- Stack TanStack Start + Lovable Cloud + shadcn déjà OK
- Le code existant de PDF/import est étendu, pas réécrit de zéro

---

Une fois la migration approuvée et la nouvelle UI en place, tu importes ton JSON et tout se range automatiquement. Tu cliques sur "Cabo Verde", tu vois ta page d'album, tap-tap-tap pour cocher ce que tu as collé.