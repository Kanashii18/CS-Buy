import loginUser from './controllers/login_user.controller.js';
import createUser from './controllers/create_user.controller.js';
import deleteUser from './controllers/delete_user.controller.js';
import modifyUser from './controllers/modify_user.controller.js';
import getUnread from './controllers/get_unread.controller.js';
import getNotify from './controllers/get_notify.controller.js';
export function userController(db, ci) {
    return {
        loginUser: (request, reply) => loginUser({ db, request, reply }),
        createUser: (request, reply) => createUser({ db, request, reply }),
        deleteUser: (request, reply) => deleteUser({ db, request, reply }),
        modifyUser: (request, reply) => modifyUser({ db, request, reply, ci }),
        getUnread: (request, reply) => getUnread({ db, request, reply }),
        getNotify: (request, reply) => getNotify({ db, request, reply }),
    };
}
