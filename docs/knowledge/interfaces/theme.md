# Theme System Interface Documentation

## Overview
The theme system provides a consistent way to style components across the application using CSS custom properties (variables).

## CSS Variables Interface

### Base Colors
```css
--primary: #646cff
--primary-hover: #535bf2
--success: #4caf50
--warning: #ff9800
--error: #f44336
```

### Theme-Specific Variables
```css
--bg-color
--bg-secondary
--text-color
--text-secondary
--border-color
--button-bg
```

## Usage

### Accessing Theme Variables
```css
.your-component {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

### Theme Transitions
All theme changes include a smooth transition:
```css
element {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## Component Classes

### Card Component
```css
.card {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}
```

## Performance Characteristics
- Theme changes are handled via CSS variables for optimal performance
- Transitions are hardware-accelerated where possible
- Media queries used for system preference detection

## Error Handling
- Fallback colors are provided in RGB format
- System preference detection gracefully degrades

## Side Effects
- Changes to theme variables will affect all components using them
- Theme changes trigger transitions on affected properties
