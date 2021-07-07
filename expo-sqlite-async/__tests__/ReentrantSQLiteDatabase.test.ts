import type { ResultSet, WebSQLDatabase } from 'expo-sqlite';
import { mock } from 'jest-mock-extended';
import { ReentrantSQLiteDatabase } from '../ReentrantSQLiteDatabase';
import { SQLiteAsyncDatabase } from '../SQLiteAsyncDatabase';
// import { ReentrantSQLiteDatabase } from '../ReentrantSQLiteDatabase';
// import { SQLiteAsyncDatabase } from '../SQLiteAsyncDatabase';

// const beginTransactionCheck = (
//   queries: Query[],
//   readOnly: boolean,
//   callback: SQLiteCallback
// ) => {
//   expect(queries).toHaveLength(1);
//   expect(queries[0].sql).toBe('begin transaction');
//   expect(readOnly).toBe(false);
//   callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
// };

// const commitTransactionCheck = (
//   queries: Query[],
//   readOnly: boolean,
//   callback: SQLiteCallback
// ) => {
//   expect(queries).toHaveLength(1);
//   expect(queries[0].sql).toBe('commit');
//   expect(readOnly).toBe(false);
//   callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
// };

// const rollbackTransactionCheck = (
//   queries: Query[],
//   readOnly: boolean,
//   callback: SQLiteCallback
// ) => {
//   expect(queries).toHaveLength(1);
//   expect(queries[0].sql).toBe('rollback');
//   expect(readOnly).toBe(false);
//   callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
// };

describe('ReentrantSQLiteDatabase', () => {
  it('constructs', () => {
    const db = new ReentrantSQLiteDatabase(async () =>
      mock<SQLiteAsyncDatabase>()
    );
    expect(db).toBeTruthy();
  });

  it('constructs mock websql', () => {
    const mockDb = mock<WebSQLDatabase>();
    const asyncDb = new SQLiteAsyncDatabase(mockDb);
    const db = new ReentrantSQLiteDatabase(async () => asyncDb);
    expect(db).toBeTruthy();
  });

  it('executeSqlAsync calls exec', async () => {
    const mockDb = mock<WebSQLDatabase>();
    const asyncDb = new SQLiteAsyncDatabase(mockDb);
    const db = new ReentrantSQLiteDatabase(async () => asyncDb);
    mockDb.exec.mockImplementation((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(readOnly).toBe(true);
      callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
    });
    const rs = await db.executeSqlAsync(
      'select * from foo where a=? and b=?',
      [1, 2],
      true
    );
    expect(rs.rows.length).toBe(0);
  });
  it('calls exec correctly from e', async () => {
    const mockDb = mock<WebSQLDatabase>();
    const asyncDb = new SQLiteAsyncDatabase(mockDb);
    const db = new ReentrantSQLiteDatabase(async () => asyncDb);
    mockDb.exec.mockImplementationOnce((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toBe('begin exclusive transaction');
      expect(readOnly).toBe(false);
      callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
    });
    mockDb.exec.mockImplementationOnce((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(readOnly).toBe(false);
      callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
    });
    mockDb.exec.mockImplementationOnce((queries, readOnly, callback) => {
      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toBe('commit');
      expect(readOnly).toBe(false);
      callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
    });
    const rs = await db.e('select * from foo where a=? and b=?', 1, 2);
    expect(rs.rows.length).toBe(0);
  });
});

// describe('SQLiteAsyncDatabase.q', () => {
//   it('calls exec correctly from q', async () => {
//     const mockDb = mock<WebSQLDatabase>();
//     const db = new SQLiteAsyncDatabase(mockDb);
//     mockDb.exec
//       .mockImplementationOnce(beginTransactionCheck)
//       .mockImplementationOnce((queries, readOnly, callback) => {
//         expect(queries).toHaveLength(1);
//         expect(readOnly).toBe(true);
//         callback(null, [
//           { rowsAffected: 0, rows: [{ id: 4 }, { id: 5 }] } as ResultSet,
//         ]);
//       })
//       .mockImplementationOnce(commitTransactionCheck);
//     const rows = await db.q('select * from foo where a=? and b=?', 1, 2);
//     expect(rows.length).toBe(2);
//   });
//   it('fail correctly from q', async () => {
//     const mockDb = mock<WebSQLDatabase>();
//     const db = new SQLiteAsyncDatabase(mockDb);
//     mockDb.exec
//       .mockImplementationOnce(beginTransactionCheck)
//       .mockImplementationOnce((queries, readOnly, callback) => {
//         expect(queries).toHaveLength(1);
//         expect(readOnly).toBe(true);
//         callback(new Error('BOO'));
//       })
//       .mockImplementationOnce(rollbackTransactionCheck);
//     try {
//       await db.q('select * from foo where a=? and b=?', 1, 2);
//     } catch (e) {
//       expect((e as Error).message).toBe('BOO');
//     }
//   });
// });

// describe('SQLiteAsyncDatabase.q1', () => {
//   it('calls exec correctly from q1', async () => {
//     const mockDb = mock<WebSQLDatabase>();
//     const db = new SQLiteAsyncDatabase(mockDb);
//     mockDb.exec
//       .mockImplementationOnce(beginTransactionCheck)
//       .mockImplementationOnce((queries, readOnly, callback) => {
//         expect(queries).toHaveLength(1);
//         expect(readOnly).toBe(true);
//         callback(null, [{ rowsAffected: 0, rows: [{ id: 5 }] } as ResultSet]);
//       })
//       .mockImplementationOnce(commitTransactionCheck);
//     const row = await db.q1('select * from foo where a=? and b=?', 1, 2);
//     expect(row).toMatchObject({ id: 5 });
//   });
//   it('calls exec correctly from q and no result', async () => {
//     const mockDb = mock<WebSQLDatabase>();
//     const db = new SQLiteAsyncDatabase(mockDb);
//     mockDb.exec
//       .mockImplementationOnce(beginTransactionCheck)
//       .mockImplementationOnce((queries, readOnly, callback) => {
//         expect(queries).toHaveLength(1);
//         expect(readOnly).toBe(true);
//         callback(null, [{ rowsAffected: 0, rows: [] } as ResultSet]);
//       })
//       .mockImplementationOnce(commitTransactionCheck);
//     const row = await db.q1('select * from foo where a=? and b=?', 1, 2);
//     expect(row).toBe(null);
//   });
//   it('fails exec correctly from q1', async () => {
//     const mockDb = mock<WebSQLDatabase>();
//     const db = new SQLiteAsyncDatabase(mockDb);
//     mockDb.exec
//       .mockImplementationOnce(beginTransactionCheck)
//       .mockImplementationOnce((queries, readOnly, callback) => {
//         expect(queries).toHaveLength(1);
//         expect(queries[0].sql).toBe(
//           'select * from shouldBeOnlyOne where a=? and b=?'
//         );
//         expect(queries[0].args[0]).toBe(1);
//         expect(queries[0].args[1]).toBe(2);
//         expect(readOnly).toBe(true);
//         callback(null, [
//           { rowsAffected: 0, rows: [{ id: 4 }, { id: 5 }] } as ResultSet,
//         ]);
//       })
//       .mockImplementationOnce(rollbackTransactionCheck);
//     try {
//       await db.q1('select * from shouldBeOnlyOne where a=? and b=?', 1, 2);
//     } catch (e) {
//       expect((e as Error).message).toBe(
//         'Multiple records found when expecting only one'
//       );
//     }
//   });
