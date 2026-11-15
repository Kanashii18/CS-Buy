export default async function transitions({request, reply, db}) {
  // TODO: mover/extraer la lógica desde wallet.controller.js
  try {
    const userInfo = request.userInfo;
    // Bug fix: subquery used `SELECT id FROM Wallets` but the PK column is `wallet_id`
    const rows = await db(
      'SELECT * FROM Transactions WHERE user_id = ? AND wallet_id = (SELECT wallet_id FROM Wallets WHERE user_id = ?)',
      [userInfo.id, userInfo.id]
    );
    return reply.code(200).send({ transactions: rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
}
