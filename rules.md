# DuraCalm Theme Development Rules

## Project Structure

```
/Duracalm-Developement/          ← Root project folder
├── duracalm-theme/              ← GIT REPO (Shopify theme files ONLY)
│   ├── assets/
│   ├── sections/
│   ├── templates/
│   ├── config/
│   └── .git/
└── CLAUDE.md
```

## Git Repository

| Repository | URL | Path | Contents |
|------------|-----|------|----------|
| **GitHub** | `https://github.com/taro8383/duracalm-theme.git` | `duracalm-theme/` | Shopify theme files |

## Shopify Configuration

| Setting | Value |
|---------|-------|
| **Store URL** | `https://porongas-2.myshopify.com/` |
| **Admin URL** | `https://admin.shopify.com/store/porongas-2` |
| **Development Theme ID** | `157533733102` |
| **Development Theme Name** | `Development (9f8f2a-PC-20211120RCVG)` |

## Development Workflow

### Start Development Server
```bash
cd duracalm-theme
shopify theme dev --store porongas-2.myshopify.com
```

### Push Changes to Shopify
```bash
cd duracalm-theme
shopify theme push --theme 157533733102
```

### Pull Latest Settings from Shopify
```bash
cd duracalm-theme
shopify theme pull --theme 157533733102
```

## CRITICAL RULES

### 1. Edit ONLY in `duracalm-theme/` folder
- **WRONG**: `sections/main-cart-items.liquid` (root level)
- **CORRECT**: `duracalm-theme/sections/main-cart-items.liquid`

### 2. Commit Pattern
After every modification:
1. Push to Shopify dev theme
2. Commit to GitHub with signature:
   ```
   Co-Authored-By: Claude (kimi-k2.5) <noreply@anthropic.com>
   ```

### 3. Never Commit Shopify Credentials
- No `.env` files with API keys
- No `shopify.app.toml` with secrets
- Check `git status` before committing

### 4. Theme Files Location
All Liquid, CSS, JS, and schema files live in `duracalm-theme/` only.

### 5. PULL FROM SHOPIFY - Synchronize Editor Changes
When user says **"PULL FROM SHOPIFY"**:

1. **Pull ALL changes** from development theme:
   ```bash
   cd duracalm-theme
   shopify theme pull --theme 157533733102
   ```

2. **Identify JSON/template changes** that were made in the online editor:
   - `config/settings_data.json` (theme settings)
   - `templates/*.json` (page templates)
   - Section-specific settings in `sections/*.liquid`

3. **Commit these pulled changes** to GitHub immediately:
   ```bash
   git add .
   git commit -m "Pull latest settings and configuration from Shopify"
   git push origin master
   ```

4. **Report what was synced** (list the changed files)

**WHY**: Prevents losing changes made in the Shopify online editor. Ensures GitHub always has the latest state.

### 6. GIT BRANCH - Use ONLY `master` Branch
**CRITICAL**: All Git operations MUST use the `master` branch exclusively.

- **NEVER use `main` branch** - It is outdated and does not contain the working code
- **ALWAYS checkout `master`** before starting work:
  ```bash
  git checkout master
  git pull origin master
  ```
- **ALWAYS push to `master`**:
  ```bash
  git push origin master
  ```
- **Pull requests must target `master`**

**WHY**: The repository has two branches (`main` and `master`). The `master` branch contains all the working code, animations, and settings. The `main` branch is outdated and will break the theme if used.

### 7. VERIFY PUSH SUCCESS - Don't Trust Success Messages
**CRITICAL**: After every push to Shopify, verify the remote actually received the changes.

1. **After pushing**, check a specific setting exists remotely:
   ```bash
   cd duracalm-theme
   shopify theme pull --theme 157533733102 --live 2>&1 | head -5
   git status
   ```

2. **If user reports settings missing**, immediately pull to check remote state:
   ```bash
   cd duracalm-theme
   shopify theme pull --theme 157533733102
   git diff --stat
   ```

3. **NEVER assume** - A "success" message doesn't mean the sync worked. Always verify.

**WHY**: Push commands can fail silently or the Shopify server may have been reverted. If local and remote diverge, pulling will OVERWRITE local changes with the outdated remote version, causing data loss.

### 8. PUSH vs PULL - Triple Check Before Executing
**CRITICAL**: These commands do opposite things and can destroy work.

| Command | Direction | Risk |
|---------|-----------|------|
| `shopify theme push` | Local → Shopify | Overwrites remote with local |
| `shopify theme pull` | Shopify → Local | **Overwrites local with remote** |

- **Use `push`** when you want to update Shopify with local changes
- **Use `pull`** ONLY when:
  - User explicitly says "PULL FROM SHOPIFY"
  - User made changes in Shopify editor that need to be synced to GitHub

**NEVER use `pull` to verify remote state** - This destroys local work. Use `shopify theme check` or ask the user.

**WHY**: Accidentally running `pull` instead of `push` will overwrite all local work with an outdated Shopify version, losing commits of progress.

### 9. NEVER PULL FROM SHOPIFY UNLESS EXPLICITLY REQUESTED
**CRITICAL**: Do NOT run `shopify theme pull` unless the user explicitly asks for it.

- **NEVER pull** to "verify" changes or check remote state
- **NEVER pull** to "refresh" or "sync" the theme
- **NEVER pull** proactively - always wait for user instruction
- **ONLY pull** when user says "PULL FROM SHOPIFY" or explicitly requests it

**WHY**: Pulling overwrites all local files with the remote Shopify version. If there are local changes that haven't been pushed yet, they will be permanently lost. GitHub is the source of truth, not Shopify.

### 10. GitHub is Source of Truth
**CRITICAL**: Always treat GitHub as the authoritative source, not Shopify.

- GitHub `master` branch contains the definitive code
- Shopify is just a deployment target
- If Shopify and GitHub diverge, trust GitHub
- Always commit to GitHub before pushing to Shopify
- If uncertain about remote state, ask the user - don't pull to check

**WHY**: Pulling from Shopify to "check" something destroys the carefully maintained GitHub state. When in doubt, communicate with the user rather than making destructive assumptions.

### 11. NEVER Create New Folders Without Explicit Confirmation
**CRITICAL**: Do NOT create new folders or directories without explicit user approval.

- **ALWAYS ask first** before creating any new folder
- **EXPLAIN the need** for the folder and why it's necessary
- **Get confirmation** with clear yes/no from user
- **No exceptions** - even for "temporary" or "utility" folders

**WHY**: Unauthorized folder creation led to multiple nested git repositories and confusion about where files should be edited. This caused file corruption and lost work.

### 12. NEVER Create New Git Repositories
**CRITICAL**: Do NOT initialize or create new git repositories under any circumstances.

- **Only ONE git repo** exists: `duracalm-theme/`
- **NEVER run** `git init` anywhere
- **NEVER create** submodules or nested repositories
- If git operations fail, ask user - don't create new repos

**WHY**: Multiple git repositories caused confusion about which files were tracked, led to edits in wrong locations, and resulted in lost work and corrupted themes.

### 13. NEVER Delete or Overwrite Shopify Themes Without Explicit Confirmation
**CRITICAL**: Do NOT delete, overwrite, or modify themes on Shopify's servers without explicit user approval.

- **ALWAYS ask first** before deleting any theme
- **ALWAYS ask first** before overwriting theme files via `shopify theme push`
- **EXPLAIN the risk** and what will happen
- **Get confirmation** with clear yes/no from user
- When in doubt, preserve - don't destroy

**WHY**: Unauthorized theme deletion and overwriting caused "Not Found" errors, lost configurations, and broken development environments. Recovery required rebuilding themes from scratch.

## Magic Mind Button Style

The **Magic Mind** button is a signature UI element with these characteristics:

### Normal State
- **Border**: 2px solid purple (#7B92C8)
- **Background**: Transparent
- **Text**: Purple (#7B92C8), 15px, 600 weight
- **Shape**: Rounded corners (8px radius)
- **Padding**: 14px 32px

### Hover State (The "Magic" Effect)
- **Background**: Animated gradient flowing from **purple → beige → cream** (#7B92C8 → #ddbea8 → #f3dfc1)
- **Text**: Changes to white
- **Border**: Becomes transparent
- **Shadow**: Soft purple glow (0 8px 24px rgba(123, 146, 200, 0.3))
- **Lift**: Button rises slightly (translateY(-2px))
- **Animation**: Smooth 0.35s transition with cubic-bezier easing

### CSS Implementation
```css
.magic-mind-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  text-transform: none;
  border: 2px solid #7B92C8;
  border-radius: 8px;
  color: #7B92C8;
  background: transparent;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 1;
}

.magic-mind-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #7B92C8 0%, #ddbea8 50%, #f3dfc1 100%);
  background-size: 200% 200%;
  opacity: 0;
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.magic-mind-btn:hover::before {
  opacity: 1;
  background-position: 100% 0;
}

.magic-mind-btn:hover {
  color: #ffffff;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(123, 146, 200, 0.3);
}
```

## Product Card Background Customization

When adding custom card background color settings to sections that display product cards, follow these guidelines to avoid common issues:

### Common Pitfalls

1. **NEVER apply background to `.card__inner`** - This element contains the product image. Applying background here will cover/hide the product photo.

2. **ALWAYS override CSS variables** - Product cards use color schemes (like `color-inverse`, `color-background-1`) which set CSS variables. You must override these variables:
   - `--color-background`
   - `--gradient-background`

3. **Use `!important` carefully** - The card color schemes have high specificity. Use `!important` on both `background` and `background-color` properties.

4. **Reset child elements to transparent** - After setting background on `.card`, set `.card__content` and `.card__inner` to `transparent` to avoid double backgrounds.

### Correct CSS Implementation

```css
/* Section-specific card background */
#shopify-section-{{ section.id }} .card {
  background: {{ section.settings.card_background_color }} !important;
  background-color: {{ section.settings.card_background_color }} !important;
  --color-background: {{ section.settings.card_background_color }};
  --gradient-background: {{ section.settings.card_background_color }};
}

/* Reset content areas to transparent */
#shopify-section-{{ section.id }} .card__content,
#shopify-section-{{ section.id }} .card__inner {
  background: transparent !important;
  background-color: transparent !important;
}
```

### For Complementary Products (Product Information Section)

Complementary products use the `.complementary-products__container` wrapper. Target this specifically:

```css
#MainProduct-{{ section.id }} .complementary-products__container .card {
  background: {{ section.settings.card_background_color }} !important;
  background-color: {{ section.settings.card_background_color }} !important;
  --color-background: {{ section.settings.card_background_color }};
  --gradient-background: {{ section.settings.card_background_color }};
}

#MainProduct-{{ section.id }} .complementary-products__container .card__content,
#MainProduct-{{ section.id }} .complementary-products__container .card__inner {
  background: transparent !important;
  background-color: transparent !important;
}
```

### Schema Setting Template

```json
{
  "type": "header",
  "content": "Product Card Background"
},
{
  "type": "color",
  "id": "card_background_color",
  "label": "Card background color",
  "info": "Select a custom color for the product cards. Leave empty to use theme default."
}
```

## JSON Template File Handling

### Shopify Adds Comments to JSON Files on Pull

**WARNING**: When pulling from Shopify, the CLI may add comment blocks to JSON template files:

```json
/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 * ...
 * ------------------------------------------------------------
 */
```

**CRITICAL**: JSON does NOT support comments. These comment blocks will cause **404 errors** on all pages when pushed back to Shopify.

### Fix Procedure

After EVERY pull from Shopify, run this to remove comments from JSON files:

```bash
cd duracalm-theme/templates
for file in *.json; do
  if head -1 "$file" | grep -q '^/\*'; then
    tail -n +10 "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  fi
done

# Also check customers folder
cd customers
for file in *.json; do
  if head -1 "$file" | grep -q '^/\*'; then
    tail -n +10 "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  fi
done
```

### Prevention

Always validate JSON files before pushing:

```bash
# Quick validation check
cd duracalm-theme/templates
node -e "JSON.parse(require('fs').readFileSync('product.json', 'utf8')); console.log('Valid')" 2>&1 || echo "INVALID JSON - Check for comments"
```

**Never push JSON files with comments to Shopify - it will break the entire theme.**

## Shopify CLI Push Requirements

### ALWAYS Use --verbose Flag When Pushing
**CRITICAL**: Every `shopify theme push` command MUST include the `--verbose` flag.

```bash
# WRONG - No debug output
shopify theme push --theme 123456789

# CORRECT - Full debug output
shopify theme push --theme 123456789 --verbose
```

**WHY**: Without verbose output, errors like "Section type does not refer to an existing section file" provide no actionable information. The verbose JSON output contains the actual error details in `cmd_theme_errors` array, showing exactly what validation failed (e.g., "Invalid block '@app': 'settings' is not a valid attribute").

**Example Error Analysis**:
```json
"cmd_theme_errors": [
  {
    "category": "VALIDATION",
    "message": "Invalid block '@app': 'settings' is not a valid attribute"
  }
]
```

This immediately identifies the problem vs. generic "section not found" errors.

---

## Schema Validation Rules

### @app Blocks CANNOT Have Settings
**CRITICAL**: The `@app` block type in section schemas does NOT support a `settings` array.

```json
// WRONG - This will cause validation error
{
  "type": "@app",
  "settings": [
    {
      "type": "text",
      "id": "my_setting",
      "label": "My Setting"
    }
  ]
}

// CORRECT - @app blocks have no settings
{
  "type": "@app"
}
```

**WHY**: App blocks receive their configuration from the app itself, not from theme settings. Adding settings to @app blocks causes "Asset upload failed: Invalid block '@app': 'settings' is not a valid attribute" errors.

---

## Liquid Syntax Validation

### ALWAYS Balance Liquid Tags
**CRITICAL**: Every opening Liquid tag must have a matching closing tag.

| Opening Tag | Closing Tag |
|-------------|-------------|
| `{% if %}` | `{% endif %}` |
| `{% for %}` | `{% endfor %}` |
| `{% case %}` | `{% endcase %}` |
| `{% capture %}` | `{% endcapture %}` |

**Check Before Committing**:
```bash
cd duracalm-theme

# Count if/endif pairs
grep -c "{% if" sections/main-product.liquid
grep -c "{% endif" sections/main-product.liquid

# These numbers MUST be equal
```

**Common Mistakes**:
- Opening `{% capture variable %}` but never closing with `{% endcapture %}`
- Using `{% if %}` inside JSON-LD schema without proper nesting
- Missing `{% endif %}` when conditionals span multiple lines

**WHY**: Unclosed Liquid tags cause 404 errors on entire pages with no clear error message. The theme appears "corrupted" when it's just a syntax error.

---

## Line Endings (CRLF vs LF)

### Use LF Line Endings Only
**WARNING**: Windows CRLF line endings (`\r\n`) can cause sync issues with Shopify.

**Check Line Endings**:
```bash
# Check if file has CRLF
file sections/main-product.liquid
# Output: "ASCII text, with CRLF line terminators" = BAD
# Output: "ASCII text" = GOOD
```

**Fix Line Endings**:
```bash
# Convert CRLF to LF
sed -i 's/\r$//' sections/main-product.liquid

# Disable git autocrlf to prevent reconversion
git config --local core.autocrlf false
```

**WHY**: Shopify's Unix-based servers may have issues with Windows-style line endings, causing "could not delete file" errors during sync operations.

---

## Theme Debugging Checklist

When theme appears "corrupted" or pushes fail:

1. **Check Liquid Tag Balance**
   ```bash
   grep -c "{% if" sections/main-product.liquid
   grep -c "{% endif" sections/main-product.liquid
   ```

2. **Validate Schema JSON**
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('sections/main-product.liquid', 'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]); console.log('Valid')"
   ```

3. **Check @app Blocks Have No Settings**
   ```bash
   grep -A5 '"type": "@app"' sections/main-product.liquid
   ```
   Should NOT show a `settings` array.

4. **Always Push With Verbose**
   ```bash
   shopify theme push --theme 123456789 --verbose 2>&1 | tee push-debug.log
   ```

5. **Read the Error JSON**
   Look for `cmd_theme_errors` array in verbose output for actual validation failures.

---

## Pre-Push Validation (CRITICAL)

**ALWAYS run validation before pushing to Shopify.** This catches errors locally before they corrupt the live theme.

### Quick Validation

```bash
cd duracalm-theme
bash scripts/validate-theme.sh
```

### What It Checks

| Check | Error Prevented |
|-------|----------------|
| Liquid tag balance | 404 errors from unclosed `{% if %}` or `{% for %}` |
| Schema JSON validity | Validation errors that break the section |
| @app block settings | "Invalid block '@app'" errors |
| Line endings (CRLF) | "Could not delete file" sync errors |
| JSON template comments | 404 errors on all pages |

### Validation Output

**✓ All validations passed!** → Safe to push
**❌ Found X error(s)!** → Fix before pushing

### After Validation Passes

**IMPORTANT**: `.gitignore` does NOT affect Shopify pushes. Use `--ignore` to exclude non-theme files:

```bash
shopify theme push --theme 157586587886 --nodelete --verbose --ignore "scripts/*" --ignore "*.md" --ignore "push-debug.log"
```

Or use this alias for convenience:
```bash
# Add to your .bashrc or .zshrc
alias shopify-push='shopify theme push --theme 157586587886 --nodelete --verbose --ignore "scripts/*" --ignore "*.md" --ignore "push-debug.log"'
```

**WHY**: Catching errors locally prevents hours of debugging and theme recovery. The validation script is 10 seconds of prevention vs. hours of cure.

---

## Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Section type 'main-product' does not refer to an existing section file" | Schema validation failed; section has syntax errors | Check `cmd_theme_errors` in verbose output for actual validation error |
| "Asset upload failed for sections/main-product.liquid: Invalid block '@app'" | @app block has settings array | Remove settings from @app block definition |
| "could not delete file" | State mismatch or line ending issues | Clear CLI cache, normalize line endings, re-authenticate |
| "The page you were looking for does not exist" (404) | Unclosed Liquid tags in section | Balance all {% if %}/{% endif %} pairs |
| "Upload stuck at 0%" | CLI cache corruption or authentication issue | Logout, clear cache, re-authenticate with `shopify auth logout && rm -rf ~/.cache/shopify` |
