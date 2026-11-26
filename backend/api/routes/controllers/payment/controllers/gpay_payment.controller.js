import { stripe } from "./_common.js";
import { walletIntent } from "./wallet-intent.js";

export default async function gpayPayment({ db, request, reply }) {
     if (process.env.GOOGLE_PAY_ENABLED !== "true")
          return reply.code(404).send({ error: "Google Pay disabled." });
     const params = walletIntent(request);
     if (!params) return reply.code(400).send({ error: "Listing unavailable for Google Pay." });
     try {
          const [available] = await db(
               `SELECT c.id FROM Checkout_id c JOIN Products p ON p.product_id = c.product_id
                WHERE c.id = ? AND c.user_id = ? AND c.expires_at > NOW()
                AND p.quantity > 0 AND p.deleted = 0`,
               [request.query.session_id, request.userInfo.id],
          );
          if (!available) return reply.code(409).send({ error: "Checkout expired or listing unavailable." });
          const intent = await stripe.paymentIntents.create(params, {
               idempotencyKey: `gpay:${request.query.session_id}`,
          });
          return reply.header("Cache-Control", "no-store").send({ clientSecret: intent.client_secret, amount: intent.amount });
     } catch {
          return reply.code(502).send({ error: "Unable to prepare Google Pay." });
     }
}
