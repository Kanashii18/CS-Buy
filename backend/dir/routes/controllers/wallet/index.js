import availableBalance from './controllers/available_balance.js';
import pendingBalance from './controllers/pending_balance.js';
import totalBalance from './controllers/total_balance.js';
import retireBalance from './controllers/retire_balance.js';
import transitions from './controllers/transitions.js';
import checkout from './controllers/checkout.js';
import getWallet from './controllers/get_wallet.js';
export default function walletController(db) {
    return {
        availableBalance: (request, reply) => availableBalance({ request, reply, db }),
        pendingBalance: (request, reply) => pendingBalance({ request, reply, db }),
        totalBalance: (request, reply) => totalBalance({ request, reply, db }),
        retireBalance: (request, reply) => retireBalance({ request, reply, db }),
        transitions: (request, reply) => transitions({ request, reply, db }),
        checkout: (request, reply) => checkout({ request, reply }),
        getWallet: (request, reply) => getWallet(db, request, reply),
    };
}
