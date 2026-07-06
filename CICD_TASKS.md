# CI/CD Setup Tasks

Goal: pushing to `main` on GitHub automatically builds and deploys the app
onto the Proxmox setup (Docker VM + Nginx VM).

Approach: self-hosted GitHub Actions runner installed on the Docker VM.
(Alternative considered: GitHub-hosted runner + SSH deploy — revisit this
if the self-hosted runner turns out to be impractical.)

## Phase 1 — Containerize the app

- [ ] Write a `Dockerfile` (multi-stage: `node` to run `npm run build`,
      then a small static server — Nginx or `serve` — for the `dist/` output)
- [ ] Add a `.dockerignore` (`node_modules`, `dist`, `.git`)
- [ ] Build and run the image locally to confirm it works:
      `docker build -t todo-app .` then `docker run -p 3000:80 todo-app`
- [ ] Confirm `curl localhost:3000` returns the app

## Phase 2 — Prepare the Docker VM

- [ ] SSH into the Docker VM, confirm Docker is installed: `docker --version`
- [ ] Pick and note the port the container will listen on (e.g. `3000`)
- [ ] Create a deploy directory on the VM (e.g. `/opt/todo-app`)

## Phase 3 — Set up the self-hosted runner

- [ ] On GitHub: repo → **Settings → Actions → Runners → New self-hosted runner**
- [ ] Run the generated download/config commands on the Docker VM
- [ ] Install the runner as a service so it survives reboots:
      `./svc.sh install && ./svc.sh start`
- [ ] Confirm the runner shows as **Idle** under Settings → Actions → Runners

## Phase 4 — Write the GitHub Actions workflow(s)

- [x] Create `.github/workflows/test.yml` — CI quality gate, runs on every
      push/PR to `main`: checkout → setup Node → `npm ci` → lint →
      format check → typecheck → test → build (runs on GitHub-hosted
      runner, no server access needed)
- [ ] Create `.github/workflows/deploy.yml` — CD, runs on push to `main`
      only, after the same checks:
  - [ ] Build the Docker image
  - [ ] Deploy step (runs on the self-hosted runner, so it's just shell):
        stop/remove the old container, run the new image
- [ ] Push and watch the workflow run in the **Actions** tab

## Phase 5 — Nginx reverse proxy

- [ ] SSH into the Nginx VM
- [ ] Add a `server` block that `proxy_pass`es to the Docker VM's IP:port
- [ ] Test config: `nginx -t`, then reload: `systemctl reload nginx`
- [ ] Confirm the app is reachable through the Nginx VM's address/domain

## Phase 6 — End-to-end verification

- [ ] Make a small visible change, commit, push to `main`
- [ ] Watch the Actions run go green
- [ ] On the Docker VM: `docker ps` / `docker logs` to confirm the new container
- [ ] Reload the app through the Nginx URL and confirm the change shows up

## Later / optional hardening

- [ ] Add automated tests to the pipeline as a real quality gate
- [ ] Tag built images with commit SHA (rollback = redeploy an older tag)
- [ ] Push images to GitHub Container Registry (GHCR) instead of building
      fresh on the VM each time
- [ ] Restrict what the self-hosted runner can access on the network
