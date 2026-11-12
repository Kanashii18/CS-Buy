import { db } from "../scripts/db.js";
/**
 * @returns {Promise<Promise[]>}  ...inject to request Object product information...
 */
export default async function (request, reply) {
    const checkoutRequest = request;
    if (!checkoutRequest.query.session_id)
        return reply.code(401).send({ error: 'Invalid Session' });
    const session_id = checkoutRequest.query.session_id;
    const userInfo = checkoutRequest.userInfo;
    if (!("id" in userInfo) ||
        !userInfo.username ||
        !userInfo.role) {
        return reply.code(401).send({ error: "Unauthorized" });
    }
    // look for the product_id with the checkout session...
    const is_session = await db(`
          SELECT
          product_id
          FROM Checkout_id
          WHERE id = ? AND user_id = ?
     `, [session_id, userInfo.id]);
    if (is_session.length === 0)
        return reply.code(404).send({ error: "Session not found, refresh and try again" });
    const product_id = is_session[0].product_id;
    // look for the product info
    const product_info = await db(`
          SELECT
               price,
               user_id,
               category,
               title,
               image
          FROM Products
          WHERE product_id = ?
     `, [product_id]);
    if (product_info.length === 0)
        return reply.code(404).send({ error: "Product not found, try later please" });
    checkoutRequest.product = {
        price: product_info[0].price,
        product_id: product_id,
        image: product_info[0].image,
        title: product_info[0].title,
        user_id: product_info[0].user_id,
        category: product_info[0].category,
    };
}
;
