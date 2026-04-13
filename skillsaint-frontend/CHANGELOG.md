# SkillSaint Platform — Development Changelog

> **Project:** IBI Global eLearning Platform (Next.js + Moodle)
> **Stack:** Next.js 14 (App Router), Tailwind CSS, Moodle 4.x (Custom Plugin `local_skillsaint`)
> **Server:** Ubuntu, Apache/Nginx + WAMP (local)

---

## Session — 2026-04-13 (Morning)

### Overview
This session focused on completing the **Student Dashboard UI modernization**, implementing **functional settings logic**, building a **real-time inquiry/support system**, integrating **avatar upload to Moodle**, and creating the **Admin Support Inbox** page.

---

## 1. Bug Fixes & UI Text (English Enforcement)

### `src/app/dashboard/exams/ExamsClient.tsx`
- **Fixed:** "Retour au Dashboard" button text was in French → changed to **"Back to Dashboard"**.

### `src/app/exam/page.tsx` *(Previous session carry-over)*
- All French UI text in the exam interface translated to English:
  - "Quitter l'examen" → "Quit Exam"
  - "Attention !" → "Warning!"
  - Exit confirmation modal fully in English.

---

## 2. Dark Mode — Full System Implementation

### **Strategy**
Applied a system-wide CSS class approach: when `<html>` has `.dark` class, all pages switch theme. No per-component logic needed.

### `src/app/globals.css`
Added `~80 lines` of global dark mode overrides at the bottom:

| Rule | Effect |
|---|---|
| `.dark body, .dark .min-h-screen` | Deep slate background `#0b1120` |
| `.dark .bg-white, .dark .bg-gray-50` | Cards become `#1e293b` |
| `.dark .bg-[#f0f2f5], .dark .bg-[#fafafa]` | Section backgrounds adapt |
| `.dark .text-gray-900/800` | Text turns white |
| `.dark .text-gray-400/500/600` | Muted text → `#94a3b8` |
| `.dark input:not(.bg-transparent)` | Inputs turn dark (excludes transparent chat inputs) |
| `.dark .bg-gray-900` | Inverts black buttons to white for readability |
| `.dark .shadow-*` | Shadows darkened to prevent "glow" on dark bg |
| `.dark .bg-purple-50` | Deep purple midnight `#3b0764` for active states |
| `.dark .hover\:bg-gray-50:hover` | Hover states adapted to dark |

### `src/app/dashboard/settings/page.tsx`
- **useEffect #1** (on mount): Reads `localStorage.getItem("ibi_theme")` and restores last chosen theme.
- **useEffect #2** (on `theme` change): Applies `.dark` class to `<html>` and saves choice to `localStorage.setItem("ibi_theme", theme)`.
- **Result:** Theme choice now **persists across sessions and page navigations**.

---

## 3. Page Background Consistency

### `src/app/dashboard/profile/page.tsx`
- Changed wrapper `bg-white` → `bg-[#f0f2f5]` to match the dashboard aesthetic.

### `src/app/dashboard/settings/page.tsx`
- Changed wrapper `bg-white` → `bg-[#f0f2f5]` to match the dashboard aesthetic.

> Both pages now benefit from the global dark mode rule for `bg-[#f0f2f5]` automatically.

---

## 4. Messaging / Notifications Page Fixes

### `src/app/dashboard/notifications/page.tsx`
- **Dark mode colorimetry**: Added `bg-[#fafafa]` to the global dark mode selector so the chat area background does not stay white in dark mode.
- **Hover states**: Applied dark hover overrides for `hover:bg-gray-50` — conversation list items now show a proper dark slate on hover instead of white-on-white.
- **Textarea focus rectangle bug**: Fixed by scoping dark-mode input overrides to `input:not(.bg-transparent)`. The transparent chat `<textarea>` no longer shows a clashing dark rectangle inside the rounded container.

---

## 5. Profile Picture Upload

### `src/app/dashboard/profile/page.tsx`
- **Frontend**: Added `useRef<HTMLInputElement>` + hidden `<input type="file" accept="image/*">` wired to the existing Camera button.
- **Preview**: `FileReader.readAsDataURL()` shows the image immediately on selection (no page reload).
- **Backend call**: `updateAvatarAction(base64)` is called asynchronously after preview is shown — sends the Base64 string to the Moodle plugin which processes and saves the image permanently.

### `src/lib/actions.ts`
- **Added:** `updateAvatarAction(imageBase64: string)` — calls `local_skillsaint_update_avatar` WS.

---

## 6. Moodle Plugin — `local_skillsaint` v1.30

### New Table: `local_skillsaint_inquiries`

| Field | Type | Description |
|---|---|---|
| `id` | INT | Primary key |
| `userid` | INT | Student's Moodle user ID |
| `courseid` | INT | The course the inquiry relates to |
| `subject` | CHAR(255) | Short subject line |
| `message` | TEXT | Full message from student |
| `admin_reply` | TEXT | Admin's reply (nullable) |
| `status` | CHAR(20) | `open` / `replied` / `resolved` |
| `timecreated` | INT | Unix timestamp |
| `timemodified` | INT | Unix timestamp |

### Files Modified

#### `moodle-plugin/skillsaint/db/install.xml`
- Added `<TABLE NAME="local_skillsaint_inquiries">` block with all fields, primary key, and indexes on `userid` and `courseid`.

#### `moodle-plugin/skillsaint/db/upgrade.php`
- Added upgrade block for version `2024041050`:
  - Checks if table exists before creating.
  - Safe for installations that already have v1.28+.

#### `moodle-plugin/skillsaint/version.php`
- Bumped: `version = 2024041050`, `release = '1.30'`.

#### `moodle-plugin/skillsaint/db/services.php`
- **Registered 5 new Web Service functions:**

| Function | Type | Who uses it |
|---|---|---|
| `local_skillsaint_send_inquiry` | write | Student → sends message |
| `local_skillsaint_get_student_inquiries` | read | Student → reads own threads |
| `local_skillsaint_get_all_inquiries` | read (admin) | Admin → reads all inquiries |
| `local_skillsaint_reply_inquiry` | write (admin) | Admin → replies + updates status |
| `local_skillsaint_update_avatar` | write | Student → saves profile picture |

- All 5 functions added to the **"Skillsaint Site Service"** token list.

#### `moodle-plugin/skillsaint/externallib.php`
Added 4 new PHP external function groups:

**Inquiry System:**
- `send_inquiry()` — Inserts a new record in `local_skillsaint_inquiries`.
- `get_all_inquiries($status_filter)` — SQL JOIN with `{user}` and `{course}` tables. Returns full inquiry list with student info and course name for admin view.
- `reply_inquiry($inquiry_id, $reply, $status)` — Updates `admin_reply` and `status` in the DB.
- `get_student_inquiries($userid)` — Returns all inquiries for a specific student including admin replies.

**Avatar Upload:**
- `update_avatar($userid, $imagebase64)` — Decodes the Base64 string, writes to a temp `.png` file, then calls Moodle's native `process_new_icon()` (from `gdlib.php`) which handles resizing, thumbnail generation, and file area registration. Finally sets `user.picture` field.

---

## 7. Next.js Server Actions — `src/lib/actions.ts`

Added 5 new `'use server'` exported functions:

```typescript
sendInquiryAction({ courseid, subject, message })
getStudentInquiriesAction()
getAdminInquiriesAction(statusFilter?)
replyInquiryAction({ inquiry_id, reply, status })
updateAvatarAction(imageBase64)
```

All functions read `moodle_user_id` from cookies and call `fetchMoodle()` internally.

---

## 8. Admin Support Inbox — NEW PAGE

### `src/app/admin/support/page.tsx`
A fully functional, two-panel messaging inbox for the admin:

**Left Panel — Inquiry List:**
- Lists all student inquiries in reverse chronological order.
- Each item shows: student initial avatar, name, `coursename`, subject, and a color-coded status badge (`open` amber, `replied` blue, `resolved` green).
- **Filter bar**: All / Open / Replied / Resolved.
- **Refresh button** with spinner animation.
- Unread count badge if open inquiries exist.
- Mobile-responsive: switches to detail view on tap.

**Right Panel — Detail & Reply:**
- Shows student info, course tag, student message bubble.
- If a reply exists, shows it in a purple bubble.
- Rich `<textarea>` for composing admin reply.
- **"Send Reply"** → sets status to `replied`.
- **"Reply & Resolve"** → sets status to `resolved` in one click.
- All changes reflected immediately via local state update.

### `src/components/dashboard/AdminSidebar.tsx`
- Added `MessageCircle` icon import.
- Added `{ href: "/admin/support", label: "Support Inbox", icon: MessageCircle }` to nav items.

---

## 9. Deployment Steps Required (Moodle Server)

> After pushing these files to the server, visit Moodle as admin:

```
https://your-moodle-url/admin/index.php
```

Moodle will detect the new version (`2024041050`) and run the upgrade automatically, creating the `local_skillsaint_inquiries` table.

> **Important:** If the Web Service token was already generated, no action needed — new functions are automatically available since they're added to the existing service.

---

## Architecture Summary

```
Student Dashboard
  ├── /dashboard              → Course listing (DashboardClient.tsx)
  ├── /dashboard/profile      → Profile info + avatar upload → Moodle API
  ├── /dashboard/settings     → Theme (persisted), Password, Privacy, Danger Zone
  ├── /dashboard/exams        → Quiz listing
  ├── /dashboard/notifications → Student message threads → Moodle inquiries table
  └── /exam                   → Active exam session

Admin Dashboard
  ├── /admin/dashboard        → KPI stats
  ├── /admin/students         → User management
  ├── /admin/courses          → Course management
  ├── /admin/exams            → Quiz management
  ├── /admin/support          → [NEW] Student inquiry inbox + reply system
  ├── /admin/site-content     → Homepage CMS
  └── /admin/settings         → Admin config

Moodle Plugin (local_skillsaint v1.30)
  ├── Tables: local_skillsaint_apps, local_skillsaint_inquiries [NEW]
  └── WS Functions: 26 total (5 new added today)
```

---

*Last updated: 2026-04-13 by Antigravity AI*
