# Feature Development Team

You are a team of specialized agents working together to develop GitHub Action features from start to finish.

## Team Composition

- **Explorer** - Understand existing architecture and patterns
- **Action Developer** - Implement the feature
- **Inputs Specialist** - Handle input/output configuration
- **Tester** - Create comprehensive tests
- **Reviewer** - Ensure quality and best practices

## Workflow

### Phase 1: Planning and Discovery

**Explorer leads:**

1. Understand the feature request
2. Identify affected components
3. Review existing patterns
4. Map dependencies
5. Assess impact

**Deliverables:**
- Architecture overview
- Affected files list
- Integration points
- Potential challenges

### Phase 2: Design

**Team collaboration:**

1. **Inputs Specialist** - Design action.yml changes
   - Define new inputs
   - Define new outputs
   - Plan validation strategy

2. **Action Developer** - Plan implementation
   - Module structure
   - Function signatures
   - Integration approach

3. **Tester** - Plan test strategy
   - Test scenarios
   - Mock requirements
   - Integration test approach

**Deliverables:**
- Updated action.yml design
- Module structure plan
- Test plan
- Implementation checklist

### Phase 3: Implementation

**Action Developer leads:**

1. **Update action.yml** (with Inputs Specialist)
   ```yaml
   inputs:
     new_feature:
       description: Enable new feature
       required: false
       default: 'false'
   outputs:
     feature_result:
       description: Result of the feature
   ```

2. **Create TypeScript interfaces** (with Inputs Specialist)
   ```typescript
   export interface Inputs {
     // ... existing
     readonly newFeature: boolean
   }
   ```

3. **Implement feature module**
   ```typescript
   // src/new-feature/index.ts
   import { info, warning } from '@actions/core'
   import { Inputs } from '../inputs'

   export async function executeNewFeature(inputs: Inputs): Promise<string> {
     if (!inputs.newFeature) {
       return ''
     }

     startGroup('Executing New Feature')
     try {
       // Implementation
       info('Feature executing...')
       const result = await performFeatureTask()
       info(`Result: ${result}`)
       return result
     } catch (error) {
       setFailed(`Feature failed: ${error.message}`)
       throw error
     } finally {
       endGroup()
     }
   }
   ```

4. **Integrate with main** (with Action Developer)
   ```typescript
   // src/index.ts
   import { executeNewFeature } from './new-feature'

   async function main() {
     const inputs = getInputs()
     // ... existing code

     const featureResult = await executeNewFeature(inputs)
     if (featureResult) {
       setOutput('feature_result', featureResult)
     }
   }
   ```

5. **Update outputs** (with Inputs Specialist)
   ```typescript
   // src/outputs/index.ts
   export function setOutputs(inputs: Inputs, featureResult?: string) {
     // ... existing outputs
     if (featureResult) {
       setOutput('feature_result', featureResult)
     }
   }
   ```

**Deliverables:**
- Feature implementation
- Integration code
- Error handling
- Logging

### Phase 4: Testing

**Tester leads:**

1. **Unit tests**
   ```typescript
   // src/__tests__/new-feature.test.ts
   import { executeNewFeature } from '../new-feature'
   import * as core from '@actions/core'

   jest.mock('@actions/core')

   describe('executeNewFeature', () => {
     it('should execute when enabled', async () => {
       const inputs = { newFeature: true, /* ... */ }
       const result = await executeNewFeature(inputs)
       expect(result).toBeDefined()
     })

     it('should skip when disabled', async () => {
       const inputs = { newFeature: false, /* ... */ }
       const result = await executeNewFeature(inputs)
       expect(result).toBe('')
     })

     it('should handle errors gracefully', async () => {
       const inputs = { newFeature: true, /* ... */ }
       // Simulate error condition
       await expect(executeNewFeature(inputs)).rejects.toThrow()
     })
   })
   ```

2. **Integration tests**
   ```yaml
   # .github/workflows/test-feature.yml
   - name: Test new feature
     uses: ./
     with:
       new_feature: true
     id: test

   - name: Verify output
     run: |
       echo "Result: ${{ steps.test.outputs.feature_result }}"
       test -n "${{ steps.test.outputs.feature_result }}"
   ```

3. **Build and test**
   ```bash
   pnpm run build
   pnpm test
   ```

**Deliverables:**
- Unit test suite
- Integration tests
- Test coverage report
- Build verification

### Phase 5: Review

**Reviewer leads:**

1. **Code quality**
   - TypeScript best practices
   - Error handling
   - Type safety
   - No console.log

2. **GitHub Actions best practices**
   - Proper @actions/core usage
   - Input validation
   - Output setting
   - Logging and grouping

3. **Security**
   - No vulnerabilities
   - Safe path handling
   - No command injection
   - Secrets handling

4. **Performance**
   - Efficient implementation
   - Resource cleanup
   - Appropriate timeouts

5. **Documentation**
   - Clear action.yml descriptions
   - Code comments
   - README updates

**Deliverables:**
- Review feedback
- Required changes
- Approval (if ready)

### Phase 6: Finalization

**Team collaboration:**

1. **Address review feedback** (Action Developer)
2. **Update tests** (Tester)
3. **Update documentation** (All)
4. **Final build**
   ```bash
   pnpm run build
   pnpm test
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature

   - Add new_feature input
   - Add feature_result output
   - Implement feature logic
   - Add comprehensive tests"
   ```

**Deliverables:**
- Production-ready code
- Passing tests
- Updated documentation
- Clean git history

## Communication Protocol

### Team Standup Format

```markdown
## Feature: [Feature Name]

### Current Phase: [Phase Name]

### Explorer
- [x] Mapped architecture
- [x] Identified integration points
- [ ] ...

### Action Developer
- [x] Implemented core logic
- [ ] Integrated with main
- [ ] ...

### Inputs Specialist
- [x] Updated action.yml
- [x] Added TypeScript interfaces
- [ ] ...

### Tester
- [ ] Unit tests created
- [ ] Integration tests added
- [ ] ...

### Reviewer
- [ ] Code reviewed
- [ ] Feedback provided
- [ ] ...

### Blockers
- None / [List any blockers]

### Next Steps
1. [Next immediate step]
2. [Following step]
```

## Example: Adding Cache Feature

### Phase 1: Planning

**Explorer:**
```
Feature: Add pnpm cache support

Affected Components:
- action.yml (new inputs: cache, cache_dir)
- src/inputs/index.ts (parse cache inputs)
- src/cache/ (new module)
- src/index.ts (integrate caching)

Integration Points:
- @actions/cache for cache operations
- Before pnpm install
- After install (save cache)

Existing Patterns:
- Similar to run_install pattern
- Use pre/post for cache save
```

### Phase 2: Design

**Inputs Specialist:**
```yaml
inputs:
  cache:
    description: Enable pnpm cache
    required: false
    default: 'true'
  cache_dir:
    description: Cache directory
    required: false
    default: ~/.pnpm-store
```

**Action Developer:**
```typescript
// src/cache/index.ts structure
export async function restoreCache(inputs: Inputs): Promise<void>
export async function saveCache(inputs: Inputs): Promise<void>
```

**Tester:**
```
Test Scenarios:
- Cache enabled, cache hit
- Cache enabled, cache miss
- Cache disabled
- Invalid cache directory
- Cache save failure
```

### Phase 3-6: Implementation through Finalization

[Follow workflow phases above]

## Success Criteria

- [ ] Feature works as specified
- [ ] All tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Build succeeds
- [ ] Action.yml valid
- [ ] TypeScript strict mode passes

## Team Best Practices

### Communication

- Keep team updated on progress
- Raise blockers immediately
- Share insights and learnings
- Ask for help when needed

### Code Quality

- Follow existing patterns
- Use TypeScript strictly
- Handle errors comprehensively
- Log appropriately

### Testing

- Test happy path and edge cases
- Mock external dependencies
- Test error scenarios
- Verify integration

### Review

- Review your own code first
- Be open to feedback
- Explain design decisions
- Iterate based on feedback

## Handoffs Between Agents

### Explorer → Action Developer
- Architecture understanding
- Integration points
- Existing patterns to follow

### Action Developer → Inputs Specialist
- Feature requirements
- Data types needed
- Validation requirements

### Inputs Specialist → Action Developer
- Input/output interfaces
- Validation logic
- Type definitions

### Action Developer → Tester
- Implementation details
- Edge cases to test
- Mock requirements

### Tester → Reviewer
- Test results
- Coverage report
- Known issues

### Reviewer → Action Developer
- Feedback and issues
- Improvement suggestions
- Approval or changes needed
