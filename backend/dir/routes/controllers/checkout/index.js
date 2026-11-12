import getSession from "./controllers/get_session.controller.js";
import getCheckoutProduct from "./controllers/getCheckoutProduct.controller.js";
import getOrder from "./controllers/get_order.controller.js";
import postOrder from "./controllers/post_order.controller.js";
/**
 * @returns An object with the checkout controllers.
 */
export default function checkoutController(db, io, users) {
    return {
        // Create a new checkout session for a product
        get_session: (request, reply) => getSession({ db, request, reply }),
        // Get the product details for a given checkout session
        getCheckoutProduct: (request, reply) => getCheckoutProduct({ db, request, reply }),
        // Get the order details for a given user
        get_order: (request, reply) => getOrder({ db, request, reply }),
        // Create a new order for a given user and product
        post_order: (request, reply) => postOrder({ db, io, users, request, reply }),
    };
}
;
