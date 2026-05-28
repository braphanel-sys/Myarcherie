# ArcherAI — Retours terrain & Solutions

> Document vivant — mis à jour au fil des retours des membres du club  
> Dernière mise à jour : 28 mai 2026

---

## Tableau problèmes → solutions

| # | Problème remonté | Statut | Solution apportée |
|---|-----------------|--------|-------------------|
| 1 | Score légèrement erroné à cause des ombres ou d'une flèche en limite de zone | ✅ Résolu | Correction manuelle : tap sur un badge de flèche pour modifier la valeur, total recalculé automatiquement |
| 2 | Erreur de connexion sur le terrain (réseau faible) | ✅ Résolu | File d'attente hors ligne : la photo est stockée localement et analysée automatiquement au retour du réseau |
| 3 | Photo prise sous mauvais angle → erreur d'analyse | ✅ Résolu | Guide de bonne pratique accessible via le bouton "? Guide" dans l'appli |
| 4 | Lien de l'appli introuvable | ✅ Résolu | Lien épinglé dans le canal WhatsApp du club — myarcherie.vercel.app |
| 5 | L'IA compte les impacts anciens (trous dans la cible) comme des flèches | 🔧 En cours | Amélioration du prompt : l'IA devra détecter uniquement les fûts physiquement plantés, pas les impacts vides |
| 6 | Soleil direct / contre-jour sur la photo | 📋 Documenté | Conseil ajouté au guide : éviter le contre-jour, se positionner de façon à avoir la lumière dans le dos |
| 7 | Ne savait pas comment prendre la photo correctement | ✅ Résolu | Guide visuel complet dans l'appli (guide-scoring.html) — à consulter avant la première utilisation |

---

## Améliorations techniques prioritaires

| Priorité | Amélioration | Impact | Statut |
|----------|-------------|--------|--------|
| 🔴 Haute | Détection des fûts uniquement (ignorer les impacts vides) | Précision du comptage des flèches sur cibles usées | 🔧 En cours |
| 🟡 Moyenne | Formats FFTA complets par catégorie d'âge | Recommandations encore plus précises selon le profil | 📋 Planifié |
| 🟢 Basse | Améliorer le guide photo avec exemples "bonne/mauvaise photo" | Réduire les erreurs de prise de vue | 📋 Planifié |

---

## Bonnes pratiques photo (à diffuser au club)

✅ **Ce qu'il faut faire**
- Photographier **avant** de retirer les flèches
- Se placer **de face**, à **1-2 mètres** de la cible
- Avoir la **lumière dans le dos** — jamais en contre-jour
- Attendre que les flèches **arrêtent de bouger**
- S'assurer que les **plumes des flèches sont visibles**
- Photo **nette** — tenir fermement le téléphone

❌ **Ce qu'il faut éviter**
- Photo prise **de côté ou en diagonale**
- **Soleil direct** dans l'objectif
- Photo **floue** ou en mouvement
- Retirer les flèches **avant** de photographier
- Photo trop **loin** (cible trop petite dans le cadre)

---

## Légende statuts

| Statut | Signification |
|--------|--------------|
| ✅ Résolu | Correction déployée en production |
| 🔧 En cours | En cours de développement |
| 📋 Planifié | Identifié, à traiter |
| ❌ Bloquant | Urgent, à corriger immédiatement |
