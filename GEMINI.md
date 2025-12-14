# AI Guidelines


- **Language Policy**: Always respond in Japanese logic and explanations, unless the user specifically requests another language or the task involves specific multi-language content generation (as implemented in the survey translation features).

## Mandatory Testing Protocol
Any new feature development or bug fix MUST be verified using the following steps before reporting completion:

1.  **Environment Verification**:
    *   Confirm all necessary environment variables (e.g., `GEMINI_API_KEY`) are correctly set.
    *   If changing API related code, verify the API key has access to the specific model version being used (e.g. check for 404/429 errors).

2.  **Browser verification**:
    *   Use the `browser_subagent` tool to perform an end-to-end user flow test.
    *   Verify the UI appears as expected and interactive elements function correctly.

3.  **Proof of Success**:
    *   **MUST capture a screenshot** of the successful state using the browser tool.
    *   Include this screenshot in the final report/walkthrough.

## GitHub & Deployment Workflow
All code changes must follow this Feature Branch Workflow:

1.  **Branching**:
    *   NEVER commit directly to `main`.
    *   Create a feature branch for every task: `git checkout -b feature/[task-name]`.
2.  **Clean Commits**:
    *   Do not commit temporary debug files (e.g., test scripts, temp text files).
    *   Commit logically related changes together.
3.  **Vercel Preview Verification**:
    *   After pushing to GitHub, wait for Vercel to build the Preview Deployment.
    *   Verify functionality on the Preview URL before requesting a merge to `main`.

