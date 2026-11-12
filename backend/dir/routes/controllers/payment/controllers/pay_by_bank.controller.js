import { stripe as defaultStripe } from './_common.js';
import { STRIPE_BANK_DESCRIPTOR, STRIPE_PAY_BY_BANK_GBP_RATE } from "../../../../config/env.js";
console.log(STRIPE_PAY_BY_BANK_GBP_RATE);
const getPayByBankConfig = () => {
    return {
        STRIPE_PAY_BY_BANK_GBP_RATE,
        STRIPE_BANK_DESCRIPTOR
    };
};
export default async function pay_by_bank({ request, reply, }) {
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
    let config;
    try {
        config = getPayByBankConfig();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Pay by Bank is not configured.';
        return reply.code(503).send({ error: message });
    }
    const amountInPence = Math.round(priceUSD * config.STRIPE_PAY_BY_BANK_GBP_RATE * 100);
    if (!Number.isSafeInteger(amountInPence) || amountInPence <= 0) {
        return reply.code(400).send({ error: 'Invalid converted Pay by Bank amount.' });
    }
    try {
        const paymentIntent = await defaultStripe.paymentIntents.create({
            amount: amountInPence,
            currency: 'gbp',
            payment_method_types: ['pay_by_bank'],
            statement_descriptor: config.STRIPE_BANK_DESCRIPTOR,
            metadata: {
                product_id: String(product.product_id),
                user_id: String(userInfo.id),
                seller_id: String(product.user_id),
                source_currency: 'usd',
                source_amount: priceUSD.toFixed(2),
                usd_to_gbp_rate: String(config.STRIPE_PAY_BY_BANK_GBP_RATE),
            },
        }, {
            idempotencyKey: `pay-by-bank:${typedRequest.query.session_id}`,
        });
        return reply.code(200).send({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: (amountInPence / 100).toFixed(2),
            currency: 'gbp',
        });
    }
    catch (error) {
        console.error('Error creating Pay by Bank PaymentIntent:', error);
        return reply.code(500).send({ error: 'Pay by Bank could not be started.' });
    }
}
