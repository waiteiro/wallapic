# Design Document: Circles Redesign

## Overview

### Purpose

This design document specifies the complete redesign of the Social Circles System (Sistema de Círculos Sociales) to transform it into a modern social network experience with 100% modular styles, operational functionality, and responsive design.

### Design Goals

1. **Established and functional limits** - System with clear circle and member restrictions (10 owned, 15 invited, 25 total per user; 12 members per circle)
2. **Total modularity** - Completely isolated styles without conflicts with other systems (all selectors prefixed with `circles-`)
3. **Modern experience** - Social network UI with integrated feed, minimalist and fluid
4. **Complete functionality** - All features implemented: propose challenge, invite members, automatic revelation, comments, likes, admin management
5. **Responsive design** - Adaptable to all screens (mobile-first approach)

### System Context

The Circles System is a standalone module within WallaPic (ImagingDay), a creative writing application. It operates independently from the main journal system and integrates with:
- Supabase authentication and database
- User management system
- Image bank system (`user_images` table)
- Current daily image from main application (`window.currentImage`)
- Notification system

### Key Features Summary

- **Circle Management**: Create, join, leave circles with enforced limits
- **Challenge System**: Propose writing challenges using images (daily or from personal bank)
- **Automatic Entry Revelation**: Entries reveal when all members complete OR 24-hour deadline expires
- **Social Feed**: View revealed entries with likes and general comments
- **Invitation System**: Invite users with notification badges
- **Admin Tools**: Manage members, transfer admin rights, delete circles
- **Responsive Design**: Mobile-first, touch-friendly interface


### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Circles   │  │  Circle    │  │  Challenge │       │
│  │    List    │  │   Detail   │  │   Forms    │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│              Frontend Layer (circles-ui.js)              │
│  • Navigation management    • UI rendering              │
│  • Event handling          • Toast notifications        │
│  • Form validation         • Polling for updates        │
│  • Image source selection  • Entry submission           │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│           Business Logic (circles-manager.js)            │
│  • Circle CRUD operations  • Challenge management       │
│  • Invitation system       • Entry submission           │
│  • Limit validation        • Automatic revelation       │
│  • Likes & comments        • Member management          │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ circles  │  │ circle_  │  │ circle_  │             │
│  │          │  │ members  │  │challenges│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ circle_  │  │ circle_  │  │ circle_  │             │
│  │challenge_│  │ entry_   │  │challenge_│             │
│  │ entries  │  │ likes    │  │ comments │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```


## Architecture

### Component Architecture

The system follows a three-layer architecture with clear separation of concerns:

#### 1. Presentation Layer (`circles-ui.js`)

**Responsibilities:**
- Render all UI components dynamically
- Handle user interactions and events
- Navigate between views (list, detail, create, propose, write)
- Display toast notifications for feedback
- Poll for notification updates (every 30 seconds)
- Validate form inputs client-side before submission

**Key Class:**
- `CirclesUI`: Main UI controller singleton

**Key Methods:**
```javascript
// Navigation
open()                              // Open circles modal
close()                             // Close circles modal
showCirclesList()                   // Display circles and invitations
showCircleDetail(circleId)          // Display circle details with challenge
showCreateCircle()                  // Display circle creation form
showProposeChallenge()              // Display image selection for new challenge
showWriteEntry()                    // Display entry writing form
showInviteModal()                   // Display invitation modal

// Actions
submitCreateCircle()                // Create new circle with validation
submitProposal()                    // Submit proposed image challenge
submitEntry()                       // Submit writing entry
sendInvite()                        // Send circle invitation
acceptInvitation(invitationId)      // Accept invitation
rejectInvitation(invitationId)      // Reject invitation
confirmLeaveCircle()                // Leave circle with confirmation
toggleLike(entryId, isLiked)        // Like/unlike entry
addComment(challengeId)             // Add general comment
deleteComment(commentId)            // Delete own comment

// Utilities
updateNotificationBadge()           // Update pending invitation count
showToast(message, type)            // Display toast notification
setTitle(title, showBack)           // Update modal header
getAvatarColor(username)            // Generate consistent avatar color
```


#### 2. Business Logic Layer (`circles-manager.js`)

**Responsibilities:**
- Execute all business logic and rules
- Validate system limits before operations (10/15/25 rule, 12 members per circle)
- Manage all database operations via Supabase client
- Handle automatic revelation logic
- Enforce data integrity and business constraints

**Key Class:**
- `CirclesManager`: Main business logic controller singleton

**Key Methods:**
```javascript
// Initialization
init(userId, username)              // Initialize with current user

// Circle Management
createCircle(name, description, coverColor, maxMembers)
                                    // Create circle with validation
getMyCircles()                      // Get user's circles with roles
getCircleDetails(circleId)          // Get full circle details
leaveCircle(circleId)               // Leave circle (admin transfer logic)

// Invitation Management
getPendingInvitationsCount()        // Count pending invitations
inviteUser(circleId, username)      // Send invitation with validation
getMyInvitations()                  // Get user's pending invitations
respondToInvitation(invitationId, accept)
                                    // Accept/reject with limit checks

// Challenge Management
getActiveChallenge(circleId)        // Get active challenge if exists
proposeChallenge(circleId, image)   // Create new challenge
submitChallengeEntry(challengeId, circleId, title, text)
                                    // Submit entry and check revelation
hasUserSubmittedChallenge(challengeId)
                                    // Check if user submitted
getChallengeEntries(challengeId)    // Get all entries with likes
checkAndRevealEntries(challengeId, circleId)
                                    // Check and trigger revelation

// Social Features
likeEntry(entryId)                  // Add like to entry
unlikeEntry(entryId)                // Remove like from entry
getEntryLikes(entryId)              // Get all likes for entry
addChallengeComment(challengeId, comment)
                                    // Add general comment
getChallengeComments(challengeId)   // Get all comments
deleteComment(commentId)            // Delete own comment
```


#### 3. Data Layer (Supabase)

**Responsibilities:**
- Persist all application data
- Enforce database-level constraints (CHECK, UNIQUE, FOREIGN KEY)
- Provide Row Level Security (RLS) policies
- Maintain indexes for query performance
- Handle cascading deletes for data integrity

**Tables:**
```
circles                    // Circle metadata
circle_members             // Member relationships and roles
circle_invitations         // Pending invitations
circle_challenges          // Active and revealed challenges
circle_challenge_entries   // User submissions to challenges
circle_entry_likes         // Like relationships
circle_challenge_comments  // General comments on challenges
```

**Key Constraints:**
- `circles.max_members CHECK (max_members <= 12)`
- `circle_members UNIQUE(circle_id, user_id)`
- `circle_challenge_entries UNIQUE(challenge_id, user_id)`
- `circle_entry_likes UNIQUE(entry_id, user_id)`
- Foreign keys with CASCADE delete for referential integrity

### Modular CSS Architecture

**Principle:** Complete isolation from global application styles

**Strict Rules:**
1. ✅ All selectors MUST have `circles-` prefix (e.g., `.circles-modal`, `.circles-btn`)
2. ✅ All CSS variables MUST have `--circles-` prefix (e.g., `--circles-primary`)
3. ❌ No dependencies on global classes (e.g., `.modal`, `.btn`)
4. ✅ Independent modal system (not using global modal)
5. ✅ Explicit style definitions (no reliance on inheritance)
6. ✅ Z-index range: 1000-1100 for proper layering
7. ✅ All animations prefixed: `@keyframes circles-spin`

**File Structure:**
```css
circles-styles.css
├── 1. CSS Variables (--circles-*)
├── 2. Notification Badge
├── 3. Modal Container
├── 4. Common Components (buttons, forms, inputs)
├── 5. Specific Sections (challenges, entries, comments, members)
├── 6. States (loading, empty, locked, revealed)
├── 7. Responsive Breakpoints (@media)
└── 8. Utilities (hidden, visible, flex)
```


**Color Palette:**
```css
/* Primary Colors */
--circles-primary: #6366f1;         /* Indigo vibrant */
--circles-primary-hover: #4f46e5;   /* Indigo dark */
--circles-secondary: #8b5cf6;       /* Purple */
--circles-danger: #ef4444;          /* Red */
--circles-success: #10b981;         /* Green */
--circles-warning: #f59e0b;         /* Amber */

/* Backgrounds (Dark Theme) */
--circles-bg-light: rgba(255, 255, 255, 0.03);
--circles-bg-medium: rgba(255, 255, 255, 0.05);
--circles-bg-strong: rgba(255, 255, 255, 0.08);
--circles-border: rgba(255, 255, 255, 0.1);

/* Text */
--circles-text-primary: #f5f5f5;
--circles-text-secondary: #a0a0a0;
```

### Data Flow Diagrams

#### Circle Creation Flow
```
User clicks "+ Crear Círculo"
  ↓
UI: showCreateCircle()
  → Render form with name, description, color picker, max_members=12
  ↓
User fills form and clicks "Crear Círculo"
  ↓
UI: submitCreateCircle()
  → Validate: name required, maxMembers <= 12
  ↓
CirclesManager.createCircle()
  → Query: Count user's owned circles
  → Validate: ownedCircles < 10 (throw error if exceeded)
  → Insert into circles table
  → Insert creator as admin into circle_members table
  ↓
UI: showCirclesList()
  → Display success toast
  → Refresh circles grid
```


#### Invitation Flow
```
Member clicks "Invitar amigos"
  ↓
UI: showInviteModal()
  → Display modal with username input
  ↓
User enters @username and clicks "Enviar Invitación"
  ↓
UI: sendInvite()
  → Trim and remove @ symbol
  ↓
CirclesManager.inviteUser(circleId, username)
  → Query: Check user exists in users table
  → Query: Check user not already member
  → Query: Check circle has space (<= max_members)
  → Insert into circle_invitations table (status='pending')
  ↓
Update notification badge for invitee
  ↓
UI: Display success toast, close modal

---

Invitee opens circles modal
  ↓
UI: showCirclesList()
  → Query: Get pending invitations
  → Render invitation cards with "Aceptar" and "Rechazar" buttons
  ↓
User clicks "Aceptar"
  ↓
UI: acceptInvitation(invitationId)
  ↓
CirclesManager.respondToInvitation(invitationId, true)
  → Query: Get invitation details
  → Query: Count user's total memberships
  → Validate: totalMemberships < 25 (throw if exceeded)
  → Query: Count user's owned circles
  → Calculate: invitedCount = totalMemberships - ownedCount
  → Validate: invitedCount < 15 (throw if exceeded)
  → Query: Count circle's current members
  → Validate: currentMembers < circle.max_members (throw if full)
  → Update invitation: status='accepted', responded_at=now
  → Insert into circle_members: role='member'
  ↓
UI: Refresh circles list, update badge, display success toast
```


#### Challenge Proposal and Revelation Flow
```
User in circle without active challenge
  ↓
UI: Shows "No hay ejercicio activo" with "Proponer Imagen" button
  ↓
User clicks "Proponer Imagen"
  ↓
UI: showProposeChallenge()
  → Render two options:
    [1] Imagen del Día (window.currentImage)
    [2] Mi Banco (user_images table)
  → Default: Option 1 selected, preview shown
  ↓
User selects source:
  - Option 1: selectedImage = window.currentImage
  - Option 2: Query user_images, show grid, user selects → selectedImage
  ↓
User clicks "Proponer Esta Imagen"
  ↓
UI: submitProposal()
  ↓
CirclesManager.proposeChallenge(circleId, selectedImage)
  → Query: Check no active challenge exists (status='active')
  → Calculate: deadline = now + 24 hours
  → Insert into circle_challenges:
      {circle_id, proposed_by_user_id, proposed_by_username,
       image: selectedImage, status='active', deadline}
  ↓
UI: Redirect to circle detail, display success toast

---

Member views challenge
  ↓
UI: showCircleDetail()
  → Render challenge image, timer countdown, progress bar
  → If not submitted: "Escribir mi entrada" button
  ↓
User clicks "Escribir mi entrada"
  ↓
UI: showWriteEntry()
  → Form: title (optional), text (required), word counter
  ↓
User writes and clicks "Enviar Entrada"
  ↓
UI: submitEntry()
  → Validate: text not empty
  ↓
CirclesManager.submitChallengeEntry(challengeId, circleId, title, text)
  → Calculate: word_count = text.split(/\s+/).length
  → Insert into circle_challenge_entries:
      {challenge_id, circle_id, user_id, username, title, text,
       word_count, is_revealed=false}
  → Call: checkAndRevealEntries(challengeId, circleId)
  ↓
CirclesManager.checkAndRevealEntries(challengeId, circleId)
  → Query: Count circle members
  → Query: Count submitted entries
  → Query: Get challenge deadline
  → Calculate: allCompleted = (entries.length === members.length)
  → Calculate: deadlinePassed = (now >= deadline)
  → If allCompleted OR deadlinePassed:
      → Update circle_challenge_entries: is_revealed=true (all)
      → Update circle_challenges: status='revealed', revealed_at=now
      → Return true
  → Else: Return false
  ↓
UI: If revealed → show feed, else → show locked entries
```


### State Management

**Application State (circles-ui.js):**
```javascript
{
  modal: HTMLElement,                // Modal DOM reference
  currentCircleId: string | null,    // Active circle being viewed
  currentChallengeId: string | null, // Active challenge context
  currentView: 'list' | 'detail' | 'create' | 'propose' | 'write',
  selectedImage: ImageObject | null  // Image selected for proposal
}
```

**Business State (circles-manager.js):**
```javascript
{
  currentUserId: string | null,      // Logged-in user ID
  currentUsername: string | null,    // Logged-in username
  circles: Array<Circle>,            // Cached circles (optional)
  invitations: Array<Invitation>     // Cached invitations (optional)
}
```

**Database State (Supabase):**
- All persistent data stored in 7 tables
- RLS policies ensure data security
- Indexes optimize query performance
- Constraints enforce data integrity

## Components and Interfaces

### Frontend UI Components

This section describes all visual components rendered by `circles-ui.js`.

#### 1. CirclesModal

**Container for entire circles system interface.**

**HTML Structure:**
```html
<div id="circlesModal" class="circles-modal circles-show">
  <div class="circles-modal-container">
    <div class="circles-modal-header">
      <button class="circles-back-btn circles-visible">← Back</button>
      <h2 class="circles-modal-title">Title</h2>
      <button class="circles-close-btn">×</button>
    </div>
    <div class="circles-modal-body" id="circlesContent">
      <!-- Dynamic content rendered here -->
    </div>
  </div>
</div>
```

**States:**
- Default: `display: none`
- Open: `circles-show` class added → `display: flex`
- Back button: `circles-visible` class shows/hides based on view


#### 2. CirclesList

**Displays user's circles and pending invitations.**

**Rendered Sections:**
1. Pending Invitations (if any)
2. My Circles grid with "Create Circle" button
3. Empty state if no circles

**Key Elements:**
```html
<!-- Invitations Section -->
<div class="circles-section">
  <h3 class="circles-section-title">📨 Invitaciones Pendientes</h3>
  <div class="circles-invitations">
    <!-- InvitationCard components -->
  </div>
</div>

<!-- Circles Section -->
<div class="circles-section">
  <div class="circles-section-header">
    <h3 class="circles-section-title">Mis Círculos</h3>
    <button class="circles-btn circles-btn-primary circles-btn-sm">
      + Crear Círculo
    </button>
  </div>
  <div class="circles-grid">
    <!-- CircleCard components -->
  </div>
</div>
```

**Data Requirements:**
- Array of circles: `{ id, name, description, cover_color, members, myRole }`
- Array of invitations: `{ id, circles, users }`

#### 3. InvitationCard

**Single invitation with accept/reject actions.**

**Structure:**
```html
<div class="circles-invitation-card">
  <div class="circles-invitation-avatar" style="background: [color]">
    [First letter]
  </div>
  <div class="circles-invitation-info">
    <h4 class="circles-invitation-name">[Circle Name]</h4>
    <p class="circles-invitation-from">Invitado por @[username]</p>
    <p class="circles-invitation-desc">[Description]</p>
  </div>
  <div class="circles-invitation-actions">
    <button class="circles-btn circles-btn-primary circles-btn-sm"
            onclick="circlesUI.acceptInvitation('[id]')">
      Aceptar
    </button>
    <button class="circles-btn circles-btn-secondary circles-btn-sm"
            onclick="circlesUI.rejectInvitation('[id]')">
      Rechazar
    </button>
  </div>
</div>
```

**Behavior:**
- Accept: Validates limits, adds membership, updates badge, refreshes list
- Reject: Updates invitation status, removes from list, updates badge


#### 4. CircleCard

**Circle summary in grid layout.**

**Structure:**
```html
<div class="circles-card" onclick="circlesUI.showCircleDetail('[id]')">
  <div class="circles-card-header" style="background: [cover_color]">
    <h3 class="circles-card-name">[Circle Name]</h3>
    <span class="circles-admin-badge">Admin</span> <!-- if myRole === 'admin' -->
  </div>
  <div class="circles-card-body">
    <p class="circles-card-description">[Description]</p>
    <div class="circles-card-footer">
      <span class="circles-members-count">[X]/[max_members] miembros</span>
    </div>
  </div>
</div>
```

**Hover Effect:**
- Transform: `translateY(-4px)`
- Shadow: Enhanced depth
- Transition: `cubic-bezier(0.4, 0, 0.2, 1)`

**Grid Layout:**
- Desktop: `repeat(auto-fill, minmax(280px, 1fr))`
- Mobile: Single column

#### 5. CircleDetail

**Full circle view with challenge, entries, and members.**

**Sections:**
```html
<div class="circles-detail">
  <!-- 1. Circle Header -->
  <div class="circles-detail-header" style="background: linear-gradient(...)">
    <h2 class="circles-detail-name">[Name]</h2>
    <p class="circles-detail-description">[Description]</p>
    <span class="circles-members-count">[X]/[max_members] miembros</span>
  </div>

  <!-- 2. Challenge Section (Active OR Empty State) -->
  <div class="circles-challenge">
    <!-- ChallengeDisplay OR NoChallengePrompt -->
  </div>

  <!-- 3. Members Section -->
  <div class="circles-members">
    <h4>👥 Miembros ([count]/[max_members])</h4>
    <div class="circles-members-grid">
      <!-- MemberCard components -->
    </div>
  </div>

  <!-- 4. Actions -->
  <div class="circles-options">
    <button class="circles-btn circles-btn-primary circles-btn-sm"
            onclick="circlesUI.showInviteModal()">
      Invitar amigos
    </button>
    <button class="circles-btn circles-btn-danger circles-btn-sm"
            onclick="circlesUI.confirmLeaveCircle()">
      Salir del círculo
    </button>
  </div>
</div>
```


#### 6. ChallengeDisplay (Active - Not Revealed)

**Active challenge with countdown and progress.**

**Structure:**
```html
<div class="circles-challenge">
  <h3 class="circles-section-title">🎯 Ejercicio Actual</h3>
  
  <!-- Challenge Image -->
  <div class="circles-challenge-image">
    <img src="[image.url]" alt="Challenge">
    <div class="circles-challenge-credit">Foto por [photographer]</div>
    <div class="circles-challenge-proposer">Propuesto por @[username]</div>
  </div>

  <!-- Status: Timer + Progress -->
  <div class="circles-challenge-status">
    <div class="circles-challenge-timer circles-urgent"> <!-- if < 1 hour -->
      ⏱️ <span>[H]h [M]m restantes</span>
    </div>
    <div class="circles-challenge-progress">
      <span class="circles-progress-label">[X]/[total] completaron</span>
      <div class="circles-progress-bar">
        <div class="circles-progress-fill" style="width: [%]%"></div>
      </div>
    </div>
  </div>

  <!-- Action Button (if not submitted) -->
  <button class="circles-btn circles-btn-primary" style="width: 100%"
          onclick="circlesUI.showWriteEntry()">
    Escribir mi entrada
  </button>

  <!-- Submitted Message (if already submitted) -->
  <div class="circles-submitted-message">
    ✅ Ya enviaste tu entrada. Esperando a los demás...
  </div>

  <!-- Locked Entries Grid -->
  <div class="circles-locked-grid">
    <!-- LockedEntryCard components -->
  </div>
  <p class="circles-locked-hint">
    Las entradas se revelarán cuando todos completen o pase el deadline
  </p>
</div>
```

**Timer Logic:**
- Calculate: `timeLeft = deadline - now`
- Hours: `Math.floor(timeLeft / (1000 * 60 * 60))`
- Minutes: `Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))`
- Urgent class when < 1 hour remaining

**Progress Bar:**
- Percentage: `(entries.length / members.length) * 100`
- Gradient fill: `linear-gradient(90deg, var(--circles-primary), var(--circles-secondary))`


#### 7. ChallengeDisplay (Revealed)

**Revealed challenge with social feed.**

**Structure:**
```html
<div class="circles-challenge">
  <h3 class="circles-section-title">🎯 Ejercicio Actual</h3>
  
  <!-- Challenge Image (same as active) -->
  <div class="circles-challenge-image">...</div>

  <!-- Revealed Badge -->
  <div class="circles-challenge-status">
    <div class="circles-challenge-revealed">✨ Entradas Reveladas</div>
  </div>

  <!-- Entries Feed -->
  <div class="circles-entries">
    <h4 class="circles-entries-title">📝 Entradas ([count])</h4>
    <!-- EntryCard components -->
  </div>

  <!-- Comments Section -->
  <div class="circles-comments">
    <!-- CommentsSection component -->
  </div>
</div>
```

#### 8. EntryCard (Revealed)

**Single revealed entry with like button.**

**Structure:**
```html
<div class="circles-entry circles-own"> <!-- if user's own entry -->
  <!-- Header: Author + Like Button -->
  <div class="circles-entry-header">
    <div class="circles-entry-author">
      <div class="circles-author-avatar" style="background: [color]">
        [First letter]
      </div>
      <span class="circles-author-name">@[username]</span>
      <span class="circles-own-badge">Tú</span> <!-- if own -->
    </div>
    <button class="circles-like-btn circles-liked" <!-- if liked -->
            onclick="circlesUI.toggleLike('[entryId]', [isLiked])">
      <svg>[Heart icon]</svg>
      <span>[likeCount]</span>
    </button>
  </div>

  <!-- Title (optional) -->
  <h5 class="circles-entry-title">[Title]</h5>

  <!-- Entry Text -->
  <div class="circles-entry-text">[Text content]</div>

  <!-- Footer: Metadata -->
  <div class="circles-entry-footer">
    <span class="circles-entry-meta">[word_count] palabras</span>
  </div>
</div>
```

**Visual Styling:**
- Own entries: Border color `--circles-primary`, subtle gradient background
- Like button: Filled heart when liked, red color
- Entry text: `white-space: pre-wrap` to preserve formatting


#### 9. LockedEntryCard

**Locked entry before revelation (shows completion status).**

**Structure:**
```html
<div class="circles-locked-card circles-own"> <!-- if user's own -->
  <div class="circles-locked-avatar" style="background: [color]">
    [First letter]
  </div>
  <span class="circles-locked-username">@[username]</span>
  <span style="font-size: 1.5rem;">
    ✓   <!-- if own entry -->
    🔒  <!-- if other's entry -->
  </span>
</div>
```

**Grid Layout:**
```css
.circles-locked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
}
```

#### 10. CommentsSection

**General comments on challenge.**

**Structure:**
```html
<div class="circles-comments">
  <h4 class="circles-comments-title">💬 Comentarios Generales</h4>
  
  <!-- Comments List -->
  <div class="circles-comments-list">
    <div class="circles-comment circles-own"> <!-- if own comment -->
      <div class="circles-comment-avatar" style="background: [color]">
        [First letter]
      </div>
      <div class="circles-comment-content">
        <span class="circles-comment-author">@[username]</span>
        <p class="circles-comment-text">[Comment text]</p>
      </div>
      <button class="circles-comment-delete"
              onclick="circlesUI.deleteComment('[id]')">
        🗑️
      </button> <!-- Only if own comment -->
    </div>
  </div>

  <!-- Add Comment Form -->
  <div class="circles-comment-form">
    <input type="text" id="newCommentInput"
           placeholder="Escribe un comentario..."
           class="circles-comment-input">
    <button class="circles-comment-submit"
            onclick="circlesUI.addComment('[challengeId]')">
      <svg>[Send icon]</svg>
    </button>
  </div>
</div>
```

**Behavior:**
- Comments display chronologically (oldest first)
- Delete button only for own comments
- Input clears after successful submission


#### 11. CreateCircleForm

**Form for creating new circle.**

**Structure:**
```html
<div class="circles-form">
  <!-- Circle Name -->
  <div class="circles-form-group">
    <label class="circles-form-label" for="circleName">
      Nombre del Círculo *
    </label>
    <input type="text" id="circleName" class="circles-form-input"
           placeholder="Ej: Amigos del alma" maxlength="50" required>
  </div>

  <!-- Description (Optional) -->
  <div class="circles-form-group">
    <label class="circles-form-label" for="circleDescription">
      Descripción (opcional)
    </label>
    <textarea id="circleDescription" class="circles-form-textarea"
              placeholder="¿De qué trata este círculo?"
              maxlength="200" rows="3"></textarea>
  </div>

  <!-- Color Picker -->
  <div class="circles-form-group">
    <label class="circles-form-label">Color del Círculo</label>
    <div class="circles-color-picker">
      <button class="circles-color-option circles-selected"
              data-color="#6366f1" style="background: #6366f1"></button>
      <button class="circles-color-option"
              data-color="#ec4899" style="background: #ec4899"></button>
      <!-- More color options... -->
    </div>
  </div>

  <!-- Max Members (Fixed at 12) -->
  <div class="circles-form-group">
    <label class="circles-form-label" for="maxMembers">
      Límite de Miembros
    </label>
    <input type="number" id="maxMembers" class="circles-form-input"
           value="12" min="2" max="12">
    <small class="circles-form-hint">
      Cada círculo puede tener máximo 12 miembros
    </small>
  </div>

  <!-- Actions -->
  <div class="circles-form-actions">
    <button class="circles-btn circles-btn-secondary"
            onclick="circlesUI.showCirclesList()">
      Cancelar
    </button>
    <button class="circles-btn circles-btn-primary" id="submitCircleBtn"
            onclick="circlesUI.submitCreateCircle()">
      Crear Círculo
    </button>
  </div>
</div>
```

**Validation:**
- Name: Required, max 50 characters
- Description: Optional, max 200 characters
- Color: One must be selected (default: #6366f1)
- Max members: Between 2-12, default 12
- Backend: Check owned circles < 10


#### 12. ProposeImageForm

**Image selection for new challenge.**

**Structure:**
```html
<div class="circles-form">
  <h3 class="circles-section-title">Proponer Imagen para el Ejercicio</h3>
  <p class="circles-form-hint">
    Selecciona la imagen del día actual o elige una de tu banco personal
  </p>

  <!-- Image Source Selection -->
  <div class="circles-form-group">
    <label class="circles-form-label">Fuente de la imagen</label>
    <div style="display: flex; gap: 0.75rem;">
      <button class="circles-btn circles-btn-primary circles-btn-sm circles-source-active"
              data-source="current"
              onclick="circlesUI.selectImageSource('current')">
        Imagen del Día
      </button>
      <button class="circles-btn circles-btn-secondary circles-btn-sm"
              data-source="bank"
              onclick="circlesUI.selectImageSource('bank')">
        Mi Banco
      </button>
    </div>
  </div>

  <!-- Image Preview -->
  <div class="circles-challenge-image" id="imagePreview">
    <img src="[selectedImage.url]" alt="Vista previa">
    <div class="circles-challenge-credit">Por [photographer]</div>
  </div>

  <!-- Image Bank Grid (shown when "bank" selected) -->
  <div id="imageBankGrid" style="display: none;">
    <div class="circles-image-bank-grid">
      <!-- Thumbnails from user_images table -->
    </div>
  </div>

  <!-- Actions -->
  <div class="circles-form-actions">
    <button class="circles-btn circles-btn-secondary"
            onclick="circlesUI.showCircleDetail('[circleId]')">
      Cancelar
    </button>
    <button class="circles-btn circles-btn-primary"
            onclick="circlesUI.submitProposal()">
      Proponer Esta Imagen
    </button>
  </div>
</div>
```

**Logic:**
1. **Default:** "Imagen del Día" selected, preview shows `window.currentImage`
2. **User clicks "Mi Banco":**
   - Query: `SELECT * FROM user_images WHERE user_id = currentUserId ORDER BY created_at DESC`
   - Render grid of thumbnails
   - User clicks thumbnail → Update preview → Enable submit button
3. **Submit:** Validate selectedImage exists, call `proposeChallenge()`

**Image Bank Grid Item:**
```html
<div class="circles-image-bank-item" onclick="circlesUI.selectBankImage('[imageData]')">
  <img src="[thumbnail_url]" alt="[title]">
  <div class="circles-image-bank-overlay">
    <span>[title]</span>
  </div>
</div>
```

 elige una de tu banco personal
  </p>

  <!-- Image Source Selection -->
  <div class="circles-form-group">
    <label class="circles-form-label">Fuente de la imagen</label>
    <div style="display: flex; gap: 0.75rem;">
      <button class="circles-btn circles-btn-primary circles-btn-sm circles-source-active"
              data-source="current"
              onclick="circlesUI.selectImageSource('current')">
        Imagen del Día
      </button>
      <button class="circles-btn circles-btn-secondary circles-btn-sm"
              data-source="bank"
              onclick="circlesUI.selectImageSource('bank')">
        Mi Banco
      </button>
    </div>
  </div>

  <!-- Image Preview -->
  <div class="circles-challenge-image" id="imagePreview">
    <img src="[selectedImage.url]" alt="Vista previa">
    <div class="circles-challenge-credit">Por [photographer]</div>
  </div>

  <!-- Actions -->
  <div class="circles-form-actions">
    <button class="circles-btn circles-btn-secondary"
            onclick="circlesUI.showCircleDetail('[circleId]')">
      Cancelar
    </button>
    <button class="circles-btn circles-btn-primary"
            onclick="circlesUI.submitProposal()">
      Proponer Esta Imagen
    </button>
  </div>
</div>
```

## Data Models

### Database Schema

#### circles

**Purpose:** Store circle metadata

**Columns:**
```sql
id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name                    VARCHAR(100) NOT NULL
description             TEXT
cover_color             VARCHAR(7) DEFAULT '#6366f1'
max_members                 INTEGER DEFAULT 12 CHECK (max_members <= 12)
created_by_user_id      UUID REFERENCES users(id) ON DELETE CASCADE
created_by_username     VARCHAR(50)
created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Indexes:**
- `idx_circles_creator` on `created_by_user_id`

**Constraints:**
- Max 12 members per circle (enforced by CHECK)

---

#### circle_members

**Purpose:** Store member relationships and roles

**Columns:**
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
circle_id       UUID REFERENCES circles(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
username        VARCHAR(50) NOT NULL
role            VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member'))
joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()

UNIQUE(circle_id, user_id)
```

**Indexes:**
- `idx_circle_members_circle` on `circle_id`
- `idx_circle_members_user` on `user_id`

**Constraints:**
- One user can only be member once per circle (UNIQUE)
- Role must be 'admin' or 'member'

---

#### circle_invitations

**Purpose:** Store pending invitations

**Columns:**
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
circle_id       UUID REFERENCES circles(id) ON DELETE CASCADE
inviter_id      UUID REFERENCES users(id) ON DELETE CASCADE
invitee_id      UUID REFERENCES users(id) ON DELETE CASCADE
status          VARCHAR(20) DEFAULT 'pending'
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
responded_at    TIMESTAMP WITH TIME ZONE

CHECK (status IN ('pending', 'accepted', 'rejected'))
```

**Indexes:**
- `idx_invitations_invitee` on `invitee_id, status`

---

#### circle_challenges

**Purpose:** Store writing challenges

**Columns:**
```sql
id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4()
circle_id               UUID REFERENCES circles(id) ON DELETE CASCADE
proposed_by_user_id     UUID REFERENCES users(id) ON DELETE SET NULL
proposed_by_username    VARCHAR(50)
image                   JSONB NOT NULL
status                  VARCHAR(20) DEFAULT 'active'
deadline                TIMESTAMP WITH TIME ZONE NOT NULL
created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
revealed_at             TIMESTAMP WITH TIME ZONE

CHECK (status IN ('active', 'revealed'))
```

**Indexes:**
- `idx_challenges_circle_status` on `circle_id, status`

**Image JSONB Structure:**
```json
{
  "url": "https://...",
  "photographer": "Photographer Name",
  "source": "Unsplash",
  "title": "Image Title"
}
```

---

#### circle_challenge_entries

**Purpose:** Store user submissions

**Columns:**
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
challenge_id    UUID REFERENCES circle_challenges(id) ON DELETE CASCADE
circle_id       UUID REFERENCES circles(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
username        VARCHAR(50) NOT NULL
title           VARCHAR(200)
text            TEXT NOT NULL
word_count      INTEGER NOT NULL
is_revealed     BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()

UNIQUE(challenge_id, user_id)
```

**Indexes:**
- `idx_entries_challenge` on `challenge_id`
- `idx_entries_user` on `user_id`

**Constraints:**
- One entry per user per challenge (UNIQUE)

---

#### circle_entry_likes

**Purpose:** Store likes on entries

**Columns:**
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
entry_id        UUID REFERENCES circle_challenge_entries(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
username        VARCHAR(50) NOT NULL
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()

UNIQUE(entry_id, user_id)
```

**Indexes:**
- `idx_likes_entry` on `entry_id`

---

#### circle_challenge_comments

**Purpose:** Store general comments

**Columns:**
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
challenge_id    UUID REFERENCES circle_challenges(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
username        VARCHAR(50) NOT NULL
comment         TEXT NOT NULL
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Indexes:**
- `idx_comments_challenge` on `challenge_id, created_at`

## Correctness Properties

### Property 1: Circle Limit Enforcement

**Validates: Requirements 1.1, 1.5**

**Property:** `∀ user: ownedCircles(user) ≤ 10`

**Validation:**
- Count circles where `created_by_user_id = userId`
- Must be < 10 before creating new circle

**Test Strategy:**
```javascript
// Create 10 circles successfully
// 11th attempt should throw error
```

---

### Property 2: Invitation Limit Enforcement

**Validates: Requirements 1.2, 1.3, 1.6, 1.7**

**Property:** `∀ user: totalMemberships(user) ≤ 25 ∧ invitedMemberships(user) ≤ 15`

**Validation:**
- Count all memberships for user
- Calculate invited = total - owned
- Validate before accepting invitation

**Test Strategy:**
```javascript
// Accept invitations until limits
// Verify rejection at boundaries
```

---

### Property 3: Member Capacity Enforcement

**Validates: Requirements 1.4, 1.8**

**Property:** `∀ circle: members(circle) ≤ circle.max_members ≤ 12`

**Validation:**
- Check member count before accepting invitation
- Database constraint enforces max_members ≤ 12

**Test Strategy:**
```javascript
// Fill circle to capacity
// Next invitation acceptance should fail
```

---

### Property 4: Automatic Revelation Trigger

**Validates: Requirements 5.3, 5.4, 5.5, 5.6**

**Property:** `∀ challenge: (entries(challenge) = members(circle) ∨ now ≥ deadline) ⇒ revealed(challenge)`

**Validation:**
- Check after each entry submission
- Check on circle detail view load

**Test Strategy:**
```javascript
// Submit all entries → verify revelation
// Wait for deadline → verify revelation
```

---

### Property 5: One Entry Per User Per Challenge

**Validates: Requirements 5.1, 5.2**

**Property:** `∀ challenge, user: entries(challenge, user) ≤ 1`

**Validation:**
- Database UNIQUE constraint on (challenge_id, user_id)

**Test Strategy:**
```javascript
// Submit entry twice
// Second attempt should fail
```

---

### Property 6: One Like Per User Per Entry

**Validates: Requirements 6.6, 6.7, 6.8**

**Property:** `∀ entry, user: likes(entry, user) ≤ 1`

**Validation:**
- Database UNIQUE constraint on (entry_id, user_id)

**Test Strategy:**
```javascript
// Like entry twice
// Second like ignored or toggled
```

## Error Handling

### Frontend Error Handling

**Pattern:** Try-catch with user-friendly messages

```javascript
async createCircle() {
  try {
    await circlesManager.createCircle(...);
    this.showToast('Círculo creado exitosamente', 'success');
  } catch (error) {
    console.error('Create circle error:', error);
    this.showToast(error.message || 'Error al crear círculo', 'error');
  }
}
```

### Backend Error Types

**1. Validation Errors**


- **Limit exceeded:** Clear message about which limit
- **Invalid input:** Specific field validation errors
- **User not found:** "Usuario no encontrado"

**2. Authorization Errors**

- **Not a member:** "No eres miembro de este círculo"
- **Not admin:** "Solo el administrador puede realizar esta acción"

**3. State Errors**

- **Challenge already exists:** "Ya hay un ejercicio activo"
- **Challenge not active:** "El ejercicio ya fue revelado"
- **Already submitted:** "Ya enviaste tu entrada"

**4. Database Errors**

- **Connection failed:** "Error de conexión. Intenta de nuevo"
- **Constraint violation:** Map to user-friendly message

### Error Message Mapping

```javascript
const ERROR_MESSAGES = {
  'limit_circles_owned': 'Has alcanzado el límite de 10 círculos creados',
  'limit_circles_total': 'Has alcanzado el límite de 25 círculos totales',
  'limit_circles_invited': 'Has alcanzado el límite de 15 círculos como invitado',
  'circle_full': 'El círculo está lleno',
  'user_not_found': 'Usuario no encontrado',
  'already_member': 'El usuario ya es miembro',
  'challenge_exists': 'Ya hay un ejercicio activo',
  'not_member': 'No eres miembro de este círculo',
  'not_admin': 'Solo el administrador puede hacer esto'
};
```

## Testing Strategy

### Unit Testing

**Frontend (circles-ui.js):**
- Toast notification display
- Form validation logic
- Avatar color generation
- Word count calculation
- Timer countdown logic

**Backend (circles-manager.js):**
- Limit validation functions
- Revelation trigger logic
- Data transformation methods

### Integration Testing

**Circle Lifecycle:**
1. Create circle with validation
2. Invite users
3. Accept/reject invitations
4. Verify member count

**Challenge Lifecycle:**
1. Propose challenge (both image sources)
2. Submit entries from multiple users
3. Verify automatic revelation (all complete)
4. Verify automatic revelation (deadline)
5. Like entries
6. Add comments

**Edge Cases:**
- Create 11th circle (should fail)
- Accept 26th membership (should fail)
- Join full circle (should fail)
- Propose second challenge (should fail)
- Submit second entry (should fail)
- Like own entry (should be prevented)

### Manual Testing Checklist

**Modular CSS:**
- [ ] No style conflicts with global app
- [ ] All prefixes correct (`circles-`)
- [ ] Modal independent from global modal
- [ ] Animations smooth at 60fps

**Responsive Design:**
- [ ] Mobile view (<768px)
- [ ] Tablet view (768-1024px)
- [ ] Desktop view (>1024px)
- [ ] Touch interactions work
- [ ] No horizontal scroll

**User Flows:**
- [ ] Complete circle creation flow
- [ ] Complete invitation flow (both accept/reject)
- [ ] Complete challenge proposal (both sources)
- [ ] Complete entry submission
- [ ] Revelation on all complete
- [ ] Revelation on deadline
- [ ] Like/unlike entries
- [ ] Add/delete comments
- [ ] Leave circle
- [ ] Admin transfer on leave

**Error Scenarios:**
- [ ] All limit violations show correct errors
- [ ] Network errors handled gracefully
- [ ] Empty states display correctly
- [ ] Loading states work properly
