export async function getFeedback({ request, reply, db }) {
    const user_id = request.body.user_id;
    if (!user_id) {
        return await reply.code(400).send({ error: 'Missing user_id in request body' });
    }
    try {
        const userExists = await db(`SELECT 1 FROM Users WHERE user_id = ?`, [user_id]);
        if (userExists.length === 0) {
            return await reply.code(404).send({ error: 'User not found' });
        }
        const feedbacks = await db(`
               SELECT 
               f.feedback_id,
               f.user_id,
               f.product_id,
               f.client_id,
               f.comment,
               f.stars,
               f.created_at,
               u.username AS user_username,
               u.img AS user_img
               FROM Feedbacks f
               JOIN Users u ON f.client_id = u.user_id
               WHERE f.user_id = ?
               ORDER BY f.created_at DESC
          `, [user_id]);
        return await reply.send(feedbacks);
    }
    catch (error) {
        console.error('DB error fetching feedbacks:', error);
        return await reply.code(500).send({ error: 'Server error' });
    }
}
