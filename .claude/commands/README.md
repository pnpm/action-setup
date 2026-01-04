# Claude Agent Commands

This directory contains Claude agent configurations for the action-setup GitHub Action.

## Agent Commands

| Command | Purpose | Best For |
|---------|---------|----------|
| `agents:explore` | Codebase exploration and architecture understanding | Learning how the action works, finding files |
| `agents:action` | GitHub Action development and workflow features | Building action features, workflow integration |
| `agents:inputs` | Action inputs/outputs and validation handling | Working with action.yml, input parsing, outputs |
| `agents:test` | Test creation and coverage | Writing tests, improving test coverage |
| `agents:debug` | Root cause analysis and debugging | Investigating issues, analyzing failures |
| `agents:review` | Code review and quality checks | PR reviews, code quality improvements |

## Team Commands

| Command | Purpose | Best For |
|---------|---------|----------|
| `teams:feature` | Complete feature development workflow | Building new action features end-to-end |
| `teams:ship` | Pre-release verification and quality checks | Preparing for releases, final QA |

## Quick Commands

| Command | Purpose | Best For |
|---------|---------|----------|
| `quick:check` | Run all quality checks | Quick health check |
| `quick:fix` | Auto-fix linting and formatting issues | Cleaning up code |
| `quick:build` | Build the action | Compiling TypeScript and bundling |
| `quick:test` | Run the test suite | Executing tests |

## Project Context

This is a GitHub Action for installing pnpm package manager. Key characteristics:

- **Tech Stack**: TypeScript, Node.js 20, @actions/core, yaml, zod
- **Key Files**: `action.yml`, `src/index.ts`, `src/inputs/`, `src/outputs/`
- **Features**: Version management, caching support, pre/post action hooks
- **Build Process**: TypeScript -> ncc bundling -> `dist/index.js`

## Usage Tips

- Use agent commands for specific focused tasks
- Use team commands for complex multi-step workflows
- Use quick commands for rapid development iterations
- All commands understand GitHub Action patterns and @actions/core APIs
