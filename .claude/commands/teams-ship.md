# Ship Team

You are a team of specialized agents ensuring the action is ready for release.

## Team Composition

- **Reviewer** - Final code quality check
- **Tester** - Comprehensive test verification
- **Action Developer** - Build and distribution verification
- **Explorer** - Documentation and completeness check

## Pre-Release Workflow

### Phase 1: Code Quality Check

**Reviewer leads:**

#### 1.1 TypeScript Quality

```bash
# Run TypeScript compiler
pnpm exec tsc --noEmit

# Check for issues:
# - Type errors
# - Unused variables
# - Strict mode violations
```

**Checklist:**
- [ ] No TypeScript errors
- [ ] No `any` types (or justified)
- [ ] Strict mode enabled
- [ ] No unused imports/variables

#### 1.2 Code Standards

Review all changed files:
- [ ] Consistent naming conventions
- [ ] Proper error handling
- [ ] No console.log (use @actions/core)
- [ ] Functions have single responsibility
- [ ] DRY principle followed

#### 1.3 GitHub Actions Best Practices

- [ ] action.yml is valid
- [ ] All inputs have descriptions
- [ ] All outputs documented
- [ ] Branding info present
- [ ] Using node20 runtime

#### 1.4 Security Review

- [ ] No hardcoded secrets
- [ ] No path traversal vulnerabilities
- [ ] No command injection risks
- [ ] Dependencies up-to-date
- [ ] Secrets properly redacted

### Phase 2: Test Verification

**Tester leads:**

#### 2.1 Run All Tests

```bash
# Unit tests
pnpm test

# Coverage report
pnpm test -- --coverage
```

**Coverage Requirements:**
- [ ] Lines: >80%
- [ ] Branches: >75%
- [ ] Functions: >80%
- [ ] All critical paths tested

#### 2.2 Integration Tests

```yaml
# Verify all test workflows pass
.github/workflows/test.yml
.github/workflows/integration.yml
```

**Test Scenarios:**
- [ ] Default configuration
- [ ] Specific version
- [ ] Standalone mode
- [ ] With run_install
- [ ] Multiple configurations
- [ ] Error cases

#### 2.3 Cross-Platform Tests

Test on all supported runners:
- [ ] ubuntu-latest
- [ ] macos-latest
- [ ] windows-latest

#### 2.4 Edge Cases

- [ ] Missing inputs (use defaults)
- [ ] Invalid inputs (fail gracefully)
- [ ] Network failures (retry/fallback)
- [ ] Permission errors (clear messages)

### Phase 3: Build Verification

**Action Developer leads:**

#### 3.1 Clean Build

```bash
# Clean previous build
rm -rf dist/

# Full rebuild
pnpm run build

# Verify output
ls -lh dist/
```

**Checklist:**
- [ ] dist/index.js exists
- [ ] No source maps in dist/
- [ ] Bundle size reasonable (<1MB)
- [ ] All dependencies bundled

#### 3.2 Build Artifacts

```bash
# Check what's included
cat dist/index.js | head -20

# Verify entry point
node dist/index.js --help 2>&1 || true
```

**Verify:**
- [ ] Entry point is correct
- [ ] No development dependencies
- [ ] Required files included (pnpm.cjs, worker.js if bundled)

#### 3.3 Distribution Files

```bash
# Check git status
git status

# Verify no uncommitted changes
git diff
```

**Required Files:**
- [ ] dist/index.js committed
- [ ] action.yml committed
- [ ] README.md up-to-date
- [ ] No uncommitted changes

### Phase 4: Documentation Check

**Explorer leads:**

#### 4.1 README.md

**Verify sections:**
- [ ] Usage examples
- [ ] All inputs documented
- [ ] All outputs documented
- [ ] Examples up-to-date
- [ ] Version compatibility noted
- [ ] License information

#### 4.2 action.yml

**Verify:**
- [ ] All inputs have clear descriptions
- [ ] Default values documented
- [ ] Required fields marked
- [ ] Output descriptions clear
- [ ] Branding set appropriately

Example:
```yaml
inputs:
  version:
    description: |
      Version of pnpm to install
      Examples: '8', '8.15', '8.15.0'
      If not specified, reads from packageManager field
    required: false
```

#### 4.3 CHANGELOG.md (if exists)

- [ ] New version documented
- [ ] Changes listed
- [ ] Breaking changes highlighted
- [ ] Contributors credited

#### 4.4 Code Comments

Review complex logic:
- [ ] Algorithm explanations
- [ ] Non-obvious decisions documented
- [ ] TODOs resolved or tracked
- [ ] Public APIs documented

### Phase 5: Pre-Release Testing

**Team collaboration:**

#### 5.1 Create Pre-Release

```bash
# Tag pre-release version
git tag -a v2.1.0-beta.1 -m "Pre-release v2.1.0-beta.1"
git push origin v2.1.0-beta.1
```

#### 5.2 Test in Real Workflow

Create test repository with workflow:

```yaml
name: Test Pre-Release

on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: your-org/action-setup@v2.1.0-beta.1
        with:
          version: '8'

      - run: pnpm --version

      - uses: your-org/action-setup@v2.1.0-beta.1
        with:
          version: '8.15.0'
          standalone: true

      - run: pnpm --version
```

**Verify:**
- [ ] Action installs correctly
- [ ] Outputs are set
- [ ] pnpm is available
- [ ] No unexpected errors

#### 5.3 Soak Testing

Run multiple times to verify stability:
- [ ] Consistent results
- [ ] No race conditions
- [ ] No intermittent failures

### Phase 6: Final Checks

**All agents:**

#### 6.1 Security Scan

```bash
# Check dependencies
pnpm audit

# Review dependency updates
pnpm outdated
```

**Actions:**
- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities (or acknowledged)
- [ ] Dependencies reasonably up-to-date

#### 6.2 Performance

Test action performance:
- [ ] Startup time <5s
- [ ] Installation time reasonable
- [ ] No unnecessary work
- [ ] Efficient bundling

#### 6.3 Backward Compatibility

If updating existing action:
- [ ] No breaking changes (or documented)
- [ ] Existing workflows still work
- [ ] Migration guide (if needed)
- [ ] Deprecation warnings (if applicable)

#### 6.4 Release Notes

Prepare release notes:

```markdown
## v2.1.0

### Features
- Add support for standalone pnpm installation (#123)
- Add cache_dir input for custom cache location (#124)

### Improvements
- Improve error messages for invalid version format
- Update to Node.js 20 runtime

### Bug Fixes
- Fix PATH not being set correctly on Windows (#125)

### Breaking Changes
None

### Migration Guide
No migration needed. All existing workflows are compatible.
```

### Phase 7: Release Decision

**Team decision:**

#### Go/No-Go Checklist

**Code Quality:**
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] Security scan clean

**Testing:**
- [ ] Unit tests >80% coverage
- [ ] Integration tests passing
- [ ] Cross-platform tests passing
- [ ] Pre-release tested successfully

**Documentation:**
- [ ] README up-to-date
- [ ] action.yml complete
- [ ] CHANGELOG updated
- [ ] Release notes ready

**Build:**
- [ ] Clean build successful
- [ ] Distribution files committed
- [ ] Bundle size acceptable
- [ ] No uncommitted changes

**Final Verification:**
- [ ] Pre-release tested in real workflow
- [ ] No known critical issues
- [ ] Team consensus to ship

#### Decision

If all checks pass:
```bash
# Create release tag
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0

# Update major version tag
git tag -fa v2 -m "Update v2 to v2.1.0"
git push origin v2 --force

# Create GitHub release
gh release create v2.1.0 \
  --title "v2.1.0" \
  --notes-file RELEASE_NOTES.md
```

If any checks fail:
- Document issues
- Create fix plan
- Return to appropriate phase
- Re-run ship workflow

## Emergency Rollback

If critical issue found after release:

```bash
# Revert tag
git tag -d v2.1.0
git push origin :refs/tags/v2.1.0

# Or point v2 to previous stable
git tag -fa v2 -m "Rollback to v2.0.5"
git push origin v2 --force

# Notify users
gh release create v2.1.1 \
  --title "v2.1.1 - Hotfix" \
  --notes "Rollback of v2.1.0 due to critical issue"
```

## Post-Release

**Actions after successful release:**

1. **Monitor** - Watch for issues
   - GitHub Action runs using new version
   - Issue reports
   - User feedback

2. **Announce** - Notify users
   - GitHub release
   - README badge update
   - Social media (if applicable)

3. **Close Issues** - Link to release
   - Close fixed issues
   - Reference release version

4. **Update Examples** - Ensure current
   - README examples
   - Documentation
   - Test workflows

## Ship Checklist Summary

```markdown
## Ship Checklist - v[VERSION]

### Code Quality
- [ ] TypeScript: No errors
- [ ] Code review: Approved
- [ ] Security: No vulnerabilities
- [ ] Standards: Best practices followed

### Testing
- [ ] Unit tests: >80% coverage, all passing
- [ ] Integration tests: All passing
- [ ] Cross-platform: All platforms tested
- [ ] Edge cases: Covered

### Build
- [ ] Clean build: Successful
- [ ] Bundle size: Acceptable
- [ ] Distribution: Files committed
- [ ] Git status: Clean

### Documentation
- [ ] README: Up-to-date
- [ ] action.yml: Complete
- [ ] CHANGELOG: Updated
- [ ] Release notes: Ready

### Pre-Release
- [ ] Beta tag: Created and tested
- [ ] Real workflow: Tested successfully
- [ ] Soak test: Stable

### Final
- [ ] Team consensus: GO/NO-GO
- [ ] Release plan: Ready
- [ ] Rollback plan: Documented

**Decision:** [GO / NO-GO]
**Release Date:** [DATE]
**Released By:** [NAME]
```

## Communication Style

- Be thorough and methodical
- Don't skip checks
- Document all findings
- Clear go/no-go decision
- Transparent about issues
- Confidence in release readiness
