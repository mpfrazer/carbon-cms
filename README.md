# Carbon CMS

A lightweight, open-source CMS built as a modern alternative to WordPress and Drupal. API-first, self-hostable, and ships as a single deployable unit.

## Install (self-hosted, Linux VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/mpfrazer/carbon-cms/main/scripts/install.sh | bash
```

Requires a Linux server and a domain name. The script installs Docker if needed, generates all secrets, configures HTTPS via Caddy, applies the database schema, and starts all services.

**After the script finishes:**

1. Point two DNS A records at your server's IP address (the script prints them):
   ```
   A  yourdomain.com        →  <server IP>
   A  admin.yourdomain.com  →  <server IP>
   ```
2. Once DNS has propagated, go to `https://admin.yourdomain.com/setup` and create your admin account.
3. Your site is live at `https://yourdomain.com`.

HTTPS certificates are issued automatically by Caddy once DNS resolves. See [deployment docs](docs/architecture/deployment-modes.md) for full details.

### Try it locally (no domain, no TLS)

```bash
git clone https://github.com/mpfrazer/carbon-cms.git
cd carbon-cms
./scripts/install.sh --local
```

Brings up the full stack on `http://localhost:3001` / `:3002` / `:3003` via `docker-compose.dev.yml`. Works on macOS or Linux with Docker Desktop. Uses hardcoded dev-only credentials — not for production.

## Packages

| Package | Port | Description |
|---------|------|-------------|
| `packages/api` | 3001 | REST API — all content operations |
| `packages/admin` | 3002 | Admin UI |
| `packages/frontend` | 3003 | Public-facing site |

## Development

```bash
npm install
npm run dev
```

## CI

Every pull request to `main` runs lint, type check, and unit tests before merge. Merges to `main` publish rolling Docker images to GHCR; semver tag pushes (`v*.*.*`) publish release images and create a GitHub Release with auto-generated notes.

## Releases & Docker tags

Carbon's Docker images are published to `ghcr.io/mpfrazer/carbon-cms-{api,admin,frontend}` with the following tags:

| Tag | Source | Use it for |
|---|---|---|
| `:latest` | the most recent semver release tag | **Production self-hosters who want a stable image** |
| `:v0.1.0` (and `:0.1.0`) | exact release version | Pinning to a specific release for reproducibility |
| `:0.1` | floats to latest patch within minor | Pinning a minor version, getting patch fixes automatically |
| `:main` | every push to `main` | Dev preview — may include unreleased / in-flight features |
| `:sha-abc1234` | a specific commit | Reproducing a build at a known commit |

> **Note (June 2026):** `:latest` previously tracked main HEAD. As of the release pipeline introduced in `v0.1.0`, `:latest` floats to the most recent stable release tag (Docker convention). If you want main-HEAD behavior, use `:main` instead.

### Cutting a release

Maintainers cut a release by tagging the current `main`:

```bash
git checkout main && git pull
git tag v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

CI builds the three images, pushes them with the new semver tags + `:latest`, and creates a GitHub Release with auto-generated notes from the merged PRs since the previous tag.
