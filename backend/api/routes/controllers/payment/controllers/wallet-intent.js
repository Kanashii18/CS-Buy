export function walletIntent(request) {
     const { product, userInfo, query } = request;
     const amount = Math.round(Number(product.price) * 100);
     if (!Number.isSafeInteger(amount) || amount < 50 || amount > 99999999 ||
         !["Account", "Service"].includes(product.category) ||
         String(product.user_id) === String(userInfo.id)) return null;
     return {
          amount, currency: "usd", capture_method: "manual",
          payment_method_types: ["card"],
          metadata: {
               checkout_id: String(query.session_id), product_id: String(product.product_id),
               user_id: String(userInfo.id), seller_id: String(product.user_id),
               method: "google_pay",
          },
     };
}

export function matchesCheckout(intent, { product, userInfo, query }) {
     const meta = intent.metadata ?? {};
     return intent.status === "requires_capture" && intent.currency === "usd" &&
          intent.amount_capturable === Math.round(Number(product.price) * 100) &&
          meta.user_id === String(userInfo.id) && meta.seller_id === String(product.user_id) &&
          meta.product_id === String(product.product_id) &&
          (meta.method !== "google_pay" || meta.checkout_id === String(query.session_id));
}
