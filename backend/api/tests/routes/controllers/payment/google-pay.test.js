import { jest } from "@jest/globals";
const create = jest.fn();
const path = "../../../../routes/controllers/payment/controllers/";
jest.unstable_mockModule(`${path}_common.js`, () => ({ stripe: { paymentIntents: { create } } }));
const { default: prepare } = await import(`${path}gpay_payment.controller.js`);
const request = { userInfo: { id: "buyer" }, query: { session_id: "checkout" },
     product: { product_id: "listing", user_id: "seller", price: "21.99", category: "Account" },
     body: { product: { price: 0.01 } } };
const originalFlag = process.env.GOOGLE_PAY_ENABLED;
beforeEach(() => { jest.clearAllMocks(); process.env.GOOGLE_PAY_ENABLED = "true"; });
afterAll(() => {
     if (originalFlag === undefined) delete process.env.GOOGLE_PAY_ENABLED;
     else process.env.GOOGLE_PAY_ENABLED = originalFlag;
});
function reply() { return { code: jest.fn().mockReturnThis(), header: jest.fn().mockReturnThis(), send: jest.fn() }; }
test("repeated preparations reuse one checkout key and never trust a posted price", async () => {
     const db = jest.fn().mockResolvedValue([{ id: "checkout" }]);
     create.mockResolvedValue({ client_secret: "test-secret", amount: 2199 });
     const res = reply();
     for (let i = 0; i < 2; i++) await prepare({ db, request, reply: res });
     expect(create.mock.calls[0]).toEqual(create.mock.calls[1]);
     expect(create).toHaveBeenCalledWith(expect.objectContaining({ amount: 2199, capture_method: "manual" }),
          { idempotencyKey: "gpay:checkout" });
     expect(res.send).toHaveBeenCalledWith({ clientSecret: "test-secret", amount: 2199 });
});
test("expired checkout never calls processor", async () => {
     const res = reply();
     await prepare({ db: async () => [], request, reply: res });
     expect(res.code).toHaveBeenCalledWith(409);
     expect(create).not.toHaveBeenCalled();
});
test("disabled endpoint never calls processor", async () => {
     delete process.env.GOOGLE_PAY_ENABLED;
     const res = reply();
     await prepare({ request, reply: res });
     expect(res.code).toHaveBeenCalledWith(404);
     expect(create).not.toHaveBeenCalled();
});
