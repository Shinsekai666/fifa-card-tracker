## Problème

Tu ne peux pas imprimer tes listes. Quand tu rencontres quelqu'un pour échanger, il te faut un moyen rapide sur ton téléphone pour :
1. Voir tes doubles disponibles
2. Comparer avec ce que l'autre personne a/cherche
3. Cocher au fur et à mesure ce que vous échangez

## Solution proposée : Mode Échange

Un nouveau bouton **"Mode Échange"** dans l'app, optimisé mobile, avec 3 outils :

### 1. Vue "Mes Doubles" (partage rapide)
- Liste compacte de tous tes doubles groupés par équipe
- Bouton **"Partager"** qui génère :
  - Un **texte WhatsApp/SMS** prêt à coller : `Doubles: MEX2, MEX5, FRA8...`
  - Un **lien public** (lecture seule, sans login) que tu envoies à l'autre personne → il voit ta liste sur son tél
  - Un **QR code** à scanner en face à face
- Idem pour la liste "Manquants"

### 2. Vue "Comparer" (face à face)
- Tu colles la liste de doubles de l'autre (texte ou lien) 
- L'app calcule automatiquement :
  - **Ce qu'il a et qu'il te manque** → ce que tu veux
  - **Ce que tu as en double et qu'il lui manque** → ce qu'il veut
- Affichage côte à côte avec cases à cocher

### 3. Mode "Session d'échange" (pendant le troc)
- Tu sélectionnes les stickers échangés (donnés / reçus)
- À la validation : 
  - Les **reçus** passent en "possédé" (ou double si tu l'avais déjà)
  - Les **donnés** : `doubles_count -1`, repasse en "possédé" si plus de double
- Historique des sessions d'échange (date + nombre)

## Détails techniques

- Nouvelle route publique `/partage/:token` (lecture seule, pas de login) qui lit un snapshot stocké en base
- Nouvelle table `share_links` (token, type 'doubles'|'missing', created_at, expires_at)
- Nouvelle table `trade_sessions` (id, date, given jsonb, received jsonb) pour l'historique
- Composant `TradeMode` avec 3 onglets (Mes listes / Comparer / Échanger)
- Bouton d'accès depuis le header principal
- Génération QR via `qrcode` package
- Le parseur de texte accepte plusieurs formats : `MEX2, MEX5` ou `2, 5, 8` (dans contexte équipe) ou liste collée brute

## Ce que ça remplace
- Plus besoin d'imprimer
- Plus besoin de barrer manuellement
- Mise à jour automatique du compteur de doubles après chaque échange
- Tu gardes une trace de tous tes échanges

---

**Questions avant de coder :**
1. Le **lien de partage public** te convient ? (l'autre personne n'a pas besoin de compte, voit juste ta liste figée)
2. L'**historique des échanges** est utile ou on s'en passe pour rester simple ?
3. Pour le **mode comparaison** : tu préfères coller du texte, scanner un QR, ou ouvrir un lien ?