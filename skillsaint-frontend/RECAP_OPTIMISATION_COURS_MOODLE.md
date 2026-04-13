# Journal de Développement - Optimisation de la Gestion des Cours (09 Avril 2024)

Ce document récapitule les interventions effectuées aujourd'hui pour rendre la gestion des Masterclasses plus robuste, visuelle et fiable.

## 1. Problèmes Identifiés & Solutions Appliquées

### A. Persistance de la Visibilité (Hidden vs Visible)
- **Problème** : Lors de la modification d'un cours, celui-ci repassait systématiquement en mode "Caché" (Hidden) par défaut, obligeant l'administrateur à le réactiver manuellement.
- **Solution** : 
    - Intégration du champ `visible` dans le formulaire de mise à jour.
    - Configuration du système pour que "Visible" soit l'état par défaut lors d'une édition.
    - Correction de la logique côté Moodle (`externallib.php`) pour traiter correctement ce paramètre.

### B. Fiabilité des Données au Rafraîchissement (F5)
- **Problème** : Les fonctions standards de Moodle (`core_course_get_courses` ou `search_courses`) étaient inconsistantes. Certaines donnaient les images mais pas le statut de visibilité réel, et vice-versa.
- **Solution** : Création d'une fonction API sur mesure : `local_skillsaint_get_courses_full`.
    - Cette fonction lit directement dans la base de données Moodle.
    - Elle garantit la récupération simultanée du nom, de la visibilité, des images de couverture et des fichiers PDF (Syllabus).

### C. Problème des Images "Cassées" (Authentification des Fichiers)
- **Problème** : Les images de couverture ne s'affichaient pas (icône cassée) à cause des restrictions de sécurité de Moodle sur le fichier `pluginfile.php` lors d'un accès externe.
- **Solution (Infaillible)** : 
    - Passage à un encodage **Base64** directement depuis le serveur Moodle.
    - L'image est désormais transmise sous forme de texte brut (`data:image/...`) dans la réponse JSON.
    - **Avantage** : Plus aucun problème de jeton (token), de CORS ou de session. Les images s'affichent instantanément et partout.

## 2. Améliorations de l'Interface (UX/UI)

### A. Nouveau Bloc des Domaines (Categories)
- **Changement** : Remplacement du simple compteur "Curriculum Categories" par un bloc dynamique.
- **Fonctionnalités** :
    - Affichage des **3 premières catégories** sous forme de badges élégants.
    - Bouton **"See More +"** pour une vue d'ensemble.
    - Nouveau **Modal dédié** affichant la liste complète et scrollable de tous les domaines existants avec leurs statistiques (nombre de cours par domaine).

### B. Aperçu visuel dans le Modal d'Édition
- Ajout de la prévisualisation de la **Cover Image** (image actuelle) et du **Syllabus PDF** lors de l'édition d'une Masterclass.
- Permet de voir instantanément ce qui est déjà enregistré dans Moodle avant de décider de changer les fichiers.

## 3. Gestion Technique Moodle (Backend)
- Mise à jour régulière de `db/services.php` pour enregistrer les nouvelles fonctions.
- Incrémentation systématique de `version.php` pour forcer Moodle à appliquer les changements de structure.

---

## Prochaines étapes suggérées
- [ ] Optimisation du poids des images Base64 (compression côté serveur avant envoi).
- [ ] Ajout d'une barre de recherche spécifique à l'intérieur du nouveau modal des catégories.

**Statut Global** : :white_check_mark: Stable, Robuste et Haute Performance.

---

---

# Journal de Développement — Session 13 Avril 2026

## Périmètre de la session
Modernisation finale du Dashboard Étudiant, implémentation du Dark Mode global, système de messagerie/tickets de support lié aux cours, upload de photo de profil vers Moodle, et création de la page Admin "Support Inbox".

---

## 1. Corrections Visuelles & Langue

### `src/app/dashboard/exams/ExamsClient.tsx`
- Bouton "Retour au Dashboard" traduit en **"Back to Dashboard"** (anglais obligatoire sur toute la plateforme).

### `src/app/dashboard/settings/page.tsx` & `profile/page.tsx`
- Fond de page `bg-white` → `bg-[#f0f2f5]` pour harmoniser avec le Dashboard principal.

---

## 2. Dark Mode Système Complet

### Stratégie
Ajout d'une classe `.dark` sur `<html>` via `useEffect`. Toutes les pages bénéficient automatiquement du thème sans modification individuelle.

### `src/app/globals.css`
Ajout de ~90 lignes de règles CSS globales `.dark` :
- Fond principal : `#0b1120` (ardoise très sombre)
- Cartes/panels : `#1e293b` (ardoise moyenne)
- `.bg-[#f0f2f5]`, `.bg-[#fafafa]` inclus dans les sélecteurs
- Inputs : fond sombre, sauf `.bg-transparent` (zone de saisie chat)
- Shadows redessinées pour éviter les "glow" blancs
- Hover states adaptés : `hover:bg-gray-50` → ardoise foncée
- `bg-purple-50` → violet nuit `#3b0764` pour états actifs

### `src/app/dashboard/settings/page.tsx` — Persistance du choix
- `useEffect` #1 : Lit `localStorage.getItem("ibi_theme")` → restaure le thème au montage.
- `useEffect` #2 : Applique `.dark` sur `<html>` **et** sauvegarde en `localStorage` à chaque changement.
- **Résultat** : Le thème choisi est conservé après navigation et rechargement.

---

## 3. Upload Photo de Profil → Moodle

### `src/app/dashboard/profile/page.tsx`
- Bouton Camera branché à un `<input type="file" hidden ref={fileInputRef}>`.
- `FileReader` convertit en Base64 → aperçu immédiat.
- `updateAvatarAction(base64)` appelé en async → sauvegarde réelle dans Moodle.

### `src/lib/actions.ts`
- **Ajout :** `updateAvatarAction(imageBase64)` → appelle `local_skillsaint_update_avatar`.

---

## 4. Plugin Moodle `local_skillsaint` — Mise à jour vers v1.30

### Nouvelle Table : `local_skillsaint_inquiries`
| Champ | Type | Rôle |
|---|---|---|
| `userid` | INT | Étudiant qui envoie |
| `courseid` | INT | Cours concerné |
| `subject` | CHAR(255) | Sujet court |
| `message` | TEXT | Message complet |
| `admin_reply` | TEXT | Réponse admin (nullable) |
| `status` | CHAR(20) | `open` / `replied` / `resolved` |

### Fichiers modifiés
| Fichier | Changement |
|---|---|
| `db/install.xml` | Table `local_skillsaint_inquiries` ajoutée |
| `db/upgrade.php` | Step `2024041050` → crée la table si absente |
| `db/services.php` | 5 nouvelles fonctions WS enregistrées |
| `externallib.php` | 5 nouvelles méthodes PHP implémentées |
| `version.php` | `1.28` → `1.30` (version `2024041050`) |

### Nouvelles fonctions Web Service
| Fonction | Type | Usage |
|---|---|---|
| `local_skillsaint_send_inquiry` | write | Étudiant envoie un message |
| `local_skillsaint_get_student_inquiries` | read | Étudiant lit ses tickets + réponses |
| `local_skillsaint_get_all_inquiries` | read (admin) | Admin voit tous les tickets |
| `local_skillsaint_reply_inquiry` | write (admin) | Admin répond + change statut |
| `local_skillsaint_update_avatar` | write | Sauvegarde photo Base64 via `process_new_icon()` |

---

## 5. Page Admin — Support Inbox (NOUVEAU)

### `src/app/admin/support/page.tsx`
Interface deux panneaux style messagerie professionnelle :

**Panneau gauche :**
- Liste tous les tickets avec : avatar initiale, nom étudiant, cours, sujet, badge statut coloré
- Filtres : All / Open / Replied / Resolved
- Compteur de tickets "open" non lus
- Bouton refresh avec animation spinner

**Panneau droit :**
- Affiche le message étudiant + réponse admin existante en bulles
- Zone de saisie admin
- Bouton **"Send Reply"** → statut `replied`
- Bouton **"Reply & Resolve"** → statut `resolved` en un clic
- Mobile-responsive avec navigation retour

### `src/components/dashboard/AdminSidebar.tsx`
- Icône `MessageCircle` ajoutée
- Lien `{ href: "/admin/support", label: "Support Inbox" }` inséré dans la nav

---

## 6. Déploiement Serveur (13/04/2026)

| Étape | Résultat |
|---|---|
| `scp` fichiers vers `/tmp/skillsaint_update/` | ✅ |
| `sudo cp` vers `/var/www/html/moodle/local/skillsaint/` | ✅ |
| `sudo chown www-data:www-data` | ✅ |
| `php admin/cli/upgrade.php --non-interactive` | ✅ `local_skillsaint → Succès` |
| Nettoyage `/tmp/skillsaint_update` | ✅ |

**Serveur :** `ubuntu@155.248.233.8`
**Chemin Moodle :** `/var/www/html/moodle/local/skillsaint/`

---

**Statut Global** : :white_check_mark: Déployé en production. Table `local_skillsaint_inquiries` créée. Fonctions WS actives.

