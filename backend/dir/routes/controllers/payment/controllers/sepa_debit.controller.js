import { stripe as defaultStripe } from './_common.js';
import { STRIPE_SEPA_EUR_RATE } from "../../../../config/env.js";
export default async function sepa_debit({ request, reply, }) {
    const typedRequest = request;
    const product = typedRequest.product;
    const userInfo = typedRequest.userInfo;
    if (!userInfo || !('id' in userInfo)) {
        return reply.code(401).send({ error: 'Unauthorized.' });
    }
    const priceUSD = Number(product.price);
    if (!Number.isFinite(priceUSD) || priceUSD <= 0) {
        return reply.code(400).send({ error: 'Invalid product price.' });
    }
    const amountInCents = Math.round(priceUSD * STRIPE_SEPA_EUR_RATE * 100);
    if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) {
        return reply.code(400).send({ error: 'Invalid converted SEPA amount.' });
    }
    try {
        const paymentIntent = await defaultStripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            payment_method_types: ['sepa_debit'],
            metadata: {
                product_id: String(product.product_id),
                user_id: String(userInfo.id),
                seller_id: String(product.user_id),
                source_currency: 'usd',
                source_amount: priceUSD.toFixed(2),
                usd_to_eur_rate: String(STRIPE_SEPA_EUR_RATE),
            },
        }, {
            idempotencyKey: `sepa-debit:${typedRequest.query.session_id}`,
        });
        return reply.code(200).send({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: (amountInCents / 100).toFixed(2),
            currency: 'eur',
        });
    }
    catch (error) {
        console.error('Error creating SEPA Direct Debit PaymentIntent:', error);
        return reply.code(500).send({ error: 'SEPA Direct Debit could not be started.' });
    }
}
