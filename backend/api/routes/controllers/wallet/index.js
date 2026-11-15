import available_balance from "./controllers/available_balance.js";
import pending_balance from "./controllers/pending_balance.js";
import total_balance from "./controllers/total_balance.js";
import retire_balance from "./controllers/retire_balance.js";
import transitions from "./controllers/transitions.js";
import checkout from "./controllers/checkout.js";
import getWallet from "./controllers/get_wallet.js";

// ================== Wallet Controller ================== //

export default function walletController(db) {
     return {
          availableBalance: (request, reply) =>
               available_balance({ request, reply, db }),
          pendingBalance: (request, reply) =>
               pending_balance({ request, reply, db }),
          totalBalance: (request, reply) =>
               total_balance({ request, reply, db }),
          retireBalance: (request, reply) =>
               retire_balance({ request, reply, db }),
          transitions: (request, reply) => transitions({ request, reply, db }),
          checkout: (request, reply) => checkout({ request, reply }),
          getWallet: (request, reply) => getWallet({ request, reply, db }),
     };
}
