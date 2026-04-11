# DESIGN.md — UI/UX Elements

This document summarizes the key UI/UX elements and design patterns used in the admin dashboard for AstroAdmin, focusing on reusable components, visual styles, and interaction patterns. The recommendations below are inspired by modern design systems (e.g., Material, Ant Design, Shadcn/ui) and best practices for accessibility, clarity, and delight.

---

## 1. Glass Panel Card
**Usage:** Main container for sections (profile, filters, payment info, marriage details, etc.)
**Style:**
  - Semi-transparent background with blur (glassmorphism)
  - Rounded corners (border-radius: 1.25-1.5rem for large cards, 0.75-1rem for small)
  - Subtle multi-layer box-shadow for depth
  - Border with low-opacity accent color (e.g., purple, or adapt to context)
  - Padding: 1.5-2rem
**Micro-interaction:** Slight scale-up and shadow intensification on hover
**Accessibility:** Sufficient contrast, focus ring for keyboard navigation

## 2. Filter Bar
**Usage:** Top of bookings page for searching and filtering
**Style:**
  - Horizontal flex layout, wraps on small screens
  - Grouped in a glass panel card
  - Inputs: rounded, subtle border, focus ring in accent color
  - Icons (search, calendar) for clarity
  - Responsive spacing and alignment
  - Clear button: small, rounded, muted color, hover accent
**Enhancements:**
  - Sticky positioning on scroll for persistent access
  - Animated transitions for filter changes
  - Tooltips for filter controls

## 3. Input Fields
**Style:**
  - Rounded corners (border-radius: 0.75-1rem)
  - Subtle border (accent on focus)
  - Background: dark, slightly translucent
  - Text: light color for contrast
  - Padding: 0.5-0.75rem
**Micro-interaction:**
  - Smooth focus/blur transitions
  - Floating label for better context
**Accessibility:**
  - Large clickable area
  - Visible focus ring
  - Placeholder text with sufficient contrast

## 4. Select Dropdowns
**Style:**
  - Rounded corners
  - Subtle border, accent on focus
  - Background: dark, matches input fields
  - Text: light color
  - Padding: 0.5-0.75rem
**Enhancements:**
  - Custom dropdown arrow icon
  - Option hover highlight
  - Keyboard navigation support

## 5. Buttons
**Style:**
  - Rounded, medium size
  - Primary: accent color background (purple), white text
  - Secondary: muted background, accent border
  - Hover/focus: brighter background or border
  - Disabled: reduced opacity
**Micro-interaction:**
  - Ripple or subtle scale effect on click
  - Loading spinner for async actions
**Accessibility:**
  - Sufficient color contrast
  - Large touch target

## 6. Table/List Rows
**Style:**
  - Alternating row background (subtle)
  - Hover: highlight row with accent background
  - Text: clear hierarchy (bold for main, muted for secondary)
  - Actions: right-aligned, small buttons
**Enhancements:**
  - Row selection highlight
  - Sticky header for large tables
  - Animated row transitions (add/remove)

## 7. Status Badges
**Style:**
  - Rounded pill shape
  - Color-coded: green (completed), yellow (pending), red (failed)
  - Light background, bold text
  - Small size, inline with text
**Enhancements:**
  - Status icon (check, clock, x)
  - Subtle fade-in animation

## 8. Section Headers
**Style:**
  - Font: bold, larger size
  - Accent color underline or icon
  - Spacing below for separation
**Enhancements:**
  - Animated underline on hover
  - Section anchor for quick navigation

## 9. Toast Notifications
**Style:**
  - Floating card, top-right
  - Glassmorphism background
  - Icon for success/error
  - Rounded, shadow, padding
**Enhancements:**
  - Slide-in/out animation
  - Auto-dismiss with pause on hover
  - Accessible live region for screen readers

## 10. Responsive Design
**Patterns:**
  - Flex/grid layouts that wrap on small screens
  - Padding and gap adjustments for mobile
  - Inputs and buttons expand to full width on mobile
**Enhancements:**
  - Mobile-first breakpoints
  - Touch-friendly controls
  - Hide non-essential columns on mobile tables

---


---

### Additional UI/UX Best Practices

- **Accessibility:**
  - All interactive elements must be keyboard accessible
  - Sufficient color contrast for text and controls
  - Use aria-labels and roles for screen readers
  - Focus management for modals and dialogs
- **Delight:**
  - Micro-interactions (hover, click, focus) throughout
  - Subtle animations for state changes
  - Empty states with illustration and guidance
- **Consistency:**
  - Use a design token system for colors, spacing, typography
  - Consistent iconography and button sizing
- **Feedback:**
  - Immediate visual feedback for all actions (loading, error, success)
  - Undo option for destructive actions

---

> All elements use a dark theme with accent colors (purple, emerald, yellow, red) for status and actions. Consistent use of glassmorphism, rounded corners, subtle shadows, and micro-interactions creates a modern, accessible, and delightful user experience.
