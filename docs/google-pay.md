# Google Pay checkout

The Next.js checkout uses Stripe Express Checkout Element for eligible Google Pay wallets. Fastify authenticates the buyer, resolves the listing from the checkout session, and creates a USD card PaymentIntent using the database price. Stripe authorizes without capturing. The status route independently retrieves the authorization and checks the buyer, seller, product, session and amount before recording the order and seller's pending funds in one MySQL transaction. Delivery confirmation captures the same Stripe intent and settles the seller wallet.

## Enable in staging

Set `NEXT_PUBLIC_GOOGLE_PAY_ENABLED=true` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` before building the frontend. Set `GOOGLE_PAY_ENABLED=true` and the corresponding `STRIPE_SECRET_KEY` in the backend environment. Use matching test keys, HTTPS and a registered test payment-method domain. Keep both flags off for production until acceptance testing is complete. See [Stripe's Express Checkout guide](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment).

## Acceptance checks

Run `node --test test/google-pay.test.js`. On a registered staging domain, use a supported browser with Google Pay configured. Check cancellation (no order), authorization (one pending order, no capture), repeated confirmation (no second order or credit), and delivery confirmation (one capture and wallet settlement). Check that an ineligible browser still offers existing payment methods. Only Account and Service listings have fulfillment handlers.

Order creation currently relies on the browser reporting authorization; it is not webhook-driven. An abandoned authorization may remain on hold until Stripe releases it. Reconcile uncaptured intents before production rollout.
