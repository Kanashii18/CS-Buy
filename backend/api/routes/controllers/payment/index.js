import gpayPayment from "./controllers/gpay_payment.controller.js";
import cryptoPayment from "./controllers/crypto_payment.controller.js";
import paypalPayment from "./controllers/paypal_payment.controller.js";
import stripePayment from "./controllers/stripe_payment.controller.js";
import stripeStatus from "./controllers/stripe_status.controller.js";

export default function paymentController({ db, io, users }) {
     return {
          gpay_payment: (request, reply) => gpayPayment({ db, request, reply }),
          crypto_payment: (request, reply) => cryptoPayment({ reply }),
          paypal_payment: (request, reply) => paypalPayment({ request, reply }),
          stripe_payment: (request, reply) => stripePayment({ request, reply }),
          stripe_status: (request, reply) =>
               stripeStatus({ db, io, users, request, reply }),
     };
}
