import addProduct from './controllers/addProduct.controller.js';
import updateProduct from './controllers/updateProduct.controller.js';
import getModifyProduct from './controllers/getModifyProduct.controller.js';
import getProduct from './controllers/getProduct.controller.js';
import pause from './controllers/pause.controller.js';
import resume from './controllers/resume.controller.js';
import remove from './controllers/remove.controller.js';
import getNavProduct from './controllers/getNav_Product.controller.js';
import getProductById from './controllers/getProductById.controller.js';
import getProductSelf from './controllers/getProductSelf.controller.js';
import getAccounts from './controllers/getAccounts.controller.js';
import getServices from './controllers/getServices.controller.js';
import getAssets from './controllers/getAssets.controller.js';
export default function sellerController(db, ci) {
    return {
        addProduct: (request, reply) => addProduct({ db, ci, request, reply }),
        updateProduct: (request, reply) => updateProduct({ db, ci, request, reply }),
        getModifyProduct: (request, reply) => getModifyProduct({ db, request, reply }),
        getProduct: (request, reply) => getProduct({ db, request, reply }),
        pause: (request, reply) => pause({ db, request, reply }),
        resume: (request, reply) => resume({ db, request, reply }),
        remove: (request, reply) => remove({ db, request, reply }),
        getNavProduct: (request, reply) => getNavProduct({ db, request, reply }),
        getProductById: (request, reply) => getProductById({ db, request, reply }),
        getProductSelf: (request, reply) => getProductSelf({ db, request, reply }),
        getAccounts: (_request, reply) => getAccounts({ db, reply }),
        getServices: (_request, reply) => getServices({ db, reply }),
        getAssets: (_request, reply) => getAssets({ db, reply }),
    };
}
