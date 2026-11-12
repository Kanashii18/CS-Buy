export default async function ({ db, request, reply }) {
    const userInfo = request.userInfo;
    try {
        const orders = await db(`
                    SELECT *
                    FROM Orders
                    WHERE user_id = ?
               `, [userInfo.id]);
        return await reply.code(200).send(orders);
    }
    catch (error) {
        console.error('Error getting orders:', error.message);
        return await reply.code(500).send({ error: 'Server Error' });
    }
}
