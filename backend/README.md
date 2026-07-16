# Mini-Wallet

Backend scaffold for the Mini-Wallet project using SailsJS 0.12 and MongoDB.

## Stack

- SailsJS `0.12.14`
- `sails-mongo@0.12.3`
- MongoDB database: `mini_wallet`

## Setup

```bash
npm install
npm start
```

All application settings are centralized in `config/miniWallet.js`.
`.env.example` documents the supported variables. Export them in the shell
before `npm start`; Docker Compose can also read them from a root `.env` file.
Production startup fails when JWT/session secrets are missing or use known
placeholder values.

The default development MongoDB connection is:

```txt
host: 127.0.0.1
port: 27017
database: mini_wallet
```

You can override it with:

```bash
MONGO_HOST=127.0.0.1 MONGO_PORT=27017 MONGO_DATABASE=mini_wallet npm start
```

Or with a MongoDB URI:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/mini_wallet npm start
```

On Windows PowerShell:

```powershell
$env:MONGO_URI="mongodb://127.0.0.1:27017/mini_wallet"; npm start
```

New customer wallets start with `REGISTRATION_BALANCE=0` by default. Demo money
must be created through the cash-in/ledger flow rather than being minted during
registration.

## Seed data

Reference and demo data live in versioned JSON fixtures under `fixtures/`.
The seed runner is idempotent and applies the manifest in dependency order:

```bash
npm run seed:all
```

Officer credentials are required and are never printed:

```powershell
$env:OFFICER_PHONE="0900000000"
$env:OFFICER_PASSWORD="replace-with-a-strong-password"
npm run seed:officer
```

The original individual commands remain available:

```bash
npm run seed:currencies
npm run seed:p2p
npm run seed:cash-in
```

## Verification

Backend verification intentionally uses no modern test dependency so it remains
compatible with Node 8:

```bash
npm test
npm run test:syntax
```

The live integration smoke requires a MongoDB replica set and refuses to use a
database whose name does not end in `_integration`. It creates a clean database,
runs the seed twice, exercises registration rollback, consecutive cash-ins,
provider rollback and concurrent verification, then drops the test database:

```powershell
$env:MONGO_INTEGRATION_URI="mongodb://127.0.0.1:27017/mini_wallet_local_integration?replicaSet=rs0"
npm run test:integration
```

## Docker Development

The app requires MongoDB to be running before Sails can lift. The included
Docker Compose setup starts MongoDB 4.4 as a single-node replica set and then
starts the Sails app:

```bash
docker compose up --build
```

Set `JWT_SECRET` and `SESSION_SECRET` in your shell or `.env` before starting
the app service with Docker Compose.

To start only MongoDB and run Sails on your host machine:

```bash
docker compose up -d mongo
npm start
```

If you use ledger transaction flows from the host, point the MongoDB driver at
the replica set:

```powershell
$env:MONGO_URI="mongodb://127.0.0.1:27017/mini_wallet?replicaSet=rs0"
npm start
```

## Compatibility Note

This project intentionally uses SailsJS 0.12 and `sails-mongo@0.12.3` because it follows the internship requirement. That adapter depends on an old MongoDB driver, so it does not work with newer MongoDB servers that removed legacy `OP_QUERY` support.

Use an older MongoDB server version compatible with the legacy Node driver, such as MongoDB 4.4, when running this project.
