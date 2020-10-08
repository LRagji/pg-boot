import * as pg from 'pg-promise';
export declare class PgBoot {
    version: number;
    name: string;
    constructor(name: string);
    static dynamicPreparedStatement(name: string, sql: string, dynamicValues: any): pg.PreparedStatement;
    checkVersion(pgWriterConnection: pg.IDatabase<any>, expectedSchemaVersion: number, reconcileCallback: (transaction: pg.ITask<any>, dbVersion: number) => Promise<void>): Promise<boolean>;
}
//# sourceMappingURL=index.d.ts.map