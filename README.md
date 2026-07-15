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

The default MongoDB connection is:

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

## Docker Development

The app requires MongoDB to be running before Sails can lift. The included
Docker Compose setup starts MongoDB 4.4 as a single-node replica set and then
starts the Sails app:

```bash
docker compose up --build
```

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
