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

- Node.js 18+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development servers (both frontend and backend):

```bash
npm run dev
```

This will start:

- Frontend dev server on `http://localhost:5173`
- Backend API server on `http://localhost:3001`

3. Open your browser to `http://localhost:5173`

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
├── src/              # Frontend React application
│   ├── components/  # UI components (shadcn/ui)
│   ├── routes/      # Page components
│   └── lib/         # Frontend utilities and API client
├── server/          # Backend Express API
│   ├── db.ts        # Database operations
│   ├── github.ts    # GitHub API integration
│   └── index.ts     # Express server
└── data/            # SQLite database (created automatically)
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
npm run build
```

2. Start the production server:

```bash
npm start
```

The frontend will be served from the `dist/` directory, and the API will run on port 3001 (or the PORT environment variable).
