import { test } from "node:test";
import assert from "node:assert/strict";
import { walletIntent, matchesCheckout } from "../backend/api/routes/controllers/payment/controllers/wallet-intent.js";

const req = { product: { product_id: "p", price: "23.45", category: "Service", user_id: "s" },
     query: { session_id: "session" }, userInfo: { id: "buyer" }, body: { product: { price: 0.01 } } };
const params = walletIntent(req);
const authorization = { ...params, amount_capturable: 2345, status: "requires_capture" };
test("wallet uses authenticated listing, not client price; authorization only", () => {
     assert.equal(params.amount, 2345);
     assert.equal(params.capture_method, "manual");
     assert.equal(matchesCheckout(authorization, req), true);
});
test("rejects invalid prices, unsupported listings and self-purchases", () => {
     for (const edits of [{ price: "NaN" }, { price: -1 }, { price: 0.49 }, { price: 1000000 },
          { category: "Others" }, { user_id: "buyer" }])
          assert.equal(walletIntent({ ...req, product: { ...req.product, ...edits } }), null);
});
test("rejects mismatched authorization before fulfillment", () => {
     for (const edits of [{ status: "processing" }, { currency: "eur" }, { amount_capturable: 1 },
          ...["checkout_id", "user_id", "seller_id", "product_id"].map(k => ({ metadata: { ...params.metadata, [k]: "other" } }))])
          assert.equal(matchesCheckout({ ...authorization, ...edits }, req), false);
});
