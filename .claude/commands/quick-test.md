# Quick: Test

Run the test suite for the GitHub Action.

## What This Does

Executes all tests to verify the action works correctly.

## Test Execution

### Run All Tests

```bash
pnpm test
```

Runs:
- All unit tests
- All integration tests
- Reports results and coverage

### Run Specific Tests

```bash
# Single test file
pnpm test -- inputs.test.ts

# Pattern matching
pnpm test -- --testNamePattern="install"

# Watch mode
pnpm test -- --watch
```

### Coverage Report

```bash
pnpm test -- --coverage
```

Generates:
- Coverage summary
- Detailed report
- HTML coverage report (if configured)

## Usage

Just ask:
- "Run tests"
- "Test the action"
- "Check test coverage"

## Output Format

```
=== Test Results ===

PASS  src/__tests__/inputs.test.ts
  ✓ should parse version input (5ms)
  ✓ should expand tilde in paths (3ms)
  ✓ should validate run_install YAML (12ms)

PASS  src/__tests__/install-pnpm.test.ts
  ✓ should install specified version (45ms)
  ✓ should handle standalone mode (38ms)

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Time:        2.5s

Coverage: 85% statements, 80% branches
```

## Test Organization

Current test structure:
```
src/
  __tests__/
    inputs.test.ts           # Input parsing tests
    outputs.test.ts          # Output setting tests
    install-pnpm.test.ts     # Installation tests
    pnpm-install.test.ts     # pnpm install tests
    utils.test.ts            # Utility function tests
    __mocks__/
      @actions/
        core.ts              # Mock @actions/core APIs
```

## Coverage Goals

Target coverage:
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## Test Types

### Unit Tests

Test individual functions in isolation:

```typescript
describe('getInputs', () => {
  it('should parse version input', () => {
    // Test implementation
  })
})
```

### Integration Tests

Test feature workflows:

```typescript
describe('installPnpm', () => {
  it('should install and configure pnpm', async () => {
    // Test full installation flow
  })
})
```

### Mock Tests

Test with mocked dependencies:

```typescript
jest.mock('@actions/core')

it('should call setFailed on error', async () => {
  // Test error handling
})
```

## Common Test Scenarios

### Input Validation

```typescript
it('should accept valid version formats', () => {
  expect(() => validateVersion('8')).not.toThrow()
  expect(() => validateVersion('8.15.0')).not.toThrow()
})

it('should reject invalid versions', () => {
  expect(() => validateVersion('invalid')).toThrow()
})
```

### Error Handling

```typescript
it('should fail gracefully on missing input', async () => {
  const mockSetFailed = core.setFailed as jest.Mock
  await expect(main()).rejects.toThrow()
  expect(mockSetFailed).toHaveBeenCalled()
})
```

### Output Setting

```typescript
it('should set all outputs', () => {
  const mockSetOutput = core.setOutput as jest.Mock
  setOutputs(inputs)
  expect(mockSetOutput).toHaveBeenCalledWith('dest', expect.any(String))
})
```

## Debugging Tests

### Run with Debug Output

```bash
# Enable debug logging
DEBUG=* pnpm test

# Node debug output
NODE_OPTIONS='--inspect' pnpm test
```

### Focus on Single Test

```typescript
// Use .only to run single test
it.only('should test specific case', () => {
  // This test will run alone
})
```

### Skip Tests

```typescript
// Use .skip to skip a test
it.skip('not ready yet', () => {
  // This test will be skipped
})
```

## Test Failures

### When Tests Fail

1. **Read error message**
   ```
   Expected: "8.15.0"
   Received: undefined
   ```

2. **Check test code**
   - Is the test correct?
   - Is the expectation valid?

3. **Check implementation**
   - Does the code match expectation?
   - Are there edge cases?

4. **Debug**
   - Add console.log
   - Use debugger
   - Check mock setup

### Common Issues

**Mock not working:**
```typescript
// Ensure mock is before import
jest.mock('@actions/core')
import { getInputs } from '../inputs'
```

**Async issues:**
```typescript
// Ensure async tests use await
it('should work', async () => {
  await asyncFunction()  // Don't forget await
})
```

**State pollution:**
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

## Test Coverage

### View Coverage

```bash
# Generate coverage report
pnpm test -- --coverage

# Open HTML report (if generated)
open coverage/lcov-report/index.html
```

### Improve Coverage

1. **Identify gaps**
   - Check uncovered lines in report
   - Focus on critical paths

2. **Add tests**
   - Test uncovered branches
   - Test error cases
   - Test edge cases

3. **Verify improvement**
   ```bash
   pnpm test -- --coverage
   ```

## CI Integration

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test

- name: Check coverage
  run: pnpm test -- --coverage
```

## Test Best Practices

### Good Test

```typescript
describe('specific feature', () => {
  it('should have expected behavior', () => {
    // Arrange
    const input = createTestData()

    // Act
    const result = processInput(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

### Test Naming

- Describe the behavior, not implementation
- Use "should" for expectations
- Be specific and clear

```typescript
// Good
it('should install pnpm when version is specified')

// Less clear
it('installs pnpm')
```

## Performance

### Slow Tests

If tests are slow:

```bash
# Identify slow tests
pnpm test -- --verbose

# Run tests in parallel (default)
pnpm test -- --maxWorkers=4
```

### Optimize Tests

- Mock external calls
- Use test fixtures
- Avoid unnecessary setup
- Clean up resources

## Integration with Other Commands

### Before Testing

Build the action:
```bash
quick:build
```

Fix code issues:
```bash
quick:fix
```

### After Testing

Run quality checks:
```bash
quick:check
```

## Implementation

This command executes:

```bash
#!/bin/bash
set -e

echo "=== Running Tests ==="
echo ""

# Run tests with coverage
pnpm test -- --coverage

echo ""
echo "Test run complete!"
echo ""
echo "To run specific tests:"
echo "  pnpm test -- <test-file>"
echo ""
echo "To see coverage details:"
echo "  open coverage/index.html"
```

## Quick Reference

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific file
pnpm test -- inputs.test.ts

# Watch mode
pnpm test -- --watch

# Debug mode
pnpm test -- --verbose

# Update snapshots
pnpm test -- --updateSnapshot
```
