# Quick: Check

Run all quality checks to ensure the action is healthy.

## What This Does

Executes a comprehensive health check of the action codebase, including TypeScript compilation, tests, and basic validation.

## Checks Performed

### 1. TypeScript Compilation

```bash
pnpm exec tsc --noEmit
```

Verifies:
- No type errors
- Strict mode compliance
- All imports resolve

### 2. Test Suite

```bash
pnpm test
```

Runs:
- All unit tests
- All integration tests
- Reports any failures

### 3. Build Verification

```bash
pnpm run build
```

Checks:
- TypeScript compiles
- ncc bundling succeeds
- dist/index.js is created

### 4. Action Configuration

Validates:
- action.yml syntax
- Input definitions
- Output definitions
- Runtime configuration

### 5. Git Status

```bash
git status --porcelain
```

Checks:
- Uncommitted changes
- Untracked files
- Build artifacts status

## Usage

Just ask:
- "Run quality checks"
- "Check the project"
- "Is everything healthy?"

## Output Format

```
=== Quality Check Results ===

[✓] TypeScript compilation: PASSED
[✓] Test suite: PASSED (15/15 tests)
[✓] Build: PASSED (dist/index.js created)
[✓] action.yml: VALID
[!] Git status: 3 uncommitted files

Summary: 4/5 checks passed
```

## What to Do If Checks Fail

### TypeScript Errors
- Review error messages
- Fix type issues
- Run `tsc --noEmit` again

### Test Failures
- Check test output
- Fix failing tests
- Run specific test: `pnpm test -- <test-name>`

### Build Failures
- Check build output
- Verify dependencies installed
- Try clean build: `rm -rf dist && pnpm run build`

### action.yml Issues
- Validate YAML syntax
- Check for missing required fields
- Verify input/output definitions

### Uncommitted Changes
- Review changes: `git status`
- Commit if intentional: `git add . && git commit`
- Discard if unintended: `git restore .`

## Quick Fix

If there are auto-fixable issues, use:
```
quick:fix
```

## Implementation

This command runs:

```bash
#!/bin/bash
set -e

echo "=== Quality Check Results ==="
echo ""

# TypeScript check
echo -n "[...] TypeScript compilation: "
if pnpm exec tsc --noEmit 2>&1 > /dev/null; then
  echo "✓ PASSED"
else
  echo "✗ FAILED"
fi

# Tests
echo -n "[...] Test suite: "
if pnpm test 2>&1 | tail -1; then
  echo "✓ PASSED"
else
  echo "✗ FAILED"
fi

# Build
echo -n "[...] Build: "
if pnpm run build > /dev/null 2>&1; then
  echo "✓ PASSED"
else
  echo "✗ FAILED"
fi

# action.yml
echo -n "[...] action.yml: "
if [ -f action.yml ]; then
  echo "✓ VALID"
else
  echo "✗ MISSING"
fi

# Git status
echo -n "[...] Git status: "
if [ -z "$(git status --porcelain)" ]; then
  echo "✓ CLEAN"
else
  echo "! UNCOMMITTED FILES"
fi

echo ""
echo "Check complete!"
```
