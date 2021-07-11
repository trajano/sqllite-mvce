import { Mutex } from 'async-mutex';
import type {
  Query,
  ResultSet,
  ResultSetError,
  SQLiteCallback,
  SQLTransactionCallback,
  SQLTransactionErrorCallback,
  SQLVoidCallback,
  WebSQLDatabase,
} from 'expo-sqlite';
import type {
  AsyncSQLiteDatabase,
  AsyncTransactionCallback,
  ResultSetRows,
} from './AsyncSQLiteDatabase';
import { AsyncSQLTransaction } from './AsyncSQLTransaction';

export class SQLiteAsyncDatabase
  implements WebSQLDatabase, AsyncSQLiteDatabase
{
  version: string;
  private mutex: Mutex;

  constructor(private db: WebSQLDatabase) {
    this.version = db.version;
    this.mutex = new Mutex();
  }
  /**
   * Forwards to existing database to use WebSQL transactions.
   * @param callback
   * @param errorCallback
   * @param successCallback
   */
  transaction(
    callback: SQLTransactionCallback,
    errorCallback?: SQLTransactionErrorCallback,
    successCallback?: SQLVoidCallback
  ): void {
    this.db.transaction(callback, errorCallback, successCallback);
  }
  /**
   * Forwards to existing database to use WebSQL transactions.
   * @param callback
   * @param errorCallback
   * @param successCallback
   */
  readTransaction(
    callback: SQLTransactionCallback,
    errorCallback?: SQLTransactionErrorCallback,
    successCallback?: SQLVoidCallback
  ): void {
    this.db.readTransaction(callback, errorCallback, successCallback);
  }

  /**
   * Forwards to existing database
   * @param queries
   * @param readOnly
   * @param callback
   */
  exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void {
    this.db.exec(queries, readOnly, callback);
  }

  /**
   * Creates a transaction and executes a callback passing in the transaction wrapped with an async API
   * @param callback callback function that would get a transaction that provides async capability.  The return value of the callback will be the return value of this method.
   */
  async txn<T>(callback: AsyncTransactionCallback<T>): Promise<T> {
    const release = await this.mutex.acquire();

    try {
      await this.executeSqlAsync('begin immediate transaction');
      const tx = new AsyncSQLTransaction(this);
      const rs = await callback(tx);
      await this.executeSqlAsync('commit');
      return rs;
    } catch (error) {
      await this.executeSqlAsync('rollback');
      throw error;
    } finally {
      release();
    }
  }
  /**
   * Creates a read-only transaction and executes a callback passing in the transaction wrapped with an async API
   * @param callback callback function that would get a transaction that provides async capability.  The return value of the callback will be the return value of this method.
   */
  async rtxn<T>(callback: AsyncTransactionCallback<T>): Promise<T> {
    const release = await this.mutex.acquire();

    try {
      await this.executeSqlAsync('begin immediate transaction');
      const tx = new AsyncSQLTransaction(this, true);
      const rs = await callback(tx);
      await this.executeSqlAsync('commit');
      return rs;
    } catch (error) {
      await this.executeSqlAsync('rollback');
      throw error;
    } finally {
      release();
    }
  }

  /**
   * Executes a single SQL statement and returns the result set.  The statement does not need to be read-only.
   * @param sqlStatement
   * @param args arguments
   * @returns result set promise
   */
  async e(sqlStatement: string, ...args: any): Promise<ResultSet> {
    return this.txn(async (tx) => tx.executeSqlAsync(sqlStatement, ...args));
  }

  /**
   * Executes an read only SQL statement and returns the rows of the result set.
   * @param sqlStatement
   * @param args arguments
   * @returns result set rows promise
   */
  async q<T extends Record<string, unknown>>(
    sqlStatement: string,
    ...args: any
  ): Promise<ResultSetRows<T>> {
    const rs = await this.rtxn(async (tx) =>
      tx.executeSqlAsync(sqlStatement, ...args)
    );
    return rs.rows as ResultSetRows<T>;
  }

  /**
   * Executes an read only SQL statement and returns only one row if present.  If there no rows found it returns null.  If there are multiple rows, it throws an error
   * @param sqlStatement
   * @param args arguments
   * @returns single row.
   */
  async q1<T extends Record<string, unknown>>(
    sqlStatement: string,
    ...args: any
  ): Promise<T | null> {
    return await this.rtxn(async (tx) => {
      const rs = await tx.executeSqlAsync(sqlStatement, ...args);
      if (rs.rows.length > 1) {
        throw new Error('Multiple records found when expecting only one');
      } else if (rs.rows.length === 0) {
        return null;
      }
      return (rs.rows as ResultSetRows<T>)[0];
    });
  }

  /**
   * Wraps the exec command but only supports ONE statement without notion of a transaction context.
   * @param sqlStatement SQL statement
   * @param args  arguments array
   * @param readOnly if the exec should be readonly
   * @returns result set.
   */
  async executeSqlAsync(
    sqlStatement: string,
    args: any[] = [],
    readOnly = false
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
   * Enables foreign keys
   */
  async enableForeignKeys(): Promise<void> {
    this.executeSqlAsync('PRAGMA foreign_keys = ON');
  }
}
