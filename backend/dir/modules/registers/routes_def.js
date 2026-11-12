// Routes
import userRouter from "../../routes/user.routes.js";
import authRouter from "../../routes/auth.routes.js";
import chatRouter from "../../routes/chat.routes.js";
import sellerRouter from "../../routes/seller.routes.js";
import checkoutRouter from "../../routes/purchase.routes.js";
import orderRouter from "../../routes/order.routes.js";
import walletRouter from "../../routes/wallet.routes.js";
import authMiddleware from "../../middleware/verify_session.js";
import image from "./../../config/filter.js";
export default async function routes_api({ fastify, db, io, users }) {
    // ========================== || Routes Definition || ========================== //
    await fastify.register(async (fastify) => {
        fastify.register(userRouter(db, image), { prefix: '/api/user' });
        fastify.register(sellerRouter(db, image), { prefix: '/api/seller' });
        fastify.register(authRouter(db, image), { prefix: '/api/auth' });
        fastify.register(async (scope) => {
            scope.addHook("preHandler", authMiddleware);
            scope.register(chatRouter(db), { prefix: '/api/chat' });
            scope.register(orderRouter(db), { prefix: '/api/order' });
            scope.register(walletRouter(db), { prefix: '/api/account' });
            // checkout scope
            scope.register(checkoutRouter({ db, io, users }), { prefix: '/api/verify/checkout' });
        });
    });
}
