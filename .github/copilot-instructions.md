# load-available-actions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

GitHub Action to load all available actions and reusable workflows from a GitHub organization or user account. Built with TypeScript and Node.js, uses GitHub REST API via Octokit to scan repositories for action.yml/yaml files, Dockerfiles with action labels, and reusable workflows.

## Working Effectively

### Initial Setup and Dependencies
- Install dependencies: `npm ci` -- takes 1-2 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
- Build the action: `npm run build` or `npm run esbuild` -- takes < 1 second
- Run all build and test steps: `npm run all` -- takes 5-6 seconds. NEVER CANCEL. Set timeout to 2+ minutes.

### Build Commands  
- `npm run esbuild` -- Bundles TypeScript to dist/main.js using esbuild (< 1 second)
- `npm run build` -- Alias for esbuild command (< 1 second)
- `npm run package` -- Alias for esbuild command (< 1 second)

### Testing
- `npm test` or `npm run test` -- Runs Jest unit tests. Takes 5 seconds. NEVER CANCEL. Set timeout to 2+ minutes.
- Tests are located in `__tests__/` directory and validate core utility functions

### Code Quality
- `npm run format` -- Formats TypeScript files with Prettier (< 1 second)
- `npm run format-check` -- Checks if files are properly formatted (< 1 second)
- **ESLint Configuration Issue**: `npm run lint` currently fails due to ESLint v9 configuration incompatibility. The `.eslintrc.json` file contains legacy configuration that needs migration to the new flat config format. DO NOT attempt to run `npm run lint` until this is fixed.

### Complete Workflow
- `npm run all` -- Runs build + tests (but skips lint due to config issue). Takes 5-6 seconds. NEVER CANCEL. Set timeout to 2+ minutes.

## Validation

### Manual Testing Requirements
- The action requires a GitHub Personal Access Token (PAT) with repo permissions (Actions: Read, Administration: Read, Contents: Read)
- Test with environment variables: `PAT=<token> user=<username>` or `PAT=<token> organization=<orgname>`
- ALWAYS test against a real GitHub organization or user to validate functionality
- The action outputs a JSON file containing discovered actions and workflows
- Validate output file is not empty and contains expected JSON structure with `actions` and `workflows` arrays

### Validation Scenarios
- ALWAYS run `npm run all` after making changes to ensure builds and tests pass
- ALWAYS run `npm run format` before committing to ensure consistent code style
- Test the action manually with: `PAT=<token> user=<target> node dist/main.js`
- Verify the output JSON file contains both actions and workflows when testing against organizations like `actions`
- Check that duplicate actions are properly filtered (test validates this)

### CI Requirements
- The build must pass all steps in `.github/workflows/build check.yml`
- PR validation runs against test organizations to ensure functionality
- All changes must maintain the existing test coverage

## Common Tasks

### Repository Structure
```
.
├── README.md              # Main documentation
├── action.yml            # GitHub Action metadata
├── package.json          # Node.js dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest test configuration
├── .prettierrc.json      # Prettier formatting rules
├── .eslintrc.json        # ESLint rules (currently broken)
├── src/                  # TypeScript source code
│   ├── main.ts          # Main entry point
│   ├── utils.ts         # Utility functions
│   ├── optionalActions.ts # Optional features
│   └── wait.ts          # Utility for delays
├── __tests__/           # Jest test files
├── dist/                # Built JavaScript (generated)
└── .github/
    └── workflows/       # CI/CD workflows
```

### Key Source Files
- `src/main.ts` -- Main action logic, GitHub API calls, orchestration
- `src/utils.ts` -- Utility functions for YAML parsing, date formatting, sanitization
- `src/optionalActions.ts` -- Optional features like README fetching
- `action.yml` -- Action metadata, inputs/outputs definition

### Development Workflow
1. Make changes to TypeScript files in `src/`
2. Run `npm run format` to ensure consistent formatting
3. Run `npm run all` to build and test
4. Test manually with real GitHub token if making functional changes
5. Commit changes (dist/ folder is automatically updated by CI)

### Common Validation Commands
```bash
# Full development cycle
npm ci                    # Install dependencies (1-2 min)
npm run all              # Build and test (5-6 sec)
npm run format           # Format code (< 1 sec)

# Manual testing (requires PAT)
PAT=<token> user=actions node dist/main.js

# Check output
cat actions.json | jq '.actions | length'    # Count actions found
cat actions.json | jq '.workflows | length'  # Count workflows found
```

### Troubleshooting
- **ESLint fails**: Known issue with v9 configuration. Skip linting for now.
- **Tests fail**: Usually indicates breaking changes to utility functions
- **Action fails without PAT**: Requires valid GitHub token with appropriate permissions
- **Empty output**: Check token permissions and target user/organization exists
- **Build artifacts missing**: Run `npm run build` to regenerate dist/main.js

### Publishing
- New versions are published via Git tags: `git tag -a v1.0.0 -m "Version 1.0.0"`
- Push tags to trigger publishing workflow: `git push --tags`
- Follow semantic versioning for Action Marketplace compatibility