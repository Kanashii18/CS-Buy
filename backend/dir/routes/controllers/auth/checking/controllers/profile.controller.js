export default async function ({ db, request, reply }) {
    const userId = request.query.id;
    if (!userId) {
        return await reply.status(400).send({ error: 'User id is required' });
    }
    try {
        const query = `
               SELECT user_id, username, img, description, accounts_selled, assets_selled, services_selled
               FROM Users
               WHERE user_id = ?
          `;
        const results = await db(query, [userId]);
        if (results.length === 0) {
            return await reply.status(404).send({ error: 'User not found' });
        }
        return reply.send(results[0]);
    }
    catch (err) {
        console.error(err);
        return await reply.status(500).send({ error: 'Internal server error' });
    }
}
