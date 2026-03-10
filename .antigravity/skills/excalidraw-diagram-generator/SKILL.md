---
name: excalidraw-diagram-generator
description: 'Generates Excalidraw diagrams from text descriptions or code structures, helping visualize architectural flows and UI layouts.'
---

# Excalidraw Diagram Generator

## Workflow
1. **Understand Request**: Identify diagram type (Flowchart, Relationship, Mind Map, Architecture).
2. **Extract Info**: List nodes and connections.
3. **Generate JSON**: Create `.excalidraw` content with elements.

### Diagram Types
- **Flowchart**: Process flows, decision points.
- **Relationship Diagram**: Connections, dependencies.
- **Mind Map**: Concept hierarchy.
- **Architecture**: System design, modules.
- **Class/ER Diagram**: OOP or DB structures.

### Execution rules
- **Font**: Use `fontFamily: 5` (Excalifont) for ALL text.
- **Layout**: Keep it readable, avoid overlapping.
- **Icons**: Use simple shapes or text if icon libraries are not specified.

## Output Format
Always provide the JSON within a code block or instructions to save as `.excalidraw`.
