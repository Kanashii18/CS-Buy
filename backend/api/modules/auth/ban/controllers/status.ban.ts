import type { QueryResult } from "mysql2";
import type { Ban } from "../../../../types/modules/bans/bans.type.ts";

export default async ({ db, user_id, device_id, ip }: Ban.StatusParams) => {
     try {
          if (!user_id) return { error: "Unauthorized" };
          const rows = await db<QueryResult[]>(
               `SELECT 1 FROM Bans
                    WHERE (
                         (user_id = ? AND user_id IS NOT NULL)
                         OR (deviceId = ? AND deviceId IS NOT NULL)
                         OR (ip = ? AND ip IS NOT NULL)
                    )
                    AND (expires_at IS NULL OR expires_at > NOW())
                    LIMIT 1`,
               [user_id, device_id, ip],
          );
          if (rows.length > 0) {
               return { banned: true };
          }
     } catch (e) {
          return { error: "Internal error checking status." };
     }
};
