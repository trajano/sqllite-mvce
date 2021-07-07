import type { ResultSet, WebSQLDatabase } from 'expo-sqlite';
import { mock } from 'jest-mock-extended';
import { AsyncSQLTransaction } from '../AsyncSQLTransaction';

describe('AsyncSQLTransaction', () => {
  it('constructs', async () => {
    const tx = new AsyncSQLTransaction(mock<WebSQLDatabase>(), false);
    expect(tx).toBeTruthy();
  });
  it('calls db', async () => {
    const mockDb = mock<WebSQLDatabase>();
    const tx = new AsyncSQLTransaction(mockDb, false);
    expect(tx).toBeTruthy();
    mockDb.exec.mockImplementation((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(readOnly).toBe(false);
      callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
    });
    const rs = await tx.executeSqlAsync(
      'select * from foo where a=? and b= ?',
      1,
      2
    );
    expect(rs.rows.length).toBe(0);
  });

  it('calls db read-only', async () => {
    const mockDb = mock<WebSQLDatabase>();
    const tx = new AsyncSQLTransaction(mockDb, true);
    expect(tx).toBeTruthy();
    mockDb.exec.mockImplementation((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(readOnly).toBe(true);
      callback(null, [
        {
          rowsAffected: 0,
          rows: [{ a: 1 }, { a: 2 }],
        } as ResultSet,
      ]);
    });
    const rs = await tx.executeSqlAsync(
      'select * from foo where a=? and b= ?',
      1,
      2
    );
    expect(rs.rows.length).toBe(2);
  });

  it('q calls db read-only', async () => {
    const mockDb = mock<WebSQLDatabase>();
    const tx = new AsyncSQLTransaction(mockDb, true);
    expect(tx).toBeTruthy();
    mockDb.exec.mockImplementation((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(readOnly).toBe(true);
      callback(null, [
        {
          rowsAffected: 0,
          rows: [{ a: 1 }, { a: 2 }],
        } as ResultSet,
      ]);
    });
    const rows = await tx.q('select * from foo where a=? and b= ?', 1, 2);
    expect(rows.length).toBe(2);
  });

  it('q1 calls db read-only', async () => {
    const mockDb = mock<WebSQLDatabase>();
    const tx = new AsyncSQLTransaction(mockDb, true);
    expect(tx).toBeTruthy();
    mockDb.exec.mockImplementation((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(readOnly).toBe(true);
      callback(null, [
        {
          rowsAffected: 0,
          rows: [{ a: 1 }],
        } as ResultSet,
      ]);
    });
    const rs = await tx.q1('select * from foo where a=? and b= ?', 1, 2);
    expect(rs).toMatchObject({ a: 1 });
  });
});
