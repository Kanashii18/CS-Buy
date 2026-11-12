import userCheck from "./controllers/user_check.controller.js";
import sellerCheck from "./controllers/seller_check.controller.js";
import settingCheck from "./controllers/setting_check.controller.js";
import imgCheck from "./controllers/img_check.controller.js";
import moderationCheck from "./controllers/moderation_check.controller.js";
import profile from "./controllers/profile.controller.js";
import sessionCheck from "./controllers/session_check.js";
/**
 * This function returns an object containing the user check controllers.
 * @returns An object with the user check controllers.
 */
export default function userCheck_controller(db, ci) {
    return {
        // Check if the user has a valid session
        sessionCheck: (request, reply) => sessionCheck({ db, request, reply }),
        // Check if the user exists in the database
        userCheck: (request, reply) => userCheck({ db, request, reply }),
        // Check if the user is a seller
        sellerCheck: (request, reply) => sellerCheck({ request, reply, db }),
        // Check if the user has a valid session and is a seller
        settingCheck: (request, reply) => settingCheck({ request, reply, db }),
        // Check if the user has a valid session and is a seller
        imgCheck: (request, reply) => imgCheck({ request, reply, ci }),
        // Check if the user has a valid session and is a seller
        moderationCheck: (request, reply) => moderationCheck({ ci, request, reply }),
        // Check if the user has a valid session and is a seller
        profile: (request, reply) => profile({ db, request, reply })
    };
}
;
