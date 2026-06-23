# Requirements Document

## Introduction

This document specifies the requirements for redesigning the Social Circles System (Sistema de Círculos Sociales) to transform it into a complete social network experience with modern, minimalist design, 100% operational functionality, and fully modular, independent styles.

**Created:** 2026-06-22  
**Status:** Requirements Phase  
**Priority:** High  
**Affected Components:**
- `circles-ui.js`
- `circles-manager.js`
- `circles-styles.css`
- `supabase-schema.sql` (already updated)
- `index.html` (integration)

**Design Goals:**
1. ✅ **Established and functional limits** - System with clear circle and member restrictions
2. 🎨 **Total modularity** - Completely isolated styles without conflicts with other systems
3. ✨ **Modern experience** - Social network UI with integrated feed, minimalist and fluid
4. 🔧 **Complete functionality** - All features implemented and tested
5. 📱 **Responsive** - Adaptable to all screens

## Glossary

- **Circle** (Círculo): A private group where users can share writing exercises and entries
- **Admin**: The user who created a circle, with management permissions
- **Member** (Miembro): A user who belongs to a circle (either as admin or invited member)
- **Challenge** (Ejercicio): A writing exercise proposed within a circle using an image
- **Entry** (Entrada): A text submission by a user in response to a challenge
- **Reveal** (Revelar): The automatic process of making all entries visible when all members complete or deadline expires
- **Invitation** (Invitación): A request sent to a user to join a circle
- **Badge** (Insignia): A notification indicator showing pending invitations
- **Feed**: The social network-style display of revealed entries
- **Deadline**: The 24-hour time limit for completing a challenge
- **Image_Bank** (Banco de Imágenes): Personal collection of images in `user_images` table
- **Max_Members**: Maximum capacity of members in a circle (fixed at 12)
- **Toast**: Temporary notification message displayed to the user
- **Circles_Manager**: Backend JavaScript module managing circle data operations
- **Circles_UI**: Frontend JavaScript module managing circle user interface
- **Modular_Styles**: CSS architecture with `circles-` prefix to avoid conflicts

## Requirements

### Requirement 1: System Limits and Validation

**User Story:** As a platform administrator, I want to enforce limits on circles and memberships, so that the system remains scalable and manageable.

#### Acceptance Criteria

1. THE System SHALL enforce a maximum of 10 circles created per user
2. THE System SHALL enforce a maximum of 15 circles as invited member per user
3. THE System SHALL enforce a maximum of 25 total circle memberships per user (owned + invited)
4. THE System SHALL enforce a maximum of 12 members per circle
5. WHEN a user attempts to create a circle, THE System SHALL validate the user has not reached the limit of 10 owned circles
6. WHEN a user attempts to accept an invitation, THE System SHALL validate the user has not reached the limit of 25 total circles
7. WHEN a user attempts to accept an invitation, THE System SHALL validate the user has not reached the limit of 15 invited circles
8. WHEN a user attempts to accept an invitation, THE System SHALL validate the target circle has not reached capacity of 12 members
9. IF a limit is exceeded, THEN THE System SHALL display a descriptive error message and prevent the action
10. THE System SHALL enforce these limits at both backend (database constraints) and frontend (validation) levels

**Technical Notes - Backend Validation:**
```sql
-- Already implemented in supabase-schema.sql
CHECK constraints on circles per user
Trigger functions for invitation acceptance validation
```

**Technical Notes - Frontend Validation:**
```javascript
// Required validations before API calls
- Count ownedCircles before allowing "Create Circle"
- Count totalMemberships before accepting invitation
- Display clear error messages via toast notifications
```

---

### Requirement 2: Modular CSS Architecture

**User Story:** As a developer, I want completely isolated circle styles, so that the circles system does not conflict with other application styles.

#### Acceptance Criteria

1. THE System SHALL prefix all circle CSS selectors with `circles-`
2. THE System SHALL prefix all circle CSS variables with `--circles-`
3. THE System SHALL NOT depend on global CSS classes or styles
4. THE System SHALL define all component styles explicitly without inheritance from global styles
5. THE System SHALL use independent modal styling different from the global modal system
6. WHEN circle CSS is loaded, THE System SHALL NOT override or conflict with existing application styles
7. THE System SHALL use explicit CSS resets for inherited HTML element styles within circle components
8. THE System SHALL use z-index values above 1000 to ensure proper layering
9. THE System SHALL prefix all CSS animation keyframes with `circles-`
10. WHERE responsive breakpoints are needed, THE System SHALL define them within the circles stylesheet

**Technical Notes - Modular Architecture:**
```css
/* ✅ Correct - all prefixed */
.circles-modal { }
.circles-btn-primary { }
:root {
  --circles-primary: #6366f1;
}

/* ❌ Incorrect - conflicts with global */
.modal { }
.btn { }
:root {
  --primary: #6366f1;
}
```

---

### Requirement 3: Propose Challenge with Image Selection

**User Story:** As a circle member, I want to propose a writing challenge using an image, so that my circle can participate in a shared exercise.

#### Acceptance Criteria

1. WHEN a circle has no active challenge, THE System SHALL display a "Propose Image" button to all members
2. WHEN a user clicks "Propose Image", THE System SHALL display a modal with two image selection options
3. THE Modal SHALL provide option 1: "Use today's image" (the same image from user's current personal exercise)
4. THE Modal SHALL provide option 2: "Choose from my image bank" (opens gallery from `user_images` table)
5. WHEN a user selects an image, THE System SHALL display a preview of the selected image
6. THE System SHALL validate that no active challenge exists in the circle before allowing proposal
7. WHEN a user confirms the proposal, THE System SHALL create a `circle_challenge` record with status 'active'
8. THE System SHALL set a deadline of 24 hours from the proposal time
9. WHEN the challenge is created successfully, THE System SHALL display a success toast notification
10. THE System SHALL reload the circle view to show the new active challenge
11. IF a challenge already exists, THEN THE System SHALL display an error message and prevent creation

**Technical Notes:**
```javascript
// Implementation in circles-ui.js
async showProposeChallenge() {
  // 1. Image selector with 2 options
  // 2. Preview selected image
  // 3. Validate no active challenge
  // 4. Call circlesManager.proposeChallenge()
  // 5. Display success/error toast
}
```

---

### Requirement 4: Member Invitation System

**User Story:** As a circle member, I want to invite other users to my circle, so that we can grow our writing community.

#### Acceptance Criteria

1. THE System SHALL provide an "Invite Friends" button visible to all circle members
2. WHEN a user clicks "Invite Friends", THE System SHALL display an invitation modal
3. THE Modal SHALL provide an input field for entering a username
4. WHEN a username is entered, THE System SHALL validate that the user exists in the system
5. THE System SHALL validate that the circle has not reached the maximum of 12 members
6. THE Modal SHALL display the current list of circle members with their count (e.g., "8/12 members")
7. WHEN the invitation is sent successfully, THE System SHALL create a record in `circle_invitations` table
8. THE System SHALL display a notification badge to the invited user
9. WHEN the invited user views their invitations, THE System SHALL display the circle name, admin, and member count
10. THE Invited_User SHALL be able to accept or reject the invitation
11. IF the user accepts, THEN THE System SHALL validate all limits (Requirement 1) before adding membership
12. WHEN an invitation is accepted or rejected, THE System SHALL update the invitation status and record the response timestamp

---

### Requirement 5: Automatic Entry Revelation

**User Story:** As a circle member, I want entries to be automatically revealed when all members complete or the deadline expires, so that we can read and interact with each other's work.

#### Acceptance Criteria

1. WHEN a circle has an active challenge, THE System SHALL track the number of submitted entries
2. THE System SHALL count the total number of circle members
3. WHEN all members have submitted entries, THE System SHALL automatically reveal all entries
4. WHEN the 24-hour deadline expires, THE System SHALL automatically reveal all submitted entries
5. THE System SHALL update `circle_challenge_entries.is_revealed` to `true` for all entries when revealed
6. THE System SHALL update `circle_challenges.status` to 'revealed' when entries are revealed
7. THE System SHALL record the revelation timestamp in `revealed_at` field
8. WHEN entries are revealed, THE System SHALL display them in a social feed format
9. THE System SHALL enable likes and comments on revealed entries
10. THE System SHALL display entry metadata (author username, word count, likes)

**Technical Notes:**
```javascript
// Trigger points for revelation check:
// 1. After user submits an entry (check if all complete)
// 2. Periodic deadline check (can be done on circle view load)
```

---

### Requirement 6: Social Feed Display

**User Story:** As a circle member, I want to view revealed entries in a social feed format, so that I can easily read and interact with everyone's work.

#### Acceptance Criteria

1. WHEN entries are revealed, THE System SHALL display them in a vertical feed layout
2. THE Feed SHALL display each entry as a card with author avatar, username, entry title, and text preview
3. THE System SHALL display the word count for each entry
4. THE System SHALL display a like count for each entry
5. THE System SHALL provide a heart button to like entries
6. WHEN a user clicks the like button, THE System SHALL increment the like count
7. THE System SHALL prevent users from liking their own entries
8. THE System SHALL allow users to like each entry only once
9. THE Feed SHALL be scrollable when there are many entries
10. THE System SHALL display entries in submission order (earliest first)

---

### Requirement 7: General Comments System

**User Story:** As a circle member, I want to leave general comments on the challenge, so that I can share feedback and encouragement with the group.

#### Acceptance Criteria

1. WHEN entries are revealed, THE System SHALL display a "General Comments" section
2. THE System SHALL display all existing general comments with author username and timestamp
3. THE System SHALL provide a text input field for writing new comments
4. THE System SHALL provide a submit button to post comments
5. WHEN a user submits a comment, THE System SHALL validate the comment is not empty
6. THE System SHALL save the comment to `circle_challenge_comments` table
7. WHEN a comment is posted successfully, THE System SHALL display it immediately in the comments list
8. THE System SHALL display comments in chronological order (oldest first)
9. THE Comment_List SHALL be scrollable when there are many comments
10. THE System SHALL display a placeholder message when no comments exist

---

### Requirement 8: Leave Circle Functionality

**User Story:** As a circle member, I want to leave a circle, so that I can manage my circle memberships.

#### Acceptance Criteria

1. THE System SHALL provide a "Leave Circle" button visible to all members in circle detail view
2. WHEN a user clicks "Leave Circle", THE System SHALL display a confirmation modal
3. THE Confirmation_Modal SHALL warn the user about leaving the circle
4. IF the user is the admin, THEN THE System SHALL display an additional warning about admin privileges
5. WHEN the user confirms leaving, THE System SHALL remove the `circle_members` record
6. THE System SHALL display a success toast notification
7. THE System SHALL redirect the user to the circles list view
8. THE System SHALL update the member count display for remaining members
9. IF the admin leaves and other members exist, THEN THE System SHALL transfer admin rights to the oldest member
10. IF the admin is the only member and leaves, THEN THE System SHALL delete the circle

**Technical Notes:**
```javascript
// Implementation needed:
confirmLeaveCircle() {
  // 1. Custom circles confirmation modal
  // 2. Admin warning if applicable
  // 3. Call circlesManager.leaveCircle()
  // 4. Handle redirect and cleanup
}
```

---

### Requirement 9: Admin Management Features

**User Story:** As a circle admin, I want to manage my circle settings and members, so that I can maintain a healthy community.

#### Acceptance Criteria

1. WHERE a user is the circle admin, THE System SHALL display admin management options
2. THE System SHALL provide an "Edit Circle" option to modify circle name and description
3. THE System SHALL provide a "Remove Member" option for each non-admin member
4. WHEN an admin removes a member, THE System SHALL display a confirmation modal
5. THE System SHALL delete the member's `circle_members` record when confirmed
6. THE System SHALL provide a "Transfer Admin" option to transfer admin rights to another member
7. WHEN admin rights are transferred, THE System SHALL update both members' roles atomically
8. THE System SHALL provide a "Delete Circle" option only when admin is the sole member
9. WHEN a circle is deleted, THE System SHALL remove all related records (challenges, entries, invitations)
10. THE System SHALL display success/error toasts for all admin actions

---

### Requirement 10: Notification System

**User Story:** As a user, I want to receive notifications for circle invitations and events, so that I stay informed about circle activity.

#### Acceptance Criteria

1. THE System SHALL display a notification badge on the circles button when invitations are pending
2. THE Badge SHALL display the count of pending invitations
3. WHEN the circles modal is opened, THE System SHALL refresh the invitation count
4. THE System SHALL poll for new invitations every 30 seconds while the modal is open
5. WHEN a new invitation is received, THE System SHALL update the badge count immediately
6. THE System SHALL display the invitation list with newest invitations first
7. WHEN an invitation is accepted or rejected, THE System SHALL update the badge count
8. THE Badge SHALL use a pulse animation to draw attention to new invitations
9. THE System SHALL remove the badge when no pending invitations exist
10. WHERE a new challenge is proposed in a user's circle, THE System SHALL display a visual indicator

---

### Requirement 11: Responsive Design

**User Story:** As a mobile user, I want the circles system to work well on my device, so that I can participate from anywhere.

#### Acceptance Criteria

1. THE System SHALL adapt the layout for screens below 768px width
2. WHEN viewed on mobile, THE Circle_Grid SHALL display as a single column
3. WHEN viewed on mobile, THE Modal SHALL occupy 96% of viewport width
4. WHEN viewed on mobile, THE Modal SHALL occupy maximum 94% of viewport height
5. THE System SHALL make all interactive elements touch-friendly with minimum 44px tap targets
6. THE Feed SHALL scroll smoothly on touch devices
7. THE System SHALL scale images appropriately for mobile screens
8. THE System SHALL maintain readability of text on small screens
9. THE System SHALL adapt button layouts to prevent overlap on narrow screens
10. THE System SHALL test and function correctly on iOS and Android browsers

---

### Requirement 12: Visual Design and Animations

**User Story:** As a user, I want a modern and polished visual experience, so that using circles feels enjoyable and engaging.

#### Acceptance Criteria

1. THE System SHALL use the defined color palette with `--circles-primary: #6366f1` as the primary color
2. THE System SHALL implement a dark theme with transparent layered backgrounds
3. WHEN a user hovers over a circle card, THE System SHALL animate it with translateY(-4px) and enhanced shadow
4. THE System SHALL use cubic-bezier easing (0.4, 0, 0.2, 1) for all transitions
5. THE Notification_Badge SHALL pulse with a scale animation to draw attention
6. THE Loading_Spinner SHALL rotate smoothly using CSS animation
7. THE Toast_Notifications SHALL slide up from bottom with smooth animation
8. THE System SHALL use consistent 8px border-radius for cards and buttons
9. THE System SHALL implement hover states for all interactive elements
10. THE System SHALL ensure animations run at 60fps without jank

---

### Requirement 13: Parser and Pretty Printer (if applicable)

**User Story:** As a developer, I want robust parsing of circle data formats, so that data integrity is maintained.

#### Acceptance Criteria

**Note:** This requirement applies if custom data formats are introduced (e.g., custom challenge format, entry metadata format)

1. WHEN a data format is defined for circles, THE Parser SHALL parse valid inputs into structured objects
2. WHEN invalid input is provided, THE Parser SHALL return descriptive error messages
3. THE Pretty_Printer SHALL format structured objects back into valid data format strings
4. FOR ALL valid structured objects, THE System SHALL satisfy the round-trip property: `parse(print(obj)) == obj`
5. THE System SHALL validate all parsed data before storing in database
6. THE System SHALL handle edge cases (empty fields, special characters, unicode)

**Current Status:** No custom parsers needed yet, but requirement reserved for future extensions.

---

## 📊 System Limits Reference (IMPLEMENTED)

### Limits per User
| Type | Limit | Validation |
|------|--------|------------|
| Círculos Creados | 10 | ✅ Backend + Frontend |
| Círculos como Invitado | 15 | ✅ Backend + Frontend |
| Total de Círculos | 25 | ✅ Backend + Frontend |

### Limits per Circle
| Type | Limit | Validation |
|------|--------|------------|
| Miembros Máximo | 12 | ✅ Backend (constraint) + Frontend |
| Valor Predeterminado | 12 | ✅ Modal de creación |
| Editable | NO | 🔒 Campo bloqueado en 12 |

---

## 🛠️ Missing/Incomplete Functionality

### Límites por Usuario
| Tipo | Límite | Validación |
|------|--------|------------|
| Círculos Creados | 10 | ✅ Backend + Frontend |
| Círculos como Invitado | 15 | ✅ Backend + Frontend |
| Total de Círculos | 25 | ✅ Backend + Frontend |

### Límites por Círculo
| Tipo | Límite | Validación |
|------|--------|------------|
| Miembros Máximo | 12 | ✅ Backend (constraint) + Frontend |
| Valor Predeterminado | 12 | ✅ Modal de creación |
| Editable | NO | 🔒 Campo bloqueado en 12 |

### Validaciones Requeridas

#### Al Crear Círculo
```javascript
// Validar límite de círculos creados
if (ownedCircles.length >= 10) {
  throw Error('Has alcanzado el límite de 10 círculos creados');
}

// max_members siempre es 12
if (maxMembers > 12) {
  throw Error('Un círculo puede tener máximo 12 miembros');
}
```

#### Al Aceptar Invitación
```javascript
// Validar límite total
if (totalMemberships >= 25) {
  throw Error('Has alcanzado el límite de 25 círculos totales');
}

// Validar límite como invitado
const invitedCount = totalMemberships - ownedCount;
if (invitedCount >= 15) {
  throw Error('Has alcanzado el límite de 15 círculos como invitado');
}

// Validar que círculo no esté lleno
if (currentMembers >= maxMembers) {
  throw Error('El círculo está lleno');
}
```

---

## 🛠️ Funcionalidad Faltante/Incompleta

### 1. Modal de Proponer Imagen ❌ FALTA

**Estado Actual:** Implementación truncada en `circles-ui.js` línea 661

**Lo que falta:**
```javascript
async showProposeChallenge() {
  // FALTA:
  // 1. Selector de imagen del día actual
  // 2. Integración con banco personal de imágenes
  // 3. Vista previa de imagen seleccionada
  // 4. Validación de imagen válida
  // 5. Submit funcional que llama a proposeChallenge()
}
```

**Requisitos:**
- [ ] Opción 1: Usar imagen del día actual (misma que ejercicio personal)
- [ ] Opción 2: Seleccionar de banco personal (`user_images`)
- [ ] Vista previa de imagen seleccionada
- [ ] Botón "Proponer" funcional
- [ ] Validación: solo 1 ejercicio activo por círculo
- [ ] Confirmación con toast al proponer
- [ ] Deadline automático de 24 horas

### 2. Modal de Invitar Usuarios ⚠️ INCOMPLETO

**Estado Actual:** Función `showInviteModal()` llamada pero no implementada

**Lo que falta:**
```javascript
showInviteModal() {
  // FALTA:
  // 1. Input para username
  // 2. Validación de username existente
  // 3. Validación de límite de miembros (12)
  // 4. Mostrar lista de miembros actuales
  // 5. Submit funcional
}
```

### 3. Confirmación al Salir del Círculo ⚠️

**Estado Actual:** Función `confirmLeaveCircle()` llamada pero no implementada

**Lo que falta:**
```javascript
confirmLeaveCircle() {
  // FALTA:
  // 1. Modal de confirmación personalizado de círculos
  // 2. Advertencia si es admin
  // 3. Submit que llama a leaveCircle()
}
```

### 4. Gestión de Admin ❌ FALTA COMPLETAMENTE

**Funcionalidad Requerida:**
- [ ] Ver opciones de admin en círculo propio
- [ ] Editar nombre/descripción del círculo
- [ ] Remover miembros (excepto admin)
- [ ] Transferir rol de admin
- [ ] Eliminar círculo (si es admin y único miembro)

### 5. Notificaciones en Tiempo Real ⚠️ PARCIAL

**Estado Actual:** Badge de notificación implementado, falta interactividad

**Lo que falta:**
- [ ] Polling más inteligente (solo cuando modal abierto)
- [ ] Sonido/animación al recibir invitación
- [ ] Badge también en ejercicio nuevo propuesto
- [ ] Notificación cuando entries se revelan

---

## 🎨 Requisitos de Modularidad de Estilos

### Principios Fundamentales

#### 1. Prefijo Único Obligatorio
**REGLA:** TODO selector CSS debe tener prefijo `circles-`

✅ **Correcto:**
```css
.circles-modal { }
.circles-btn-primary { }
.circles-card-header { }
```

❌ **Incorrecto:**
```css
.modal { }  /* Conflicto con otros modales */
.btn { }    /* Conflicto con botones globales */
```

#### 2. Variables CSS Aisladas
**REGLA:** Variables propias con prefijo `--circles-`

```css
:root {
  --circles-primary: #6366f1;
  --circles-bg-light: rgba(255, 255, 255, 0.03);
  /* NO usar --primary, --bg-light globales */
}
```

#### 3. Sin Herencia de Estilos Globales
**REGLA:** Ningún componente de círculos debe depender de clases globales

```css
/* ❌ NO HACER */
.circles-btn {
  /* heredar de .btn global */
}

/* ✅ HACER */
.circles-btn {
  /* definir TODO desde cero */
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  /* ... todo explícito */
}
```

#### 4. Modal Independiente
El modal de círculos debe ser **completamente diferente** al modal global:

```css
/* Modal global de la app */
.modal { }

/* Modal de círculos - INDEPENDIENTE */
.circles-modal { }
```

#### 5. Reset de Estilos Heredados
Si un elemento HTML hereda estilos, resetearlos explícitamente:

```css
.circles-modal input {
  all: unset; /* Reset completo */
  /* Luego aplicar estilos propios */
  padding: 0.75rem;
  background: var(--circles-bg-light);
}
```

### Estructura de Archivo CSS

```css
/* ========================================
   CÍRCULOS SOCIALES - 100% MODULAR
   Sin conflictos con otros sistemas
   ======================================== */

/* 1. Variables */
:root { }

/* 2. Modal principal */
.circles-modal { }

/* 3. Componentes comunes */
.circles-btn { }
.circles-card { }

/* 4. Secciones específicas */
.circles-challenge { }
.circles-entries { }

/* 5. Estados */
.circles-loading { }
.circles-empty { }

/* 6. Responsive */
@media (max-width: 768px) { }

/* 7. Utilities */
.circles-hidden { }
```

### Checklist de Modularidad
- [ ] Ningún selector sin prefijo `circles-`
- [ ] Todas las variables con prefijo `--circles-`
- [ ] Sin `@import` o dependencias externas
- [ ] Sin referencias a clases globales (`.modal`, `.btn`, etc.)
- [ ] Inputs, buttons, textareas con reset explícito
- [ ] Z-index aislado (usar valores > 1000)
- [ ] Animaciones con nombres prefijados (`@keyframes circles-spin`)

---

## 💅 Requisitos de Diseño Visual

### Paleta de Colores

```css
/* Tema oscuro (default) */
--circles-primary: #6366f1;        /* Índigo vibrante */
--circles-primary-hover: #4f46e5;  /* Índigo oscuro */
--circles-secondary: #8b5cf6;      /* Púrpura */
--circles-danger: #ef4444;         /* Rojo */
--circles-success: #10b981;        /* Verde */
--circles-warning: #f59e0b;        /* Ámbar */

/* Fondos */
--circles-bg-light: rgba(255, 255, 255, 0.03);
--circles-bg-medium: rgba(255, 255, 255, 0.05);
--circles-bg-strong: rgba(255, 255, 255, 0.08);
--circles-border: rgba(255, 255, 255, 0.1);

/* Texto */
--circles-text-primary: #f5f5f5;
--circles-text-secondary: #a0a0a0;
```

### Componentes Estilo Red Social

#### Feed de Entradas Reveladas
```
┌─────────────────────────────────────┐
│ 📝 Entradas (3)                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👤 @usuario1    ❤️ 5           │ │
│ │ Título de entrada               │ │
│ │ Texto de la entrada...          │ │
│ │ 250 palabras                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👤 @usuario2    ❤️ 3           │ │
│ │ Otro título                     │ │
│ │ Más texto...                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Comentarios Generales
```
┌─────────────────────────────────────┐
│ 💬 Comentarios Generales            │
├─────────────────────────────────────┤
│ 👤 @usuario1                        │
│ "Gran ejercicio!"                   │
│                                     │
│ 👤 @usuario3                        │
│ "Me costó pero lo logré 💪"        │
├─────────────────────────────────────┤
│ [Escribe un comentario...] [➤]     │
└─────────────────────────────────────┘
```

#### Tarjetas de Círculo (Grid)
```
┌────────────────┐ ┌────────────────┐
│ [Color Header] │ │ [Color Header] │
│ Nombre Círculo │ │ Otro Círculo   │
│ [Admin Badge]  │ │                │
├────────────────┤ ├────────────────┤
│ Descripción... │ │ Descripción... │
│ 8/12 miembros  │ │ 4/12 miembros  │
└────────────────┘ └────────────────┘
```

### Animaciones Requeridas

```css
/* Hover en tarjetas */
.circles-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Pulse en badge de notificaciones */
@keyframes circles-pulse-notification {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Loading spinner */
@keyframes circles-spin {
  to { transform: rotate(360deg); }
}

/* Toast slide-up */
.circles-toast.circles-show {
  transform: translateX(-50%) translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Responsive Breakpoints

```css
@media (max-width: 768px) {
  .circles-modal-container {
    width: 96vw;
    max-height: 94vh;
  }
  
  .circles-grid {
    grid-template-columns: 1fr; /* Stack en móvil */
  }
  
  .circles-members-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔄 Flujos de Usuario

### 1. Crear Círculo
```
Usuario → Botón "+ Crear Círculo"
  ↓
Modal con formulario
  - Nombre (requerido)
  - Descripción (opcional)
  - Color de portada (selector visual)
  - Máx. miembros: 12 (fijo, no editable)
  ↓
Validar límite (10 círculos creados)
  ↓
Crear en BD + Agregar usuario como admin
  ↓
Toast éxito → Redirigir a detalle del círculo
```

### 2. Proponer Ejercicio de Imagen
```
Usuario en círculo sin ejercicio activo
  ↓
Botón "Proponer Imagen"
  ↓
Modal de selección:
  [Opción 1: Imagen del día]
  [Opción 2: Mi banco personal]
  ↓
Seleccionar imagen → Vista previa
  ↓
Confirmar → Crear challenge con deadline 24h
  ↓
Toast éxito → Mostrar ejercicio activo
```

### 3. Participar en Ejercicio
```
Círculo con ejercicio activo
  ↓
Usuario ve:
  - Imagen del ejercicio
  - Timer countdown
  - Progreso (X/12 completaron)
  ↓
Botón "Escribir mi entrada"
  ↓
Formulario:
  - Título (opcional)
  - Texto (requerido)
  - Contador de palabras
  ↓
Submit → Guardar entrada (bloqueada)
  ↓
Verificar si todos completaron
  ↓
Si todos completaron O deadline pasó:
  → Revelar todas las entradas
```

### 4. Interactuar con Entradas Reveladas
```
Entradas reveladas
  ↓
Usuario puede:
  - ❤️ Dar like a entradas
  - 💬 Comentar en general
  - 📖 Leer todas las entradas
  ↓
Feed tipo red social
```

### 5. Invitar Miembros
```
Admin/Miembro → Botón "Invitar amigos"
  ↓
Modal de invitación:
  - Input username
  - Validar usuario existe
  - Validar límite 12 miembros
  ↓
Crear invitación → Badge notificación al invitado
  ↓
Invitado ve en su lista de invitaciones
  ↓
Acepta → Se une al círculo
Rechaza → Invitación eliminada
```

---

## 📱 Casos de Uso Detallados

### CU-01: Verificar Límites al Crear Círculo

**Actor:** Usuario autenticado

**Precondiciones:**
- Usuario ha iniciado sesión
- Modal de círculos abierto

**Flujo Principal:**
1. Usuario hace clic en "+ Crear Círculo"
2. Sistema cuenta círculos creados por usuario
3. **SI** `ownedCircles < 10`:
   - Mostrar formulario de creación
   - Campo "Máx. miembros" prefijado en 12 (disabled)
4. **SI** `ownedCircles >= 10`:
   - Mostrar toast error: "Has alcanzado el límite de 10 círculos creados"
   - No mostrar formulario

**Postcondiciones:**
- Formulario visible solo si no se alcanzó límite
- Usuario informado claramente del límite

---

### CU-02: Proponer Imagen para Ejercicio

**Actor:** Miembro de círculo sin ejercicio activo

**Precondiciones:**
- Usuario es miembro del círculo
- No hay ejercicio activo en el círculo

**Flujo Principal:**
1. Usuario ve "No hay ejercicio activo"
2. Usuario hace clic en "Proponer Imagen"
3. Sistema muestra modal con 2 opciones:
   - **Opción 1:** "Usar imagen del día" (imagen actual del ejercicio personal)
   - **Opción 2:** "Elegir de mi banco" (abre galería `user_images`)
4. Usuario selecciona imagen
5. Sistema muestra vista previa
6. Usuario hace clic en "Proponer"
7. Sistema valida:
   - No hay ejercicio activo en círculo ✓
   - Imagen válida ✓
8. Sistema crea `circle_challenge`:
   - `status`: 'active'
   - `deadline`: now + 24 horas
   - `image`: objeto JSON completo
9. Sistema muestra toast: "✅ Imagen propuesta. ¡A escribir!"
10. Sistema recarga vista del círculo mostrando ejercicio activo

**Flujo Alternativo 7a - Ya hay ejercicio activo:**
- Sistema muestra error: "Ya hay un ejercicio activo en este círculo"
- No crea challenge

**Postcondiciones:**
- Challenge creado con deadline 24h
- Todos los miembros ven el ejercicio activo
- Usuario puede escribir su entrada

---

### CU-03: Revelar Entradas Automáticamente

**Actor:** Sistema (automatizado)

**Precondiciones:**
- Hay ejercicio activo en círculo
- Al menos 1 entrada enviada

**Flujo Principal:**
1. **Trigger:** Usuario envía entrada O deadline se cumple
2. Sistema cuenta:
   - Total miembros del círculo: `M`
   - Total entradas enviadas: `E`
3. **SI** `E == M` **O** `now >= deadline`:
   - Sistema actualiza `circle_challenge_entries.is_revealed = true`
   - Sistema actualiza `circle_challenges.status = 'revealed'`
   - Sistema registra `revealed_at = now`
4. **SI** condiciones NO cumplidas:
   - Mantener entradas bloqueadas

**Postcondiciones:**
- Entradas visibles para todos los miembros
- Likes y comentarios habilitados

---

### CU-04: Aceptar Invitación con Validación de Límites

**Actor:** Usuario invitado

**Precondiciones:**
- Usuario tiene invitación pendiente
- Invitación es válida

**Flujo Principal:**
1. Usuario ve invitación en lista
2. Usuario hace clic en "Aceptar"
3. Sistema valida:
   
   **Validación 1: Límite Total**
   - Cuenta membresías totales del usuario: `T`
   - **SI** `T >= 25`:
     - Mostrar error: "Has alcanzado el límite de 25 círculos"
     - **STOP**
   
   **Validación 2: Límite Invitado**
   - Cuenta círculos creados: `O`
   - Calcula círculos como invitado: `I = T - O`
   - **SI** `I >= 15`:
     - Mostrar error: "Has alcanzado el límite de 15 círculos como invitado"
     - **STOP**
   
   **Validación 3: Círculo No Lleno**
   - Cuenta miembros del círculo: `C`
   - Obtiene `max_members` del círculo: `MAX`
   - **SI** `C >= MAX`:
     - Mostrar error: "El círculo está lleno"
     - **STOP**

4. **SI** todas validaciones pasan:
   - Actualizar invitación: `status = 'accepted'`, `responded_at = now`
   - Crear `circle_members`: `user_id`, `circle_id`, `role = 'member'`
   - Mostrar toast: "¡Te has unido al círculo!"
   - Actualizar badge de notificaciones
   - Recargar lista de círculos

**Flujos Alternativos:**
- **4a - Validación falla:** Mostrar error específico y no unir

**Postcondiciones:**
- Usuario es miembro del círculo
- Invitación marcada como aceptada
- Badge actualizado

---

## 🧪 Criterios de Aceptación

### Funcionalidad Completa
- [ ] Modal de proponer imagen 100% funcional
- [ ] Modal de invitar usuarios completo
- [ ] Sistema de likes operativo
- [ ] Comentarios generales funcionales
- [ ] Revelación automática de entradas
- [ ] Todas las validaciones de límites activas

### Modularidad de Estilos
- [ ] Ningún conflicto con estilos globales
- [ ] Prefijo `circles-` en todos los selectores
- [ ] Variables aisladas con `--circles-`
- [ ] Modal completamente independiente
- [ ] Botones y formularios con estilos propios
- [ ] No hereda de clases globales

### Experiencia Visual
- [ ] Diseño moderno tipo red social
- [ ] Animaciones suaves y fluidas
- [ ] Feed de entradas con avatares y likes
- [ ] Tarjetas de círculo con hover atractivo
- [ ] Toast notifications personalizados
- [ ] Responsive en móvil y tablet

### Performance
- [ ] Carga rápida de círculos (<1s)
- [ ] Polling de notificaciones eficiente (30s)
- [ ] Imágenes optimizadas
- [ ] Sin re-renders innecesarios

### Testing
- [ ] Crear círculo hasta límite (10)
- [ ] Aceptar invitaciones hasta límite (15)
- [ ] Círculo lleno (12 miembros)
- [ ] Proponer imagen y participar
- [ ] Revelar entradas automáticamente
- [ ] Likes y comentarios
- [ ] Salir de círculo
- [ ] Responsive en móvil

---

## 🚀 Prioridades de Implementación

### P0 - Crítico (Hacer PRIMERO)
1. ✅ Límites en backend (YA HECHO)
2. Completar modal de proponer imagen
3. Completar modal de invitar usuarios
4. Implementar confirmación de salir

### P1 - Alta
5. Sistema de gestión de admin
6. Notificaciones mejoradas
7. Validaciones frontend completas

### P2 - Media
8. Animaciones avanzadas
9. Vista previa mejorada de imágenes
10. Búsqueda de usuarios al invitar

### P3 - Baja
11. Exportar entradas del círculo
12. Estadísticas del círculo
13. Temas de color personalizados

---

## 📝 Notas Técnicas

### Dependencias
- `supabaseClient` (global)
- `window.currentUser` (global)
- `circlesManager` (instancia global)
- `circlesUI` (instancia global)

### Archivos a Modificar
1. **circles-ui.js** - Completar modales faltantes
2. **circles-manager.js** - Agregar validaciones frontend
3. **circles-styles.css** - Asegurar modularidad total
4. **index.html** - Verificar integración correcta

### Base de Datos
- ✅ Esquema ya actualizado en `supabase-schema.sql`
- ✅ Constraints de límites implementados
- ✅ Índices para performance

---

## ✅ Checklist Final

### Antes de Empezar Diseño
- [ ] Requirements aprobados
- [ ] Límites claramente definidos
- [ ] Funcionalidad faltante identificada
- [ ] Principios de modularidad establecidos

### Listo para Diseño
Una vez aprobados estos requirements, procedemos a:
- **Design Phase:** Mockups, wireframes, y flujos visuales detallados
- **Tasks Phase:** Dividir en tareas atómicas de implementación

---

**Estado:** ✅ Requirements Completados - Esperando Aprobación

**Siguiente Paso:** Crear `design.md` con mockups visuales y especificaciones de UI/UX
