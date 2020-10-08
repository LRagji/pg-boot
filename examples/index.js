const bootType = require('../build/src/index');
const pgp = require('pg-promise')({ schema: 'Boot' });
const defaultConectionString = 'postgres://postgres:@localhost:5432/QUEUE';
const writeConfigParams = {
  connectionString: defaultConectionString,
  application_name: 'Example1-Queue-Writer',
  max: 2, //2 Writer
};
const pgWriter = pgp(writeConfigParams);
const instance = new bootType.PgBoot('ProductName');

async function UpgradeHandler(transaction, dbVersion) {
  switch (dbVersion) {
    case -1: //Green field(Nothing is present in DB) first time install
      await transaction.none('CREATE TABLE "V1" ();');
      break;
    case 0: //Version zero was already present
      await transaction.none('ALTER TABLE "V1" RENAME TO "V2";');
      break;
  }
}

instance
  .checkVersion(pgWriter, 0, UpgradeHandler)
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    //Next Upgrade version  1
    instance
      .checkVersion(pgWriter, 1, UpgradeHandler)
      .then(console.log)
      .catch(console.error);

  })

