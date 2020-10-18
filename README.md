# pg-boot

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

This package is a implementation for a common task like applying DB changes when application boots up by versioning the changes.
1. Allows you to apply programatic changes.
2. Version is a simple integer.
3. All changes are applied in transaction so if any one change fails everything is rolled back.
4. Can be used with multiple instance of microservices as all changes are applied under advisory lock.


## Getting Started

1. Install using `npm i pg-boot`
2. All done, Start using it!!.

 ## Examples/Code snippets

A complete example can be found at [here](https://raw.githubusercontent.com/LRagji/pg-boot/master/examples/index.js)

1. **Initialize**
```javascript
const bootType = require('pg-boot');
const pgp = require('pg-promise')({ schema: 'Boot' });
const defaultConectionString = 'postgres://postgres:@localhost:5432/QUEUE';
const writeConfigParams = {
  connectionString: defaultConectionString,
  application_name: 'Example1-Queue-Writer',
  max: 2, //2 Writer
};
const pgWriter = pgp(writeConfigParams);
const instance = new bootType.PgBoot('ProductName');
```

2. **Upgrade Handller**
```javascript
async function UpgradeHandler(transaction, dbVersion) {
  switch (dbVersion) {
    case -1: //Green field(Nothing is present in DB) first time install
      await transaction.none('CREATE TABLE "V1" ();');
      break;
    case 0: //Version zero was already present
      await transaction.none('ALTER TABLE "V1" RENAME TO "V2";');
      break;
  }
};

instance
  .checkVersion(pgWriter, 0, UpgradeHandler)
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    //Simulate Next version upgrade (1)
    instance
      .checkVersion(pgWriter, 1, UpgradeHandler)
      .then(console.log)
      .catch(console.error);

  });
```

## Built with

1. Authors :heart: love :heart: for Open Source.
2. [pg-promise](https://www.npmjs.com/package/pg-promise).

## Contributions

1. New ideas/techniques are welcomed.
2. Raise a Pull Request.

## Current Version:
0.0.3[Beta]

## License

This project is contrubution to public domain and completely free for use, view [LICENSE.md](/license.md) file for details.

## Changelog

v0.0.3 :
1. Even if the same version exists reconcilecallback is invoked once per instance.

