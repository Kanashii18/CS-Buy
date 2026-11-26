import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../../../config/env.ts";
import { transaction } from "../../../../scripts/transaction.ts";
import type { Order } from "../../../../types/order/index.type.ts";
import type { PaymentDB } from "../../../../types/order/db.type.ts";
import type { ResultSetHeader } from "mysql2";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export default async function confirmProduct({ request, reply }: Order.Params<unknown, Order.Query>): Promise<void> {
     const id = request.query.o;
     try {
          const completed = await transaction(async (tx) => {
               const [payment] = await tx<(PaymentDB & { status: string })[]>(`
                    SELECT p.payment_gateway, p.payment_id, p.amount, p.wallet_id, p.status
                    FROM Payments p JOIN Orders o ON o.order_id = p.order_id
                    WHERE o.order_id = ? AND o.user_id = ? FOR UPDATE`, [id, request.userInfo.id]);
               if (!payment || payment.payment_gateway !== "stripe") return false;
               if (payment.status === "completed") return true;
               if (payment.status !== "requires_capture") return false;
               let intent = await stripe.paymentIntents.retrieve(payment.payment_id);
               if (intent.status === "requires_capture")
                    intent = await stripe.paymentIntents.capture(payment.payment_id, {}, { idempotencyKey: `capture:${payment.payment_id}` });
               if (intent.status !== "succeeded" || intent.currency !== "usd" ||
                    intent.amount_received !== Math.round(Number(payment.amount) * 100)) return false;
               const wallet = await tx<ResultSetHeader>(`UPDATE Wallets SET balance = balance + ?, pending = pending - ?
                    WHERE wallet_id = ?`, [payment.amount, payment.amount, payment.wallet_id]);
               if (wallet.affectedRows !== 1) throw new Error("Wallet unavailable");
               await tx("UPDATE Payments SET status = 'completed' WHERE payment_id = ?", [payment.payment_id]);
               await tx("UPDATE Orders SET status = 'confirmed' WHERE order_id = ?", [id]);
               return true;
          });
          if (!completed) return await reply.code(409).send({ error: "Order cannot be confirmed." });
          return await reply.send({ message: "OK" });
     } catch {
          return await reply.code(500).send({ error: "Could not confirm order. Please retry." });
     }
}
