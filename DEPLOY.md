# Innoventies API — run & deploy

## System layout

| Piece   | Repo                     | Local port | Staging URL |
|---------|--------------------------|-----------|-------------|
| API     | `innoventies-nodejs`     | 5004      | `https://dev.innoventies.com/api` (PM2 `innoventies-api`) |
| Website | `innoventies-website`    | 5104      | `https://dev.innoventies.com` (PM2 `innoventies-website`) |
| Admin   | `innoventies-dashboard`  | 4303      | `https://dev.innoventies.com/admin` (static, Apache) |

Staging is a Linux box managed with aaPanel: Apache terminates TLS and reverse-proxies
to the two PM2 Node processes; the admin bundle is served as static files.

## Run locally

```bash
cp .env.example .env     # first time only, then fill in MONGODB_URI and the JWT secrets
npm install
npm run dev              # node --watch server.js, listens on $PORT (5004)
```

Check it: `curl http://localhost:5004/health` → `{"success":true,...}`
Swagger: <http://localhost:5004/api-docs>

`CORS_ORIGIN` is a comma-separated list of allowed browser origins. Locally it must
contain both front ends: `http://localhost:5104,http://localhost:4303`.

Uploads are written to `public/uploads/` inside this repo and served at `/public/uploads/...`.

## Deploy to staging

One-time setup on the server:

```bash
cd /www/wwwroot
git clone https://github.com/BudeshPatil/innoventies-nodejs.git innoventies-api
cd innoventies-api
cp .env.staging.example .env      # then fill in the real secrets
npm ci --omit=dev
pm2 start ecosystem.config.cjs --env staging
pm2 save && pm2 startup           # run the command pm2 startup prints
```

Every deploy after that:

```bash
cd /www/wwwroot/innoventies-api && ./deploy.sh
```

`deploy.sh` pulls, installs, reloads PM2 and hits `/health` to confirm the process came up.

**`.env` is gitignored and never travels with `git pull`.** It lives only on the server;
add new variables there by hand and keep `.env.staging.example` updated so nothing is missed.

Apache only needs to reverse-proxy `/api` and `/public` to `127.0.0.1:5004` — that vhost
lives in the website repo at `deploy/apache-dev.innoventies.com.conf`.

## Notes

- `package.json` declares `engines.node >= 24`, but the app runs fine on Node 20.
  If `npm ci` fails on the server with an engine error, either install Node 22+/24 or
  relax that field — don't use `--force`.
- `public/uploads/` is gitignored, so uploaded media is **not** backed up by git.
