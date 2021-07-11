import type { ResultSet, ResultSetError, WebSQLDatabase } from 'expo-sqlite';
import type { ResultSetRows } from './AsyncSQLiteDatabase';

export class AsyncSQLTransaction {
  constructor(private db: WebSQLDatabase, private readOnly = false) {}

  /**
   * This is the same logic as in SQLiteAsyncDatabase, but the database that is
   * passed into this transaction is NOT a SQLiteAsyncDatabase but a WebSQLDatabase
   * for interop.
   * @param sqlStatement
   * @param args as an array
   * @param readOnly read only SQL allowed
   * @returns result set
   */
  private async doExecuteSqlAsync(
    sqlStatement: string,
    args: any[],
    readOnly: boolean
  ): Promise<ResultSet> {
    return new Promise<ResultSet>((resolve, reject) => {
      this.db.exec(
        [{ sql: sqlStatement, args }],
        readOnly,
        (error, resultSet) => {
          if (error) {
            reject(error);
          }
          if (resultSet && resultSet[0]) {
            const result = resultSet[0];
            if ((result as ResultSetError).error) {
              const resultSetError = (result as ResultSetError).error;
              console.error(`${resultSetError} for ${sqlStatement} ${args}`);
              reject(resultSetError);
            } else {
              resolve(result as unknown as ResultSet);
            }
          }
        }
      );
    });
  }

  /**
   * This is the same logic as in SQLiteAsyncDatabase, but the database that is
   * passed into this transaction is NOT a SQLiteAsyncDatabase but a WebSQLDatabase
   * for interop.
   * @param sqlStatement
   * @param args
   * @returns
   */
  async executeSqlAsync(
    sqlStatement: string,
    ...args: any
  ): Promise<ResultSet> {
    return this.doExecuteSqlAsync(sqlStatement, args, this.readOnly);
  }

  /**
   * This is the same logic as in SQLiteAsyncDatabase, but the database that is
   * passed into this transaction is NOT a SQLiteAsyncDatabase but a WebSQLDatabase
   * for interop.
   * @param sqlStatement a read only SQL statement
   * @param args
   * @returns
   */
  async q<T extends Record<string, unknown>>(
    sqlStatement: string,
    ...args: any
  ): Promise<ResultSetRows<T>> {
    const rs = await this.doExecuteSqlAsync(sqlStatement, args, true);
    return rs.rows as ResultSetRows<T>;
  }

  /**
   * This is the same logic as in SQLiteAsyncDatabase, but the database that is
   * passed into this transaction is NOT a SQLiteAsyncDatabase but a WebSQLDatabase
   * for interop.
   * @param sqlStatement a read only SQL statement
   * @param args
   * @returns
   */
  async q1<T extends Record<string, unknown>>(
    sqlStatement: string,
    ...args: any
  ): Promise<T | null> {
    const rs = await this.doExecuteSqlAsync(sqlStatement, args, true);
    if (rs.rows.length > 1) {
      throw new Error('Multiple records found when expecting only one');
    } else if (rs.rows.length === 0) {
      return null;
    }
    return (rs.rows as ResultSetRows<T>)[0];
  }
}
