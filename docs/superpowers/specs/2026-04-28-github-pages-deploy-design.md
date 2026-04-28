# GitHub Pages Deploy — Design Spec

**Date:** 2026-04-28
**Repo:** `marcosviniiciusfs-png/ribeiro-simulador-parauapebas`
**Custom domain:** `ribeiroparauapebas.simulead.com.br`

## Problem

Custom domain returns GitHub's `404 — There isn't a GitHub Pages site here`, even though:

- DNS is correctly configured (CNAME `ribeiroparauapebas` → `marcosviniiciusfs-png.github.io`, "DNS check successful" in repo settings).
- GitHub Pages source is set to "GitHub Actions".
- Custom domain is registered in repo settings.

**Root cause:** the repository has no Actions workflow that builds the Vite app and publishes it to Pages. The "Workflow details will appear here once your site has been deployed" hint in repo settings confirms no deployment has ever run.

## Constraints

- Must stay on GitHub Pages (DNS and infra are already configured for it).
- App is a Vite + React SPA with `BrowserRouter` and three routes: `/`, `/obrigado`, `*`.
- Custom domain must survive every deploy (Pages strips the custom domain config on deploy if no `CNAME` file is in the artifact).
- Direct loads of `/obrigado` (refresh, share link, return-from-payment) must work — not just navigation from `/`.

## Out of Scope

- Migrating to Vercel / Netlify / Cloudflare Pages.
- Switching the SPA from `BrowserRouter` to `HashRouter`.
- Any unrelated refactors.
- Setting up a staging environment / preview deploys.

## Approach: GitHub Actions + SPA 404 redirect trick

### File 1 — `.github/workflows/deploy.yml` (new)

GitHub Actions workflow with two jobs:

- **`build`**: checkout → setup Node 20 → `npm ci` → `npm run build` → upload `dist/` as Pages artifact.
- **`deploy`**: depends on `build` → uses `actions/deploy-pages@v4` to publish.

Triggers:
- `push` to `main`
- `workflow_dispatch` (manual rerun from the Actions tab)

Permissions: `contents: read`, `pages: write`, `id-token: write` (required by `deploy-pages@v4`).

Concurrency: `group: "pages"`, `cancel-in-progress: false` (don't kill an in-flight deploy with a newer one — let the in-flight finish, then run the next).

### File 2 — `public/CNAME` (new)

Single line: `ribeiroparauapebas.simulead.com.br`

Vite copies everything in `public/` verbatim to `dist/` on build, so this file ends up at `dist/CNAME` in the published artifact. Without it, GitHub Pages clears the custom domain on every deploy.

### File 3 — `public/404.html` (new)

Implements the [`spa-github-pages`](https://github.com/rafgraph/spa-github-pages) (rafgraph) technique. When the GitHub Pages CDN serves a 404 (e.g., user refreshes on `/obrigado`), `404.html` runs a tiny script that:

1. Reads the requested path.
2. Redirects to `/?/obrigado` (path encoded into the query string with a `/` sentinel and `&` for `&` to survive URL encoding).

Single-file HTML. No dependencies. `pathSegmentsToKeep = 0` (custom domain at root, not a project page).

### File 4 — `index.html` (modify)

Add a small inline script in `<head>` (before any module scripts) that:

1. Detects the redirect query string set by `404.html`.
2. Calls `window.history.replaceState` to rewrite the URL back to the real path (e.g., `/obrigado`).
3. Lets React Router boot normally and pick up the now-correct path.

Result: URL bar always shows the clean path; user sees a single redirect flash on first 404'd load.

## Why not the alternatives

- **HashRouter**: avoids the 404 trick but produces `/#/obrigado` URLs. Trade-off rejected — landing page benefits from clean URLs for tracking, sharing, and SEO.
- **Vercel / Netlify / Cloudflare Pages**: technically nicer SPA story (native rewrites, no 404 trick), but DNS and Pages settings are already in place for GitHub. Migration is a separate decision.

## Verification

After the first deploy completes:

1. **Workflow:** Actions tab shows the `Deploy to GitHub Pages` workflow with a green check.
2. **Custom domain:** Settings → Pages still shows `ribeiroparauapebas.simulead.com.br` saved (not cleared).
3. **Apex load:** `https://ribeiroparauapebas.simulead.com.br/` returns the home page, not 404.
4. **Direct route load:** `https://ribeiroparauapebas.simulead.com.br/obrigado` returns the obrigado page after one redirect (URL bar settles on `/obrigado`).
5. **Unknown route:** `https://ribeiroparauapebas.simulead.com.br/qualquercoisa` shows the in-app `NotFound` component (not GitHub's 404 page).
6. **HTTPS:** Settings → Pages allows enabling "Enforce HTTPS" once the cert provisions (may take a few minutes after first deploy).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Forgot to set Source = GitHub Actions | Already set per screenshot — verified before implementation. |
| `CNAME` file gets out of sync if user changes domain via UI | Document in spec that `public/CNAME` is the source of truth. |
| First deploy takes longer than expected (cert provisioning) | Expected — call out in completion notes; HTTPS may need a manual toggle 5-10 min later. |
| 404 redirect script breaks if `index.html` script tag order is wrong | Place the redirect script as the **first** child of `<head>`, before any other scripts. |
