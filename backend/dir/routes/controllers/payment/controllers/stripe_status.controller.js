import { randomUUID, Set_orders, stripe as defaultStripe } from './_common.js';
export default async function stripe_status({ db, io, users, request, reply }) {
    const userInfo = request.userInfo;
    const product = request.product;
    const paymentIntentId = request.body.paymentIntentId;
    if (!userInfo)
        return reply.code(401).send({ error: 'Unauthorized.' });
    if (!paymentIntentId)
        return reply.code(400).send({ error: 'Payment intent id is required.' });
    try {
        const paymentStripe = defaultStripe;
        const paymentIntent_response = await paymentStripe.paymentIntents.retrieve(paymentIntentId);
        const isSepaDebit = paymentIntent_response.payment_method_types.includes('sepa_debit');
        const expectedStatus = 'succeeded';
        if (paymentIntent_response.metadata.product_id !== String(product.product_id) ||
            paymentIntent_response.metadata.user_id !== String(userInfo.id) ||
            paymentIntent_response.metadata.seller_id !== String(product.user_id)) {
            return reply.code(400).send({ error: 'Payment intent does not match this checkout.' });
        }
        const expectedCurrency = isSepaDebit ? 'eur' : 'usd';
        const conversionRate = isSepaDebit
            ? Number(paymentIntent_response.metadata.usd_to_eur_rate)
            : 1;
        const sourceAmount = isSepaDebit
            ? Number(paymentIntent_response.metadata.source_amount)
            : Number(product.price);
        const expectedAmount = Math.round(Number(product.price) * conversionRate * 100);
        if (!Number.isSafeInteger(expectedAmount) ||
            sourceAmount !== Number(product.price) ||
            paymentIntent_response.currency !== expectedCurrency ||
            paymentIntent_response.amount !== expectedAmount) {
            return reply.code(400).send({ error: 'Payment amount or currency does not match this checkout.' });
        }
        if (isSepaDebit && paymentIntent_response.status === 'processing') {
            return reply.code(202).send({ status: 'processing' });
        }
        if (paymentIntent_response.status !== expectedStatus) {
            return reply.code(400).send({ error: 'Pago fallido o incompleto.' });
        }
        const security_q = `SELECT payment_processed FROM Payments WHERE payment_id = ?`;
        const response = await db(security_q, [paymentIntent_response.id]);
        if (response.length === 1 && response[0].payment_processed === 1) {
            return reply.code(401).send({ error: 'invalid payment id' });
        }
        if (product.category !== 'Service' && product.category !== 'Account') {
            return reply.code(400).send('invalid option');
        }
        const update_wallet = `UPDATE Wallets SET pending = pending + ? WHERE user_id = ?;`;
        await db(update_wallet, [product.price, product.user_id]);
        const order_id = randomUUID();
        if (product.category === 'Service') {
            await Set_orders.service({ db, product, userInfo, order_id });
        }
        else if (product.category === 'Account') {
            await Set_orders.account({ db, product_: product, userInfo, order_id });
        }
        await Set_orders.final({ db, product, userInfo, io, users });
        // reply, db, product, userInfo, io, users;
        const security_u = `
               INSERT INTO Payments (
                    payment_processed, 
                    payment_id, 
                    order_id, 
                    user_id,
                    payment_gateway, 
                    payment_gateway_id, 
                    amount,
                    status,
                    wallet_id
               )
               VALUES (
                    1, ?, ?, ?, ?, ?, ?, ?, 
                    (SELECT wallet_id FROM Wallets WHERE user_id = ?)
               );
          `;
        const gateway_id = randomUUID();
        await db(security_u, [
            paymentIntent_response.id,
            order_id,
            userInfo.id,
            'stripe',
            gateway_id,
            product.price,
            paymentIntent_response.status,
            product.user_id,
        ]);
        return reply.code(200).send('OK');
    }
    catch (error) {
        console.error('Error al verificar el pago:', error);
        return reply.code(500).send({ error: 'Error en el servidor al verificar el pago.' });
    }
}
