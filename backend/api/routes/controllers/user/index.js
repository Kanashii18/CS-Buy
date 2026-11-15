import loginUserController from "./controllers/login_user.controller.js";
import createUserController from "./controllers/create_user.controller.js";
import deleteUserController from "./controllers/delete_user.controller.js";
import modifyUserController from "./controllers/modify_user.controller.js";
import getUnreadController from "./controllers/get_unread.controller.js";
import getNotifyController from "./controllers/get_notify.controller.js";

// ================== User Controller ================== //

export default function userController(db, ci) {
     return {
          loginUser: (request, reply) =>
               loginUserController({ db, request, reply }),
          createUser: (request, reply) =>
               createUserController({ db, request, reply }),
          deleteUser: (request, reply) =>
               deleteUserController({ db, request, reply }),
          modifyUser: (request, reply) =>
               modifyUserController({ db, request, reply, ci }),
          getUnread: (request, reply) =>
               getUnreadController({ db, request, reply }),
          getNotify: (request, reply) =>
               getNotifyController({ db, request, reply }),
     };
}
