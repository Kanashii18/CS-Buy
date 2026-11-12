import getPurchased_by_user from "./controllers/get_purchased_by_user.js";
import getSpecific_product from "./controllers/get_specific_product.js";
import confirmProduct from "./controllers/confirm_product.js";
/**
 * This function returns an object containing the order controllers.
 * @returns An object with the order controllers.
 */
export function orderController(db) {
    return {
        // Get the list of purchased products by the user
        getPurchasedByUser: (request, reply) => getPurchased_by_user({ request, reply, db }),
        // Get the details of a specific product in an order
        getSpecificProduct: (request, reply) => getSpecific_product({ request, reply, db }),
        // Confirm the receipt of a product in an order
        confirmProduct: (request, reply) => confirmProduct({ request, reply, db }),
    };
}
