# Carbon CMS

A lightweight, open-source CMS built as a modern alternative to WordPress and Drupal. API-first, self-hostable, and ships as a single deployable unit.

## Install (self-hosted, Linux VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/mpfrazer/carbon-cms/main/scripts/install.sh | bash
```

Requires a Linux server and a domain name. The script installs Docker if needed, generates all secrets, configures HTTPS via Caddy, and starts all services.

**After the script finishes:**

1. Point two DNS A records at your server's IP address (the script prints them):
   ```
   A  yourdomain.com        →  <server IP>
   A  admin.yourdomain.com  →  <server IP>
   ```
2. Once DNS has propagated, go to `https://admin.yourdomain.com/setup` and create your admin account.
3. Your site is live at `https://yourdomain.com`.

HTTPS certificates are issued automatically by Caddy once DNS resolves. See [deployment docs](docs/architecture/deployment-modes.md) for full details.

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

Every pull request to `main` runs lint, type check, and unit tests before merge. Merges to `main` publish Docker images to GHCR.
