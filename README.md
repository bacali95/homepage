# Homelab Homepage

A homepage application for managing and displaying your homelab services running in Kubernetes.

## Features

- 📱 Modern UI built with React and shadcn/ui
- 🔄 Automatic update checking for GitHub releases
- 📊 Dashboard view of all your services
- ⚙️ Easy app management interface
- 🗄️ SQLite database for storing app configurations
- 🚀 React Router for navigation

## Getting Started

### Prerequisites

- Bun 1.0+ ([Install Bun](https://bun.sh/docs/installation))

### Installation

1. Install dependencies:

```bash
bun install
```

2. Start the development servers (both frontend and backend):

```bash
bun run dev
```

This will start:

- Frontend dev server on `http://localhost:5173`
- Backend API server on `http://localhost:3001`

3. Open your browser to `http://localhost:5173`

Useful checks: `bun lint` (oxlint), `bun check` (typecheck all tsconfig projects), `bun run test`.

## Usage

1. Navigate to "Manage Apps" to add your first service
2. Fill in:
   - **App Name**: A friendly name for your service
   - **URL**: The URL where your service is accessible
   - **GitHub Repository**: The GitHub repo (e.g., `owner/repo` or `https://github.com/owner/repo`)
   - **Current Version**: Select from the dropdown (fetched from GitHub releases)
3. The app will automatically check for updates every 6 hours
4. View all your services on the home page

## Project Structure

```
homepage/
├── src/              # Frontend React app (components, routes, lib hooks/API client)
├── server/           # Backend NestJS app, one module per feature
│   ├── apps/         # App CRUD and Kubernetes pod discovery
│   ├── notifications/, ping/, updates/, jobs/, health/, logger/
│   ├── tags-fetchers/ # Docker Hub, GHCR, GitHub releases, k8s registry
│   ├── database/     # Prisma/libSQL service
│   └── rpc/          # typesafe-rpc endpoint used by the frontend
├── prisma/           # Schema and migrations
├── e2e/              # Playwright tests
└── data/             # SQLite database (created automatically)
```

## Environment Variables

The app supports environment variables via a `.env` file. Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Available environment variables:

- `PORT`: Server port (default: 3001)
- `GITHUB_TOKEN`: GitHub personal access token for accessing GitHub Container Registry (ghcr.io). **Required** for fetching tags.
  - Create a token at: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Required scopes: `read:packages` (minimum) or `repo` (for private packages)
  - Copy the token and add it to your `.env` file

**Note:** The `.env` file is already included in `.gitignore` and will not be committed to version control.

## Database

The app uses SQLite to store configurations. The database file is created automatically in the `data/` directory on first run.

## Update Checking

The app periodically checks GitHub for new releases and displays update notifications in the UI. Update checks run:

- Immediately on server start
- Every 6 hours thereafter

## Production Build

1. Build the frontend:

```bash
bun run build
```

2. Start the production server:

```bash
bun start
```

The frontend will be served from the `dist/` directory, and the API will run on port 3001 (or the PORT environment variable).

## Versioning

The app uses semantic versioning managed through `package.json` and `standard-version`. The current version is stored in the `version` field of `package.json`.

### Updating the Version

We use [standard-version](https://github.com/conventional-changelog/standard-version) to automate version bumps, changelog generation, and git tagging.

#### Quick Version Bump

For a patch release (bug fixes):

```bash
bun run version:patch
```

For a minor release (new features):

```bash
bun run version:minor
```

For a major release (breaking changes):

```bash
bun run version:major
```

For a prerelease:

```bash
bun run version:prerelease
```

#### Manual Version Bump

If you want to specify a specific version:

```bash
bun run version
```

This will:

1. Bump the version in `package.json` based on your commits (following [Conventional Commits](https://www.conventionalcommits.org/))
2. Generate/update `CHANGELOG.md`
3. Create a git tag (e.g., `v1.0.1`)
4. Commit the changes

#### Release Workflow

After running a version command, push the changes and tags:

```bash
git push --follow-tags origin main
```

Or use the release script:

```bash
bun run release
```

### CI

`.github/workflows/ci.yml` runs on pull requests, pushes to `main` and `v*.*.*` tags (shared setup in `.github/actions/setup`):

- `lint`: oxlint, typecheck (`bun check`) and prettier check
- `test`: unit tests (vitest)
- `build`: `bun run build`, uploads `dist/` and `dist-server/` as an artifact
- `e2e`: Playwright (chromium) against the built artifact, without rebuilding
- `docker`: after all of the above, builds the image from the artifact, smoke-tests it (`/healthz` and `/`), and pushes to GitHub Container Registry only for `v*.*.*` tags

### Docker Image Tags

Images are pushed only when a version tag is pushed (e.g. `v1.2.3`), tagged with:

- `1.2.3` - full version
- `1.2` - major.minor
- `latest` - most recent version tag
- `<short-sha>` - short commit SHA

Images are available at: `ghcr.io/<your-username>/<repo-name>:<tag>`

To pull and use the image:

```bash
docker pull ghcr.io/<your-username>/<repo-name>:latest
```
