# Implementation Plan: Circles Redesign

## Overview

This implementation plan covers the complete redesign of the Social Circles System into a modern social network experience. The implementation is organized into discrete tasks that build incrementally, with testing checkpoints to ensure quality at each stage.

**Key Implementation Principles:**
- 100% modular CSS with `circles-` prefix
- System limits enforcement (10/15/25 circles per user, 12 members per circle)
- Complete functionality: propose challenges, invite members, automatic revelation, social feed
- Responsive mobile-first design
- All tasks build on previous work - no orphaned code

## Tasks

- [x] 1. Complete CSS modularization and verify isolation
  - Audit all CSS selectors to ensure `circles-` prefix
  - Audit all CSS variables to ensure `--circles-` prefix
  - Remove any dependencies on global styles
  - Add explicit resets for inherited HTML element styles
  - Verify z-index values are above 1000
  - Test that circles styles don't affect other app components
  - Test that other app styles don't affect circles
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [ ]* 1.1 Write integration tests for CSS isolation
  - Test circles modal doesn't inherit global modal styles
  - Test circles buttons don't inherit global button styles
  - Test circles form inputs have independent styling
  - _Requirements: 2.3, 2.4_

- [x] 2. Implement propose challenge modal with image selection
  - [x] 2.1 Create `showProposeChallenge()` UI with two-option selector
    - Render modal with "Image of the Day" and "My Image Bank" options
    - Implement radio button or tab selection between options
    - Display `window.currentImage` as Option 1 preview
    - Query `user_images` table for Option 2 gallery
    - Render image grid for image bank selection
    - Implement image selection state management
    - Add preview display for selected image
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.2 Implement proposal validation and submission
    - Validate image is selected before submission
    - Validate no active challenge exists via `getActiveChallenge()`
    - Implement `submitProposal()` to call `circlesManager.proposeChallenge()`
    - Handle success: display toast and refresh circle view
    - Handle errors: display error toast with descriptive message
    - Add loading state during submission
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

- [ ]* 2.3 Write unit tests for propose challenge flow
  - Test image selection state management
  - Test validation prevents duplicate challenges
  - Test error handling for network failures
  - _Requirements: 3.6, 3.11_

- [x] 3. Implement invite members modal and validation
  - [x] 3.1 Create `showInviteModal()` UI component
    - Render modal with username input field
    - Display current member count (X/12) prominently
    - Add member list display showing current members
    - Implement @ symbol auto-prefix or trimming
    - Add submit button with loading state
    - Style modal using circles-specific classes
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [x] 3.2 Implement invitation validation and submission
    - Validate username is not empty
    - Call `circlesManager.inviteUser()` with validation
    - Handle "user not found" error with clear message
    - Handle "circle full" error (12 member limit)
    - Handle "already a member" error
    - Display success toast on successful invitation
    - Close modal after successful submission
    - Refresh circle detail view to show updated state
    - _Requirements: 4.4, 4.5, 4.7, 4.8, 4.9, 4.11_

- [ ]* 3.3 Write unit tests for invitation flow
  - Test username validation
  - Test member limit validation
  - Test duplicate member prevention
  - _Requirements: 4.4, 4.5, 4.11_

- [x] 4. Implement leave circle confirmation and admin logic
  - [x] 4.1 Create `confirmLeaveCircle()` with custom circles modal
    - Create circles-specific confirmation modal (not global)
    - Display standard warning about leaving circle
    - Check if user is admin and display admin-specific warning
    - Show consequences: "Admin rights will transfer to oldest member"
    - Add "Cancel" and "Leave Circle" buttons
    - Style using circles classes only
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 4.2 Implement leave circle logic with admin transfer
    - Call `circlesManager.leaveCircle(circleId)`
    - Display success toast notification
    - Redirect to circles list view using `showCirclesList()`
    - Handle errors gracefully with error toast
    - Update notification badge if needed
    - _Requirements: 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

- [ ]* 4.3 Write unit tests for leave circle flow
  - Test confirmation modal display
  - Test admin warning appears for admins
  - Test redirect after successful leave
  - _Requirements: 8.3, 8.4, 8.6, 8.7_

- [ ] 5. Checkpoint - Verify core user flows
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement admin management features
  - [x] 6.1 Create admin options UI in circle detail view
    - Add "Admin Options" section visible only to admins
    - Implement "Edit Circle" button and form
    - Add "Remove Member" button next to each non-admin member
    - Add "Transfer Admin" option in member actions
    - Add "Delete Circle" button (only when admin is sole member)
    - Style admin UI distinctly with admin badge colors
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.8_
  
  - [x] 6.2 Implement edit circle functionality
    - Create inline or modal form for editing name and description
    - Validate name is not empty
    - Call Supabase update on circles table
    - Refresh circle view with updated information
    - Display success toast
    - _Requirements: 9.2_
  
  - [x] 6.3 Implement remove member functionality
    - Display confirmation modal when "Remove Member" clicked
    - Show member username in confirmation message
    - Delete from `circle_members` table on confirmation
    - Update member count and grid display
    - Display success toast
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [x] 6.4 Implement transfer admin functionality
    - Display confirmation modal for admin transfer
    - Update both roles atomically using transaction or two updates
    - Refresh circle view to show new admin badge
    - Display success toast
    - _Requirements: 9.6, 9.7_
  
  - [x] 6.5 Implement delete circle functionality
    - Show only when admin is sole remaining member
    - Display strong warning confirmation modal
    - Delete circle and all related records (cascading deletes handle most)
    - Redirect to circles list
    - Display success toast
    - _Requirements: 9.8, 9.9, 9.10_

- [ ]* 6.6 Write integration tests for admin features
  - Test only admins see admin options
  - Test remove member updates member list
  - Test admin transfer changes badges
  - Test delete circle redirects correctly
  - _Requirements: 9.1, 9.5, 9.7, 9.9_

- [x] 7. Implement notification system enhancements
  - [x] 7.1 Enhance notification badge functionality
    - Verify badge displays count correctly (1-9, or "9+")
    - Ensure badge is hidden when count is 0
    - Implement 30-second polling only when modal is open
    - Add pulse animation to badge using `circles-pulse-notification`
    - Test badge updates immediately after invitation actions
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 10.8, 10.9_
  
  - [x] 7.2 Implement invitation list display and sorting
    - Sort invitations by newest first
    - Update invitation display dynamically after accept/reject
    - Refresh badge count after invitation response
    - _Requirements: 10.6, 10.7_

- [ ]* 7.3 Write unit tests for notification system
  - Test badge count calculation
  - Test badge visibility toggling
  - Test polling starts/stops correctly
  - _Requirements: 10.1, 10.2, 10.9_

- [x] 8. Enhance social feed and interaction features
  - [x] 8.1 Refine revealed entries feed display
    - Verify entry cards display correctly with all metadata
    - Ensure own entries have distinct styling with border
    - Test like button state (filled/unfilled heart)
    - Verify like count updates without page refresh
    - Test word count display is accurate
    - Ensure text preserves formatting with `white-space: pre-wrap`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10_
  
  - [x] 8.2 Implement locked entries grid for active challenges
    - Display locked grid when challenge is active but not revealed
    - Show member avatars with completion status icons (✓ or 🔒)
    - Highlight own locked entry with distinct border
    - Display hint text about revelation conditions
    - Update grid dynamically as members submit
    - _Requirements: 5.1, 5.2, 5.8, 5.9_
  
  - [x] 8.3 Enhance comments section interactivity
    - Verify comments display chronologically
    - Test comment input clears after submission
    - Ensure delete button only appears for own comments
    - Test comment deletion with confirmation
    - Add loading state during comment submission
    - Display placeholder when no comments exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

- [ ]* 8.4 Write integration tests for social feed
  - Test like toggle updates count correctly
  - Test comments appear immediately after posting
  - Test delete removes comment from list
  - Test own entries have correct styling
  - _Requirements: 6.5, 6.6, 7.6, 7.7_

- [x] 9. Implement system limits validation on frontend
  - [x] 9.1 Add pre-creation validation for circles
    - Query user's owned circles count before showing create form
    - Display error toast if limit of 10 reached
    - Disable "Create Circle" button if limit reached
    - _Requirements: 1.1, 1.5, 1.9, 1.10_
  
  - [x] 9.2 Add pre-acceptance validation for invitations
    - Query user's total memberships before accepting
    - Check owned circles count to calculate invited count
    - Validate total < 25 and invited < 15
    - Query target circle's member count
    - Validate circle not full (< 12 members)
    - Display descriptive error message if any limit exceeded
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9, 1.10_
  
  - [x] 9.3 Add real-time member count display
    - Show "X/12 members" in circle cards
    - Show member count in invitation cards
    - Update counts dynamically after actions
    - Highlight when circle is near capacity (10+/12)
    - _Requirements: 1.4, 1.10_

- [ ]* 9.4 Write unit tests for limit validation
  - Test create circle blocked at 10 owned
  - Test accept invitation blocked at 25 total
  - Test accept invitation blocked at 15 invited
  - Test accept invitation blocked when circle full
  - _Requirements: 1.5, 1.6, 1.7, 1.8_

- [ ] 10. Checkpoint - Verify all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement responsive design for mobile devices
  - [x] 11.1 Add mobile-specific layout adjustments
    - Set modal width to 96vw and max-height to 94vh on mobile
    - Change circles grid to single column on screens < 768px
    - Change members grid to single column on mobile
    - Adjust locked entries grid to smaller minmax (100px)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 11.2 Optimize touch interactions
    - Ensure all buttons are minimum 44px tap targets
    - Test scrolling in modal body on touch devices
    - Verify image preview is touch-friendly
    - Test swipe gestures don't interfere with UI
    - _Requirements: 11.5, 11.6_
  
  - [x] 11.3 Optimize content for small screens
    - Ensure images scale appropriately without overflow
    - Verify text remains readable at mobile sizes
    - Test button text doesn't wrap awkwardly
    - Adjust padding/margins for mobile comfort
    - _Requirements: 11.7, 11.8, 11.9_

- [ ]* 11.4 Write responsive design tests
  - Test layout at 768px breakpoint
  - Test layout at 375px (mobile)
  - Test touch target sizes meet minimum
  - _Requirements: 11.1, 11.5_

- [ ] 12. Implement visual design polish and animations
  - [ ] 12.1 Verify color palette and theming
    - Ensure all components use CSS variables consistently
    - Test dark theme colors (default)
    - Test light theme colors if applicable
    - Verify contrast ratios meet accessibility standards
    - _Requirements: 12.1, 12.2_
  
  - [ ] 12.2 Implement and verify hover animations
    - Test circle card hover effect (translateY, shadow)
    - Verify cubic-bezier easing on all transitions
    - Test button hover states
    - Ensure animations run smoothly at 60fps
    - _Requirements: 12.3, 12.4, 12.9, 12.10_
  
  - [ ] 12.3 Implement specialized animations
    - Verify notification badge pulse animation
    - Test loading spinner rotation
    - Implement toast slide-up animation
    - Test all animations for smooth performance
    - _Requirements: 12.5, 12.6, 12.7, 12.10_
  
  - [ ] 12.4 Apply consistent visual styling
    - Ensure 8px border-radius on cards and buttons
    - Verify hover states on all interactive elements
    - Test focus states for accessibility
    - Polish spacing and alignment across all views
    - _Requirements: 12.8, 12.9_

- [ ]* 12.5 Write visual regression tests
  - Test component styling matches design
  - Test animations execute correctly
  - Test hover states appear as expected
  - _Requirements: 12.3, 12.5, 12.6, 12.7_

- [x] 13. Integrate automatic entry revelation system
  - [x] 13.1 Verify revelation trigger logic
    - Test revelation when all members submit entries
    - Test revelation when 24-hour deadline expires
    - Verify `checkAndRevealEntries()` is called after each submission
    - Verify `is_revealed` flag updates for all entries
    - Verify challenge status updates to 'revealed'
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 13.2 Implement deadline checking on view load
    - Check deadline on circle detail view load
    - Trigger revelation if deadline has passed
    - Display countdown timer accurately
    - Highlight timer in red when < 1 hour remaining
    - _Requirements: 5.4, 5.8_
  
  - [x] 13.3 Implement UI state transitions for revelation
    - Switch from locked grid to revealed feed on revelation
    - Display "✨ Entradas Reveladas" badge
    - Enable likes and comments after revelation
    - Display entry metadata after revelation
    - _Requirements: 5.8, 5.9, 5.10_

- [ ]* 13.4 Write integration tests for revelation system
  - Test revelation triggers when all members complete
  - Test revelation triggers when deadline expires
  - Test UI switches from locked to revealed state
  - Test likes/comments are enabled after revelation
  - _Requirements: 5.3, 5.4, 5.8, 5.9_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Test complete user journey: Create circle → Invite → Propose → Submit → Reveal → Interact
    - Create new circle and verify limits
    - Invite members and verify notifications
    - Propose challenge with image selection
    - Submit entries from multiple users
    - Verify automatic revelation
    - Test likes and comments functionality
    - Test leave circle and admin transfer
    - _Requirements: All_
  
  - [ ] 14.2 Cross-browser compatibility testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS Safari and Android Chrome
    - Verify styles render consistently
    - Test all interactions work on each browser
    - _Requirements: 11.10_
  
  - [ ] 14.3 Performance optimization
    - Verify modal opens/closes smoothly
    - Test feed scrolling performance with many entries
    - Optimize image loading in image bank
    - Verify polling doesn't cause performance issues
    - _Requirements: 12.10_

- [ ]* 14.4 Write end-to-end tests
  - Test complete circle lifecycle
  - Test multi-user interactions
  - Test error handling and recovery
  - _Requirements: All_

- [ ] 15. Final checkpoint - Comprehensive verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation should be done in sequence to ensure dependencies are met
- The design document contains complete specifications for all UI components and logic
- Backend (`circles-manager.js`) already implements core business logic and validation
- Database schema is already implemented with proper constraints and RLS policies
- Focus on frontend UI completion, validation, and user experience polish

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["1.1", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["4.2", "4.3"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 9, "tasks": ["6.6", "7.1"] },
    { "id": 10, "tasks": ["7.2", "7.3"] },
    { "id": 11, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 12, "tasks": ["8.4", "9.1", "9.2", "9.3"] },
    { "id": 13, "tasks": ["9.4"] },
    { "id": 14, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 15, "tasks": ["11.4", "12.1", "12.2", "12.3", "12.4"] },
    { "id": 16, "tasks": ["12.5", "13.1", "13.2", "13.3"] },
    { "id": 17, "tasks": ["13.4", "14.1", "14.2", "14.3"] },
    { "id": 18, "tasks": ["14.4"] }
  ]
}
```
