import { pool } from "./db.ts";
import type { DB } from "../types/db.type.ts";

export async function transaction<T>(operation: (query: DB) => Promise<T>): Promise<T> {
     const connection = await pool.getConnection();
     try {
          await connection.beginTransaction();
          const query: DB = async <R>(sql: string, params: unknown[] = []) => {
               const [rows] = await connection.execute(sql, params as any);
               return rows as R;
          };
          const result = await operation(query);
          await connection.commit();
          return result;
     } catch (error) {
          await connection.rollback();
          throw error;
     } finally {
          connection.release();
     }
}
