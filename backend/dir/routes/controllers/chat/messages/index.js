import readRoomController from "./controllers/readRoom.controller.js";
import postChatController from "./controllers/postChat.controller.js";
import getUnreadController from "./controllers/get_unread.controller.js";
/**
 * This function returns an object containing the chat controllers.
 * @returns An object with the chat controllers.
 */
export default function chat_controller(db) {
    return {
        // Read chat messages in the indicate chat
        readRoom: (request, reply) => readRoomController({ db, request, reply }),
        // Send new message in the indicate chat
        postChat: (request, reply) => postChatController({ db, request, reply }),
        // Get unread messages
        get_unread: (request, reply) => getUnreadController({ db, request, reply })
    };
}
