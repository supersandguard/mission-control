# Mission Control — Design Review by Johnny

**Estado visual actual: C-** — Funcional pero inconsistente. Falta jerarquía clara y sistema de diseño.

## 🚨 Top 5 Visual Issues

### 1. **Headers demasiado pequeños**
Control.jsx líneas 245/382/507: `text-sm` para section headers es microscópico. Imposible escanear contenido.

### 2. **Modales quebrados en móvil** 
Dashboard.jsx línea 123: `w-96` explota en pantallas pequeñas. Modal fuera de vista.

### 3. **Toggles con posicionamiento hardcoded**
Control.jsx línea 318: `left-[14px]` es frágil. Se ve mal en diferentes tamaños.

### 4. **Inconsistencia brutal en botones**
15+ variantes de botones en Control.jsx (líneas 196, 87, etc). Caos visual total.

### 5. **Texto microscópico en móvil**
`text-[10px]` en Status Bar línea 75. Imposible de leer, problemas de accesibilidad.

## ⚡ Quick Wins (cambios mínimos, máximo impacto)

### 1. **Fix headers inmediatamente**
```jsx
// ANTES (Control.jsx línea 245)
<h3 className="text-sm font-semibold text-text">💓 Heartbeat</h3>

// DESPUÉS
<h2 className="text-base font-semibold text-text border-b border-card/30 pb-2 mb-3">💓 Heartbeat</h2>
```

### 2. **Modal responsive fix**
```jsx
// ANTES (Dashboard.jsx línea 123)  
<div className="bg-surface border border-card rounded-xl p-6 w-96 shadow-2xl">

// DESPUÉS
<div className="bg-surface border border-card rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
```

### 3. **Tipografía móvil legible**
```jsx
// ANTES (Control.jsx línea 75)
className="flex items-center gap-3 text-[10px] md:text-xs text-muted"

// DESPUÉS  
className="flex items-center gap-3 text-xs md:text-sm text-muted"
```

### 4. **Botón primario estandarizado**
```jsx
// Reemplazar TODAS las variantes por:
className="bg-highlight hover:bg-highlight/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
```

### 5. **Card padding consistente**
```jsx
// Usar en TODOS los cards:
className="bg-surface border border-card rounded-lg p-4"
```

## 🎨 Premium Dark Theme Palette

### Core Colors
```css
background: #0a0a0f    /* Más profundo que actual */
surface:    #151520    /* Cards/modales */  
card:       #1f1f2e    /* Elementos interactive */
accent:     #2a2a3f    /* Borders/dividers */
highlight:  #6366f1    /* Indigo en lugar de blue genérico */
```

### Text & Status
```css
text:       #f1f5f9    /* Más alto contraste */
muted:      #94a3b8    /* Más legible */
success:    #10b981    /* Mantener */
warning:    #f59e0b    /* Mantener */
danger:     #ef4444    /* Mantener */
```

### Implementation
Reemplazar custom CSS properties en index.css y usar en tailwind.config.js.

## 📝 Typography Fixes Exactos

### Headers
```jsx
// Page titles  
"text-xl md:text-2xl font-bold text-text leading-tight"

// Section headers (Control.jsx líneas 245, 382, 507)
"text-base font-semibold text-text border-b border-card/30 pb-2"

// Sub-headers
"text-sm font-medium text-text"
```

### Body text
```jsx
// Normal text
"text-sm text-text leading-relaxed"

// Muted text (NUNCA menos de text-xs)
"text-xs text-muted"

// Code/mono
"text-xs font-mono text-text"
```

### Mobile overrides
```jsx
// Status bar stats
"text-xs md:text-sm text-muted"

// Mobile nunca menos de 12px (text-xs)
```

## 🧩 Component Consistency

### 1. **Buttons - 4 variantes máximo**
```jsx
// PRIMARY: Control.jsx línea 196
const primaryBtn = "bg-highlight hover:bg-highlight/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"

// SECONDARY: nuevo
const secondaryBtn = "bg-card border border-accent hover:border-highlight/50 text-text px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"

// GHOST: Dashboard.jsx línea 548
const ghostBtn = "text-highlight hover:bg-highlight/10 px-3 py-2 rounded-lg text-sm font-medium transition-colors"

// DANGER: nuevo
const dangerBtn = "bg-danger hover:bg-danger/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
```

### 2. **Form inputs unificados**
```jsx
// Control.jsx línea 318, Dashboard.jsx línea 162
const inputClass = "bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight transition-colors"
```

### 3. **Card containers**
```jsx
// Usar EN TODAS PARTES
const cardClass = "bg-surface border border-card rounded-lg p-4"
```

### 4. **Toggle component proper**
```jsx
// Reemplazar hardcoded toggle Control.jsx línea 316
const toggleClass = `
  relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
  transition-colors duration-200 ease-in-out focus:outline-none
  ${enabled ? 'bg-highlight' : 'bg-card'}
`
const toggleDot = `
  pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg 
  transition duration-200 ease-in-out
  ${enabled ? 'translate-x-4' : 'translate-x-0'}
`
```

## 🔧 Priority Actions

### Week 1: Critical fixes
1. Headers size fix (text-base)
2. Modal responsive fix  
3. Mobile typography (min text-xs)
4. Primary button standardization

### Week 2: System implementation  
1. Color palette en tailwind.config.js
2. Component classes consolidation
3. Card padding standardization

**Resultado esperado:** De C- a B+ en una semana, A- en dos semanas.

---
*Johnny • 2025 • "Si el usuario tiene que pensar, algo falló"*