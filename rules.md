# DuraCalm Theme Development Rules

## Global Environment
* **Working Directory:** `/duracalm-theme/` (All edits, git, and CLI commands MUST execute from here).
* **Repository:** `https://github.com/taro8383/duracalm-theme.git`
* **Branch:** `master` ONLY. Never use `main`.
* **Store URL:** `https://porongas-2.myshopify.com/`
* **Live Theme ID:** `157586587886` (`dura-calm`)

## Strict Constraints
* **Never** use `shopify theme pull` unless the user explicitly types "PULL FROM SHOPIFY". It overwrites local data.
* **Never** create new folders, initialize Git repos, or delete themes without explicit user confirmation.
* **Never** commit credentials (`.env`, `shopify.app.toml`).
* **GitHub `master`** is the absolute source of truth. Trust GitHub over Shopify state.

## Development Workflow


### 1. Local Development
`shopify theme dev --store porongas-2.myshopify.com`

### 2. Pushing Changes
`shopify theme push --live --allow-live --nodelete --verbose`
* `--verbose` is MANDATORY to expose actual JSON validation errors in `cmd_theme_errors`.
* Do not trust generic success messages; verify remote settings applied.

### 3. Committing
Commit to GitHub immediately after pushing to Shopify. Include signature:
`Co-Authored-By: Claude (kimi-k2.5) <noreply@anthropic.com>`

### 4. Pulling (Only when requested)
When user says "PULL FROM SHOPIFY":
1.  Run `shopify theme pull --live`.
2.  Strip auto-generated Shopify comments (`/* ... */`) from all `.json` files in `templates/` and `customers/`. Comments cause global 404 errors.
3.  Commit pulled changes to `master` and report synced files.

## Pre-Push Validation
Execute local validation before every push to prevent live corruption. `bash  duracalm-theme/scripts/validate-theme.sh` checks for:

| Validation Target | Requirement | Failure Consequence |
| :--- | :--- | :--- |
| **Liquid Tags** | All `{% if %}`, `{% for %}`, `{% capture %}` must be balanced/closed. | 404 errors |
| **Schema `@app`** | `@app` blocks MUST NOT have a `settings` array. | Asset upload failure |
| **Line Endings** | File format must be LF (Unix), not CRLF (Windows). | "Could not delete file" sync errors |
| **JSON Templates** | No comment blocks (`/* */`). | 404 errors |

## Error Resolution Reference
| Error Output | Root Cause & Action |
| :--- | :--- |
| "Section type does not refer to an existing section" | Syntax/schema error. Read `cmd_theme_errors` in `--verbose` push log. |
| "Invalid block '@app'" | Remove `settings` array from the section's `@app` schema block. |
| "The page you were looking for does not exist" | Unclosed Liquid tag or Shopify comments present in JSON files. |
| "Upload stuck at 0%" or "Could not delete file" | Clear cache: `shopify auth logout && rm -rf ~/.cache/shopify`. Verify LF line endings. |
