# Contributing to drought-mcp

Thank you for your interest in contributing to the US Drought Monitor MCP Server! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)
8. [Commit Messages](#commit-messages)
9. [Pull Request Process](#pull-request-process)
10. [Release Process](#release-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Our Standards

**Positive behaviors**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards other contributors

**Unacceptable behaviors**:
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
1. Check the [existing issues](https://github.com/tyson-swetnam/drought-mcp/issues) to avoid duplicates
2. Verify the bug exists in the latest version
3. Collect information about your environment

**Submit a bug report** by creating a new issue with:
- Clear, descriptive title
- Steps to reproduce the problem
- Expected behavior vs actual behavior
- Error messages and stack traces
- Environment information (Node.js version, OS, etc.)

**Bug Report Template**:
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- Node.js version:
- OS:
- drought-mcp version:
- MCP client (e.g., Claude Desktop):

## Additional Context
Screenshots, logs, or other relevant information
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- Clear, descriptive title
- Detailed description of the proposed enhancement
- Explanation of why this enhancement would be useful
- Examples of how the feature would be used
- Possible implementation approach (optional)

**Enhancement Template**:
```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Who would benefit and how?

## Proposed Solution
How might this be implemented?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples from other projects, etc.
```

### Contributing Code

We welcome code contributions! You can contribute by:

1. **Implementing new features** from the roadmap
2. **Fixing bugs** reported in issues
3. **Improving performance** or code quality
4. **Adding tests** to increase coverage
5. **Improving documentation**

### Improving Documentation

Documentation contributions are highly valued:

- Fix typos or unclear wording
- Add examples and use cases
- Improve API documentation
- Create tutorials or guides
- Translate documentation (future)

### First-Time Contributors

Look for issues labeled `good-first-issue` - these are specifically chosen as good entry points for new contributors.

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git
- A code editor (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/tyson-swetnam/drought-mcp.git
   cd drought-mcp
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/drought-mcp.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

6. **Verify setup**:
   ```bash
   npm test
   npm run lint
   ```

## Development Workflow

### 1. Create a Branch

Always work on a feature branch, never on `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or modifications

### 2. Make Changes

Make your changes following the [Coding Standards](#coding-standards).

**Best practices**:
- Make small, focused commits
- Write clear commit messages
- Add tests for new functionality
- Update documentation as needed
- Run tests frequently

### 3. Test Your Changes

Before committing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Test manually with MCP Inspector
npx @modelcontextprotocol/inspector node src/index.js
```

### 4. Commit Changes

Follow the [Commit Message Guidelines](#commit-messages):

```bash
git add .
git commit -m "feat: add new feature description"
```

### 5. Keep Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

If conflicts occur, resolve them and continue:

```bash
# Fix conflicts in your editor
git add .
git rebase --continue
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template
5. Submit the PR

## Coding Standards

### JavaScript Style Guide

We follow modern JavaScript ES6+ standards:

**Module System**:
- Use ESM modules (`import`/`export`)
- No CommonJS (`require`)

**Variables**:
- Use `const` by default
- Use `let` when reassignment is needed
- Never use `var`

**Functions**:
- Prefer arrow functions for callbacks
- Use async/await over raw promises
- Document functions with JSDoc

**Naming**:
- camelCase for variables and functions
- PascalCase for classes
- UPPER_SNAKE_CASE for constants
- kebab-case for file names

### Code Examples

**Good**:
```javascript
import { logger } from './logger.js';

const MAX_RETRIES = 3;

/**
 * Fetch drought data with retry logic
 * @param {string} url - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Drought data
 */
async function fetchDroughtData(url, options = {}) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

**Avoid**:
```javascript
var max_retries = 3;  // Use const, not var

function fetch_drought_data(url, options) {  // Use camelCase
  return new Promise((resolve, reject) => {  // Use async/await
    // ... promise-based code
  });
}
```

### File Organization

- One main export per file
- Group related functions together
- Keep files under 300 lines when possible
- Use index.js for module exports

### Error Handling

Always handle errors appropriately:

```javascript
// Define custom error classes
export class DroughtAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'DroughtAPIError';
    this.statusCode = statusCode;
  }
}

// Use try-catch for async operations
async function fetchData() {
  try {
    return await apiClient.get('/data');
  } catch (error) {
    if (error.response?.status === 404) {
      throw new NotFoundError('Data not found');
    }
    throw new DroughtAPIError(error.message, error.response?.status);
  }
}
```

### JSDoc Documentation

Document all public functions:

```javascript
/**
 * Get current drought severity for a location
 *
 * @param {Object} params - Query parameters
 * @param {string} [params.location] - Location name
 * @param {number} [params.latitude] - Latitude coordinate
 * @param {number} [params.longitude] - Longitude coordinate
 * @param {string} [params.format='wildfire_schema'] - Output format
 * @returns {Promise<Object>} Drought conditions data
 * @throws {ValidationError} If parameters are invalid
 * @throws {NotFoundError} If location cannot be resolved
 *
 * @example
 * const data = await getCurrentDrought({
 *   latitude: 40.0150,
 *   longitude: -105.2705,
 *   format: 'wildfire_schema'
 * });
 */
async function getCurrentDrought(params) {
  // Implementation
}
```

## Testing Guidelines

### Test Structure

Organize tests by module:

```
tests/
├── unit/                  # Unit tests
│   ├── api/
│   │   ├── usdm-client.test.js
│   │   └── ndmc-client.test.js
│   ├── geojson/
│   │   └── processor.test.js
│   └── tools/
│       └── get-current.test.js
├── integration/           # Integration tests
│   └── mcp-tools.test.js
├── fixtures/              # Test data
│   └── sample-geojson.json
└── mocks/                 # Mock implementations
    └── api-responses.js
```

### Writing Tests

Use Jest testing framework:

```javascript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { getDroughtSeverity } from '../../src/geojson/processor.js';
import sampleGeoJSON from '../fixtures/sample-geojson.json';

describe('GeoJSON Processor', () => {
  test('should return correct severity for point', () => {
    const coords = [-105.2705, 40.0150];
    const severity = getDroughtSeverity(coords, sampleGeoJSON);
    expect(severity).toBe('D2');
  });

  test('should handle overlapping polygons', () => {
    // Point in multiple drought zones
    const coords = [-105.0, 40.0];
    const severity = getDroughtSeverity(coords, sampleGeoJSON);
    expect(severity).toBe('D2'); // Highest severity
  });

  test('should return null for no drought', () => {
    const coords = [-122.3321, 47.6062]; // Seattle
    const severity = getDroughtSeverity(coords, sampleGeoJSON);
    expect(severity).toBeNull();
  });
});
```

### Test Coverage Requirements

- New code should have >80% test coverage
- All bug fixes should include regression tests
- Integration tests for all MCP tools
- Edge cases and error conditions

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/geojson/processor.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode (during development)
npm test -- --watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide context and rationale
- Keep documentation in sync with code

### What to Document

**In Code**:
- JSDoc comments for all public functions
- Inline comments for complex logic
- Explain "why" not just "what"

**In README/Docs**:
- Installation instructions
- Configuration options
- Usage examples
- API reference
- Troubleshooting guides

### Documentation Updates

When you change code, update:
- JSDoc comments
- README.md (if user-facing changes)
- DEVELOPER.md (if architecture changes)
- USER_GUIDE.md (if usage changes)
- EXAMPLES.md (if examples are affected)

## Commit Messages

### Format

Follow Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `perf`: Performance improvements

### Examples

**Good commit messages**:

```
feat(tools): add get_drought_statistics tool

Implement the fourth MCP tool for statistical summaries and
comparisons. Includes support for year-over-year comparisons
and historical averages.

Closes #42
```

```
fix(geojson): handle overlapping polygons correctly

Previous implementation returned first match instead of
highest severity. Now correctly returns maximum DM value
when point falls in multiple polygons.

Fixes #38
```

```
docs(readme): add troubleshooting section

Add common issues and solutions for users experiencing
problems with location resolution and data freshness.
```

**Avoid**:
```
update code          # Too vague
fixed bug            # Which bug?
WIP                  # Don't commit work-in-progress
```

### Commit Message Guidelines

- Use imperative mood ("add" not "added" or "adds")
- First line should be 50 characters or less
- Provide context in the body when needed
- Reference issues and PRs when applicable
- Explain "why" in the body, not "what" (code shows what)

## Pull Request Process

### Before Submitting

Checklist:
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Code coverage maintained or improved
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Related Issues
Closes #(issue number)

## Testing
Describe testing performed

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Lint passes
- [ ] All tests pass
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, PR will be merged
5. **Cleanup**: Delete your feature branch after merge

### Responding to Feedback

- Be open to suggestions
- Ask questions if feedback is unclear
- Make requested changes promptly
- Commit fixes to the same branch
- Push updates to automatically update PR

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible API changes
- **MINOR** version: Backward-compatible new features
- **PATCH** version: Backward-compatible bug fixes

### Release Workflow

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm (if applicable)
5. Create GitHub release with notes

### Changelog Format

```markdown
## [1.2.0] - 2025-10-15

### Added
- New get_drought_statistics tool for comparisons
- Support for monthly aggregation in historical queries

### Changed
- Improved GeoJSON caching strategy
- Updated error messages for clarity

### Fixed
- Fixed overlapping polygon handling
- Resolved geocoding rate limit issues

### Deprecated
- Old format parameter (use wildfire_schema instead)
```

## Development Resources

### Helpful Links

- [MCP SDK Documentation](https://github.com/anthropics/model-context-protocol)
- [US Drought Monitor](https://droughtmonitor.unl.edu/)
- [NDMC Data Services API](https://usdmdataservices.unl.edu/)
- [Turf.js Documentation](https://turfjs.org/)
- [Jest Testing Framework](https://jestjs.io/)

### Internal Documentation

- [DEVELOPER.md](DEVELOPER.md) - Architecture and implementation
- [USER_GUIDE.md](USER_GUIDE.md) - User-facing documentation
- [EXAMPLES.md](EXAMPLES.md) - Usage examples
- [implementation_plan.md](implementation_plan.md) - Development roadmap

### Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Chat**: (Future: Discord/Slack link)

## Recognition

### Contributors

All contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes (for significant contributions)

### Types of Contributions Recognized

- Code contributions
- Documentation improvements
- Bug reports and triage
- Feature suggestions
- Testing and QA
- Community support

## License

By contributing to drought-mcp, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for contributing to drought-mcp! Your efforts help make drought data more accessible for wildfire risk assessment, agricultural planning, and water resource management.

**Questions?** Open an issue or reach out to the maintainers.
