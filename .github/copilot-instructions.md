# load-available-actions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

**CRITICAL: Only modify files that are directly related to the feature or issue you are implementing. Do not make unnecessary changes to existing working code, formatting, or files that are not part of your specific task scope.**

GitHub Action to load all available actions and reusable workflows from a GitHub organization or user account. Built with TypeScript and Node.js, uses GitHub REST API via Octokit to scan repositories for action.yml/yaml files, Dockerfiles with action labels, and reusable workflows.

## Working Effectively

### Initial Setup and Dependencies
- Install dependencies: `npm ci` -- takes 6 seconds. NEVER CANCEL. Set timeout to 5+ minutes.
- Build the action: `npm run build` or `npm run esbuild` -- takes < 1 second
- Run all build and test steps: `npm run all` -- takes 5 seconds. NEVER CANCEL. Set timeout to 2+ minutes.

### Important Dependencies
- **@actions/core**: GitHub Actions toolkit for inputs/outputs
- **octokit**: GitHub REST API client
- **esbuild**: Fast TypeScript bundler (replaces webpack/rollup)
- **jest**: Testing framework
- **prettier**: Code formatting
- **eslint**: Code linting (currently misconfigured)
- **typescript**: TypeScript compiler
- **node-fetch**: HTTP client for API calls
- **yaml**: YAML parsing for action.yml files

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

### Expected Output Structure
When the action runs successfully, it creates a JSON file with this structure:
```json
{
  "lastUpdated": "20240811_2130", 
  "actions": [
    {
      "name": "Action Name",
      "repo": "repository-name", 
      "downloadUrl": "https://raw.githubusercontent.com/...",
      "author": "action author",
      "description": "action description",
      "using": "node16|docker|composite",
      "isArchived": false
    }
  ],
  "workflows": [
    {
      "name": "Workflow Name",
      "repo": "repository-name",
      "isArchived": false, 
      "downloadUrl": "https://raw.githubusercontent.com/.../.github/workflows/workflow.yml"
    }
  ]
}
```

### Test Scenarios After Changes
1. **Unit Tests**: `npm test` should pass with all 6 tests
2. **Build Validation**: `npm run all` should complete in ~5 seconds
3. **Code Style**: `npm run format-check` should pass
4. **Manual Functionality Test**: 
   ```bash
   # Test with a public user/org (requires real PAT)
   PAT=<your_token> user=actions node dist/main.js
   # Verify output file exists and has content
   test -f actions.json && jq '.actions | length' actions.json
   ```
5. **Error Handling Test**:
   ```bash
   # Should fail with proper error message
   node dist/main.js  # Missing PAT
   PAT=invalid user=nonexistent node dist/main.js  # Invalid token
   ```

### CI Requirements
- The build must pass all steps in `.github/workflows/build check.yml` 
- PR validation runs in `.github/workflows/pr_validation.yml` against test organizations
- All changes must maintain the existing test coverage
- **Critical**: The `dist/` folder must be kept in sync with source changes - CI will update it automatically
- Linting is currently skipped in CI due to ESLint v9 configuration issues

### GitHub Actions Context
This codebase IS a GitHub Action itself, designed to run within GitHub Actions workflows. Key considerations:
- The action uses `@actions/core` for GitHub Actions integration (inputs, outputs, logging)
- Built TypeScript is bundled into `dist/main.js` for distribution
- The `action.yml` file defines the action's interface and specifies `dist/main.js` as entry point
- Environment variables are used for local testing, GitHub Action inputs for production use

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
npm ci                    # Install dependencies (6 sec). NEVER CANCEL. Timeout: 5+ min
npm run all              # Build and test (5 sec). NEVER CANCEL. Timeout: 2+ min
npm run format           # Format code (< 1 sec)

# Individual commands
npm run build            # Build only (< 1 sec)
npm test                 # Test only (5 sec). NEVER CANCEL. Timeout: 2+ min
npm run format-check     # Check formatting (< 1 sec)

# Manual testing (requires valid GitHub PAT)
PAT=<token> user=actions node dist/main.js
PAT=<token> organization=microsoft node dist/main.js

# Validate output
cat actions.json | jq '.actions | length'              # Count actions found
cat actions.json | jq '.workflows | length'            # Count workflows found  
cat actions.json | jq '.lastUpdated'                   # Check timestamp
cat actions.json | jq '.actions[0] | keys'             # Inspect action structure

# Check for common issues
cat actions.json | jq '.actions | unique_by({name, repo}) | length'  # Verify no duplicates
```

### File Watching During Development
```bash
# Monitor builds during development
npm run esbuild  # Manual rebuild after changes
# Or use a file watcher for automatic builds (not built into this project)
```

### Troubleshooting
- **ESLint fails**: Known issue with v9 configuration. The `.eslintrc.json` contains `eslint.validate` property which is invalid in v9. Skip linting for now or migrate to flat config format.
- **Tests fail**: Usually indicates breaking changes to utility functions in `src/utils.ts`
- **Action fails without PAT**: Requires valid GitHub token with permissions: Actions (Read), Administration (Read), Contents (Read)
- **Action fails with PAT**: Check token scopes, ensure target user/organization exists and is accessible
- **Empty output file**: Verify token permissions, check that target has repositories with actions/workflows
- **Build artifacts missing**: Run `npm run build` to regenerate `dist/main.js`
- **Npm ci fails**: Clear `node_modules` and `package-lock.json`, then retry
- **Format issues**: Run `npm run format` to auto-fix, or `npm run format-check` to identify issues

### Action Input Parameters
Required:
- `PAT`: GitHub Personal Access Token with repo permissions
- `user` OR `organization`: Target GitHub user or organization to scan

Optional:
- `outputFilename`: Custom output filename (default: `actions.json`)
- `removeToken`: Remove hardcoded tokens from URLs (default: false)
- `fetchReadmes`: Include base64-encoded READMEs (default: false)
- `scanForReusableWorkflows`: Scan for reusable workflows (default: true)
- `includePrivateWorkflows`: Include private workflows (default: false)

### Publishing
- New versions are published via Git tags: `git tag -a v1.0.0 -m "Version 1.0.0"`
- Push tags to trigger publishing workflow: `git push --tags`
- Follow semantic versioning for Action Marketplace compatibility

### Example Usage in Workflows
```yaml
# Basic usage
- uses: devops-actions/load-available-actions@v2.0.0
  with:
    PAT: ${{ secrets.GITHUB_TOKEN }}
    organization: myorg
  id: load-actions

# Access outputs
- name: Show results
  run: |
    echo "Actions file: ${{ steps.load-actions.outputs.actions-file-path }}"
    jq '.actions | length' "${{ steps.load-actions.outputs.actions-file-path }}"
```