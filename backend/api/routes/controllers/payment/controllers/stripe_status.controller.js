import { randomUUID, Set_orders, stripe } from "./_common.js";
import { transaction } from "../../../../scripts/transaction.ts";
import { matchesCheckout } from "./wallet-intent.js";

export default async function stripeStatus({ db, io, users, request, reply }) {
     const { product, userInfo } = request;
     const id = request.body?.paymentIntentId;
     if (typeof id !== "string" || !id.startsWith("pi_"))
          return reply.code(400).send({ error: "Invalid payment intent." });
     try {
          const intent = await stripe.paymentIntents.retrieve(id);
          if (!matchesCheckout(intent, request))
               return reply.code(409).send({ error: "Authorization does not match checkout." });
          const createOrder = { Account: Set_orders.account, Service: Set_orders.service }[product.category];
          if (!createOrder) return reply.code(400).send({ error: "Unsupported listing." });
          const result = await transaction(async (tx) => {
               // Serialize fulfillment against competing buyers and repeated confirmations.
               const [listing] = await tx("SELECT price, quantity, deleted FROM Products WHERE product_id = ? FOR UPDATE", [product.product_id]);
               const [paid] = await tx("SELECT order_id FROM Payments WHERE payment_id = ?", [id]);
               if (paid) return { orderId: paid.order_id, created: false };
               if (!listing || listing.deleted || listing.quantity <= 0 ||
                    Number(listing.price) !== Number(product.price)) return null;
               const orderId = randomUUID();
               const credit = await tx("UPDATE Wallets SET pending = pending + ? WHERE user_id = ?", [product.price, product.user_id]);
               if (credit.affectedRows !== 1) throw new Error("Seller wallet unavailable");
               await createOrder(reply, tx, product, userInfo, orderId);
               await tx(`INSERT INTO Payments (payment_processed, payment_id, order_id, user_id,
                    payment_gateway, payment_gateway_id, amount, status, wallet_id, method)
                    VALUES (1, ?, ?, ?, 'stripe', ?, ?, 'requires_capture',
                    (SELECT wallet_id FROM Wallets WHERE user_id = ?), ?)`,
                    [id, orderId, userInfo.id, randomUUID(), product.price, product.user_id,
                         intent.metadata.method === "google_pay" ? "google_pay" : "card"]);
               return { orderId, created: true };
          });
          if (!result) return reply.code(409).send({ error: "Listing no longer available." });
          if (result.created) {
               try { await Set_orders.final(reply, db, product, userInfo, io, users); }
               catch { request.log.warn("Order saved; notification failed"); }
          }
          return reply.send({ orderId: result.orderId });
     } catch {
          return reply.code(500).send({ error: "Could not verify payment. Retry order confirmation." });
     }
}
