Run the full PO → Architect → Dev → QA workflow for a GitHub issue.

Issue: $ARGUMENTS

## Steps:
1. **PO Phase**: Read the issue, cross-reference req.md, and post acceptance criteria as a comment
2. **Architect Phase**: Design the implementation plan and post it as a comment
3. **Dev Phase**: Create a feature branch, implement the changes, run tests, create a PR
4. **QA Phase**: Review the PR against acceptance criteria, run tests, approve or request changes

Execute each phase sequentially. If any phase fails or identifies blockers, stop and report.
