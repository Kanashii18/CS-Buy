// bans.controller.js
import create from "./controllers/create.ban.js";
import revoke from "./controllers/revoke.ban.js";
import list from "./controllers/list.ban.js";
import status from "./controllers/status.ban.js";
import linking from "./controllers/linking.ban.js";
import { db } from "../../../scripts/db.js";
export default function banController() {
    return {
        /** POST /api/bans
         *  Body: { subject_type: 'user'|'device'|'ip'|'email', subject_value: string, reason?: string, expires_at?: string|null }
         */
        create: ({ subject_value, reason, expires_at }) => create(db, { subject_value, reason, expires_at }),
        /** DELETE /api/bans
         *  Body: { subject_type: 'user'|'device'|'ip'|'email', subject_value: string }
         *  Soft-unban by deleting active bans for that subject.
         */
        revoke: (user_id) => revoke({ db, user_id }),
        /** GET /api/bans?type=user|device|ip&value=xxx&active=1&page=1&pageSize=50
         *  List bans with optional filters and pagination.
         */
        list: ({ type }) => list({ db, type }),
        /** GET /api/bans/status?userId=...&deviceId=...&ip=...
         *  Quick check if any subject is currently banned.
         */
        status: (device_id, user_id, ip) => status({ db, user_id, device_id, ip }),
        /**
         * Linking banned to the user
         */
        linking: (deviceId, user_id, ip) => linking({ db, deviceId, user_id, ip })
    };
}
;
