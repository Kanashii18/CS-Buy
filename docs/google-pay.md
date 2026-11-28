# Google Pay checkout

The Next.js checkout uses Stripe Express Checkout Element for eligible Google Pay wallets. Fastify authenticates the buyer, resolves the listing from the checkout session, and creates a USD card PaymentIntent using the database price. Stripe authorizes without capturing. The status route independently retrieves the authorization and checks the buyer, seller, product, session and amount before recording the order and seller's pending funds in one MySQL transaction. Delivery confirmation captures the same Stripe intent and settles the seller wallet.

## Configuration

Google Pay is listed by default for Account and Service listings. To turn it off, set `NEXT_PUBLIC_GOOGLE_PAY_ENABLED=false` in the frontend environment (`frontend/.env.local`, read at build time) and `GOOGLE_PAY_ENABLED=false` in the backend environment. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` overrides the built-in test publishable key and must match the backend `STRIPE_SECRET_KEY` account. The wallet button itself needs HTTPS, a registered payment-method domain and a supported browser; without those the row opens with an "unavailable" message. See [Stripe's Express Checkout guide](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment).

## Acceptance checks

Run `node --test test/google-pay.test.js`. On a registered staging domain, use a supported browser with Google Pay configured. Check cancellation (no order), authorization (one pending order, no capture), repeated confirmation (no second order or credit), and delivery confirmation (one capture and wallet settlement). Check that an ineligible browser still offers existing payment methods. Only Account and Service listings have fulfillment handlers.

Order creation currently relies on the browser reporting authorization; it is not webhook-driven. An abandoned authorization may remain on hold until Stripe releases it. Reconcile uncaptured intents before production rollout.
