import { getFeedback } from "./controllers/getFeedback.js";
import { getAllFeedback } from "./controllers/getAllFeedback.js";
import { getRecentOrder } from "./controllers/getRecentOrder.js";
import { getTotalSelled } from "./controllers/getTotalSelled.js";
import { postFeedback } from "./controllers/postFeedback.js";
import { getRating } from "./controllers/getRating.js";
/**
 * This function returns an object containing the feedback controllers.
 * @returns An object with the feedback controllers.
 */
export default function gestionFeedback(db) {
    return {
        // Get feedback for a specific user
        getFeedback: (request, reply) => getFeedback({ request, reply, db }),
        // Get all feedback in the system
        getAllFeedback: (request, reply) => getAllFeedback({ request, reply, db }),
        // Get the most recent order for a user
        getRecentOrder: (request, reply) => getRecentOrder({ request, reply, db }),
        // Get the total number of products sold by a user
        getTotalSelled: (request, reply) => getTotalSelled({ request, reply, db }),
        // Post feedback for a specific order
        postFeedback: (request, reply) => postFeedback({ request, reply, db }),
        // Get the average rating for a specific user
        getRating: (request, reply) => getRating({ request, reply, db })
    };
}
