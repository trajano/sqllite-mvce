import type {
  ResultSet,
  SQLTransactionCallback,
  SQLTransactionErrorCallback,
  SQLVoidCallback,
} from 'expo-sqlite';
import type { AsyncSQLTransaction } from './AsyncSQLTransaction';

export type AsyncTransactionCallback<T> = (
  tx: AsyncSQLTransaction
) => Promise<T>;

/**
 * Typesafe version of result set row.
 */
export type ResultSetRow<T extends Record<string, unknown>> = T;
export type ResultSetRows<T extends Record<string, unknown>> =
  ResultSetRow<T>[];

export interface AsyncSQLiteDatabase {
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
  ): void;
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
  ): void;
  /**
   * Creates a transaction and executes a callback passing in the transaction wrapped with an async API
   * @param callback callback function that would get a transaction that provides async capability.  The return value of the callback will be the return value of this method.
   */
  txn<T>(callback: AsyncTransactionCallback<T>): Promise<T>;
  /**
   * Creates a read-only transaction and executes a callback passing in the transaction wrapped with an async API
   * @param callback callback function that would get a transaction that provides async capability.  The return value of the callback will be the return value of this method.
   */
  rtxn<T>(callback: AsyncTransactionCallback<T>): Promise<T>;
  /**
   * Executes a single SQL statement and returns the result set.  The statement does not need to be read-only.
   * @param sqlStatement
   * @param args arguments
   * @returns result set promise
   */
  e(sqlStatement: string, ...args: any): Promise<ResultSet>;

  /**
   * Executes an read only SQL statement and returns the rows of the result set.
   * @param sqlStatement
   * @param args arguments
   * @returns result set rows promise
   */
  q<T extends Record<string, unknown>>(
    sqlStatement: string,
    ...args: any
  ): Promise<ResultSetRows<T>>;

  /**
   * Executes an read only SQL statement and returns only one row if present.  If there no rows found it returns null.  If there are multiple rows, it throws an error
   * @param sqlStatement
   * @param args arguments
   * @returns single row.
   */
  q1<T extends Record<string, unknown>>(
    sqlStatement: string,
    ...args: any
  ): Promise<T | null>;

  /**
   * Forwards to the database with no transaction wrapping
   * @param sqlStatement SQL statement
   * @param args  arguments array
   * @param readOnly if the exec should be readonly
   * @returns result set.
   */
  executeSqlAsync(
    sqlStatement: string,
    args?: any[],
    readOnly?: boolean
  ): Promise<ResultSet>;
}
