import { DB } from "../../types/db.type.ts";

// check if user is banned
export default async function isBanned(db : DB, { userId = "", deviceId = "", ip = "" }) {

     const rows = await db(
          `SELECT 1
               FROM Bans
               WHERE (
                    (user_id = ? AND user_id IS NOT NULL)
                    OR (deviceId = ? AND deviceId IS NOT NULL)
                    OR (ip = ? AND ip IS NOT NULL)
               )
               AND (expires_at IS NULL OR expires_at > NOW())
               LIMIT 1`,
          [userId || null, deviceId || null, ip || null]
     );
     if(!Array.isArray(rows)){
          throw new Error("Invalid database response");
     }
     return rows.length > 0;
}
