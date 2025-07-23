# Minimalist Styling Guide for Phase 1 Implementation

## Design Philosophy

**Core Principles:**
- Clean, uncluttered interfaces
- Generous whitespace
- Subtle interactions
- Typography-first hierarchy
- Restrained color usage
- Refined micro-interactions

## Design System Overview

### Color Palette - Minimalist Approach

```css
/* Primary Palette - Subtle Grays */
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;

/* Accent Colors - Muted Tones */
--accent-purple: #8B5CF6;    /* Maven - Softer purple */
--accent-orange: #F59E0B;    /* WoW - Warmer orange */
--accent-blue: #3B82F6;      /* Bemnet - Classic blue */
--accent-green: #10B981;     /* PACCI - Natural green */

/* Minimalist Status Colors */
--success: #10B981;
--error: #EF4444;
--info: #6B7280;

/* Background & Surface */
--bg-primary: #FFFFFF;
--bg-secondary: #FAFAFA;
--surface: #FFFFFF;
--border: #E5E5E5;
```

### Typography - Clean & Minimal

```css
/* Font Stack - System Fonts for Clean Look */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;

/* Refined Type Scale */
text-xs: 0.75rem;    /* 12px - Minimal labels */
text-sm: 0.875rem;   /* 14px - Body text */
text-base: 1rem;     /* 16px - Default */
text-lg: 1.125rem;   /* 18px - Subtle emphasis */
text-xl: 1.25rem;    /* 20px - Section headers */
text-2xl: 1.5rem;    /* 24px - Page titles */

/* Minimal Font Weights */
font-normal: 400;    /* Body text */
font-medium: 500;    /* Subtle emphasis */
font-semibold: 600;  /* Headers only */

/* Line Heights for Readability */
leading-tight: 1.25;
leading-normal: 1.5;
leading-relaxed: 1.75;
```

### Spacing System - Generous Whitespace

```css
/* Expanded spacing for elegant breathing room */
space-1: 0.25rem;   /* 4px - Micro spacing */
space-2: 0.5rem;    /* 8px - Tight grouping */
space-3: 0.75rem;   /* 12px - Inner padding */
space-4: 1rem;      /* 16px - Standard gap */
space-6: 1.5rem;    /* 24px - Section spacing */
space-8: 2rem;      /* 32px - Major sections */
space-12: 3rem;     /* 48px - Page sections */
space-16: 4rem;     /* 64px - Generous breaks */
```

## Component-Specific Styles - Minimalist Approach

### 1. Sidebar - Clean & Subtle

```jsx
// Sidebar container - No shadow, subtle border
className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen"

// Sidebar toggle - Smooth transition
className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-500 ease-out overflow-hidden`}

// Navigation items - Minimal states
// Default
className="w-full flex items-center gap-3 p-3 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"

// Active - Subtle highlight
className="w-full flex items-center gap-3 p-3 rounded-md bg-gray-100 text-gray-900 font-medium"

// Domain indicator - Understated
<span className="text-xs text-gray-400 opacity-60">{domain.icon}</span>
```

### 2. Domain Card - Elegant Simplicity

```jsx
// Card container - Subtle elevation
className="relative bg-white p-8 rounded-xl cursor-pointer hover:shadow-sm transition-all border border-gray-100 overflow-hidden group"

// Gradient overlay - Very subtle
<div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

// Role badge - Minimal style
className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium"

// Hover states - Refined
hover:shadow-sm       // Subtle elevation
hover:border-gray-200 // Slightly darker border
transform hover:-translate-y-0.5 // Micro lift
```

### 3. Domain Selector - Refined Dropdown

```jsx
// Trigger button - Minimal border
className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-all duration-200"

// Dropdown container - Soft shadow
className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-sm z-50"

// Dropdown items - Clean hover
// Default
className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors duration-200"

// Active domain - Subtle indication
className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors bg-gray-50 text-gray-900"

// Section header - Minimal style
className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider"
```

### 4. Role Selection - Understated Selection

```jsx
// Role card - Minimal selection state
style={{
  borderColor: isSelected ? '#E5E5E5' : undefined,
  backgroundColor: isSelected ? '#FAFAFA' : undefined
}}

// Base classes - Thin borders
className={`
  relative block p-6 rounded-lg border transition-all duration-200 cursor-pointer
  ${isSelected ? 'border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-gray-200 bg-white'}
  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
`}

// Price - Muted accent
<span className="text-sm font-medium text-gray-600">
  {role.price}
</span>

// Selected indicator - Subtle
{isSelected && (
  <div className="absolute top-4 right-4">
    <div className="w-2 h-2 bg-gray-900 rounded-full" />
  </div>
)}
```

### 5. Modal - Clean Overlay

```jsx
// Modal backdrop - Lighter overlay
className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50"

// Modal container - Minimal shadow
className="relative bg-white rounded-2xl p-12 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-sm border border-gray-100"

// No gradient background for cleaner look

// Join button - Subtle styling
className="w-full py-4 rounded-lg font-medium text-base transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800"

// Alternative: Ghost button style
className="w-full py-4 rounded-lg font-medium text-base transition-all duration-200 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
```

### 6. Recent Items - Subtle List

```jsx
// Item container - Minimal style
className="p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-0"

// Icon - Smaller, muted
className="text-base opacity-60"

// Typography - Clear hierarchy
className="text-sm font-medium text-gray-900 leading-tight"
className="text-xs text-gray-500 mt-1 leading-relaxed"

// Timestamp - De-emphasized
className="text-xs text-gray-400 mt-2"
```

## Responsive Design - Mobile-First Minimalism

### Breakpoints
```css
/* Mobile: default */
/* Tablet: md:* (768px) */
/* Desktop: lg:* (1024px) */
/* Wide: xl:* (1280px) */
```

### Responsive Patterns - Elegant Scaling

```jsx
// Grid - Generous spacing
className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12"

// Typography - Subtle scaling
className="text-base md:text-lg lg:text-xl"

// Padding - Spacious on larger screens
className="p-6 md:p-8 lg:p-12 xl:p-16"

// Container - Max width for readability
className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
```

## Animation Guidelines - Subtle & Refined

### Transitions - Smooth & Natural
```jsx
// Refined transitions
transition-all        // Smooth all changes
transition-colors     // Color only
transition-opacity    // Fades
transition-transform  // Movement

// Duration - Considered timing
duration-200  // Quick interactions
duration-300  // Standard transitions
duration-500  // Deliberate changes
duration-700  // Page transitions

// Easing - Natural movement
ease-out      // Most interactions
ease-in-out   // Continuous animations
```

### Hover Effects - Restraint
```jsx
// Micro-interactions only
hover:-translate-y-0.5  // Subtle lift
hover:shadow-sm         // Minimal shadow

// Color transitions - Subtle
hover:bg-gray-50        // Light backgrounds
hover:text-gray-900     // Darker text
hover:border-gray-200   // Border emphasis

// Avoid heavy effects
// ❌ hover:scale-110
// ❌ hover:shadow-2xl
// ✅ hover:opacity-90
```

## Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add domain colors if needed
        'maven': '#7C3AED',
        'wow': '#F97316',
        'bemnet': '#0EA5E9',
        'pacci': '#16A34A',
      },
      animation: {
        // Custom animations if needed
      },
    },
  },
  plugins: [],
}
```

## Accessibility - Elegant & Inclusive

### Focus States - Visible but Refined
```jsx
// Subtle focus ring
focus:outline-none focus:ring-1 focus:ring-gray-900 focus:ring-offset-2

// Alternative: Outline style
focus:outline-none focus:outline-2 focus:outline-offset-2 focus:outline-gray-900

// Skip links - Minimal style
className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-4 py-2 rounded-md shadow-sm"
```

### Color Contrast
```css
/* Minimum contrast ratios */
/* Normal text: 4.5:1 */
/* Large text: 3:1 */
/* Use gray-600 minimum on white backgrounds */
/* Use gray-400 minimum on gray-50 backgrounds */
```

### Motion Preferences
```jsx
// Respect reduced motion
className="motion-safe:transition-all motion-reduce:transition-none"

// Disable animations for prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Tips for Minimalist Design

### 1. **Whitespace is Key**
- Use generous padding and margins
- Let elements breathe
- Empty space is not wasted space

### 2. **Typography First**
- Establish clear hierarchy with size and weight
- Limit font weights to 2-3 maximum
- Use color sparingly for emphasis

### 3. **Subtle Interactions**
- Micro-animations only where meaningful
- Hover states should be barely noticeable
- Focus on functional feedback

### 4. **Color Restraint**
- Primarily grayscale palette
- Domain colors used sparingly as accents
- Avoid gradients in UI elements (cards only)

### 5. **Border & Shadow Usage**
- Prefer borders over shadows
- Use 1px borders in light gray
- Shadows only for modals and dropdowns

## Example: Minimalist Button Styles

```jsx
// Primary - Black on white
className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"

// Secondary - Outlined
className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 hover:text-gray-900 transition-all duration-200"

// Ghost - No border
className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
```