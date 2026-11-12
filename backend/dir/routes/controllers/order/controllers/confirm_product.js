import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from "../../../../config/env.js";
if (!STRIPE_SECRET_KEY)
    throw new Error('STRIPE_SECRET_KEY is required.');
const stripe = new Stripe(STRIPE_SECRET_KEY);
export default async function confirm_product({ request, reply, db }) {
    const id = request.query?.o;
    const userInfo = request.userInfo;
    if (!id || !userInfo) {
        await reply.code(401).send({ error: 'Unauthorized' });
        return;
    }
    try {
        const [payment] = await db(`
               SELECT payment_gateway, payment_id, amount, wallet_id
               FROM Payments
               WHERE order_id = (SELECT order_id FROM Orders WHERE order_id = ? AND user_id = ?)
          `, [id, userInfo.id]);
        if (payment.payment_gateway === 'stripe') {
            const currentPaymentIntent = await stripe.paymentIntents.retrieve(payment.payment_id);
            const paymentIntent = currentPaymentIntent.status === 'requires_capture'
                ? await stripe.paymentIntents.capture(payment.payment_id)
                : currentPaymentIntent;
            if (paymentIntent.status === 'succeeded') {
                await db(`
                         UPDATE Payments
                         SET status = 'completed'
                         WHERE order_id = (SELECT order_id FROM Orders WHERE order_id = ? AND user_id = ?)
                    `, [id, userInfo.id]);
                await db(`
                         UPDATE Wallets
                         SET balance = balance + ?, pending = pending - ?
                         WHERE wallet_id = ?;
                    `, [payment.amount, payment.amount, payment.wallet_id]);
                await db(`
                         UPDATE Orders
                         SET status = 'confirmed'
                         WHERE order_id = ? AND user_id = ?
                    `, [id, userInfo.id]);
                return await reply.code(200).send({ message: 'OK' });
            }
        }
        return await reply.code(500).send({ error: 'unknown error, try again later' });
    }
    catch (err) {
        console.log(err);
        return await reply.code(500).send({ error: 'Error updating order' });
    }
}
