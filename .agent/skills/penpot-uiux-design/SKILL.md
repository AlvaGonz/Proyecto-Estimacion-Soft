---
name: penpot-uiux-design
description: 'Provides guidance on using Penpot for UI/UX design, focusing on creating layouts, components, and design systems for web applications.'
---

# Penpot UI/UX Design Guide

## Design Workflow
1. **Check for design system first**: Ask user if they have existing tokens/specs, or discover from current Penpot file.
2. **Understand the page**: Call `mcp__penpot__execute_code` with `penpotUtils.shapeStructure()` to see hierarchy.
3. **Find elements**: Use `penpotUtils.findShapes()` to locate elements by type or name.
4. **Create/modify**: Use `penpot.createBoard()`, `penpot.createRectangle()`, `penpot.createText()` etc.
5. **Apply layout**: Use `addFlexLayout()` for responsive containers.
6. **Validate**: Call `mcp__penpot__export_shape` to visually check your work.

## Key Penpot API Gotchas
- `width`/`height` are READ-ONLY → use `shape.resize(w, h)`
- `parentX`/`parentY` are READ-ONLY → use `penpotUtils.setParentXY(shape, x, y)`
- Use `insertChild(index, shape)` for z-ordering (not `appendChild`)
- Flex children array order is REVERSED for `dir="column"` or `dir="row"`
- After `text.resize()`, reset `growType` to `"auto-width"` or `"auto-height"`

## Positioning New Boards
**Always check existing boards before creating new ones** to avoid overlap.
- Use 100px gap between related screens (same flow).
- Use 200px+ gap between different sections/flows.
- Align boards vertically (same y) for visual organization.

## Default Design Tokens (fallback)
- **Spacing**: 8px base (8, 16, 24, 32, 48, 64).
- **Desktop**: 1440x900.
- **Mobile**: 375x812.
