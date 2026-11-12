import { createHmac, randomUUID } from "node:crypto";
import { SECRET_KEY } from "../config/env.js";
const isUUID = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export default async function ensureDevice(request, reply) {
    // Fastify plugins...
    const sign = (v) => createHmac("sha256", SECRET_KEY).update(v).digest("base64url");
    const COOKIE = "__did";
    const c = request.cookies?.[COOKIE];
    if (c) {
        const [id, sig] = c.split(".");
        if (id && isUUID(id) && sig && sig === sign(id)) {
            request.deviceId = id;
            return;
        }
    }
    const id = randomUUID();
    reply.setCookie(COOKIE, `${id}.${sign(id)}`, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 31536000000,
        path: "/"
    });
    request.deviceId = id;
}
