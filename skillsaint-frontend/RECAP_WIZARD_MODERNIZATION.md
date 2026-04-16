# Récapitulatif : Modernisation de la Candidature (Wizard)

Ce document résume les modifications apportées pour transformer le formulaire d'inscription en un assistant multi-étapes (Wizard) intelligent avec sauvegarde incrémentielle.

---

## 1. Structure du Wizard (`ApplyClient.tsx` & `ApplyForm.tsx`)
Le formulaire monolithique a été divisé en 5 étapes distinctes avec une barre de progression dynamique :
1.  **Identity** : Informations personnelles de base.
2.  **Faith** : Background spirituel et engagement ecclésiastique.
3.  **Vision** : Motivations et objectifs de croissance.
4.  **Plan** : Sélection du niveau d'abonnement (Standard, Premium, Executive).
5.  **Payment** : Finalisation sécurisée via Stripe ou PayPal.

---

## 2. Sauvegarde Incrémentielle (Zéro Perte)
Contrairement à l'ancienne version qui ne sauvegardait les données qu'au moment du paiement, le nouveau système est **"Fail-Safe"** :
- **Save on Next** : À chaque clic sur le bouton "Next", les données de l'étape actuelle sont fusionnées dans l'état global et envoyées en arrière-plan au plugin Moodle.
- **Persistance locale** : L'email est stocké dans le `localStorage` pour permettre une reconnexion facile en cas d'interruption.
- **Backend Robuste** : La fonction Web Service `local_skillsaint_save_application` a été ré-implémentée dans `externallib.php` pour supporter les mises à jour partielles (UPSERT).

---

## 3. Communication Backend Simplifiée
- **Abstraction dans `data.ts`** : La fonction `saveApplication` a été simplifiée pour réutiliser `fetchMoodle`. Elle ne contient plus de logique de routage API manuelle.
- **Proxy Isomorphe** : Toutes les requêtes passent par le proxy `/api/moodle`, garantissant que le `MOODLE_TOKEN` reste secret côté serveur.

---

## 4. Design & UX Premium
- **Animations fluides** : Utilisation de `framer-motion` avec `AnimatePresence` pour des transitions de glissement (slide) entre les étapes.
- **Validation par étape** : Chaque étape vérifie la présence des champs `required` avant de permettre la progression, avec des retours visuels immédiats (ring rouge).
- **Responsive Navigation** : Nouveau système de boutons "Next" et "Back" permettant une navigation fluide sans perte de contexte.

---

## 5. Prochaines Étapes
- [ ] **Persistance Visuelle (Back Navigation)** : Faire en sorte que les champs de formulaire se pré-remplissent avec les données précédemment saisies (`collectedData`) lorsqu'on revient en arrière.
- [ ] **Réactivation des Cours** : L'étape des cours est actuellement commentée dans le code. Elle peut être réactivée en décommentant les sections `WIZARD_STEPS` et le composant `CourseSelector` dans `ApplyForm.tsx`.
- [ ] **Validation Avancée** : Ajouter des validations plus poussées (format d'email, durée de foi, etc.).

---
*Date : 16 Avril 2026*
*Auteur : Antigravity AI*
