import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import "dotenv/config";
import { CA_PEM, SQL_PASSWORD } from "../config/env.ts";
import type { DB } from "../types/db.type.ts";

// Load environment variables
// ======================== | DB | ======================== //

const db_conection: Pool = mysql.createPool({
     port: 15874,
     host: "mysql-35fc5689-danielalexander177125-03c9.a.aivencloud.com",
     user: "avnadmin",
     password: SQL_PASSWORD,
     database: "defaultdb",
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0,
     ssl: { ca: CA_PEM },
});

const db: DB = async <T>(query: string, params: unknown[] = []): Promise<T> => {
     if (typeof query !== "string") {
          throw new Error("Invalid type query in db");
     }
     if (!Array.isArray(params)) {
          throw new Error("Invalid params type in db");
     }
     const [rows] = await db_conection.execute(query, params as any);
     return rows as T;
};
export { db, db_conection as pool };
