import type {
  ResultSet,
  SQLTransactionCallback,
  SQLTransactionErrorCallback,
  SQLVoidCallback,
} from 'expo-sqlite';
import { AsyncSQLTransaction } from './AsyncSQLTransaction';
import type { ResultSetRows, SQLiteAsyncDatabase } from './SQLiteAsyncDatabase';

type AsyncTransactionCallback<T> = (tx: AsyncSQLTransaction) => Promise<T>;

type OpenDatabaseFunction = () => Promise<SQLiteAsyncDatabase>;

/**
 * This is a SQLite API that allows multiple transactions to run concurrently
 * at the expense that every transaction starts a new database connection
 * as transactions cannot be nested.
 */
export class ReentrantSQLiteDatabase {
  /**
   *
   * @param openDbFn function called to open a database.
   */
  constructor(private openDbFn: OpenDatabaseFunction) {}

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
    this.openDbFn().then((asyncDb) => {
      asyncDb.transaction(callback, errorCallback, successCallback);
    });
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
    this.openDbFn().then((asyncDb) => {
      asyncDb.readTransaction(callback, errorCallback, successCallback);
    });
  }

  /**
   * Creates a transaction and executes a callback passing in the transaction wrapped with an async API
   * @param callback callback function that would get a transaction that provides async capability.  The return value of the callback will be the return value of this method.
   */
  async txn<T>(callback: AsyncTransactionCallback<T>): Promise<T> {
    const db = await this.openDbFn();
    try {
      await db.executeSqlAsync('begin exclusive transaction');
      const tx = new AsyncSQLTransaction(db);
      const rs = await callback(tx);
      await db.executeSqlAsync('commit');
      return rs;
    } catch (error) {
      await db.executeSqlAsync('rollback');
      throw error;
    }
  }
  /**
   * Creates a read-only transaction and executes a callback passing in the transaction wrapped with an async API
   * @param callback callback function that would get a transaction that provides async capability.  The return value of the callback will be the return value of this method.
   */
  async rtxn<T>(callback: AsyncTransactionCallback<T>): Promise<T> {
    const db = await this.openDbFn();
    try {
      await db.executeSqlAsync('begin transaction');
      const tx = new AsyncSQLTransaction(db, true);
      const rs = await callback(tx);
      await db.executeSqlAsync('commit');
      return rs;
    } catch (error) {
      await db.executeSqlAsync('rollback');
      throw error;
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
   * Forwards to the database with no transaction wrapping
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
    const db = await this.openDbFn();
    return await db.executeSqlAsync(sqlStatement, args, readOnly);
  }
}
