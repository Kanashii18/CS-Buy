export default async ({ db, user_id }) => {
    try {
        if (typeof user_id !== "string") {
            return { error: "Invalid user_id" };
        }
        const resp = await db(`DELETE FROM Bans
               WHERE user_id = ?`, [user_id]);
        if (resp.length === 0) {
            return { error: "No ban found for the given user_id." };
        }
    }
    catch (e) {
        return { error: "Internal error revoking ban." };
    }
};
