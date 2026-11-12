import getProductController from "./controllers/get_product.controller.js";
import markAsReadController from "./controllers/mark_as_read.controller.js";
import overviewController from "./controllers/overview.controller.js";
/**
 * This function returns an object containing the chat overview controllers.
 * @returns An object with the chat overview controllers.
 */
export default function overviewsController(db) {
    return {
        // Ver overview de los chats
        overview: (request, reply) => overviewController({ request, reply, db }),
        // Marcar un mensaje como leído
        markAsRead: (request, reply) => markAsReadController({ request, reply, db }),
        // Get specific product information
        getProduct: (request, reply) => getProductController({ request, reply, db })
    };
}
;
