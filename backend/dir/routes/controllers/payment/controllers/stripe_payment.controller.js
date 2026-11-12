import { randomUUID, stripe as defaultStripe } from './_common.js';
export default async function stripe_payment({ db, request, reply, }) {
    const typedRequest = request;
    const product = typedRequest.product;
    const userInfo = typedRequest.userInfo;
    if (!userInfo || !('id' in userInfo)) {
        return reply.code(401).send({ error: 'Unauthorized.' });
    }
    const priceUSD = Number(product.price);
    if (!Number.isFinite(priceUSD) || priceUSD <= 0)
        return reply.code(400).send({ error: 'Invalid product price.' });
    const amountInCents = Math.round(priceUSD * 100);
    const invoiceId = `INV_${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
    const invoiceCreatedAt = new Date().toISOString();
    const invoiceDate = invoiceCreatedAt.slice(0, 10);
    const invoiceCreatedAtForMetadata = invoiceCreatedAt.slice(0, 19).replace('T', ' ');
    const serviceType = product.category === 'Service' ? 'services' : 'account';
    try {
        const paymentStripe = defaultStripe;
        const accounts = await db('SELECT email, username FROM Users WHERE user_id = ? LIMIT 1', [userInfo.id]);
        const account = accounts[0];
        if (!account?.email) {
            return reply.code(404).send({ error: 'Customer account was not found.' });
        }
        const customerSearch = await paymentStripe.customers.search({
            query: `metadata['user_id']:'${String(userInfo.id)}'`,
            limit: 1,
        });
        let stripeCustomer = customerSearch.data[0];
        if (!stripeCustomer) {
            stripeCustomer = await paymentStripe.customers.create({
                email: account.email,
                name: account.username,
                metadata: {
                    user_id: String(userInfo.id),
                },
            }, {
                idempotencyKey: `customer:${String(userInfo.id)}`,
            });
        }
        else if (stripeCustomer.email !== account.email ||
            stripeCustomer.name !== account.username) {
            stripeCustomer = await paymentStripe.customers.update(stripeCustomer.id, {
                email: account.email,
                name: account.username,
            });
        }
        const paymentIntent = await paymentStripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            customer: stripeCustomer.id,
            receipt_email: account.email,
            description: `Payment for ${serviceType} - Invoice #${invoiceId}`,
            payment_method_types: ['card'],
            setup_future_usage: 'off_session',
            metadata: {
                created_at: invoiceCreatedAtForMetadata,
                invoice_date: invoiceDate,
                invoice_id: invoiceId,
                product_id: String(product.product_id),
                user_id: String(userInfo.id),
                seller_id: String(product.user_id),
            },
        });
        if (!paymentIntent.client_secret) {
            return reply.code(500).send({ error: 'Stripe did not return a client secret.' });
        }
        return reply.code(200).send({
            id: paymentIntent.client_secret,
            status: paymentIntent.status,
            payment_id: paymentIntent.id,
            invoice_id: invoiceId,
        });
    }
    catch (error) {
        console.error(error);
        return reply.code(500).send({ error: 'Stripe PaymentIntent could not be created.' });
    }
}
