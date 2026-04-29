# Carbon CMS — Distributed Deployment

This guide covers deploying the three Carbon packages (`api`, `admin`, `frontend`) as independent services on separate hosts. This is the Enterprise deployment model described in [deployment-modes.md](../architecture/deployment-modes.md).

## Prerequisites

- Each host must be able to run a Node.js container (Docker, Fly.io, Railway, Render, etc.)
- A managed Postgres database (Neon, AWS RDS, Supabase, Railway Postgres, or self-hosted)
- S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, etc.)
- Domains/subdomains for each service, with TLS termination at the ingress layer

## Environment Variables

### Shared (all three services)

| Variable | Description |
|---|---|
| `AUTH_SECRET` | **Required.** Shared signing secret for sessions and internal API calls. Generate once with `openssl rand -hex 32` and use the same value on all three services. |
| `NODE_ENV` | Set to `production`. |

### `packages/api`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string: `postgresql://user:pass@host/db` |
| `AUTH_SECRET` | Yes | Must match admin and frontend |
| `NEXTAUTH_URL` | Yes | Public URL of this API instance: `https://api.yourdomain.com` |
| `STORAGE_DRIVER` | Yes | `s3` for distributed deployments |
| `AWS_S3_BUCKET` | Yes (if `STORAGE_DRIVER=s3`) | S3 bucket name |
| `AWS_REGION` | Yes (if `STORAGE_DRIVER=s3`) | AWS region, e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Yes (if `STORAGE_DRIVER=s3`) | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | Yes (if `STORAGE_DRIVER=s3`) | S3 secret key |
| `AWS_S3_URL_BASE` | No | Custom CDN URL for media, e.g. `https://media.yourdomain.com`. Defaults to the S3 bucket URL. |
| `CARBON_ALLOWED_ORIGINS` | Yes | Comma-separated list of origins allowed to make cross-origin requests: `https://yourdomain.com,https://admin.yourdomain.com` |
| `PORT` | No | HTTP port the API listens on. Defaults to `3001`. |

### `packages/admin`

| Variable | Required | Description |
|---|---|---|
| `CARBON_API_URL` | Yes | Full URL of the API: `https://api.yourdomain.com` |
| `AUTH_SECRET` | Yes | Must match api and frontend |
| `NEXTAUTH_URL` | Yes | Public URL of this admin instance: `https://admin.yourdomain.com` |
| `PORT` | No | HTTP port admin listens on. Defaults to `3002`. |

### `packages/frontend`

| Variable | Required | Description |
|---|---|---|
| `CARBON_API_URL` | Yes | Full URL of the API: `https://api.yourdomain.com` |
| `NEXTAUTH_URL` | Yes | Public URL of the frontend: `https://yourdomain.com` |
| `PORT` | No | HTTP port frontend listens on. Defaults to `3003`. |

## Deployment Steps

### 1. Generate shared secrets

On any machine:

```bash
echo "AUTH_SECRET=$(openssl rand -hex 32)"
```

Copy this value — it goes into all three services.

### 2. Deploy the API

The API must be reachable by admin and frontend. It does not need to be publicly reachable unless you want headless API access (external frontends, mobile apps, API key consumers).

Using the reference config in `docker-compose.distributed.yml`:

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=<generated above>
NEXTAUTH_URL=https://api.yourdomain.com
STORAGE_DRIVER=s3
AWS_S3_BUCKET=my-carbon-media
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
CARBON_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

docker compose -f docker-compose.distributed.yml up -d api
```

Verify it is healthy:
```bash
curl https://api.yourdomain.com/api/v1/health
# {"status":"ok","db":"ok"}
```

### 3. Deploy admin and frontend

Both services only need `CARBON_API_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL`:

```bash
# Admin
CARBON_API_URL=https://api.yourdomain.com
AUTH_SECRET=<same as step 1>
NEXTAUTH_URL=https://admin.yourdomain.com

# Frontend
CARBON_API_URL=https://api.yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

### 4. CORS

Once all three services are deployed, confirm the API's `CARBON_ALLOWED_ORIGINS` includes the actual public origins of admin and frontend. Without this, browser-side requests from admin and frontend will be blocked by CORS.

```
CARBON_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

### 5. Run database migrations

Migrations must be run once after the first deploy, and again after any Carbon upgrade that includes schema changes:

```bash
docker compose exec api npm run db:migrate
```

Or from the repo locally, pointing at the production database:

```bash
DATABASE_URL=postgresql://... npm run db:migrate --workspace=packages/api
```

## TLS

Each service should sit behind a TLS-terminating reverse proxy. Options:

| Platform | TLS handling |
|---|---|
| Fly.io | Automatic via `fly certs` |
| Railway | Automatic for all deployments |
| Render | Automatic for all web services |
| AWS (ALB) | ACM certificate + ALB listener |
| Self-hosted | Caddy or nginx with Let's Encrypt |

The Carbon services themselves listen on plain HTTP internally. TLS is always terminated at the ingress layer.

## Health Check

All load balancers and uptime monitors should use:

```
GET /api/v1/health
```

Returns `200 {"status":"ok","db":"ok"}` when healthy, `503 {"status":"error","db":"unreachable"}` if the database is unreachable.

## Updating

Pull the new image and restart the service. Run migrations if the release notes mention schema changes.

```bash
docker compose pull api && docker compose up -d api
# then, if migrations needed:
docker compose exec api npm run db:migrate
```

## Security Notes

- The API in distributed mode is reachable from admin and frontend, which may mean it is publicly reachable depending on your network topology. Ensure rate limiting is in effect (it is by default) and API keys are rotated regularly.
- `AUTH_SECRET` is a high-value secret — it signs session tokens and internal API calls. Rotate it by updating all three services simultaneously (a brief sign-out of all users).
- Restrict access to the admin service by IP allowlist or VPN at the ingress level if your threat model warrants it.
