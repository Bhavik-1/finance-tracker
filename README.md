# Finance Tracker

Finance Tracker is a full-stack app for personal expense tracking with a DevOps-ready repository layout.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB

## Repository Structure

```text
finance-tracker/
├── app/
│   ├── client/      # Frontend workspace
│   └── server/      # Backend workspace
├── docker/          # Dockerfiles, compose, container assets
├── jenkins/         # Jenkins pipelines and shared library files
├── terraform/       # Infrastructure as code
├── ansible/         # Configuration management and provisioning
├── config/          # Runtime/deployment configs
├── .env.example
├── package.json
└── README.md
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Run app in development:

```bash
npm run dev
```

## Production Commands

- Build frontend:

```bash
npm run build
```

- Start production server:

```bash
npm start
```

## DevOps Directories

- `docker/`: Containerization assets
- `jenkins/`: CI/CD pipeline definitions
- `terraform/`: Cloud infrastructure definitions
- `ansible/`: Server provisioning and configuration automation
