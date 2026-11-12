import { randomUUID } from "node:crypto";
export default async function ({ db, request, reply }) {
    const userInfo = request.userInfo;
    const product_id = request.body?.product_id;
    if (!product_id) {
        return await reply.code(400).send({ error: 'Missing product_id in request body' });
    }
    if (!userInfo) {
        return await reply.code(401).send({ error: 'Unauthorized' });
    }
    const id_session = randomUUID();
    try {
        let res = await db(`
               INSERT INTO Checkout_id (
                    id,
                    user_id,
                    product_id,
                    expires_at
               ) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))
          `, [id_session, userInfo.id, product_id]);
        if (res.affectedRows === 0) {
            return await reply.code(500).send({ error: 'Failed to create session' });
        }
        res = await db(`
                    DELETE FROM Checkout_id
                         WHERE user_id = ?
                         AND id <> ?
               `, [userInfo.id, id_session]);
        return await reply.send({ session_id: id_session });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        return await reply.code(500).send({ error: 'Database error' });
    }
}
