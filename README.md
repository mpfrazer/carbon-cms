# Carbon CMS

A lightweight, open-source CMS built as a modern alternative to WordPress and Drupal. API-first, self-hostable, and ships as a single deployable unit.

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

Every pull request to `main` runs lint, type check, and unit tests before merge.
