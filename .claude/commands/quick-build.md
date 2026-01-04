# Quick: Build

Build the GitHub Action for distribution.

## What This Does

Compiles TypeScript and bundles the action into a single distributable file using ncc.

## Build Process

### 1. TypeScript Compilation

```bash
pnpm exec tsc
```

Compiles:
- `src/**/*.ts` → `dist/tsc/**/*.js`
- Generates type declarations
- Outputs to `dist/tsc/` directory

Configuration: `tsconfig.json`
- Target: ES2022
- Module: Node16
- Strict mode enabled
- Source maps generated

### 2. Bundle with ncc

```bash
pnpm exec ncc build --minify --no-source-map-register --no-cache dist/tsc/index.js --out dist/
```

Creates:
- Single bundled file: `dist/index.js`
- All dependencies included
- Minified for distribution
- No source maps (cleaner output)

### 3. Copy Required Files

If needed:
```bash
cp ./node_modules/pnpm/dist/pnpm.cjs ./dist/pnpm.cjs
cp ./node_modules/pnpm/dist/worker.js ./dist/worker.js
```

## Usage

Just ask:
- "Build the action"
- "Compile and bundle"
- "Create distribution"

## Output

```
=== Building Action ===

[1/3] TypeScript compilation...
✓ Compiled successfully

[2/3] Bundling with ncc...
✓ Bundle created: dist/index.js (512 KB)

[3/3] Copying assets...
✓ pnpm.cjs copied
✓ worker.js copied

Build complete! ✓
```

## Build Artifacts

After successful build:

```
dist/
  ├── index.js          # Main entry point (bundled)
  ├── pnpm.cjs          # Bundled pnpm (if needed)
  ├── worker.js         # pnpm worker (if needed)
  └── tsc/              # TypeScript output
      ├── index.js
      ├── index.d.ts
      └── ...
```

## Verification

After building, verify:

```bash
# Check file exists
ls -lh dist/index.js

# Check size
du -h dist/index.js

# Test execution (should not error immediately)
node dist/index.js 2>&1 | head -5
```

## Build Scripts

From `package.json`:

```json
{
  "scripts": {
    "build:ncc": "ncc build --minify --no-source-map-register --no-cache dist/tsc/index.js --out dist/",
    "build": "tsc && pnpm run build:ncc"
  }
}
```

## Clean Build

For a completely fresh build:

```bash
# Remove previous build
rm -rf dist/

# Rebuild
pnpm run build
```

## Common Issues

### TypeScript Errors

**Problem:** Build fails with type errors

**Solution:**
```bash
# Check errors
pnpm exec tsc --noEmit

# Fix type issues
# Then rebuild
```

### Missing Dependencies

**Problem:** Module not found errors

**Solution:**
```bash
# Install dependencies
pnpm install

# Rebuild
pnpm run build
```

### ncc Bundle Errors

**Problem:** Bundle fails or is too large

**Solution:**
```bash
# Check ncc version
pnpm list @vercel/ncc

# Update if needed
pnpm update @vercel/ncc

# Try without minification
pnpm exec ncc build dist/tsc/index.js --out dist/
```

### Large Bundle Size

**Problem:** dist/index.js is very large (>5MB)

**Check:**
- Unnecessary dependencies included
- Large data files bundled
- Unused code not tree-shaken

**Solution:**
- Review dependencies in package.json
- Use `--external` for runtime dependencies
- Remove unused imports

## Build Optimization

### Minimize Bundle Size

```bash
# Use minification
ncc build --minify ...

# External dependencies (if available at runtime)
ncc build --external dependency-name ...

# Analyze bundle
ncc build --stats-out stats.json ...
```

### Faster Builds

```bash
# Skip TypeScript if no changes
pnpm run build:ncc

# Use incremental compilation (tsconfig.json)
"incremental": true
```

## Distribution

After building:

1. **Commit dist files**
   ```bash
   git add dist/
   git commit -m "build: update distribution"
   ```

2. **Verify in CI**
   - Push changes
   - Ensure CI passes
   - Test action execution

3. **Tag release**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

## GitHub Actions Runtime

The built action runs as:

```yaml
runs:
  using: node20        # Node.js 20 runtime
  main: dist/index.js  # Entry point
  post: dist/index.js  # Post-action cleanup
```

Node.js 20 features available:
- Fetch API
- ES2022 features
- Native test runner
- Performance improvements

## Build Checklist

Before considering build complete:

- [ ] TypeScript compiles without errors
- [ ] ncc bundle succeeds
- [ ] dist/index.js created
- [ ] Bundle size reasonable (<1MB preferred)
- [ ] Required assets copied
- [ ] No errors when loading bundle
- [ ] Git status clean (or dist committed)

## Watch Mode

For development (if needed):

```bash
# Watch TypeScript files
pnpm exec tsc --watch

# In another terminal, rebuild when TS changes
# (requires file watcher script)
```

## Integration with Other Commands

### After Building

Run tests:
```bash
quick:test
```

Run quality checks:
```bash
quick:check
```

### Before Building

Fix code issues:
```bash
quick:fix
```

## Implementation

This command executes:

```bash
#!/bin/bash
set -e

echo "=== Building Action ==="
echo ""

echo "[1/3] TypeScript compilation..."
if pnpm exec tsc; then
  echo "✓ Compiled successfully"
else
  echo "✗ TypeScript compilation failed"
  exit 1
fi

echo ""
echo "[2/3] Bundling with ncc..."
if pnpm run build:ncc; then
  SIZE=$(du -h dist/index.js | cut -f1)
  echo "✓ Bundle created: dist/index.js ($SIZE)"
else
  echo "✗ Bundling failed"
  exit 1
fi

echo ""
echo "[3/3] Verifying build..."
if [ -f dist/index.js ]; then
  echo "✓ Build artifacts verified"
else
  echo "✗ dist/index.js not found"
  exit 1
fi

echo ""
echo "Build complete! ✓"
```
