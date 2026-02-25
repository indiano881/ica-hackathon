# ICA Always-On Checkout

Hackathon project for ICA supermarkets — an offline-capable self-checkout system powered by Couchbase. Customers scan products, pay, earn loyalty points, and initiate returns even without connectivity. Couchbase Lite on-device syncs to Couchbase Capella via Sync Gateway when online.

## Tech Stack

- **Mobile App**: React Native (Expo) + TypeScript + Couchbase Lite (`cbl-reactnative`)
- **Backend API**: Python 3.12 + FastAPI + Couchbase Python SDK
- **Database**: Couchbase Capella + App Services (Sync Gateway)

## Getting Started

```bash
# Install npm dependencies (shared types + mobile app)
npm install
npm run build:shared

# Set up the Python server
cd packages/server
python3.12 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env  # Edit with your Couchbase credentials

# Start the server
.venv/bin/uvicorn app.main:app --reload --port 3000

# Seed the product catalog
.venv/bin/python seed.py

# Start the mobile app (from another terminal)
cd packages/app && npx expo start
```

## Project Structure

```
packages/
├── shared/    # TypeScript types, constants, utilities (used by mobile app)
├── server/    # Python FastAPI backend with Couchbase SDK
└── app/       # React Native (Expo) mobile app with Couchbase Lite
```

## API Documentation

With the server running, visit:
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## Environment Variables

Copy `packages/server/.env.example` to `packages/server/.env` and fill in your Couchbase Capella credentials:

```
COUCHBASE_CONNECTION_STRING=couchbases://cb.xxx.cloud.couchbase.com
COUCHBASE_USERNAME=admin
COUCHBASE_PASSWORD=password
COUCHBASE_BUCKET=ica-checkout
PORT=3000
```
