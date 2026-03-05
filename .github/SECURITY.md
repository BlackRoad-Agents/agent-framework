# Security Policy — BlackRoad OS, Inc.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

Please report security vulnerabilities to: **security@blackroad.ai**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and provide a fix timeline within 7 days.

## Security Measures

- All GitHub Actions are pinned to specific commit hashes
- Dependabot automated updates with automerge for patches
- CodeQL analysis on every push and PR
- TruffleHog secrets scanning
- License compliance checking
- CODEOWNERS enforced reviews for sensitive paths
