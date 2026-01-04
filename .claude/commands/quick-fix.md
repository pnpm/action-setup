# Quick: Fix

Automatically fix common code quality issues.

## What This Does

Runs automated fixes for linting, formatting, and other auto-correctable issues in the action codebase.

## Fixes Applied

### 1. Code Formatting

If Prettier is configured:
```bash
pnpm exec prettier --write "src/**/*.ts"
```

Fixes:
- Indentation
- Semicolons
- Quotes
- Line length
- Trailing commas

### 2. Import Organization

If available:
```bash
pnpm exec organize-imports-cli "src/**/*.ts"
```

Fixes:
- Unused imports
- Import order
- Missing imports

### 3. Lint Auto-Fix

If ESLint is configured:
```bash
pnpm exec eslint --fix "src/**/*.ts"
```

Fixes:
- Code style issues
- Simple violations
- Formatting issues

### 4. Build Artifacts

Regenerate distribution files:
```bash
pnpm run build
```

Updates:
- dist/index.js
- Type declarations
- Bundled output

## Usage

Just ask:
- "Fix code issues"
- "Auto-fix the code"
- "Clean up the codebase"

## Output Format

```
=== Auto-Fix Results ===

[✓] Formatting: 5 files formatted
[✓] Imports: 3 files updated
[✓] Lint: 12 issues fixed
[✓] Build: dist/index.js updated

All auto-fixes applied successfully!
```

## What Gets Fixed

### Auto-Fixable Issues

- Formatting inconsistencies
- Missing semicolons
- Quote style (single vs double)
- Indentation
- Trailing whitespace
- Import ordering
- Unused imports
- Simple lint violations

### Not Auto-Fixable

- Type errors
- Logic bugs
- Test failures
- Breaking changes
- Security issues

## After Running Fix

1. **Review changes**
   ```bash
   git diff
   ```

2. **Run checks**
   ```bash
   quick:check
   ```

3. **Run tests**
   ```bash
   pnpm test
   ```

4. **Commit if satisfied**
   ```bash
   git add .
   git commit -m "fix: auto-fix code quality issues"
   ```

## Manual Fixes Required

If auto-fix reports issues it can't fix:

### TypeScript Errors
- Review tsc output
- Fix type issues manually
- Consult TypeScript docs

### Test Failures
- Debug failing tests
- Fix implementation
- Update test expectations

### Complex Lint Issues
- Review ESLint output
- Fix violations manually
- Add eslint-disable if justified

## Configuration Files

This command respects:
- `.prettierrc` - Formatting rules
- `.eslintrc` - Lint rules
- `tsconfig.json` - TypeScript config

## Safety

Auto-fix is safe because:
- Only applies approved transformations
- Doesn't change logic
- Can be reviewed in git diff
- Can be reverted if needed

## When to Use

Good times to use quick:fix:
- After code review
- Before committing
- After merge conflicts
- When onboarding code
- After dependency updates

## Implementation

This command runs:

```bash
#!/bin/bash
set -e

echo "=== Auto-Fix Results ==="
echo ""

# Check if prettier exists
if command -v prettier &> /dev/null; then
  echo -n "[...] Formatting: "
  FILES=$(pnpm exec prettier --write "src/**/*.ts" 2>&1 | grep -c "^" || echo "0")
  echo "✓ $FILES files formatted"
fi

# Check if eslint exists
if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
  echo -n "[...] Lint: "
  pnpm exec eslint --fix "src/**/*.ts" 2>&1 | grep -o "[0-9]* problems" || echo "✓ All issues fixed"
fi

# Rebuild
echo -n "[...] Build: "
if pnpm run build > /dev/null 2>&1; then
  echo "✓ dist/index.js updated"
else
  echo "✗ Build failed"
fi

echo ""
echo "Auto-fixes applied!"
echo "Run 'git diff' to review changes"
```

## Recommendations

After auto-fix:
1. Review all changes carefully
2. Run quality checks (quick:check)
3. Run tests (quick:test)
4. Commit with descriptive message
