import * as pg from 'pg-promise';
import * as crypto from 'crypto';

export class PgBoot {
  version: number;
  name: string;

  constructor(name: string) {
    this.version = -1;
    this.name = crypto
      .createHash('md5')
      .update(name)
      .digest('hex');
    this.checkVersion = this.checkVersion.bind(this);
  }

  static dynamicPreparedStatement(
    name: string,
    sql: string,
    dynamicValues: any
  ): pg.PreparedStatement {
    const valueArray = Object.keys(dynamicValues).map(k => dynamicValues[k]);
    const options: pg.IPreparedStatement = {
      name: crypto
        .createHash('md5')
        .update(name + '.' + valueArray.join('.'))
        .digest('hex'),
      text: pg.as.format(sql, dynamicValues),
    };
    return new pg.PreparedStatement(options);
  }

  async checkVersion(
    pgWriterConnection: pg.IDatabase<any>,
    expectedSchemaVersion: number,
    reconcileCallback: (
      transaction: pg.ITask<any>,
      dbVersion: number
    ) => Promise<void>
  ): Promise<boolean> {
    if (expectedSchemaVersion === this.version) return Promise.resolve(true);
    const lockStatement = new pg.PreparedStatement({
      name: 'TransactionLock',
      text: 'SELECT pg_advisory_xact_lock(hashtext($1)) as "Locked";',
      values: [this.name],
    });
    const checkSchemaVersion = PgBoot.dynamicPreparedStatement(
      'CheckSchemaVersion',
      'SELECT $[name:name]() AS "version";',
      { name: this.name }
    );
    const updateCreateSchemaVersion = PgBoot.dynamicPreparedStatement(
      'updateCreateSchemaVersion',
      'CREATE OR REPLACE FUNCTION $[name:name]() RETURNS integer LANGUAGE SQL AS $$ SELECT $[version] $$;',
      { name: this.name, version: expectedSchemaVersion }
    );
    const versionFunctionExists = new pg.PreparedStatement({
      name: 'VersionFunctionExists',
      text: `SELECT EXISTS(
            SELECT 1 
            FROM pg_catalog.pg_proc p
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace 
            WHERE proname = $1 AND n.nspname::TEXT = $2)`,
    });

    return pgWriterConnection.tx(async transaction => {
      await transaction.one(lockStatement, [this.name]);

      const versionExists = await transaction.one(versionFunctionExists, [
        this.name,
        pgWriterConnection.$config.options.schema,
      ]);
      if (versionExists.exists === true) {
        const existingVersion = await transaction.one(checkSchemaVersion);
        this.version = existingVersion.version;
        if (existingVersion.version === expectedSchemaVersion) {
          await reconcileCallback(transaction, this.version);
          return Promise.resolve(true);
        }
      }

      await reconcileCallback(transaction, this.version);

      await transaction.none(updateCreateSchemaVersion);
      this.version = expectedSchemaVersion;
      return Promise.resolve(true);
    });
  }
}
