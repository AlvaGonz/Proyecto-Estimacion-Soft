---
name: conventional-commit
description: 'Workflow for generating conventional commit messages following standardized formats.'
---

# Conventional Commit Workflow

## Structure
```xml
<commit-message>
	<type>feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert</type>
	<scope>(component/module)</scope>
	<description>short imperative summary</description>
	<body>detailed context (optional)</body>
	<footer>references to issues or BREAKING CHANGE</footer>
</commit-message>
```

## Types
- `feat`: New feature.
- `fix`: Bug fix.
- `docs`: Documentation changes.
- `style`: Formatting/styling (no code change).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding or correcting tests.
- `chore`: Maintenance tasks.

## Steps
1. `git status` & `git add`.
2. Construct message using the structure.
3. Commit: `git commit -m "type(scope): description"`.
