export default async ({ db, type }) => {
    try {
        if (!type.userId) {
            return { error: "UserID is required." };
        }
        const ban = await db(`SELECT id, email, ip, reason, created_at, expires_at
               FROM Bans
               WHERE user_id = ?
               AND (expires_at IS NULL OR expires_at > NOW())
               LIMIT 1`, [type.userId]);
        return { ban: ban ?? null };
    }
    catch {
        return { error: "Internal error finding ban." };
    }
};
