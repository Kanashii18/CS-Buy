export default async function getWallet({ db, request, reply }) {
     // Bug fix: use request.userInfo (set by verify_session middleware),
     // NOT request.userId which never exists.
     const userInfo = request.userInfo;
     if (!userInfo) {
          return reply.status(401).send({ error: 'Unauthenticated' });
     }

     try {
          const query = 'SELECT * FROM Wallets WHERE user_id = ?';
          const results = await db(query, [userInfo.id]);

          if (results.length === 0) {
               return reply.status(404).send({ error: 'Wallet not found' });
          }

          return reply.send(results[0]);

     } catch (error) {
          console.error('Unexpected error in getWallet:', error);
          return reply.status(500).send({ error: 'Unknown Error' });
     }
}
