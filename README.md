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
host: localhost
port: 27017
database: mini_wallet
```

You can override it with:

```bash
MONGO_HOST=localhost MONGO_PORT=27017 MONGO_DATABASE=mini_wallet npm start
```

## Compatibility Note

This project intentionally uses SailsJS 0.12 and `sails-mongo@0.12.3` because it follows the internship requirement. That adapter depends on an old MongoDB driver, so it does not work with newer MongoDB servers that removed legacy `OP_QUERY` support.

Use an older MongoDB server version compatible with the legacy Node driver, such as MongoDB 4.4, when running this project.
