# Security Policy / سياسة الأمان

## Scope

- **Public Static Website:** `index.html`, `assets/`, `data/`, and `files/` are served as static files on GitHub Pages.
- **Admin Automation (`bot/`, `scripts/telegram-bot.mjs`):** Runs separately with private environment credentials (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`, `GITHUB_TOKEN`, `GEMINI_API_KEY`). Secrets are never stored in this repository.

## Reporting a Vulnerability

If you discover a security issue (such as an XSS vector, unsafe workflow trigger, or accidental exposure of credentials/private data):

1. **Do not** open a public Issue or Pull Request with exploit details.
2. Report it privately using GitHub's **Security Advisories ("Report a vulnerability")** tab on the repository, or contact the maintainer directly.
3. Include steps to reproduce and the affected file(s) so it can be verified and patched quickly.

## PR Security Expectations

- All Pull Requests run automated checks ([`.github/workflows/pr-check.yml`](.github/workflows/pr-check.yml)) in a read-only environment (`pull_request` trigger, `contents: read`).
- JSON URLs are validated to only allow `http://` and `https://`.
- Never submit `.env` files, tokens, or unescaped HTML/script payloads in data files.
