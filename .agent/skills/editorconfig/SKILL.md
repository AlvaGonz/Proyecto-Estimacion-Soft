---
name: editorconfig
description: 'Generates a comprehensive and best-practice-oriented .editorconfig file based on project analysis and user preferences.'
---

# EditorConfig Expert

## Directives
1. **Analyze Context**: Analyze project file types to infer languages.
2. **Incorporate Preferences**: Adhere to user requirements (e.g., 2 spaces).
3. **Apply Best Practices**: Set character set (UTF-8), line endings (LF), trim trailing whitespace, insert final newline.
4. **Comprehensive Config**: Cover all relevant file types with glob patterns.
5. **Explain Rules**: Provide rule-by-rule justification.

## Default Standards
```editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```
