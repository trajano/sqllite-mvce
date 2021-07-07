import { openDatabaseAsync, SQLiteAsyncDatabase } from "../expo-sqlite-async";

export class DataStore {
  private db!: SQLiteAsyncDatabase;
  async setup(name: string) {
    this.db = await openDatabaseAsync(name);
    await this.db.enableForeignKeys();
    await this.db.txn(async (tx) => {
      await tx.executeSqlAsync(`
        create table if not exists artifact (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            encryptedArtifactId TEXT NOT NULL,
            name TEXT NOT NULL,
            purge INT
          );
        `);

      await tx.executeSqlAsync(`
        create unique index if not exists artifactsEncryptedArtifactId
            on artifact (encryptedArtifactId)
        `);

      await tx.executeSqlAsync(`
        create table if not exists artifact_permission (
            artifactId INT,
            encryptedUserId TEXT,
            purge INT,
            PRIMARY KEY (artifactId, encryptedUserId),
            CONSTRAINT fk_observations
              FOREIGN KEY (artifactId)
              REFERENCES artifact(id)
              ON DELETE CASCADE
          );
        `);
    });
  }
  async add(foo: number) {
    await this.db.txn(async (tx) => {
      await tx.executeSqlAsync(
        `
        insert into artifact (encryptedArtifactId, name, purge)
        values (?,?,?)
        `,
        `id${foo}`,
        `name${foo}`,
        false
      );
      await tx.executeSqlAsync(
        `
        insert into artifact (encryptedArtifactId, name, purge)
        values (?,?,?)
        `,
        `id${foo}`,
        `name${foo}`,
        false
      );
    });
  }
  async query(): Promise<any[]> {
    return this.db.rtxn(
      async (tx) => (await tx.executeSqlAsync("select * from artifact")).rows
    );
  }
}
